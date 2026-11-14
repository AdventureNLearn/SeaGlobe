/* SeaRadio: Creedence Clearwater Revival Radio. SeaGlobe hosts no audio.
   - In-app player: the official CCR YouTube playlist in YouTube's own embedded player (IFrame Player API,
     privacy-enhanced host). Nothing loads until you press "Load the player", playback starts only when you press
     play (no autoplay), there is only ever one player, it is at least 200 × 200 px, nothing is drawn over it,
     and the player is never [hidden], display:none, or removed while it exists.
   - Minimize collapses the panel to a visible on-screen mini player: the real YouTube iframe stays at least
     200×200 CSS px, uncovered, with its controls usable, docked in a corner, plus the title and Expand next to it.
     The player stays mounted and keeps playing; minimize, opening other panels, tabs or layers never calls destroy()
     and never resets st.started. If a 200×200 tile cannot fit above the globe controls, playback is paused instead.
     The mini-bar Play control only acts on a visible player (it never starts a hidden one).
   - Close (×) is the only action that destroys the player and resets st.started, so a later reopen waits for play.
   - A track that is blocked from embedding or unavailable is skipped with a short message (only after the user has
     started playback).
   - Link-outs to two outside radio pages open in a new tab.
   - Offline, or if YouTube is blocked, the panel says so; the rest of SeaGlobe is not affected. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const R = () => (window.SEAGLOBE_DATA || {}).radio;
  const st = { open: false, player: null, apiState: "idle", skips: 0, msg: "", started: false, minimized: false, pausedForFit: false };
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
  function trackTitle() {
    try { const d = st.player && st.player.getVideoData && st.player.getVideoData(); if (d && d.title) return d.title; } catch (e) { /* player gone */ }
    const r = R(); return (r && r.player && r.player.title) || "Radio";
  }
  function playerState() { try { return st.player && st.player.getPlayerState ? st.player.getPlayerState() : -1; } catch (e) { return -1; } }
  function isPlaying() { return playerState() === 1; }
  function stageVisible() {
    const stage = $("radioStage"); if (!stage) return false;
    const r = stage.getBoundingClientRect(), cs = getComputedStyle(stage);
    return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) !== 0 &&
      r.width >= 200 && r.height >= 200 && r.left >= -0.5 && r.top >= -0.5 &&
      r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5;
  }
  function hiddenPlayback() {
    if (st.pausedForFit) return true;
    const p = $("radioPanel");
    if (p && p.classList.contains("is-min-paused")) return true;
    if (st.minimized && !stageVisible()) return true;
    return false;
  }
  function bindMediaSession() {
    const ms = navigator.mediaSession;
    if (!ms || !ms.setActionHandler) return;
    const set = (action, fn) => { try { ms.setActionHandler(action, fn); } catch (e) { /* action not supported */ } };
    // Play must not start a hidden player; expand so the user can press play on a visible tile, or do nothing.
    set("play", () => { if (hiddenPlayback()) { expand(); return; } try { if (st.player && st.player.playVideo) st.player.playVideo(); } catch (e) { /* player gone */ } syncMini(); });
    set("pause", () => { try { if (st.player && st.player.pauseVideo) st.player.pauseVideo(); } catch (e) { /* player gone */ } syncMini(); });
  }
  function togglePlay() {
    if (!st.player) return;
    // Play may only control a visible on-screen player, never a hidden or off-screen one.
    if (st.minimized && !stageVisible()) { expand(); return; }
    try {
      if (isPlaying()) { if (st.player.pauseVideo) st.player.pauseVideo(); }
      else { if (st.player.playVideo) st.player.playVideo(); }   // explicit press on the mini-bar, not autoplay
    } catch (e) { /* player gone */ }
    syncMini();
  }
  function overlaps(a, b) {
    return a && b && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  }
  function fitsMiniPlayer() {
    const min = 200, gap = 8;
    const timeline = $("timeline"), menu = $("menuBtn"), topbar = document.querySelector(".topbar");
    let left = gap, top = gap, right = innerWidth - gap, bottom = innerHeight - gap;
    if (topbar) top = Math.max(top, topbar.getBoundingClientRect().bottom + gap);
    if (timeline) {
      const t = timeline.getBoundingClientRect();
      if (t.height > 0 && t.top < innerHeight) bottom = Math.min(bottom, t.top - gap);
    }
    if (right - left < min || bottom - top < min) return false;
    const places = [
      { left: left, top: bottom - min, right: left + min, bottom: bottom },
      { left: right - min, top: bottom - min, right: right, bottom: bottom }
    ];
    const mr = menu ? menu.getBoundingClientRect() : null;
    return places.some((p) => !overlaps(p, mr));
  }
  function applyMiniFit() {
    const p = $("radioPanel");
    const ok = fitsMiniPlayer();
    st.pausedForFit = !ok;
    if (p) p.classList.toggle("is-min-paused", !ok);
    document.body.classList.toggle("radio-min", !!(st.minimized && ok));
    if (!ok && st.player && st.player.pauseVideo) {
      try { st.player.pauseVideo(); } catch (e) { /* player gone */ }
    }
    if (window.SeaWindows && window.SeaWindows.paintDock) window.SeaWindows.paintDock();
    syncMini();
  }
  function syncMini() {
    document.querySelectorAll("#radioMiniPlay, .radiomini [data-radio='play']").forEach((b) => {
      b.textContent = isPlaying() ? "❚❚" : "▶";
      b.setAttribute("aria-label", isPlaying() ? "Pause" : "Play");
    });
    document.querySelectorAll("#radioMiniTitle, .radiomini .rmtitle").forEach((t) => { t.textContent = trackTitle(); });
  }
  function miniNode() {
    const wrap = document.createElement("span");
    wrap.className = "radiomini";
    wrap.innerHTML = "<button class='btn ghost icon' type='button' data-radio='play' aria-label='Play'>▶</button>" +
      "<span class='rmtitle'>" + esc(trackTitle()) + "</span>" +
      "<button class='btn ghost small' type='button' data-radio='expand'>Expand</button>";
    wrap.querySelector("[data-radio='play']").addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });
    wrap.querySelector("[data-radio='expand']").addEventListener("click", (e) => { e.stopPropagation(); expand(); });
    syncMini();
    return wrap;
  }
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
        onReady: () => { st.apiState = "ready"; note("Press play in the player to start. Tracks play from YouTube."); if (btn) btn.hidden = true; bindMediaSession(); syncMini(); },
        // the user has pressed play once (state 1 = playing); before that nothing may start playback by itself
        onStateChange: (e) => {
          const data = e && e.data;
          // 1 = playing, 3 = buffering. A media key must not restart a hidden / paused-for-fit player.
          if ((data === 1 || data === 3) && hiddenPlayback()) {
            try { if (st.player && st.player.pauseVideo) st.player.pauseVideo(); } catch (x) { /* player gone */ }
            syncMini();
            return;
          }
          if (data === 1) st.started = true;
          syncMini();
        },
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
  // Close (×) only. Minimize and switching panels must never call this (it resets st.started and tears down the player).
  function destroy() { if (st.player && st.player.destroy) { try { st.player.destroy(); } catch (e) { /* already gone */ } } st.player = null; st.skips = 0; st.started = false; }
  function bindWindows(p) {
    if (!window.SeaWindows) return;
    window.SeaWindows.register("radio", p, {
      title: (R() && R().title) || "Radio",
      keepAlive: true,
      minW: 280,
      minH: 260,
      mini: miniNode,
      onMinimize: () => { st.minimized = true; syncMini(); },
      onExpand: () => { st.minimized = false; if (p.hidden) p.hidden = false; syncMini(); },
    });
  }
  function panel() {
    let p = $("radioPanel"); if (p) return p;
    const r = R();
    p = document.createElement("aside"); p.className = "panel glass radiopanel"; p.id = "radioPanel"; p.hidden = true; p.setAttribute("aria-label", r.title);
    p.innerHTML = "<div class='loghead'><div><div class='kicker'>Radio</div><div class='rtitle'>" + esc(r.title) + "</div></div><button class='btn ghost icon' id='radioClose' aria-label='Close radio (stops the player)'>×</button></div>" +
      "<div class='radiostage' id='radioStage'><div id='radioPlayer'></div></div>" +
      "<div class='radiomini' id='radioMini'><button class='btn ghost icon' type='button' data-radio='play' aria-label='Play'>▶</button>" +
      "<span class='rmtitle'></span><button class='btn ghost small' type='button' data-radio='expand'>Expand</button></div>" +
      "<button class='btn' id='radioLoad'>Load the player</button><div class='small' id='radioMsg' role='status' hidden></div>" +
      "<div class='small'>Playlist: <a href='" + esc(r.player.playlistUrl) + "' target='_blank' rel='noopener noreferrer'>" + esc(r.player.title) + "</a> on <a href='" + esc(r.player.channel) + "' target='_blank' rel='noopener noreferrer'>" + esc(r.player.channelName) + "</a>. Played by YouTube’s embedded player; SeaGlobe hosts no audio. Free; YouTube may show ads.</div>" +
      "<div class='kicker' data-style='margin-top:6px'>Outside radio sites</div><ul class='radiolinks'>" +
      r.links.map((l) => "<li><a href='" + esc(l.url) + "' target='_blank' rel='noopener noreferrer'>" + esc(l.title) + "</a> <span class='rtype'>outside site: " + esc(l.site) + " ↗</span><div class='small'>" + esc(l.note) + "</div></li>").join("") + "</ul>";
    document.body.appendChild(p);
    $("radioClose").addEventListener("click", () => open(false));
    $("radioLoad").addEventListener("click", start);
    const mini = $("radioMini");
    if (mini) {
      mini.querySelector("[data-radio='play']").addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });
      mini.querySelector("[data-radio='expand']").addEventListener("click", (e) => { e.stopPropagation(); expand(); });
    }
    bindWindows(p);
    return p;
  }
  function minimize() {
    if (!st.open) return;
    st.minimized = true;
    const p = $("radioPanel"); if (p) p.hidden = false;   // never [hidden] the player
    applyMiniFit();
    if (window.SeaWindows) window.SeaWindows.minimize("radio");
    else if (p) p.classList.add("is-min");
    applyMiniFit();
    syncMini();
  }
  function expand() {
    const p = panel();
    st.open = true; st.minimized = false; st.pausedForFit = false;
    p.hidden = false; p.classList.remove("is-min-paused");
    document.body.classList.add("radio-open"); document.body.classList.remove("radio-min");
    setPressed(true);
    if (window.SeaWindows) window.SeaWindows.expand("radio");
    else p.classList.remove("is-min");
    syncMini();
  }
  function open(on) {
    const p = panel();
    if (!on) {
      if (window.SeaWindows) { window.SeaWindows.expand("radio"); window.SeaWindows.unregister("radio"); }
      destroy(); p.remove(); st.open = false; st.minimized = false; st.pausedForFit = false;
      document.body.classList.remove("radio-open"); document.body.classList.remove("radio-min"); setPressed(false); return;
    }
    if (st.minimized) { expand(); return; }
    st.open = true; st.minimized = false;
    p.hidden = false; document.body.classList.add("radio-open"); setPressed(true);
    if (navigator.onLine === false) note("Radio needs internet. You appear to be offline; the rest of SeaGlobe works as usual.");
  }
  function onRadioButton() {
    if (!st.open) return open(true);
    if (st.minimized) return expand();
    if (st.player) return minimize();   // keep playing; only × destroys
    return open(false);
  }
  function setPressed(v) { ["radioBtn", "mRadioBtn"].forEach((id) => { const b = $(id); if (b) b.setAttribute("aria-pressed", String(v)); }); }
  function init() {
    if (!R()) return;
    const logBtn = $("atlasBtn") || $("logBtn");
    if (logBtn && !$("radioBtn")) {
      const b = document.createElement("button"); b.className = "btn"; b.id = "radioBtn"; b.setAttribute("aria-pressed", "false"); b.title = R().title + " (needs internet)"; b.textContent = "Radio";
      b.addEventListener("click", onRadioButton); logBtn.parentNode.insertBefore(b, logBtn.nextSibling);
    }
    const mq = $("mQuick");
    if (mq && !$("mRadioBtn")) { const m = document.createElement("button"); m.className = "btn"; m.id = "mRadioBtn"; m.textContent = "Radio"; m.addEventListener("click", () => { if (window.__sgMobile) window.__sgMobile.sheet(null); onRadioButton(); }); mq.appendChild(m); }
    window.addEventListener("offline", () => { if (st.open) note("Radio needs internet. You are offline now."); });
    window.addEventListener("resize", () => { if (st.minimized) applyMiniFit(); });
  }
  window.SeaRadio = { open, start, minimize, expand, state: () => ({ open: st.open, player: !!st.player, api: st.apiState, skips: st.skips, msg: st.msg, started: !!st.started, minimized: !!st.minimized, pausedForFit: !!st.pausedForFit }) };
  window.addEventListener("seaglobe:ready", () => setTimeout(init, 0));
})();
