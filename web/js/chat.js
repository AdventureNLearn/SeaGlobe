/* SeaChat: "Ask the atlas". Answers are grounded in atlas entries only:
   1. find the matching entries with the built-in search (local, no network);
   2. if the user has pasted THEIR OWN xAI API key in the chat settings, send the question plus those entries straight
      from this browser to the xAI API (api.x.ai allows browser calls: CORS). The reply must cite entry ids and say
      [UNKNOWN] when the entries do not answer it. The user pays xAI for their own use; SeaGlobe has no key and no server;
   3. otherwise (default) chat is offline and shows the matching entries instead.
   The key is kept in sessionStorage (this tab only) unless the user ticks "Remember on this device" (localStorage).
   It is never put in the URL, never logged, never shown again, and never sent anywhere except the xAI API.
   With no matching entries the answer is always [UNKNOWN] and nothing is sent. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const E = () => window.SEAGLOBE_EDITION || {};
  const KEY = "sg-xai-key", MODEL = "sg-xai-model";
  const XAI_ORIGIN = "https://api.x.ai", XAI = XAI_ORIGIN + "/v1/chat/completions";
  const CONSOLE = "https://console.x.ai/";
  const DEFAULT_MODEL = "grok-4.20-0309-non-reasoning";
  const SYSTEM = "You answer questions about SeaGlobe, an atlas of historical routes. Use ONLY the numbered atlas entries given. " +
    "Cite every claim with the entry id in square brackets, e.g. [route:wright-kitty-hawk-1903]. If the entries do not answer the question, reply exactly: [UNKNOWN] The atlas has no source for that. " +
    "Never add facts, dates or names that are not in the entries. Keep answers under 120 words. Say when an entry is a reconstruction.";
  const log = [];
  // the endpoint is fixed; a copy served from this computer may point it at a local test stand-in (tests only)
  function endpoint() {
    const P = new URLSearchParams(location.search), local = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
    const q = local && P.get("xaiurl");
    return q && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(q) ? q : XAI;
  }
  const store = (kind) => { try { return kind === "local" ? window.localStorage : window.sessionStorage; } catch (e) { return null; } };
  const get = (kind, k) => { const s = store(kind); try { return s ? s.getItem(k) || "" : ""; } catch (e) { return ""; } };
  const put = (kind, k, v) => { const s = store(kind); try { if (s) s.setItem(k, v); } catch (e) { /* storage off */ } };
  const del = (kind, k) => { const s = store(kind); try { if (s) s.removeItem(k); } catch (e) { /* storage off */ } };
  let memKey = "";   // used when browser storage is turned off: lives only until the page closes
  function userKey() { return get("session", KEY) || get("local", KEY) || memKey; }
  function remembered() { return !!get("local", KEY); }
  function setKey(k, remember) {
    forget();
    k = String(k || "").trim(); if (!k) return;
    if (remember) put("local", KEY, k); else put("session", KEY, k);
    if (!get(remember ? "local" : "session", KEY)) memKey = k;
  }
  function forget() { memKey = ""; ["session", "local"].forEach((s) => { del(s, KEY); del(s, MODEL); }); }
  function model() { return get("session", MODEL) || get("local", MODEL) || DEFAULT_MODEL; }
  function mode() { return userKey() ? "key" : "offline"; }
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
    if (window.SeaAtlas && window.SeaAtlas.ensureAll) await window.SeaAtlas.ensureAll();   // index every entry, including regions and towns
    const ctx = context(q), m = mode();
    let res = { q, mode: m, ctx, answer: "", note: "" };
    if (!ctx.length) res.answer = "[UNKNOWN] The atlas has no entry that matches that, so there is no source to answer from.";
    else if (m === "offline") { res.answer = ""; res.note = "Chat is offline (no xAI key is set in chat settings). Here is what the atlas has:"; }
    else {
      const r = await post(endpoint(), { model: model(), max_tokens: 400, temperature: 0.2, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt(q, ctx) }] }, { authorization: "Bearer " + userKey() });
      const text = r.ok && r.j ? (r.j.answer || (r.j.choices && r.j.choices[0] && r.j.choices[0].message && r.j.choices[0].message.content) || "") : "";
      if (!text) { res.note = (r.status === 401 || r.status === 403 ? "xAI did not accept the key (check it, or its credits, in the xAI console)."
        : r.status === 429 ? "xAI says the key has hit a rate or spending limit."
        : "The xAI API could not be reached.") + " Here is what the atlas has:"; res.mode = "offline"; }
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
    const status = m === "key" ? "Online with your own xAI key" + (remembered() ? " (remembered on this device)" : " (this tab only)") + ": questions and the matching atlas entries go straight from this browser to the xAI API."
      : "Offline: no xAI key is set, so you get the matching atlas entries instead of a written answer.";
    body.innerHTML = "<p class='small'>Ask about any route, vessel, aircraft, spacecraft, place or era. Answers come only from atlas entries, with links; anything the atlas does not cover is [UNKNOWN].</p>" +
      "<div class='small chatstatus' id='chatStatus' data-mode='" + m + "'>" + esc(status) + "</div><div class='chatlog' id='chatLog'></div>" +
      "<form id='chatForm' class='row'><input id='chatQ' type='search' maxlength='500' placeholder='e.g. When did the Comet fly to Johannesburg?' aria-label='Question'><button class='btn' type='submit'>Ask</button></form>" +
      "<details class='small chatkey' id='chatSettings'" + (m === "key" ? "" : " open") + "><summary>Chat settings: your own xAI key</summary>" +
      "<p>To get written answers, paste your own xAI API key. <a href='" + CONSOLE + "' target='_blank' rel='noopener noreferrer'>Get a key in the xAI console</a> (outside site, opens in a new tab).</p>" +
      "<p><b>Cost:</b> you pay xAI for your own use, at xAI's prices. SeaGlobe has no key, no server and no account, and is not paid for this.</p>" +
      "<p>The key stays in this browser. It is sent only to the xAI API (api.x.ai), never put in a link, a file or a log, and is not shown again after you save it.</p>" +
      "<form id='chatKeyForm' autocomplete='off'><input id='chatKey' type='password' autocomplete='off' spellcheck='false' placeholder='" + (m === "key" ? "A key is set" : "Paste your xAI API key") + "' aria-label='xAI API key'>" +
      " <input id='chatModel' placeholder='Model (default " + DEFAULT_MODEL + ")' aria-label='Model' value='" + esc(model() === DEFAULT_MODEL ? "" : model()) + "'>" +
      "<label class='row'><input type='checkbox' id='chatRemember'" + (remembered() ? " checked" : "") + "> Remember on this device (otherwise the key is forgotten when this tab closes)</label>" +
      "<div class='row'><button class='btn' type='submit' id='chatSave'>Save key</button> <button class='btn ghost' type='button' id='chatForget'>Forget key</button></div></form></details>";
    $("chatForm").addEventListener("submit", (ev) => { ev.preventDefault(); const q = $("chatQ").value; $("chatQ").value = ""; ask(q); });
    $("chatKeyForm").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const k = $("chatKey").value.trim(), mo = $("chatModel").value.trim(), rem = $("chatRemember").checked;
      $("chatKey").value = "";
      if (k) setKey(k, rem);
      else if (userKey()) { const cur = userKey(); setKey(cur, rem); }   // only the remember choice changed
      if (userKey()) { const where = remembered() ? "local" : "session"; if (mo) put(where, MODEL, mo); else del(where, MODEL); }
      view(body);
    });
    $("chatForget").addEventListener("click", () => { forget(); view(body); });
    render();
  }
  window.SeaChat = { ask, mode, context, checkCites, view, prompt, SYSTEM, forget, remembered, endpoint, log: () => log.slice() };
})();
