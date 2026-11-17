/* SeaRegions: drill-down from the globe to local layers (world › country › state/province › county › town).
   A layer registry gives each layer its level, source, attribution and camera-altitude range; packs load lazily
   for the region in view. Static packs (Natural Earth, public domain) ship with the app. One live source (US Census
   TIGERweb town boundaries) is opt-in: a health check runs first, and if the host does not answer the layer is
   SKIPPED with a message while the static layers keep working. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TW = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer";
  // altitude = globe.gl camera altitude in Earth radii (smaller = closer)
  const REGISTRY = [
    { id: "countries", level: "country", kind: "static", pack: () => "world", maxAlt: 4.0, color: "rgba(231,199,102,.55)", attribution: "Made with Natural Earth", source: "src-natural-earth", coverage: "World" },
    { id: "states", level: "state", kind: "static", pack: (c) => c.country ? (ADMIN1_REST.has(c.country.a3) ? "admin1/rest" : "admin1/" + c.country.a3) : null, maxAlt: 1.3, color: "rgba(94,231,255,.55)", attribution: "Made with Natural Earth", source: "src-natural-earth", coverage: "Natural Earth states and provinces for every country" },
    { id: "counties", level: "county", kind: "static", pack: (c) => c.state && /^US-/.test(c.state.iso || "") ? "counties/" + c.state.iso : null, maxAlt: 0.5, color: "rgba(201,162,255,.6)", attribution: "Made with Natural Earth", source: "src-natural-earth", coverage: "United States" },
    { id: "towns", level: "town", kind: "static", pack: (c) => (c.country ? "towns/" + c.country.a3 : null), maxAlt: 0.7, attribution: "Made with Natural Earth", source: "src-natural-earth", coverage: "World (populated places)" },
    { id: "us-places-live", level: "town", kind: "live", optIn: true, maxAlt: 0.3, color: "rgba(255,111,174,.75)", health: TW + "?f=json", query: TW + "/4/query",
      attribution: "Boundaries: U.S. Census Bureau, TIGERweb (live)", source: "src-tigerweb", coverage: "United States incorporated places" },
  ];
  // <admin1-rest>
  const ADMIN1_REST = new Set(["ATA","ATF","BRN","CYN","CYP","FLK","GBR","LUX","NCL","PRI","PSX","SAH","SLE","SOL","SWZ"]);
  // </admin1-rest>
  const R = () => (window.SEAGLOBE_REGIONS = window.SEAGLOBE_REGIONS || {});
  const loading = {};
  const st = { on: false, live: false, liveStatus: "off", ctx: {}, lastKey: "", liveCache: {}, msg: "", wantCounty: null, wantTown: null, drawn: { counties: 0, towns: 0 } };
  function statesOf(pack, a3) {
    if (!pack) return null;
    if (pack.states) return pack;
    const one = pack.countries && a3 && pack.countries[a3];
    return one && one.states ? one : null;
  }
  function wanted(key) {
    if (!key) return false;
    if (key.startsWith("counties/")) return key === st.wantCounty;
    if (key.startsWith("towns/") && key !== "towns-index") return key === st.wantTown;
    return true;
  }
  function loadPack(key) {
    if (R()[key]) return Promise.resolve(R()[key]);
    if (!loading[key]) loading[key] = new Promise((res) => { const s = document.createElement("script"); s.src = "data/regions/" + key + ".js"; s.onload = () => res(R()[key] || null); s.onerror = () => res(null); document.head.appendChild(s); });
    return loading[key].then((pack) => {
      if (!pack) return null;
      if (!R()[key]) {
        if (!wanted(key)) return null;
        R()[key] = pack;
      } else if (!wanted(key) && (key.startsWith("counties/") || (key.startsWith("towns/") && key !== "towns-index"))) {
        delete R()[key];
        return null;
      }
      return R()[key] || pack;
    });
  }
  function evictBelow() {
    const keep = { index: 1, world: 1, "towns-index": 1 };
    if (st.wantCounty) keep[st.wantCounty] = 1;
    if (st.wantTown) keep[st.wantTown] = 1;
    const drop = (k) => k.startsWith("counties/") || (k.startsWith("towns/") && k !== "towns-index");
    const packs = R();
    Object.keys(packs).forEach((k) => {
      if (keep[k] || !drop(k)) return;
      delete packs[k];
    });
    Object.keys(loading).forEach((k) => {
      if (keep[k] || !drop(k)) return;
      delete loading[k];
    });
  }
  function inRing(lon, lat, ring) { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
  function inPolys(lon, lat, polys) { return polys.some((poly) => inRing(lon, lat, poly[0]) && !poly.slice(1).some((h) => inRing(lon, lat, h))); }
  const geom = (polys) => ({ type: "MultiPolygon", coordinates: polys });

  async function update() {
    const sg = window.__sg; if (!st.on || !sg || !sg.globe()) return;
    const pov = sg.globe().pointOfView();
    const alt = pov.altitude, lat = pov.lat, lon = ((pov.lng + 540) % 360) - 180;
    const world = await loadPack("world");
    const ctx = { alt, lat, lon, country: null, state: null, county: null };
    if (world) ctx.country = world.countries.find((c) => inPolys(lon, lat, c.polys)) || null;
    const stateRaw = ctx.country && alt < 1.3 ? await loadPack(REGISTRY[1].pack(ctx)) : null;
    const statePack = statesOf(stateRaw, ctx.country && ctx.country.a3);
    if (statePack) ctx.state = statePack.states.find((s) => inPolys(lon, lat, s.polys)) || null;
    const countyKey = ctx.state && alt < 0.5 && /^US-/.test(ctx.state.iso || "") ? "counties/" + ctx.state.iso : null;
    const townKey = ctx.country && alt < 0.7 ? "towns/" + ctx.country.a3 : null;
    const narrowed = (st.wantCounty && st.wantCounty !== countyKey) || (st.wantTown && st.wantTown !== townKey);
    st.wantCounty = countyKey; st.wantTown = townKey;
    evictBelow();
    if (narrowed && window.SeaLayers && SeaLayers.reapply) SeaLayers.reapply();
    const countyPack = countyKey ? await loadPack(countyKey) : null;
    if (countyKey !== st.wantCounty) return;
    if (countyPack) ctx.county = countyPack.counties.find((c) => inPolys(lon, lat, c.polys)) || null;
    const townPack = townKey ? await loadPack(townKey) : null;
    if (townKey !== st.wantTown) return;
    evictBelow();
    st.ctx = ctx;
    const polys = [];
    if (world && alt < 4.0) world.countries.forEach((c) => polys.push({ g: geom(c.polys), color: REGISTRY[0].color, id: c.id, name: c.name, lvl: 0 }));
    if (statePack) statePack.states.forEach((s) => polys.push({ g: geom(s.polys), color: REGISTRY[1].color, id: s.id, name: s.name, lvl: 1 }));
    if (countyPack) countyPack.counties.forEach((c) => polys.push({ g: geom(c.polys), color: REGISTRY[2].color, id: c.id, name: c.name, lvl: 2 }));
    if (st.live && st.liveStatus === "ok" && alt < 0.3 && ctx.country && ctx.country.a3 === "USA") (await liveQuery(lat, lon)).forEach((f) => polys.push({ g: f.geometry, color: REGISTRY[4].color, id: "live-" + f.properties.GEOID, name: f.properties.NAME, lvl: 3 }));
    if (window.SeaNext && SeaNext.pmtilesBorders && SeaNext.pmtilesBorders.active()) {
      try {
        const extra = await SeaNext.pmtilesBorders.polygons(ctx, alt, lon, lat);
        if (extra && extra.length) extra.forEach((d) => polys.push(d));
      } catch (e) { /* next layer skips quietly */ }
    }
    const key = polys.map((p) => p.id).join("|");
    const g = sg.globe();
    if (key !== st.lastKey) {
      st.lastKey = key;
      g.polygonsData(polys).polygonGeoJsonGeometry((d) => d.g).polygonCapColor(() => "rgba(0,0,0,0)").polygonSideColor(() => "rgba(0,0,0,0)")
        .polygonStrokeColor((d) => d.color).polygonAltitude((d) => 0.0012 + d.lvl * 0.0004).polygonsTransitionDuration(0).polygonLabel((d) => esc(d.name));
    }
    let towns = townPack && townPack.towns ? townPack.towns.filter((t) => Math.abs(t.lat - lat) < alt * 30 && Math.abs(t.lon - lon) < alt * 40) : [];
    if (ctx.state && ctx.state.name) towns = towns.filter((t) => !t.adm1 || t.adm1 === ctx.state.name);
    towns = towns.slice(0, alt < 0.25 ? 80 : 30);
    st.drawn = { counties: countyPack && countyPack.counties ? countyPack.counties.length : 0, towns: towns.length };
    g.labelsData(towns).labelLat((d) => d.lat).labelLng((d) => d.lon).labelText((d) => d.name).labelSize(() => Math.max(0.12, alt * 0.9)).labelDotRadius(() => Math.max(0.06, alt * 0.35))
      .labelColor(() => "rgba(234,246,255,.85)").labelAltitude(0.002).labelResolution(2).labelsTransitionDuration(0);
    crumbs();
  }
  async function health() {
    st.liveStatus = "checking"; crumbs();
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 5000);
    try {
      const r = await fetch(REGISTRY[4].health, { signal: ctl.signal, credentials: "omit" });
      const j = r.ok ? await r.json() : null;
      st.liveStatus = j && j.layers ? "ok" : "down";
    } catch (e) { st.liveStatus = "down"; }
    clearTimeout(tm);
    st.msg = st.liveStatus === "down" ? "Live US town boundaries skipped: the Census TIGERweb service did not answer. The built-in layers still work." : "";
    st.lastKey = ""; crumbs();
    return st.liveStatus;
  }
  async function liveQuery(lat, lon) {
    const k = Math.round(lat * 5) / 5 + "," + Math.round(lon * 5) / 5;
    if (st.liveCache[k]) return st.liveCache[k];
    st.liveCache[k] = [];
    const env = [lon - 0.15, lat - 0.12, lon + 0.15, lat + 0.12].map((v) => v.toFixed(3)).join(",");
    const u = REGISTRY[4].query + "?where=1%3D1&geometry=" + env + "&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=NAME,GEOID,LSADC&returnGeometry=true&outSR=4326&maxAllowableOffset=0.001&geometryPrecision=4&resultRecordCount=200&f=geojson";
    const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 8000);
    try { const r = await fetch(u, { signal: ctl.signal, credentials: "omit" }); const j = r.ok ? await r.json() : null; st.liveCache[k] = j && j.features ? j.features.filter((f) => f.geometry) : []; }
    catch (e) { st.liveStatus = "down"; st.msg = "Live US town boundaries skipped: the TIGERweb request failed. The built-in layers still work."; }
    clearTimeout(tm);
    return st.liveCache[k];
  }
  function crumbs() {
    const el = $("regionChip"); if (!el) return;
    el.hidden = !st.on;
    if (!st.on) return;
    const c = st.ctx, parts = ["<a href='#/region/world'>World</a>"];
    if (c.country) parts.push("<a href='#/entry/region:" + esc(c.country.id) + "'>" + esc(c.country.name) + "</a>");
    if (c.state) parts.push("<a href='#/entry/region:" + esc(c.state.id) + "'>" + esc(c.state.name) + "</a>");
    if (c.county) parts.push("<a href='#/entry/region:" + esc(c.county.id) + "'>" + esc(c.county.name) + "</a>");
    const live = st.live ? " <span class='small'>· live: " + esc(st.liveStatus) + "</span>" : "";
    el.innerHTML = "<span class='kicker'>Region</span> " + parts.join(" › ") + live + (st.msg ? "<div class='small warn'>" + esc(st.msg) + "</div>" : "") +
      "<div class='small'>Made with Natural Earth" + (st.live && st.liveStatus === "ok" ? " · Boundaries: U.S. Census Bureau, TIGERweb" : "") +
      (window.SeaNext && SeaNext.pmtilesBorders && SeaNext.pmtilesBorders.credited() ? " · U.S. Census Bureau, TIGER/Line 2026" : "") +
      (window.SeaNext && SeaNext.terrain && SeaNext.terrain.credited() ? " · U.S. Geological Survey, 3DEP" : "") + "</div>";
  }
  function freePacks() {
    const keep = { index: 1, world: 1, "towns-index": 1 };
    const R = window.SEAGLOBE_REGIONS;
    if (R) Object.keys(R).forEach((k) => { if (!keep[k]) delete R[k]; });
    Object.keys(loading).forEach((k) => { if (!keep[k]) delete loading[k]; });
  }
  function enable(on) {
    if (on && window.SeaLayers && !SeaLayers.request("regions", true)) {
      const cb = $("tRegions"); if (cb) cb.checked = false;
      return;
    }
    if (!on && window.SeaLayers) SeaLayers.request("regions", false);
    st.on = !!on;
    const cb = $("tRegions"); if (cb) cb.checked = st.on;
    const sg = window.__sg;
    if (!st.on && sg && sg.globe()) { sg.globe().polygonsData([]).labelsData([]); st.lastKey = ""; st.ctx = {}; freePacks(); }
    crumbs(); if (st.on) update();
  }
  async function enableLive(on) {
    if (on && window.SeaLayers && !SeaLayers.request("live", true)) {
      const cb = $("tLive"); if (cb) cb.checked = false;
      return;
    }
    if (!on && window.SeaLayers) SeaLayers.request("live", false);
    st.live = !!on; const cb = $("tLive"); if (cb) cb.checked = st.live;
    if (st.live) { if (!st.on) enable(true); await health(); } else { st.liveStatus = "off"; st.msg = ""; }
    st.lastKey = ""; update();
  }
  function focus(e) {
    enable(true);
    const alt = { country: 1.0, state: 0.6, county: 0.25 }[e.level] || 1.2;
    if (e.geo) window.__sg.flyTo({ lat: e.geo.lat, lng: e.geo.lon, altitude: alt }, 2.2);
    if (window.SeaLayers && SeaLayers.reapply) SeaLayers.reapply();
  }
  function init() {
    const pane = document.querySelector("[data-pane='layers'] .toggles");
    if (pane && !$("tRegions")) {
      pane.insertAdjacentHTML("beforeend", "<label title='Shows country, then state, then county, then town borders as you zoom in.'><input type='checkbox' id='tRegions'> Borders and regions (zoom in: country › state › county › towns)</label>" +
        "<label title='Shows live US town boundaries from Census TIGERweb. Needs the internet.'><input type='checkbox' id='tLive'> Live US town boundaries (U.S. Census TIGERweb; off by default, needs the internet)</label>");
      $("tRegions").addEventListener("change", (ev) => enable(ev.target.checked));
      $("tLive").addEventListener("change", (ev) => enableLive(ev.target.checked));
    }
    if (!$("regionChip")) { const d = document.createElement("div"); d.className = "regionchip glass"; d.id = "regionChip"; d.hidden = true; document.body.appendChild(d); }
    let acc = 0;
    window.__sg.onFrame((dt) => { acc += dt; if (acc > 0.35) { acc = 0; update(); } });
    if (new URLSearchParams(location.search).get("regions") === "1") enable(true);
  }
  window.SeaRegions = { registry: REGISTRY, enable, enableLive, health, focus, update, state: () => ({ on: st.on, live: st.live, liveStatus: st.liveStatus, msg: st.msg, ctx: { country: st.ctx.country && st.ctx.country.name, state: st.ctx.state && st.ctx.state.name, county: st.ctx.county && st.ctx.county.name }, drawn: st.drawn || { counties: 0, towns: 0 }, packs: Object.keys(R()).filter((k) => k.startsWith("counties/") || (k.startsWith("towns/") && k !== "towns-index")) }),
    loadIndex: () => loadPack("index"), loadPack };
  window.addEventListener("seaglobe:ready", init);
})();
