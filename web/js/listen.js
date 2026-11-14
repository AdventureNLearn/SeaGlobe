/* SeaListen: read entries aloud with the browser's own speech voice (Web Speech API; nothing is sent anywhere
   by SeaGlobe), and narrated tours with captions. If the browser has no speech voice, captions still play. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const synth = window.speechSynthesis || null;
  const st = { speaking: false, tour: null, i: 0, timer: null, rate: 1, onEnd: null, lastText: "" };
  const supported = () => !!(synth && window.SpeechSynthesisUtterance);
  function textOf(e) {
    if (!e) return "";
    const parts = [e.title + "."];
    if (e.summary) parts.push(e.summary);
    if (e.evidence && e.evidence.basis === "reconstruction") parts.push("This route is a reconstruction.");
    return parts.join(" ").replace(/\[UNKNOWN\]/g, "unknown").replace(/\s+/g, " ").trim();
  }
  function caption(html) { const c = $("listenCap"); if (!c) return; c.hidden = !html; c.innerHTML = html || ""; }
  function stop() {
    if (synth) synth.cancel();
    clearTimeout(st.timer); st.speaking = false; st.tour = null; caption("");
    document.querySelectorAll("[data-listen]").forEach((b) => b.setAttribute("aria-pressed", "false"));
  }
  function say(text, cap, done) {
    if (synth) synth.cancel(); clearTimeout(st.timer);
    st.speaking = true; st.lastText = text;
    caption("<span class='kicker'>Listening</span> " + esc(cap || text) + " <button class='btn ghost small' id='listenStop' aria-label='Stop listening'>Stop</button>");
    const b = $("listenStop"); if (b) b.addEventListener("click", stop);
    const finish = () => { st.speaking = false; if (done) done(); else caption(""); };
    const mute = new URLSearchParams(location.search).get("mute") === "1";
    if (supported() && !mute) {
      const u = new SpeechSynthesisUtterance(text); u.rate = st.rate; u.lang = "en";
      let fired = false; const once = () => { if (!fired) { fired = true; finish(); } };
      u.onend = once; u.onerror = once;
      synth.speak(u);
      // fallback timer in case the engine never reports the end (some browsers with no voices)
      st.timer = setTimeout(once, 2500 + text.length * 75);
    } else st.timer = setTimeout(finish, 1500 + text.length * 55);   // captions only
  }
  function entry(id) { const A = window.SeaAtlas; const e = A && A.get(id); if (!e) return false; say(textOf(e)); return true; }
  function tour(id) {
    const T = ((window.SEAGLOBE_DATA || {}).tours || []).find((t) => t.id === id); const A = window.SeaAtlas; if (!T || !A) return false;
    const stops = T.stops.map((s) => A.get(s)).filter(Boolean);
    st.tour = { id, title: T.title, stops }; st.i = 0;
    const next = () => {
      if (!st.tour) return;
      if (st.i >= st.tour.stops.length) { caption("<span class='kicker'>Tour</span> End of “" + esc(st.tour.title) + "”."); st.tour = null; st.timer = setTimeout(() => caption(""), 3000); return; }
      const e = st.tour.stops[st.i++];
      if (window.SeaEncyclopedia && window.SeaEncyclopedia.showOnGlobe) window.SeaEncyclopedia.showOnGlobe(e);
      const n = st.i + "/" + st.tour.stops.length;
      say(textOf(e), "<b>" + esc(st.tour.title) + " · " + n + "</b> " + esc(textOf(e)), () => { st.timer = setTimeout(next, 900); });
    };
    next(); return true;
  }
  function wire(root) {
    (root || document).querySelectorAll("[data-listen]:not([data-wired])").forEach((b) => {
      b.dataset.wired = "1";
      b.addEventListener("click", () => {
        if (st.speaking && b.getAttribute("aria-pressed") === "true") return stop();
        const v = b.dataset.listen;
        const ok = v.startsWith("tour:") ? tour(v.slice(5)) : v === "card" ? cardText() : entry(v);
        if (ok) b.setAttribute("aria-pressed", "true");
      });
    });
  }
  function cardText() { const d = document.querySelector("#detail, .detail"); const t = d ? d.innerText.replace(/\s+/g, " ").trim() : ""; if (!t) return false; say(t.slice(0, 900)); return true; }
  function init() {
    if (!$("listenCap")) { const c = document.createElement("div"); c.id = "listenCap"; c.className = "listencap glass"; c.hidden = true; c.setAttribute("aria-live", "polite"); document.body.appendChild(c); }
    const deeper = document.querySelector("[data-pane='deeper']");
    if (deeper && !$("tourList")) {
      const tours = (window.SEAGLOBE_DATA || {}).tours || [];
      deeper.insertAdjacentHTML("afterbegin", "<div class='tours' id='tourList'><div class='kicker'>Narrated tours</div>" + tours.map((t) => "<button class='btn ghost' data-listen='tour:" + esc(t.id) + "'>▶ " + esc(t.title) + "</button>").join("") +
        "<div class='small'>" + (supported() ? "Read aloud by your browser’s speech voice, with captions." : "Your browser has no speech voice; tours play as captions.") + "</div></div>");
    }
    wire(document);
    window.addEventListener("seaglobe:entry", () => wire(document));
    window.addEventListener("seaglobe:detail", () => wire(document));
    window.addEventListener("keydown", (e) => { if (e.key === "Escape" && st.speaking) stop(); });
  }
  window.SeaListen = { supported, entry, tour, stop, say, textOf, wire, state: () => ({ speaking: st.speaking, tour: st.tour && st.tour.id, i: st.i, last: st.lastText }) };
  window.addEventListener("seaglobe:ready", init);
})();
