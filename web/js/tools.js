/* SeaTools: atlas tools on the shared globe — point layers (air hubs, launch sites, bring-your-own feeds),
   cursor coordinates, great-circle measuring and a printable view. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const layers = {};       // id -> { on, items: [{lat, lon, color, r, label, id}] }
  const KM = 6371.0088;    // mean Earth radius (IUGG)
  const st = { coords: false, measure: false, pts: [], key: "" };
  function g() { return window.__sg && window.__sg.globe && window.__sg.globe(); }
  function points(id, items, on) {
    layers[id] = layers[id] || { on: false, items: [] };
    if (items) layers[id].items = items;
    if (on != null) {
      layers[id].on = !!on;
      if (!layers[id].on) layers[id].items = [];
    }
    redraw();
  }
  function layer(id, on) {
    if (on && window.SeaLayers && !SeaLayers.request(id, true)) {
      const cb = $("t" + id[0].toUpperCase() + id.slice(1)); if (cb) cb.checked = false;
      return;
    }
    if (!on && window.SeaLayers) SeaLayers.request(id, false);
    if (id === "hubs" && on && !(layers.hubs && layers.hubs.items.length)) hubs();
    points(id, null, on);
    const cb = $("t" + id[0].toUpperCase() + id.slice(1)); if (cb) cb.checked = !!(layers[id] && layers[id].on);
  }
  function redraw() {
    const G = g(); if (!G) return;
    const all = []; Object.keys(layers).forEach((k) => { if (layers[k].on) layers[k].items.forEach((p) => all.push(p)); });
    const key = all.length + ":" + Object.keys(layers).filter((k) => layers[k].on).join(",") + ":" + (all[0] ? all[0].lat + "," + all[all.length - 1].lat : "");
    if (key === st.key) return;
    st.key = key;
    G.pointsData(all).pointLat((d) => d.lat).pointLng((d) => d.lon).pointColor((d) => d.color).pointRadius((d) => d.r || 0.12)
      .pointAltitude((d) => d.alt || 0.003).pointsMerge(all.length > 300).pointsTransitionDuration(0).pointLabel((d) => d.label || "");
    if (!st.pointClick) {
      st.pointClick = true;
      G.onPointClick((d) => { if (d && d.id && window.SeaEncyclopedia) window.SeaEncyclopedia.show(d.id); });
    }
  }
  function hubs() {
    const A = (window.SEAGLOBE_DATA || {}).airports || [];
    points("hubs", A.map((a) => ({ lat: a[2], lon: a[3], color: a[7] === "large_airport" ? "#b8f3ff" : "#ffe08a", r: 0.11, label: "<b>" + esc(a[1]) + "</b><div>" + esc(a[0]) + (a[6] ? " · " + esc(a[6]) : "") + " · OurAirports</div>", id: "place:airport-" + a[0].toLowerCase() })));
  }
  // great-circle distance (haversine on the mean sphere)
  function distance(a, b) {
    const r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r;
    const h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2;
    return 2 * KM * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function at(x, y) { const G = g(); if (!G) return null; const c = G.toGlobeCoords(x, y); return c ? { lat: c.lat, lon: c.lng } : null; }
  function chip(html) { const el = $("toolChip"); el.hidden = !html; if (html) el.innerHTML = html; }
  function fmt(p) { return Math.abs(p.lat).toFixed(3) + "° " + (p.lat >= 0 ? "N" : "S") + ", " + Math.abs(p.lon).toFixed(3) + "° " + (p.lon >= 0 ? "E" : "W"); }
  function measureShow() {
    const G = g(); const [a, b] = st.pts;
    G.arcsData(a && b ? [{ a, b }] : []).arcStartLat((d) => d.a.lat).arcStartLng((d) => d.a.lon).arcEndLat((d) => d.b.lat).arcEndLng((d) => d.b.lon)
      .arcColor(() => ["#e7c766", "#5ee7ff"]).arcStroke(0.35).arcAltitude(0).arcsTransitionDuration(0);
    if (!a) return chip(st.measure ? "<span class='kicker'>Measure</span> Click a start point on the globe" : "");
    if (!b) return chip("<span class='kicker'>Measure</span> From " + fmt(a) + " · click an end point");
    const km = distance(a, b);
    chip("<span class='kicker'>Measure</span> " + km.toFixed(km < 100 ? 1 : 0) + " km · " + (km / 1.609344).toFixed(0) + " mi · " + (km / 1.852).toFixed(0) + " nmi<div class='small'>Great circle on a sphere of radius 6,371 km (mean Earth radius); a ship or plane route is usually longer.</div>");
  }
  function measure(on) {
    st.measure = on == null ? !st.measure : !!on; st.pts = [];
    const b = $("measureBtn"); if (b) b.setAttribute("aria-pressed", String(st.measure));
    document.body.classList.toggle("measuring", st.measure);
    measureShow();
  }
  function coords(on) { st.coords = !!on; const cb = $("tCoords"); if (cb) cb.checked = st.coords; if (!st.coords && !st.measure) chip(""); }
  function snapshot() {
    const G = g(); if (!G) return null;
    try { G.renderer().render(G.scene(), G.camera()); return G.renderer().domElement.toDataURL("image/jpeg", 0.9); } catch (e) { return null; }
  }
  function print(entity) {
    const img = snapshot(), V = window.SEAGLOBE_VERSION || {};
    const s = window.__sg ? window.__sg.state() : {};
    let pv = $("printView"); if (!pv) { pv = document.createElement("div"); pv.id = "printView"; document.body.appendChild(pv); }
    const restyle = (h) => h.replace(/ style="/g, ' data-style="');   // copies go back through js/styles.js (no inline style attributes under the CSP)
    const legend = $("legend") ? restyle($("legend").innerHTML) : "";
    const ent = entity ? document.querySelector("#atlasBody .aentry") : null;
    pv.innerHTML = "<h1>SeaGlobe — " + esc(entity ? entity.title : "map view") + "</h1><div class='pmeta'>" + esc(s.date || "") + " · SeaGlobe v" + esc(V.version || "") + " · printed from " + esc(location.href.split("#")[0]) + "</div>" +
      (img ? "<img alt='Globe view' src='" + img + "'>" : "<p>[Map image not available in this browser]</p>") + "<div class='plegend'>" + legend + "</div>" + (ent ? restyle(ent.outerHTML) : "") +
      "<p class='pfootp'>Every reconstruction is labelled; gaps are marked [UNKNOWN]. Sources: see each entry, DATA.md and SOURCES.md. Made with Natural Earth; Earth imagery NASA (public domain). © OpenStreetMap contributors (ODbL).</p>";
    document.body.classList.add("printing");
    const done = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    if (!new URLSearchParams(location.search).get("noprint")) window.print();
    return pv;
  }
  function init() {
    const pane = document.querySelector("[data-pane='layers'] .toggles");
    if (pane && !$("tHubs")) {
      pane.insertAdjacentHTML("beforeend", "<label title='Shows airport hubs from OurAirports.'><input type='checkbox' id='tHubs'> Air hubs (" + ((window.SEAGLOBE_DATA || {}).airports || []).length.toLocaleString("en-US") + " airports, OurAirports)</label><label title='Shows latitude and longitude at the cursor.'><input type='checkbox' id='tCoords'> Cursor coordinates</label>");
      $("tHubs").addEventListener("change", (e) => layer("hubs", e.target.checked));
      $("tCoords").addEventListener("change", (e) => coords(e.target.checked));
      pane.insertAdjacentHTML("afterend", "<div class='row actions toolrow'><button class='btn' id='measureBtn' aria-pressed='false'>Measure distance</button><button class='btn ghost' id='printBtn'>Print map view</button></div>");
      $("measureBtn").addEventListener("click", () => measure());
      $("printBtn").addEventListener("click", () => print(null));
    }
    if (!$("toolChip")) { const d = document.createElement("div"); d.className = "toolchip glass"; d.id = "toolChip"; d.hidden = true; d.setAttribute("aria-live", "polite"); document.body.appendChild(d); }
    const el = $("globe"); let down = null;
    el.addEventListener("pointermove", (e) => { if (st.coords && !st.measure) { const p = at(e.clientX, e.clientY); chip(p ? "<span class='kicker'>Cursor</span> " + fmt(p) : "<span class='kicker'>Cursor</span> off the globe"); } });
    el.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener("pointerup", (e) => {
      if (!st.measure || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      const p = at(e.clientX, e.clientY); if (!p) return;
      if (st.pts.length >= 2) st.pts = [];
      st.pts.push(p); measureShow();
    });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape" && st.measure) measure(false); });
    const P = new URLSearchParams(location.search);
    if (P.get("hubs") === "1") layer("hubs", true);
  }
  window.SeaTools = { points, layer, distance, measure, coords, print, snapshot, at, state: () => ({ measure: st.measure, pts: st.pts.slice(), coords: st.coords, layers: Object.keys(layers).filter((k) => layers[k].on) }),
    measurePoints: (a, b) => { measure(true); st.pts = [a, b]; measureShow(); return distance(a, b); } };
  window.addEventListener("seaglobe:ready", init);
})();


/* SeaLayers: one small registry for overlays. Heavy layers are capped so added
   layers do not crowd or crash the app. Light layers are not capped. */
