/* SeaRadio: Creedence Clearwater Revival Radio. SeaGlobe hosts no audio.
   - In-app player: the official CCR YouTube playlist in YouTube's own embedded player (IFrame Player API,
     privacy-enhanced host). Nothing loads until you press "Load the player", playback starts only when you press
     play in YouTube's player (no autoplay), there is only ever one player, it is at least 200 × 200 px, nothing is
     drawn over it, and it is never hidden while it exists (closing the panel removes it).
   - A track that is blocked from embedding or unavailable is skipped with a short message.
   - Link-outs to two outside radio pages open in a new tab.
   - Offline, or if YouTube is blocked, the panel says so; the rest of SeaGlobe is not affected. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const R = () => (window.SEAGLOBE_DATA || {}).radio;
  const st = { open: false, player: null, apiState: "idle", skips: 0, msg: "" };
  const ERR = { 2: "a bad request", 5: "an HTML5 player error", 100: "the video was removed or is private", 101: "its owner does not allow embedding", 150: "its owner does not allow embedding", 153: "the player could not identify this site" };
  function apiUrl() {   // tests point this at a local stand-in (localhost only)
    const q = new URLSearchParams(location.search).get("radioapi");
    return q && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)\//.test(q) ? q : R().player.api;
  }
  function loadApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(true);
    if (st.apiPromise) return st.apiPromise;
    st.apiPromise = new Promise((res) => {
      if (navigator.onLine === false) return res(false);
      const t = setTimeout(() => res(false), 10000);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { clearTimeout(t); if (typeof prev === "function") prev(); res(true); };
      const s = document.createElement("script"); s.src = apiUrl(); s.async = true;
      s.onerror = () => { clearTimeout(t); res(false); };
      document.head.appendChild(s);
    }).then((ok) => { if (!ok) st.apiPromise = null; return ok; });
    return st.apiPromise;
  }
  function note(t) { st.msg = t || ""; const el = $("radioMsg"); if (el) { el.textContent = st.msg; el.hidden = !st.msg; } }
  async function start() {
    const btn = $("radioLoad"); if (btn) btn.disabled = true;
    note("Loading YouTube’s player…");
    const ok = await loadApi();
    if (!ok || !$("radioPlayer")) { st.apiState = "offline"; note("Radio needs internet. YouTube’s player could not be reached (you may be offline, or YouTube is blocked here). The rest of SeaGlobe works as usual."); if (btn) btn.disabled = false; return false; }
    if (st.player) return true;   // one player only
    const P = R().player;
    st.player = new window.YT.Player("radioPlayer", {
      host: P.host, width: "100%", height: "100%",
      playerVars: { listType: "playlist", list: P.playlist, autoplay: 0, playsinline: 1, rel: 0, origin: location.origin },
      events: {
        onReady: () => { st.apiState = "ready"; note("Press play in the player to start. Tracks play from YouTube."); if (btn) btn.hidden = true; },
        // the user has pressed play once (state 1 = playing); before that nothing may start playback by itself
        onStateChange: (e) => { if (e && e.data === 1) st.started = true; },
        onError: (e) => {
          const why = ERR[e.data] || "it is unavailable";
          if (!st.started) { note("The first track can’t be played here because " + why + ". Press the next-track button in the player to go on."); return; }
          st.skips++;
          note("A track was skipped because " + why + ".");
          try { if (st.skips < 25) st.player.nextVideo(); } catch (x) { /* player gone */ }
        },
      },
    });
    st.apiState = "loading";
    return true;
  }
  function destroy() { if (st.player && st.player.destroy) { try { st.player.destroy(); } catch (e) { /* already gone */ } } st.player = null; st.skips = 0; st.started = false; }   // a reopened player waits for the user's play again before any skip
  function panel() {
    let p = $("radioPanel"); if (p) return p;
    const r = R();
    p = document.createElement("aside"); p.className = "panel glass radiopanel"; p.id = "radioPanel"; p.hidden = true; p.setAttribute("aria-label", r.title);
    p.innerHTML = "<div class='loghead'><div><div class='kicker'>Radio</div><div class='rtitle'>" + esc(r.title) + "</div></div><button class='btn ghost icon' id='radioClose' aria-label='Close radio (stops the player)'>×</button></div>" +
      "<div class='radiostage' id='radioStage'><div id='radioPlayer'></div></div>" +
      "<button class='btn' id='radioLoad'>Load the player</button><div class='small' id='radioMsg' role='status' hidden></div>" +
      "<div class='small'>Playlist: <a href='" + esc(r.player.playlistUrl) + "' target='_blank' rel='noopener noreferrer'>" + esc(r.player.title) + "</a> on <a href='" + esc(r.player.channel) + "' target='_blank' rel='noopener noreferrer'>" + esc(r.player.channelName) + "</a>. Played by YouTube’s embedded player; SeaGlobe hosts no audio. Free; YouTube may show ads.</div>" +
      "<div class='kicker' data-style='margin-top:6px'>Outside radio sites</div><ul class='radiolinks'>" +
      r.links.map((l) => "<li><a href='" + esc(l.url) + "' target='_blank' rel='noopener noreferrer'>" + esc(l.title) + "</a> <span class='rtype'>outside site: " + esc(l.site) + " ↗</span><div class='small'>" + esc(l.note) + "</div></li>").join("") + "</ul>";
    document.body.appendChild(p);
    $("radioClose").addEventListener("click", () => open(false));
    $("radioLoad").addEventListener("click", start);
    return p;
  }
  function open(on) {
    const p = panel(); st.open = !!on;
    if (!on) { destroy(); p.remove(); document.body.classList.remove("radio-open"); setPressed(false); return; }
    p.hidden = false; document.body.classList.add("radio-open"); setPressed(true);
    if (navigator.onLine === false) note("Radio needs internet. You appear to be offline; the rest of SeaGlobe works as usual.");
  }
  function setPressed(v) { ["radioBtn", "mRadioBtn"].forEach((id) => { const b = $(id); if (b) b.setAttribute("aria-pressed", String(v)); }); }
  function init() {
    if (!R()) return;
    const logBtn = $("atlasBtn") || $("logBtn");
    if (logBtn && !$("radioBtn")) {
      const b = document.createElement("button"); b.className = "btn"; b.id = "radioBtn"; b.setAttribute("aria-pressed", "false"); b.title = R().title + " (needs internet)"; b.textContent = "Radio";
      b.addEventListener("click", () => open(!st.open)); logBtn.parentNode.insertBefore(b, logBtn.nextSibling);
    }
    const mq = $("mQuick");
    if (mq && !$("mRadioBtn")) { const m = document.createElement("button"); m.className = "btn"; m.id = "mRadioBtn"; m.textContent = "Radio"; m.addEventListener("click", () => { if (window.__sgMobile) window.__sgMobile.sheet(null); open(!st.open); }); mq.appendChild(m); }
    window.addEventListener("offline", () => { if (st.open) note("Radio needs internet. You are offline now."); });
  }
  window.SeaRadio = { open, start, state: () => ({ open: st.open, player: !!st.player, api: st.apiState, skips: st.skips, msg: st.msg }) };
  window.addEventListener("seaglobe:ready", () => setTimeout(init, 0));
})();
