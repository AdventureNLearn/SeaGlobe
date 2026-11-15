/* PMTiles US Census borders (TIGER/Line 2026). Loads only when SeaFlags.on("pmtilesBorders").
   The Layers toggle stays off until the user turns it on (remembered in this browser, not during tests).
   Tiles come from the existing asset host under pmtiles/. A missing file or 404 is skipped with a
   "layer unavailable" note and does not throw. Natural Earth stays in place where these archives do not. */
(function () {
  "use strict";
  const FLAG = "pmtilesBorders";
  const STORE = "sg-next-layers";
  const CREDIT = "U.S. Census Bureau, TIGER/Line 2026";
  const NOTE = "layer unavailable";
  const LAYERS = [
    { id: "us-state-census", asset: "tiles-census-state", layerName: "state", minZoom: 0, maxZoom: 10, maxAlt: 1.3, color: "rgba(94,231,255,.55)", lvl: 1 },
    { id: "us-county-census", asset: "tiles-census-county", layerName: "county", minZoom: 3, maxZoom: 12, maxAlt: 0.5, color: "rgba(201,162,255,.6)", lvl: 2 },
    { id: "us-cousub-census", asset: "tiles-census-cousub", layerName: "cousub", minZoom: 6, maxZoom: 10, maxAlt: 0.25, color: "rgba(120,210,190,.65)", lvl: 2.5 },
    { id: "us-place-census", asset: "tiles-census-place", layerName: "place", minZoom: 6, maxZoom: 10, maxAlt: 0.3, color: "rgba(255,111,174,.75)", lvl: 3 }
  ];
  const $ = (id) => document.getElementById(id);
  const testMode = () => { try { const q = new URLSearchParams(location.search); return q.get("capture") === "1" || q.get("shot") === "1"; } catch (e) { return false; } };
  function enabled() { return window.SeaFlags && window.SeaFlags.on(FLAG); }
  function store() { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { return {}; } }
  function remember(on) {
    if (testMode()) return;
    try { const o = store(); o[FLAG] = !!on; localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) { /* quota / private mode */ }
  }
  function recalled() { if (testMode()) return false; return !!store()[FLAG]; }

  const st = { on: false, status: "off", msg: "", lastKey: "", cache: {}, features: [], ready: false };
  let gen = 0, ctl = null;

  function assetUrl(id) { return window.SeaAssets && SeaAssets.url(id); }
  function zoomFromAlt(alt) {
    if (!(alt > 0)) return 0;
    return Math.max(0, Math.min(15, Math.round(Math.log2(12 / alt) + 2)));
  }
  function lonLatToTile(z, lon, lat) {
    const n = 1 << z;
    const x = Math.floor((lon + 180) / 360 * n);
    const latRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return [Math.max(0, Math.min(n - 1, x)), Math.max(0, Math.min(n - 1, y))];
  }
  function tilesInView(z, lon, lat) {
    const n = 1 << z;
    const [cx, cy] = lonLatToTile(z, lon, lat);
    const pad = z >= 11 ? 1 : 2;
    const out = [];
    for (let x = cx - pad; x <= cx + pad; x++) {
      for (let y = cy - pad; y <= cy + pad; y++) {
        if (y < 0 || y >= n) continue;
        out.push([z, ((x % n) + n) % n, y]);
      }
    }
    return out;
  }

  function setNote(show, text) {
    const n = $("pmtilesNote"); if (!n) return;
    n.hidden = !show; if (show) n.textContent = text || NOTE;
  }
  function setCredit(show) {
    const c = $("pmtilesCredit"); if (!c) return;
    c.hidden = !show;
  }
  function syncUi() {
    const cb = $("tPmtiles"); if (cb) cb.checked = st.on;
    setCredit(st.on && st.status === "ok");
    setNote(st.on && (st.status === "down" || st.status === "missing"), st.msg || NOTE);
  }

  async function health(signal) {
    const url = assetUrl(LAYERS[0].asset);
    if (!url || !window.SeaPmtiles) {
      st.status = "missing";
      st.msg = NOTE;
      return st.status;
    }
    st.status = "checking";
    let ok = false;
    try { ok = await SeaPmtiles.probe(url, signal); } catch (e) { ok = false; }
    st.status = ok ? "ok" : "down";
    st.msg = ok ? "" : NOTE;
    return st.status;
  }

  async function loadLayer(layer, alt, lon, lat, signal) {
    if (st.status !== "ok") return [];
    if (!(alt < layer.maxAlt)) return [];
    const zCam = zoomFromAlt(alt);
    if (zCam < layer.minZoom) return [];
    const z = Math.min(zCam, layer.maxZoom);
    const url = assetUrl(layer.asset);
    if (!url || !window.SeaPmtiles || !window.SeaMvt) return [];
    const arch = SeaPmtiles.open(url);
    let maxZ = layer.maxZoom;
    try { const h = await arch.header(signal); if (h && h.maxZoom != null) maxZ = Math.min(maxZ, h.maxZoom); } catch (e) { return []; }
    const useZ = Math.min(z, maxZ);
    if (useZ < layer.minZoom) return [];
    const feats = [];
    const seen = new Set();
    await Promise.all(tilesInView(useZ, lon, lat).map(async ([tz, x, y]) => {
      const key = layer.asset + ":" + tz + "/" + x + "/" + y;
      let list = st.cache[key];
      if (!list) {
        try {
          const buf = await arch.getDecoded(tz, x, y, signal);
          list = buf ? SeaMvt.features(buf, tz, x, y) : [];
        } catch (e) {
          list = [];
        }
        st.cache[key] = list;
      }
      list.forEach((f) => {
        const id = (f.properties && f.properties.GEOID) || f.id;
        const k = layer.layerName + ":" + id;
        if (seen.has(k)) return;
        seen.add(k);
        feats.push(f);
      });
    }));
    return feats;
  }

  function toPolys(list, rec) {
    return list.map((f) => ({
      g: f.geometry,
      color: rec.color,
      id: "census-" + rec.layerName + "-" + ((f.properties && f.properties.GEOID) || f.id),
      name: (f.properties && f.properties.NAME) || rec.layerName,
      lvl: rec.lvl
    }));
  }

  function paint(polys) {
    const sg = window.__sg; if (!sg || !sg.globe()) return;
    if (window.SeaRegions && SeaRegions.state().on) {
      try { SeaRegions.update(); } catch (e) { /* regions will pick up contribute */ }
      return;
    }
    const g = sg.globe();
    const key = polys.map((p) => p.id).join("|");
    if (key === st.lastKey) return;
    st.lastKey = key;
    g.polygonsData(polys)
      .polygonGeoJsonGeometry((d) => d.g)
      .polygonCapColor(() => "rgba(0,0,0,0)")
      .polygonSideColor(() => "rgba(0,0,0,0)")
      .polygonStrokeColor((d) => d.color)
      .polygonAltitude((d) => 0.0012 + d.lvl * 0.0004)
      .polygonsTransitionDuration(0)
      .polygonLabel((d) => d.name);
  }

  async function polygons(ctx, alt, lon, lat, signal) {
    if (!st.on || st.status === "missing" || st.status === "down") return [];
    if (st.status !== "ok") return [];
    const out = [];
    for (const layer of LAYERS) {
      const list = await loadLayer(layer, alt, lon, lat, signal);
      out.push.apply(out, toPolys(list, layer));
    }
    st.features = out;
    return out;
  }

  async function update() {
    if (!enabled() || !st.on) return;
    const sg = window.__sg; if (!sg || !sg.globe()) return;
    const my = ++gen;
    if (ctl) ctl.abort();
    ctl = new AbortController();
    const signal = ctl.signal;
    if (st.status === "off" || st.status === "checking") await health(signal);
    if (my !== gen) return;
    syncUi();
    if (st.status !== "ok") { st.features = []; paint([]); return; }
    const pov = sg.globe().pointOfView();
    const alt = pov.altitude, lat = pov.lat, lon = ((pov.lng + 540) % 360) - 180;
    const extra = await polygons(null, alt, lon, lat, signal);
    if (my !== gen) return;
    paint(extra);
    if (window.SeaRegions) { try { SeaRegions.update(); } catch (e) { /* chip only */ } }
  }

  function enable(on) {
    st.on = !!on;
    remember(st.on);
    if (!st.on) {
      st.status = "off"; st.msg = ""; st.features = []; st.lastKey = "";
      const sg = window.__sg;
      if (sg && sg.globe() && !(window.SeaRegions && SeaRegions.state().on)) sg.globe().polygonsData([]);
    } else {
      st.status = "off";
    }
    syncUi();
    if (st.on) update();
    else if (window.SeaRegions) { try { SeaRegions.update(); } catch (e) { /* chip only */ } }
  }

  function init() {
    if (!enabled()) return;
    const pane = document.querySelector("[data-pane='layers'] .toggles");
    if (pane && !$("tPmtiles")) {
      pane.insertAdjacentHTML("beforeend",
        "<label title='Shows US Census TIGER/Line 2026 state, county, county-subdivision and place boundaries.'><input type='checkbox' id='tPmtiles' data-next-layer='pmtilesBorders'> US Census boundaries (TIGER/Line 2026; off by default)</label>" +
        "<div id='pmtilesCredit' class='small' hidden>" + CREDIT + "</div>" +
        "<div id='pmtilesNote' class='small warn' hidden>" + NOTE + "</div>");
      $("tPmtiles").addEventListener("change", (ev) => enable(ev.target.checked));
    }
    let acc = 0;
    if (window.__sg && window.__sg.onFrame) window.__sg.onFrame((dt) => { if (!st.on) return; acc += dt; if (acc > 0.35) { acc = 0; update(); } });
    if (recalled()) enable(true);
    else syncUi();
  }

  window.SeaNext = window.SeaNext || {};
  window.SeaNext[FLAG] = {
    enabled, flag: FLAG, get ready() { return st.ready; },
    enable, update, health, polygons,
    active: () => !!(st.on && st.status === "ok"),
    credited: () => !!(st.on && st.status === "ok"),
    state: () => ({ on: st.on, status: st.status, msg: st.msg, ready: st.ready, features: st.features.length })
  };
  function start() { init(); st.ready = true; }
  start();
  window.addEventListener("seaglobe:ready", start);
})();
