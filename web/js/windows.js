/* SeaWindows: one shared window system for floating SeaGlobe panels (radio, encyclopedia, Ship's Log,
   the side panel). Drag, resize, lock, content zoom (not the globe), minimize to a dock, and a remembered
   layout in localStorage. On a phone the panels stay snap-to-edge sheets; the dock sits above the globe
   controls and never covers them. capture=1 / shot=1 tests do not read or write the saved layout. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const KEY = "seaglobe-windows";
  const regs = Object.create(null);
  const qs = () => new URLSearchParams(location.search);
  const testMode = () => qs().get("capture") === "1" || qs().get("shot") === "1";
  const ui = () => { const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui")); return v > 0 ? v : 1; };
  const phone = () => window.matchMedia("(max-width: 820px)").matches;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function safeArea() {
    const u = ui(), ph = phone();
    const top = ph ? 52 * u + 16 * u : 8 * u;
    const bottom = ph ? 108 * u + 16 * u + 8 * u : 128 * u + 28 * u;
    const pad = 8 * u;
    return { x: pad, y: top, r: innerWidth - pad, b: innerHeight - bottom, pad, top, bottom };
  }
  function store() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
  function layerPref(name, value) {
    if (arguments.length < 2) {
      if (testMode()) return undefined;
      const o = store();
      return o.layers && o.layers[name];
    }
    if (testMode()) return;
    try {
      const o = store();
      o.layers = o.layers || {};
      if (value == null) delete o.layers[name];
      else o.layers[name] = !!value;
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) { /* quota / private mode */ }
  }
  function persist() {
    if (testMode()) return;
    const out = store();
    Object.keys(regs).forEach((id) => {
      const r = regs[id], rec = recOf(r);
      if (r.moved || r.locked || r.zoom !== 1 || r.minimized) out[id] = rec;
      else delete out[id];
    });
    try { localStorage.setItem(KEY, JSON.stringify(out)); } catch (e) { /* quota / private mode */ }
  }
  function recOf(r) {
    const u = ui(), b = r.el.getBoundingClientRect();
    return { x: b.left / u, y: b.top / u, w: b.width / u, h: b.height / u, zoom: r.zoom, locked: r.locked, minimized: r.minimized };
  }

  function dock() {
    let d = $("windowDock");
    if (!d) {
      d = document.createElement("div");
      d.id = "windowDock"; d.className = "windock glass"; d.hidden = true;
      d.setAttribute("aria-label", "Minimized windows");
      d.innerHTML = "<div class='kicker'>Windows</div><div class='windock-chips' id='windowDockChips'></div>" +
        "<button class='btn ghost small' id='windowReset' type='button' title='Restore the default panel layout'>Reset layout</button>";
      document.body.appendChild(d);
      $("windowReset").addEventListener("click", resetLayout);
    }
    return d;
  }
  function paintDock() {
    const d = dock();
    const chips = $("windowDockChips");
    if (!chips) return;
    chips.innerHTML = "";
    let n = 0, dirty = false;
    Object.keys(regs).forEach((id) => {
      const r = regs[id];
      if (r.moved || r.locked || r.zoom !== 1) dirty = true;
      if (!r.minimized) return;
      // Visible keep-alive tile (radio) already shows title and Expand; a dock chip would cover the iframe.
      if (r.opts.keepAlive && r.opts.mini && !r.el.classList.contains("is-min-paused")) return;
      n++;
      const b = document.createElement("button");
      b.className = "btn ghost small windock-chip" + (r.opts.keepAlive ? " is-alive" : "");
      b.type = "button"; b.dataset.win = id;
      b.setAttribute("aria-label", "Expand " + (r.opts.title || id));
      if (r.opts.keepAlive && r.opts.mini) {
        b.appendChild(r.opts.mini());
      } else {
        b.textContent = r.opts.title || id;
        b.addEventListener("click", () => expand(id));
      }
      chips.appendChild(b);
    });
    d.hidden = n === 0 && !dirty;
    d.classList.toggle("has-chips", n > 0);
  }

  function tools(id) {
    const t = document.createElement("div");
    t.className = "wintools";
    t.innerHTML =
      "<button class='btn ghost icon' type='button' data-act='menu' aria-expanded='false' title='Window controls' aria-label='Window controls'>" +
      "<svg class='win-controls-icon' viewBox='0 0 16 16' width='16' height='16' aria-hidden='true' focusable='false'>" +
      "<rect x='1.5' y='4.5' width='9' height='9' rx='1.25' fill='none' stroke='currentColor' stroke-width='1.4'/>" +
      "<rect x='5.5' y='1.5' width='9' height='9' rx='1.25' fill='none' stroke='currentColor' stroke-width='1.4'/>" +
      "</svg></button>" +
      "<div class='wintools-menu' hidden>" +
      "<button class='btn ghost icon win-lock' type='button' data-act='lock' aria-pressed='false' title='Lock position and size' aria-label='Lock position and size'>🔒</button>" +
      "<button class='btn ghost icon' type='button' data-act='zoom-out' title='Zoom content out' aria-label='Zoom content out'>−</button>" +
      "<button class='btn ghost icon' type='button' data-act='zoom-reset' title='Reset content zoom' aria-label='Reset content zoom'>1:1</button>" +
      "<button class='btn ghost icon' type='button' data-act='zoom-in' title='Zoom content in' aria-label='Zoom content in'>+</button>" +
      "<button class='btn ghost icon' type='button' data-act='min' title='Minimize' aria-label='Minimize'>–</button>" +
      "</div>";
    t.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      const act = b.dataset.act;
      if (act === "menu") {
        const m = t.querySelector(".wintools-menu");
        m.hidden = !m.hidden;
        b.setAttribute("aria-expanded", String(!m.hidden));
        return;
      }
      if (act === "lock") toggleLock(id);
      else if (act === "zoom-in") zoom(id, 0.1);
      else if (act === "zoom-out") zoom(id, -0.1);
      else if (act === "zoom-reset") zoom(id, "reset");
      else if (act === "min") minimize(id);
    });
    return t;
  }
  function handles(el) {
    if (el.querySelector(":scope > .win-h")) return;
    "n s e w ne nw se sw".split(" ").forEach((dir) => {
      const h = document.createElement("div");
      h.className = "win-h " + dir; h.dataset.dir = dir;
      h.setAttribute("aria-hidden", "true");
      el.appendChild(h);
    });
  }
  function attachChrome(id, r) {
    const el = r.el;
    const t = tools(id);
    const tabRow = el.id === "side" ? el.querySelector(".tabs") : null;
    const loghead = el.querySelector(".loghead");
    if (tabRow) {
      // Reserved slot at the end of the tab row, in flow, so Window controls never sits on Voyage (or any tab).
      t.classList.add("wintools-end");
      tabRow.appendChild(t);
      tabRow.setAttribute("data-winbar", "1");
    } else if (loghead) {
      // In-flow between the title and the right-hand buttons. space-between keeps
      // the title on the left and Export CSV / Back / × on the right, unmoved.
      const right = [...loghead.children].find((c) => c.classList.contains("row") || c.tagName === "BUTTON");
      if (right) loghead.insertBefore(t, right);
      else loghead.appendChild(t);
      loghead.setAttribute("data-winbar", "1");
    } else {
      const bar = document.createElement("div");
      bar.className = "winbar"; bar.setAttribute("data-winbar", "1");
      const k = document.createElement("div"); k.className = "kicker"; k.textContent = r.opts.title || id;
      bar.appendChild(k);
      bar.appendChild(t);
      el.insertBefore(bar, el.firstChild);
    }
    handles(el);
  }

  function zoomTarget(r) {
    return r.el.querySelector(r.opts.zoomSel || ".pbody, #atlasBody, .abody, #logList, .radiostage") || r.el.querySelector(":scope > .winbody");
  }
  function applyZoom(r) {
    r.el.style.setProperty("--win-zoom", String(r.zoom));
    r.el.classList.toggle("is-zoomed", r.zoom !== 1);
    const t = zoomTarget(r);
    if (!t) return;
    // A keep-alive mini player must stay at least 200×200 CSS px, uncovered, so do not zoom it while minimized.
    if (r.minimized && r.opts.keepAlive) t.style.zoom = "";
    else t.style.zoom = r.zoom === 1 ? "" : String(r.zoom);
  }
  function applyLock(r) {
    r.el.classList.toggle("is-locked", r.locked);
    r.el.querySelectorAll(".win-lock").forEach((b) => b.setAttribute("aria-pressed", String(r.locked)));
  }
  function applyBox(r, rec) {
    if (!rec) return;
    const u = ui(), a = safeArea();
    const w = clamp(rec.w * u, (r.opts.minW || 200) * u, innerWidth - a.pad * 2);
    const h = clamp(rec.h * u, (r.opts.minH || 120) * u, a.b - a.y);
    const x = clamp(rec.x * u, a.x, a.r - Math.min(w, 80 * u));
    const y = clamp(rec.y * u, a.y, a.b - Math.min(h, 40 * u));
    r.el.style.left = x + "px"; r.el.style.top = y + "px";
    r.el.style.right = "auto"; r.el.style.bottom = "auto";
    r.el.style.width = w + "px"; r.el.style.height = h + "px";
    r.el.classList.add("sgwin-moved");
    r.moved = true;
  }
  function clearBox(r) {
    r.el.style.left = r.el.style.top = r.el.style.right = r.el.style.bottom = "";
    r.el.style.width = r.el.style.height = "";
    r.el.classList.remove("sgwin-moved");
    r.moved = false;
  }
  function raise(el) {
    const z = 22 + (raise.n = (raise.n || 0) + 1);
    el.style.zIndex = String(z);
  }

  function bindDrag(id, r) {
    const el = r.el;
    const go = (e) => {
      if (r.locked || r.minimized || phone()) return;
      if (e.target.closest("button, input, a, select, textarea, .win-h, .wintools")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const box = el.getBoundingClientRect();
      const ox = e.clientX - box.left, oy = e.clientY - box.top;
      el.classList.add("is-dragging");
      raise(el);
      const move = (ev) => {
        ev.preventDefault();
        const a = safeArea();
        const w = el.getBoundingClientRect().width, h = el.getBoundingClientRect().height;
        const x = clamp(ev.clientX - ox, a.x - w + 80, a.r - 80);
        const y = clamp(ev.clientY - oy, a.y, a.b - 32 * ui());
        el.style.left = x + "px"; el.style.top = y + "px";
        el.style.right = "auto"; el.style.bottom = "auto";
        el.style.width = w + "px"; el.style.height = h + "px";
        el.classList.add("sgwin-moved");
        r.moved = true;
      };
      const up = () => {
        el.classList.remove("is-dragging");
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        persist();
      };
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", up);
      e.preventDefault();
    };
    const bar = el.querySelector("[data-winbar], .winbar, .loghead") || el;
    bar.addEventListener("pointerdown", go);
    bar.addEventListener("keydown", (e) => onKeys(id, r, e));
    if (!bar.hasAttribute("tabindex")) bar.tabIndex = 0;
  }
  function bindResize(id, r) {
    r.el.addEventListener("pointerdown", (e) => {
      const h = e.target.closest(".win-h"); if (!h || r.locked || r.minimized || phone()) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const dir = h.dataset.dir, box = r.el.getBoundingClientRect(), u = ui();
      const minW = (r.opts.minW || 200) * u, minH = (r.opts.minH || 120) * u;
      const move = (ev) => {
        ev.preventDefault();
        const a = safeArea();
        let x = box.left, y = box.top, w = box.width, hgt = box.height;
        const dx = ev.clientX - e.clientX, dy = ev.clientY - e.clientY;
        if (dir.indexOf("e") >= 0) w = clamp(box.width + dx, minW, a.r - box.left);
        if (dir.indexOf("s") >= 0) hgt = clamp(box.height + dy, minH, a.b - box.top);
        if (dir.indexOf("w") >= 0) { w = clamp(box.width - dx, minW, box.right - a.x); x = box.right - w; }
        if (dir.indexOf("n") >= 0) { hgt = clamp(box.height - dy, minH, box.bottom - a.y); y = box.bottom - hgt; }
        r.el.style.left = x + "px"; r.el.style.top = y + "px";
        r.el.style.right = "auto"; r.el.style.bottom = "auto";
        r.el.style.width = w + "px"; r.el.style.height = hgt + "px";
        r.el.classList.add("sgwin-moved");
        r.moved = true;
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        persist();
      };
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", up);
      e.preventDefault(); e.stopPropagation();
    });
  }
  function onKeys(id, r, e) {
    if (e.target.closest("input, textarea, select")) return;
    const step = (e.shiftKey ? 1 : 8) * ui();
    if (e.key === "l" || e.key === "L") { toggleLock(id); e.preventDefault(); return; }
    if (e.key === "m" || e.key === "M") { minimize(id); e.preventDefault(); return; }
    if (e.key === "=" || e.key === "+") { zoom(id, 0.1); e.preventDefault(); return; }
    if (e.key === "-") { zoom(id, -0.1); e.preventDefault(); return; }
    if (e.key === "0") { zoom(id, "reset"); e.preventDefault(); return; }
    if (r.locked || phone()) return;
    const box = r.el.getBoundingClientRect();
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (e.altKey) {
        const dw = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
        const dh = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
        resize(id, box.width + dw, box.height + dh);
      } else {
        const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
        const dy = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
        move(id, box.left + dx, box.top + dy);
      }
      e.preventDefault();
    }
  }

  function register(id, el, opts) {
    if (!el) return null;
    if (regs[id]) { regs[id].opts = Object.assign(regs[id].opts, opts || {}); return regs[id]; }
    const r = { el, opts: opts || {}, zoom: 1, locked: false, minimized: false, moved: false };
    regs[id] = r;
    el.classList.add("sgwin");
    el.dataset.win = id;
    attachChrome(id, r);
    bindDrag(id, r);
    bindResize(id, r);
    el.addEventListener("pointerdown", () => raise(el), true);
    if (!testMode()) {
      const saved = store()[id];
      if (saved && !phone()) {
        const z = Number(saved.zoom);
        r.zoom = Number.isFinite(z) ? clamp(z, 0.8, 1.8) : 1;
        r.locked = !!saved.locked;
        applyBox(r, saved); applyZoom(r); applyLock(r);
        if (saved.minimized) minimize(id);
      }
    }
    paintDock();
    return r;
  }
  function minimize(id) {
    const r = regs[id]; if (!r || r.minimized) return;
    r.minimized = true;
    r.el.classList.add("is-min");
    if (!r.opts.keepAlive) r.el.setAttribute("data-win-min", "1");
    applyZoom(r);
    // keepAlive panels stay in the document and must not be [hidden] or display:none (YouTube would stop)
    if (typeof r.opts.onMinimize === "function") r.opts.onMinimize();
    persist(); paintDock();
  }
  function expand(id) {
    const r = regs[id]; if (!r || !r.minimized) return;
    r.minimized = false;
    r.el.classList.remove("is-min");
    r.el.classList.remove("is-min-paused");
    r.el.removeAttribute("data-win-min");
    applyZoom(r);
    if (r.el.hidden && r.opts.unhideOnExpand !== false) { /* leave hidden to the owner's open() */ }
    if (typeof r.opts.onExpand === "function") r.opts.onExpand();
    raise(r.el);
    persist(); paintDock();
  }
  function toggleLock(id) {
    const r = regs[id]; if (!r) return;
    r.locked = !r.locked; applyLock(r); persist(); paintDock();
  }
  function zoom(id, d) {
    const r = regs[id]; if (!r) return;
    r.zoom = d === "reset" ? 1 : clamp(Math.round((r.zoom + d) * 10) / 10, 0.8, 1.8);
    applyZoom(r); persist();
  }
  function move(id, x, y) {
    const r = regs[id]; if (!r || r.locked) return;
    const a = safeArea(), b = r.el.getBoundingClientRect();
    r.el.style.left = clamp(x, a.x - b.width + 80, a.r - 80) + "px";
    r.el.style.top = clamp(y, a.y, a.b - 32 * ui()) + "px";
    r.el.style.right = "auto"; r.el.style.bottom = "auto";
    r.el.style.width = b.width + "px"; r.el.style.height = b.height + "px";
    r.el.classList.add("sgwin-moved"); r.moved = true;
    persist();
  }
  function resize(id, w, h) {
    const r = regs[id]; if (!r || r.locked) return;
    const u = ui(), a = safeArea(), b = r.el.getBoundingClientRect();
    r.el.style.left = b.left + "px"; r.el.style.top = b.top + "px";
    r.el.style.right = "auto"; r.el.style.bottom = "auto";
    r.el.style.width = clamp(w, (r.opts.minW || 200) * u, a.r - b.left) + "px";
    r.el.style.height = clamp(h, (r.opts.minH || 120) * u, a.b - b.top) + "px";
    r.el.classList.add("sgwin-moved"); r.moved = true;
    persist();
  }
  function resetLayout() {
    Object.keys(regs).forEach((id) => {
      const r = regs[id];
      if (r.minimized) expand(id);
      r.zoom = 1; r.locked = false; applyZoom(r); applyLock(r); clearBox(r);
    });
    if (!testMode()) try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    paintDock();
  }
  function unregister(id) {
    const r = regs[id]; if (!r) return;
    delete regs[id]; paintDock();
  }
  function state(id) {
    if (!id) return Object.keys(regs).reduce((o, k) => { o[k] = state(k); return o; }, {});
    const r = regs[id]; if (!r) return null;
    const b = r.el.getBoundingClientRect();
    return { id, locked: r.locked, minimized: r.minimized, zoom: r.zoom, moved: r.moved, keepAlive: !!r.opts.keepAlive,
      left: b.left, top: b.top, width: b.width, height: b.height };
  }

  function initBuiltins() {
    const side = $("side");
    if (side) register("side", side, { title: "Panel", minW: 280, minH: 200, sheet: true,
      onMinimize: () => { side.setAttribute("data-win-min", "1"); if (phone() && window.__sgMobile) window.__sgMobile.sheet(null); },
      onExpand: () => { side.removeAttribute("data-win-min"); if (phone() && window.__sgMobile) window.__sgMobile.sheet("menu"); } });
    const log = $("log");
    if (log) register("log", log, { title: "Ship’s Log", minW: 280, minH: 200, sheet: true,
      onExpand: () => { if (window.__sg && window.__sg.log) window.__sg.log(true); } });
    const logBtn = $("logBtn");
    if (logBtn) logBtn.addEventListener("click", (e) => { if (regs.log && regs.log.minimized) { e.stopImmediatePropagation(); expand("log"); } }, true);
    const atlasBtn = $("atlasBtn");
    if (atlasBtn) atlasBtn.addEventListener("click", (e) => { if (regs.atlas && regs.atlas.minimized) { e.stopImmediatePropagation(); expand("atlas"); if (window.SeaEncyclopedia) { /* open() runs in onExpand if hidden */ } } }, true);
    dock();
  }

    function bring(id) {
    const r = regs[id]; if (!r) return false;
    if (r.minimized) { expand(id); return true; }
    return false;
  }

  window.SeaWindows = { register, unregister, minimize, expand, toggleLock, zoom, move, resize, resetLayout, state, persist, bring, paintDock, layerPref };
  window.addEventListener("seaglobe:ready", () => setTimeout(initBuiltins, 0));
})();
