// SeaGlobe chat pass-through. OPTIONAL and NOT used by the app as shipped: api.x.ai accepts calls straight from the
// browser (CORS), so SeaGlobe calls it directly with the visitor's own key. This Worker exists only for a visitor who
// wants (or needs, if xAI ever stops allowing browser calls) to run their own relay on THEIR OWN Cloudflare account.
// It forwards one chat request to the xAI API with the caller's own Authorization header. It has no key of its own,
// stores nothing (no KV, no cache, no logs of headers or bodies) and accepts only the origins listed in ALLOWED_ORIGINS.
const XAI = "https://api.x.ai/v1/chat/completions";
const MAX_BODY = 64 * 1024;

export function corsHeaders(origin, allowed) {
  const ok = origin && String(allowed || "").split(",").map((s) => s.trim()).filter(Boolean).includes(origin);
  return ok ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "authorization, content-type", "access-control-max-age": "600", vary: "origin" } : null;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);
    const json = (status, obj, h) => new Response(JSON.stringify(obj), { status, headers: Object.assign({ "content-type": "application/json", "cache-control": "no-store" }, h || {}) });
    if (!cors) return json(403, { error: "origin not allowed" });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json(405, { error: "POST only" }, cors);
    const auth = request.headers.get("authorization") || "";
    if (!/^Bearer \S{8,}$/.test(auth)) return json(401, { error: "send your own xAI key as Authorization: Bearer <key>" }, cors);
    const body = await request.text();
    if (body.length > MAX_BODY) return json(413, { error: "request too large" }, cors);
    const up = await fetch(env.XAI_URL || XAI, { method: "POST", headers: { authorization: auth, "content-type": "application/json" }, body });
    return new Response(up.body, { status: up.status, headers: Object.assign({ "content-type": up.headers.get("content-type") || "application/json", "cache-control": "no-store" }, cors) });
  },
};
