/* SeaListen: read entries aloud with the browser's own speech voice (Web Speech API; nothing is sent anywhere
   by SeaGlobe), and narrated tours with captions. If the browser has no speech voice, captions still play.
   Narration starts only on an explicit press (Listen, a tour button, or Next). It never starts when a tab
   opens, and a tour never advances on its own — not on end, and not on a speech error. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const synth = window.speechSynthesis || null;
  const st = { speaking: false, tour: null, i: 0, timer: null, rate: 1, lastText: "", token: 0 };
  const supported = () => !!(synth && window.SpeechSynthesisUtterance);
  const muted = () => new URLSearchParams(location.search).get("mute") === "1";
  function textOf(e) {
    if (!e) return "";
    const parts = [e.title + "."];
    if (e.summary) parts.push(e.summary);
    if (e.evidence && e.evidence.basis === "reconstruction") parts.push("This route is a reconstruction.");
    return parts.join(" ").replace(/\[UNKNOWN\]/g, "unknown").replace(/\s+/g, " ").trim();
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clearCaption() {
    const c = $("listenCap");
    if (!c) return;
    while (c.firstChild) c.removeChild(c.firstChild);
    c.hidden = true;
  }
  function addControls(c) {
    const row = el("span", "listen-ctrls");
    if (st.tour && st.i < st.tour.stops.length) {
      const n = el("button", "btn ghost small", "Next");
      n.id = "listenNext";
      n.type = "button";
      row.appendChild(n);
    }
    const s = el("button", "btn ghost small", "Stop");
    s.id = "listenStop";
    s.type = "button";
    s.setAttribute("aria-label", "Stop listening");
    row.appendChild(s);
    c.appendChild(row);
    const b = $("listenStop"); if (b) b.addEventListener("click", stop);
    const n = $("listenNext"); if (n) n.addEventListener("click", next);
  }
  // Caption nodes are built with textContent only. Tour titles, stop counters and entry text
  // never go through innerHTML.
  function showCaption(kind, opts) {
    const c = $("listenCap");
    if (!c) return;
    while (c.firstChild) c.removeChild(c.firstChild);
    c.hidden = false;
    if (kind === "tour") {
      const head = el("div", "listen-head");
      head.appendChild(el("span", "listen-title", opts.title));
      const n = el("span", "listen-count", "Stop " + opts.i + " of " + opts.n);
      n.setAttribute("aria-label", "Stop " + opts.i + " of " + opts.n);
      head.appendChild(n);
      c.appendChild(head);
      c.appendChild(el("div", "listen-body", opts.body));
    } else if (kind === "end") {
      c.appendChild(el("span", "kicker", "Tour"));
      c.appendChild(document.createTextNode(" "));
      c.appendChild(el("span", "listen-body", "End of “" + opts.title + "”."));
    } else {
      c.appendChild(el("span", "kicker", "Listening"));
      c.appendChild(document.createTextNode(" "));
      c.appendChild(el("span", "listen-body", opts.body));
    }
    addControls(c);
  }
  function stop() {
    st.token++;
    if (synth) synth.cancel();
    clearTimeout(st.timer); st.speaking = false; st.tour = null; clearCaption();
    document.querySelectorAll("[data-listen]").forEach((b) => b.setAttribute("aria-pressed", "false"));
  }
  function say(text, meta) {
    clearTimeout(st.timer);
    const token = ++st.token;
    const start = () => {
      if (token !== st.token) return;
      st.speaking = true; st.lastText = text;
      if (meta && meta.title) showCaption("tour", { title: meta.title, i: meta.i, n: meta.n, body: text });
      else showCaption("listen", { body: text });
      const finish = (why) => {
        if (token !== st.token) return;
        st.speaking = false;
        clearTimeout(st.timer);
        // end and error both stay on this stop; only an explicit Next or Stop moves on
        if (why === "error") {
          const c = $("listenCap");
          if (c && !c.querySelector(".listen-err")) {
            c.appendChild(el("span", "listen-err small", "Couldn’t play this stop."));
          }
        }
      };
      if (supported() && !muted()) {
        const u = new SpeechSynthesisUtterance(text); u.rate = st.rate; u.lang = "en";
        u.onend = () => finish("end");
        u.onerror = () => finish("error");
        synth.speak(u);
      } else {
        // captions only: hold this stop until Next or Stop; no end timer that would auto-advance
        st.timer = null;
      }
    };
    // Chrome drops a new utterance if cancel() and speak() run in the same turn, which sounded like a stutter
    // and then skipped ahead when onerror was treated as the end of the stop.
    if (synth && (synth.speaking || synth.pending)) {
      synth.cancel();
      st.timer = setTimeout(start, 0);
    } else start();
  }
  function entry(id) { const A = window.SeaAtlas; const e = A && A.get(id); if (!e) return false; st.tour = null; st.i = 0; say(textOf(e)); return true; }
  function playStop() {
    if (!st.tour) return;
    if (st.i >= st.tour.stops.length) {
      const title = st.tour.title;
      st.tour = null;
      showCaption("end", { title: title });
      st.timer = setTimeout(() => clearCaption(), 3000);
      return;
    }
    const e = st.tour.stops[st.i++];
    if (window.SeaEncyclopedia && window.SeaEncyclopedia.showOnGlobe) window.SeaEncyclopedia.showOnGlobe(e);
    say(textOf(e), { title: st.tour.title, i: st.i, n: st.tour.stops.length });
  }
  function tour(id) {
    const T = ((window.SEAGLOBE_DATA || {}).tours || []).find((t) => t.id === id); const A = window.SeaAtlas; if (!T || !A) return false;
    const stops = T.stops.map((s) => A.get(s)).filter(Boolean);
    st.tour = { id, title: T.title, stops }; st.i = 0;
    playStop(); return true;
  }
  function next() {
    if (!st.tour) return false;
    playStop(); return true;
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
  function cardText() { const d = document.querySelector("#detail, .detail"); const t = d ? d.innerText.replace(/\s+/g, " ").trim() : ""; if (!t) return false; st.tour = null; st.i = 0; say(t.slice(0, 900)); return true; }
  function init() {
    if (!$("listenCap")) { const c = document.createElement("div"); c.id = "listenCap"; c.className = "listencap glass"; c.hidden = true; c.setAttribute("aria-live", "polite"); document.body.appendChild(c); }
    const deeper = document.querySelector("[data-pane='deeper']");
    if (deeper && !$("tourList")) {
      const tours = (window.SEAGLOBE_DATA || {}).tours || [];
      const box = el("div", "tours");
      box.id = "tourList";
      box.appendChild(el("div", "kicker", "Narrated tours"));
      tours.forEach((t) => {
        const b = el("button", "btn ghost", "▶ " + t.title);
        b.type = "button";
        b.setAttribute("data-listen", "tour:" + t.id);
        box.appendChild(b);
      });
      const note = el("div", "small", supported()
        ? "Read aloud by your browser’s speech voice, with captions. Press a tour to start; Next for the next stop."
        : "Your browser has no speech voice; tours play as captions. Press a tour to start; Next for the next stop.");
      box.appendChild(note);
      deeper.insertBefore(box, deeper.firstChild);
    }
    wire(document);
    window.addEventListener("seaglobe:entry", () => wire(document));
    window.addEventListener("seaglobe:detail", () => wire(document));
    window.addEventListener("keydown", (e) => { if (e.key === "Escape" && (st.speaking || st.tour)) stop(); });
  }
  window.SeaListen = { supported, entry, tour, next, stop, say, textOf, wire, state: () => ({ speaking: st.speaking, tour: st.tour && st.tour.id, i: st.i, last: st.lastText }) };
  window.addEventListener("seaglobe:ready", init);
})();
