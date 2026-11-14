/* SeaChat: "Ask the atlas". Answers are grounded in atlas entries only:
   1. find the matching entries with the built-in search (local, no network);
   2. if a chat service is set (edition.chatUrl, a Cloudflare Worker that holds the key), send the question plus those
      entries; the reply must cite entry ids and say [UNKNOWN] when the entries do not answer it;
   3. PC edition only: a bring-your-own xAI key kept in this browser's localStorage, never in files;
   4. otherwise (default) chat is offline and shows the matching entries instead.
   With no matching entries the answer is always [UNKNOWN] and nothing is sent. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const E = () => window.SEAGLOBE_EDITION || {};
  const KEY = "sg-xai-key", MODEL = "sg-xai-model";
  const XAI = "https://api.x.ai/v1/chat/completions";
  const DEFAULT_MODEL = "grok-4.20-0309-non-reasoning";
  const SYSTEM = "You answer questions about SeaGlobe, an atlas of historical routes. Use ONLY the numbered atlas entries given. " +
    "Cite every claim with the entry id in square brackets, e.g. [route:wright-kitty-hawk-1903]. If the entries do not answer the question, reply exactly: [UNKNOWN] The atlas has no source for that. " +
    "Never add facts, dates or names that are not in the entries. Keep answers under 120 words. Say when an entry is a reconstruction.";
  const log = [];
  function chatUrl() {
    const P = new URLSearchParams(location.search), local = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
    return (local && P.get("chaturl")) || E().chatUrl || "";
  }
  function byoKey() { try { return E().byoKey ? localStorage.getItem(KEY) || "" : ""; } catch (e) { return ""; } }
  function mode() { return chatUrl() ? "worker" : byoKey() ? "byo" : "offline"; }
  function context(q) {
    const A = window.SeaAtlas; if (!A) return [];
    // question words that carry no topic ("when did the ... fly to") are dropped; if every remaining word together
    // finds nothing, the entries matching the most of them are used instead
    const STOP = new Set("a an and are as at be by can did do does for from how in into is it its of on or the to was were what when where which who why with fly flew go went".split(" "));
    const words = String(q).toLowerCase().split(/[^a-z0-9\u00c0-\u024f]+/).filter((w) => w.length > 1 && !STOP.has(w));
    let hits = words.length ? A.search(words.join(" "), { limit: 6 }) : [];
    if (!hits.length && words.length > 1) {
      const tally = new Map();
      words.forEach((w) => A.search(w, { limit: 40 }).forEach((e, rank) => { const t = tally.get(e.id) || { e, n: 0, r: 0 }; t.n++; t.r += rank; tally.set(e.id, t); }));
      const best = Math.max(0, ...[...tally.values()].map((t) => t.n));
      if (best >= 2) hits = [...tally.values()].filter((t) => t.n === best).sort((a, b) => a.r - b.r).slice(0, 6).map((t) => t.e);
    }
    return hits.map((r) => r.entity || A.get(r.id) || r).filter((e) => e && e.id).map((e) => ({
      id: e.id, title: e.title, kind: e.kind, reconstruction: !!(e.evidence && e.evidence.reconstruction),
      text: String(e.summary || "").slice(0, 900), sources: (e.citations || []).slice(0, 4).map((sid) => { const s = A.source(sid); return s ? s.title : sid; }),
    }));
  }
  function prompt(q, ctx) { return ctx.map((c, i) => (i + 1) + ". [" + c.id + "] " + c.title + (c.reconstruction ? " (reconstruction)" : "") + ": " + c.text + " Sources: " + c.sources.join("; ")).join("\n") + "\n\nQuestion: " + q; }
  async function post(url, body, headers, ms) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms || 20000);
    try { const r = await fetch(url, { method: "POST", headers: Object.assign({ "content-type": "application/json" }, headers || {}), body: JSON.stringify(body), signal: ctl.signal, credentials: "omit" });
      const j = await r.json().catch(() => null); return { ok: r.ok, status: r.status, j }; }
    catch (e) { return { ok: false, status: 0, j: null }; } finally { clearTimeout(t); }
  }
  // keep only citations that point at entries we actually sent
  function checkCites(answer, ctx) {
    const ids = new Set(ctx.map((c) => c.id));
    const cited = [...String(answer).matchAll(/\[([a-z]+:[^\]\s]+)\]/g)].map((m) => m[1]);
    const bad = cited.filter((c) => !ids.has(c));
    return { cited: cited.filter((c) => ids.has(c)), bad, grounded: /\[UNKNOWN\]/.test(answer) || (cited.length > 0 && bad.length === 0) };
  }
  async function ask(q) {
    q = String(q || "").trim().slice(0, 500); if (!q) return null;
    const ctx = context(q), m = mode();
    let res = { q, mode: m, ctx, answer: "", note: "" };
    if (!ctx.length) res.answer = "[UNKNOWN] The atlas has no entry that matches that, so there is no source to answer from.";
    else if (m === "offline") { res.answer = ""; res.note = "Chat is offline in this copy (no chat service is set). Here is what the atlas has:"; }
    else {
      const r = m === "worker" ? await post(chatUrl(), { question: q, context: ctx, version: (window.SEAGLOBE_VERSION || {}).version })
        : await post(XAI, { model: (localStorage.getItem(MODEL) || DEFAULT_MODEL), max_tokens: 400, temperature: 0.2, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt(q, ctx) }] }, { authorization: "Bearer " + byoKey() });
      const text = r.ok && r.j ? (r.j.answer || (r.j.choices && r.j.choices[0] && r.j.choices[0].message && r.j.choices[0].message.content) || "") : "";
      if (!text) { res.note = r.status === 429 ? "The chat service is busy or has reached its daily limit. Here is what the atlas has:" : "Chat could not be reached. Here is what the atlas has:"; res.mode = "offline"; }
      else { res.answer = text; const c = checkCites(text, ctx); res.check = c; if (!c.grounded) res.note = "Warning: this reply cites nothing from the atlas (or cites entries that were not sent); treat it as unsourced."; }
    }
    log.push(res); render(); return res;
  }
  function linkify(t) { return esc(t).replace(/\[([a-z]+:[^\]\s]+)\]/g, (m, id) => "<a href='#/entry/" + encodeURIComponent(id) + "'>[" + esc(id) + "]</a>"); }
  function render() {
    const out = $("chatLog"); if (!out) return;
    out.innerHTML = log.map((r) => "<div class='cq'><b>You:</b> " + esc(r.q) + "</div><div class='ca'>" + (r.answer ? "<div>" + linkify(r.answer) + "</div>" : "") + (r.note ? "<div class='small warn'>" + esc(r.note) + "</div>" : "") +
      (r.ctx.length && (!r.answer || r.mode === "offline") ? "<ul class='small'>" + r.ctx.map((c) => "<li><a href='#/entry/" + encodeURIComponent(c.id) + "'>" + esc(c.title) + "</a> — " + esc(c.text.slice(0, 160)) + (c.text.length > 160 ? "…" : "") + "</li>").join("") + "</ul>" : "") +
      (r.answer && r.ctx.length ? "<div class='small'>Grounded in: " + r.ctx.map((c) => "<a href='#/entry/" + encodeURIComponent(c.id) + "'>" + esc(c.title) + "</a>").join(", ") + "</div>" : "") + "</div>").join("");
    out.scrollTop = out.scrollHeight;
  }
  function view(body) {
    const m = mode();
    const status = m === "worker" ? "Online: questions and the matching atlas entries go to this site’s chat service." : m === "byo" ? "Your own xAI key (stored only in this browser) is used; questions go straight to the xAI API." : "Offline: no chat service is set, so you get the matching atlas entries instead of a written answer.";
    body.innerHTML = "<p class='small'>Ask about any route, vessel, aircraft, spacecraft, place or era. Answers come only from atlas entries, with links; anything the atlas does not cover is [UNKNOWN].</p>" +
      "<div class='small chatstatus' id='chatStatus' data-mode='" + m + "'>" + esc(status) + "</div><div class='chatlog' id='chatLog'></div>" +
      "<form id='chatForm' class='row'><input id='chatQ' type='search' maxlength='500' placeholder='e.g. When did the Comet fly to Johannesburg?' aria-label='Question'><button class='btn' type='submit'>Ask</button></form>" +
      (E().byoKey ? "<details class='small'><summary>Use my own xAI key (this computer only)</summary><p>The key stays in this browser’s storage on this computer. It is never written to a file or sent anywhere except api.x.ai.</p>" +
        "<input id='chatKey' type='password' autocomplete='off' placeholder='" + (byoKey() ? "A key is saved" : "xai-…") + "' aria-label='xAI API key'> <input id='chatModel' placeholder='Model (default " + DEFAULT_MODEL + ")' aria-label='Model'> <button class='btn ghost' type='button' id='chatSave'>Save</button> <button class='btn ghost' type='button' id='chatForget'>Forget key</button></details>" : "");
    $("chatForm").addEventListener("submit", (ev) => { ev.preventDefault(); const q = $("chatQ").value; $("chatQ").value = ""; ask(q); });
    if ($("chatSave")) {
      $("chatSave").addEventListener("click", () => { const k = $("chatKey").value.trim(), mo = $("chatModel").value.trim(); try { if (k) localStorage.setItem(KEY, k); if (mo) localStorage.setItem(MODEL, mo); } catch (e) { /* storage off */ } $("chatKey").value = ""; view(body); });
      $("chatForget").addEventListener("click", () => { try { localStorage.removeItem(KEY); localStorage.removeItem(MODEL); } catch (e) { /* storage off */ } view(body); });
    }
    render();
  }
  window.SeaChat = { ask, mode, context, checkCites, view, prompt, SYSTEM, log: () => log.slice() };
})();