(function () {
  "use strict";
  const REG = {
    routes: { weight: "light", toggle: "tRoutes" },
    wakes: { weight: "light", toggle: "tWakes" },
    night: { weight: "light", toggle: "tNight" },
    sats: { weight: "light", toggle: "tSats" },
    orbit: { weight: "light", toggle: "tOrbit" },
    coords: { weight: "light", toggle: "tCoords" },
    ships: { weight: "light", toggle: "tShips" },
    bells: { weight: "light", toggle: "tBells" },
    uap: { weight: "heavy", toggle: "tUap" },
    starfire: { weight: "heavy", toggle: "tStarfire" },
    wind: { weight: "heavy", toggle: "tWind" },
    regions: { weight: "heavy", toggle: "tRegions" },
    live: { weight: "heavy", toggle: "tLive" },
    hubs: { weight: "heavy", toggle: "tHubs" },
    launch: { weight: "heavy", toggle: "tLaunch" },
    pmtilesBorders: { weight: "heavy", toggle: "tPmtiles" },
    terrain: { weight: "heavy", toggle: "tTerrain" }
  };
  const byToggle = {};
  Object.keys(REG).forEach((id) => { byToggle[REG[id].toggle] = id; });
  const active = new Set();
  let noticeText = "";

  function isLite() {
    if (window.__sg && window.__sg.isLite) return true;
    if (window.SEAGLOBE_EDITION && SEAGLOBE_EDITION.lite) return true;
    return /(^|\/)lite\.html$/i.test((location.pathname || "").split("?")[0]);
  }
  function isPhone() {
    return !!(window.matchMedia && window.matchMedia("(max-width: 820px)").matches);
  }
  function capNow() { return (isLite() || isPhone()) ? 3 : 5; }
  let appliedCap = null, reapplying = false;
  function cap() {
    const n = capNow();
    if (!reapplying && appliedCap != null && n !== appliedCap) reapply();
    return n;
  }

  function testMode() {
    try {
      const q = new URLSearchParams(location.search);
      return q.get("capture") === "1" || q.get("shot") === "1";
    } catch (e) { return false; }
  }
  function installHook() {
    if (!testMode()) {
      try { if (window.__sgLayerHook) delete window.__sgLayerHook; } catch (e) { /* ignore */ }
      return;
    }
    window.__sgLayerHook = {
      cap, isLite, isPhone,
      active: () => [...active],
      notice: () => noticeText,
      state: () => ({ cap: cap(), active: [...active], notice: noticeText, lite: isLite(), phone: isPhone() }),
      reapply
    };
  }

  function turnOff(id) {
    const spec = REG[id];
    const el = spec && document.getElementById(spec.toggle);
    if (el && el.checked) {
      el.checked = false;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      active.delete(id);
    }
  }

  /* Re-apply the cap when the selection or the window narrows (Focus, a tighter
     region, leaving a state so county packs unload, or a resize that drops the
     cap from 5 to 3). Layers past the cap are turned off in turn-on order;
     the ones that still fit stay on and loaded. */
  function reapply() {
    reapplying = true;
    try {
      const n = capNow();
      appliedCap = n;
      const list = [...active];
      const dropped = list.slice(n);
      if (!dropped.length) {
        if (active.size < n) hideNotice();
        installHook();
        return { cap: n, kept: list.slice(), dropped: [], active: [...active] };
      }
      dropped.forEach(turnOff);
      showNotice();
      installHook();
      return { cap: n, kept: [...active], dropped: dropped, active: [...active] };
    } finally { reapplying = false; }
  }

  function bindCapWatch() {
    if (bindCapWatch.done) return;
    bindCapWatch.done = true;
    if (window.matchMedia) {
      const mq = window.matchMedia("(max-width: 820px)");
      const on = () => reapply();
      if (mq.addEventListener) mq.addEventListener("change", on);
      else if (mq.addListener) mq.addListener(on);
    }
    window.addEventListener("resize", () => reapply());
  }

  function noteEl() {
    let el = document.getElementById("layerNotice");
    if (el) return el;
    el = document.createElement("div");
    el.id = "layerNotice";
    el.className = "small warn";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.hidden = true;
    const pane = document.querySelector("[data-pane='layers'] .toggles");
    if (pane && pane.parentNode) pane.parentNode.insertBefore(el, pane.nextSibling);
    else document.body.appendChild(el);
    return el;
  }
  function showNotice() {
    const n = cap();
    const where = isLite() && !isPhone() ? " in the lite edition" : (isPhone() ? " on a phone" : "");
    noticeText = "Only " + n + " heavier layers can be on at once" + where + ". Turn one off to add another.";
    const el = noteEl();
    el.textContent = noticeText;
    el.hidden = false;
  }
  function hideNotice() {
    noticeText = "";
    const el = document.getElementById("layerNotice");
    if (el) { el.textContent = ""; el.hidden = true; }
  }

  function wanted(idOrIds, on) {
    const list = Array.isArray(idOrIds) ? idOrIds.slice() : [idOrIds];
    if (idOrIds === "live" && on && window.SeaRegions && !SeaRegions.state().on) list.push("regions");
    return list;
  }

  function request(idOrIds, on) {
    const ids = wanted(idOrIds, on);
    if (!on) {
      ids.forEach((id) => active.delete(id));
      if (active.size < cap()) hideNotice();
      installHook();
      return true;
    }
    const need = [];
    ids.forEach((id) => {
      const spec = REG[id];
      if (spec && spec.weight === "heavy" && !active.has(id)) need.push(id);
    });
    if (active.size + need.length > cap()) { showNotice(); return false; }
    need.forEach((id) => active.add(id));
    if (need.length) hideNotice();
    installHook();
    return true;
  }

  function bind() {
    const pane = document.querySelector("[data-pane='layers'] .toggles");
    if (!pane || pane.dataset.layerGuard) return;
    pane.dataset.layerGuard = "1";
    pane.addEventListener("change", (ev) => {
      const el = ev.target;
      if (!el || el.type !== "checkbox") return;
      const id = byToggle[el.id];
      if (!id) return;
      if (!request(id, el.checked)) {
        el.checked = false;
        ev.stopImmediatePropagation();
      }
    }, true);
  }

  window.SeaLayers = {
    registry: REG,
    cap, isLite, isPhone,
    request, reapply,
    active: () => [...active],
    notice: () => noticeText,
    state: () => ({ cap: cap(), active: [...active], notice: noticeText, lite: isLite(), phone: isPhone() })
  };
  function start() { bind(); bindCapWatch(); appliedCap = capNow(); installHook(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("seaglobe:ready", start);
})();
