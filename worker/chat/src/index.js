/* SeaGlobe chat Worker (Cloudflare Workers). Holds the xAI key as a Worker SECRET (env.XAI_API_KEY);
   the key is never in this file, the repository, the browser or logs.
   POST /chat  { question, context: [{id,title,kind,reconstruction,text,sources[]}], version }
   -> { answer, model, usage }   (answers only from the given atlas entries; [UNKNOWN] otherwise)
   Protection: origin allowlist, request-size and field limits, per-client rate limit (Workers Rate Limiting
   binding RATE_LIMITER, else a per-isolate fallback), a daily request cap (KV binding USAGE, else per-isolate),
   max_tokens cap, and no request bodies or answers are logged. */
const SYSTEM = "You answer questions about SeaGlobe, an atlas of historical routes. Use ONLY the numbered atlas entries given. " +
  "Cite every claim with the entry id in square brackets, e.g. [route:wright-kitty-hawk-1903]. If the entries do not answer the question, reply exactly: [UNKNOWN] The atlas has no source for that. " +
  "Never add facts, dates or names that are not in the entries. Keep answers under 120 words. Say when an entry is a reconstruction.";
const LIMITS = { bodyBytes: 16384, question: 500, entries: 8, entryText: 1200, sources: 6 };
const mem = { hits: new Map(), day: "", count: 0 };   // fallback only; resets when the isolate restarts

function cors(origin, env) {
  const allow = String(env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = origin && allow.includes(origin);
  return { ok, headers: ok ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "86400", vary: "origin" } : { vary: "origin" } };
}
const json = (obj, status, headers) => new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, headers || {}) });

async function rateLimited(env, key) {
  if (env.RATE_LIMITER && env.RATE_LIMITER.limit) { const r = await env.RATE_LIMITER.limit({ key }); return !r.success; }
  const perMin = Number(env.RATE_PER_MINUTE || 6), now = Date.now();
  const arr = (mem.hits.get(key) || []).filter((t) => now - t < 60000);
  if (arr.length >= perMin) { mem.hits.set(key, arr); return true; }
  arr.push(now); mem.hits.set(key, arr); return false;
}
async function overDailyCap(env) {
  const cap = Number(env.DAILY_CAP || 500), day = new Date().toISOString().slice(0, 10);
  if (env.USAGE) {   // KV is eventually consistent, so the cap is approximate (can overshoot slightly under bursts)
    const k = "count:" + day, n = Number((await env.USAGE.get(k)) || 0);
    if (n >= cap) return true;
    await env.USAGE.put(k, String(n + 1), { expirationTtl: 172800 }); return false;
  }
  if (mem.day !== day) { mem.day = day; mem.count = 0; }
  if (mem.count >= cap) return true;
  mem.count++; return false;
}
export function validate(body) {
  if (!body || typeof body !== "object") return "bad json";
  const q = typeof body.question === "string" ? body.question.trim() : "";
  if (!q || q.length > LIMITS.question) return "question must be 1-" + LIMITS.question + " characters";
  if (!Array.isArray(body.context) || body.context.length > LIMITS.entries) return "context must be an array of at most " + LIMITS.entries + " entries";
  for (const c of body.context) if (!c || typeof c.id !== "string" || !/^[a-z]+:[\w.-]+$/.test(c.id) || typeof c.title !== "string") return "bad context entry";
  return null;
}
export function buildPrompt(q, ctx) {
  return ctx.map((c, i) => (i + 1) + ". [" + c.id + "] " + String(c.title).slice(0, 200) + (c.reconstruction ? " (reconstruction)" : "") + ": " + String(c.text || "").slice(0, LIMITS.entryText) +
    " Sources: " + (Array.isArray(c.sources) ? c.sources.slice(0, LIMITS.sources).map((s) => String(s).slice(0, 200)).join("; ") : "")).join("\n") + "\n\nQuestion: " + q;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url), origin = request.headers.get("origin") || "";
    const c = cors(origin, env);
    if (request.method === "OPTIONS") return new Response(null, { status: c.ok ? 204 : 403, headers: c.headers });
    if (url.pathname === "/health") return json({ ok: true, configured: !!env.XAI_API_KEY }, 200, c.headers);
    if (url.pathname !== "/chat" || request.method !== "POST") return json({ error: "not found" }, 404, c.headers);
    if (!c.ok) return json({ error: "origin not allowed" }, 403, c.headers);
    const len = Number(request.headers.get("content-length") || 0);
    if (len > LIMITS.bodyBytes) return json({ error: "request too large" }, 413, c.headers);
    const raw = await request.text();
    if (raw.length > LIMITS.bodyBytes) return json({ error: "request too large" }, 413, c.headers);
    let body = null; try { body = JSON.parse(raw); } catch (e) { /* handled below */ }
    const bad = validate(body); if (bad) return json({ error: bad }, 400, c.headers);
    if (!body.context.length) return json({ answer: "[UNKNOWN] The atlas has no entry that matches that, so there is no source to answer from.", model: null }, 200, c.headers);
    const client = request.headers.get("cf-connecting-ip") || "anon";
    if (await rateLimited(env, client)) return json({ error: "rate limited" }, 429, Object.assign({ "retry-after": "60" }, c.headers));
    if (await overDailyCap(env)) return json({ error: "daily limit reached" }, 429, c.headers);
    if (!env.XAI_API_KEY) return json({ error: "chat not configured" }, 503, c.headers);
    const model = env.XAI_MODEL || "grok-4.20-0309-non-reasoning";
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 25000);
    let r;
    try {
      r = await fetch(env.XAI_URL || "https://api.x.ai/v1/chat/completions", { method: "POST", signal: ctl.signal,
        headers: { "content-type": "application/json", authorization: "Bearer " + env.XAI_API_KEY },
        body: JSON.stringify({ model, max_tokens: Number(env.MAX_TOKENS || 400), temperature: 0.2, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: buildPrompt(body.question.trim(), body.context) }] }) });
    } catch (e) { clearTimeout(t); return json({ error: "upstream unreachable" }, 502, c.headers); }
    clearTimeout(t);
    if (!r.ok) return json({ error: "upstream error", status: r.status }, r.status === 429 ? 429 : 502, c.headers);
    const j = await r.json().catch(() => null);
    const answer = j && j.choices && j.choices[0] && j.choices[0].message ? String(j.choices[0].message.content || "") : "";
    if (!answer) return json({ error: "empty answer" }, 502, c.headers);
    return json({ answer, model, usage: j.usage ? { prompt_tokens: j.usage.prompt_tokens, completion_tokens: j.usage.completion_tokens } : null }, 200, c.headers);
  },
};
export { SYSTEM, LIMITS, mem };
