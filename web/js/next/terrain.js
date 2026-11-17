/* USGS 3DEP terrain (Terrarium PMTiles). Loads only when SeaFlags.on("terrain").
   The Layers toggle stays off until the user turns it on (remembered in this browser, not during tests).
   Relief draws only where samples exist; elsewhere the current globe elevation stays. A missing file
   or 404 is skipped with a "layer unavailable" note and does not throw. Coverage is US-centred.
   The current archive has zooms 0–6 (zoom 6 partial). Zoom 7–8 tiles are not in that archive;
   at those camera zooms the closest available tile is used and no elevation is invented. */
(function () {
  "use strict";
  const FLAG = "terrain";
  const STORE = "sg-next-layers";
  const CREDIT = "U.S. Geological Survey, 3DEP";
  const LIMIT_DEFAULT = "US only, zooms 0–6, zoom 6 partial";
  const NOTE = "layer unavailable";
  const ASSET = "dem-terrain";
  const MIN_Z = 0, REQ_MAX_Z = 8;
  function limitText(archiveMax) {
    if (archiveMax == null) return LIMIT_DEFAULT;
    if (archiveMax >= 7) return "US only, zooms 0–" + archiveMax;
    const base = "US only, zooms 0–" + archiveMax + (archiveMax === 6 ? ", zoom 6 partial" : "");
    return base + ". Zoom 7–8 tiles are not in this archive; close views use the closest available zoom.";
  }
  const $ = (id) => document.getElementById(id);
  const testMode = () => { try { const q = new URLSearchParams(location.search); return q.get("capture") === "1" || q.get("shot") === "1"; } catch (e) { return false; } };
  function enabled() { return window.SeaFlags && window.SeaFlags.on(FLAG); }
  function store() { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { return {}; } }
  function remember(on) {
    if (testMode()) return;
    try { const o = store(); o[FLAG] = !!on; localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) { /* quota / private mode */ }
  }
  function recalled() { if (testMode()) return false; return !!store()[FLAG]; }

  const st = { on: false, status: "off", msg: "", group: null, lastKey: "", ready: false, archiveMax: null, viewZoom: 0, usedZoom: 0, closeFallback: false };
  let gen = 0, ctl = null;
  const cache = new Map();

  function assetUrl() { return window.SeaAssets && SeaAssets.url(ASSET); }
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
    const n = $("terrainNote"); if (!n) return;
    n.hidden = !show; if (show) n.textContent = text || NOTE;
  }
  function setCredit(show) {
    const c = $("terrainCredit"); if (!c) return;
    c.hidden = !show;
    if (show) c.textContent = CREDIT + " (" + limitText(st.archiveMax) + ")";
  }
  function syncUi() {
    const cb = $("tTerrain"); if (cb) cb.checked = st.on;
    setCredit(st.on && st.status === "ok");
    setNote(st.on && (st.status === "down" || st.status === "missing"), st.msg || NOTE);
  }

  function earthMesh() {
    const g = window.__sg && window.__sg.globe && window.__sg.globe();
    if (!g || !g.scene) return null;
    let found = null;
    g.scene().traverse((o) => {
      if (!found && o.isMesh && o.material && o.material.uniforms && o.material.uniforms.dayMap) found = o;
    });
    return found;
  }
  function globeRadius(mesh) {
    if (mesh && mesh.geometry) {
      mesh.geometry.computeBoundingSphere();
      if (mesh.geometry.boundingSphere) return mesh.geometry.boundingSphere.radius;
    }
    const g = window.__sg && window.__sg.globe && window.__sg.globe();
    return (g && g.getGlobeRadius && g.getGlobeRadius()) || 100;
  }
  function toCart(lat, lon, rel) {
    const g = window.__sg.globe();
    if (g.getCoords) return g.getCoords(lat, lon, rel);
    const r = 1 + (rel || 0);
    const phi = (90 - lat) * Math.PI / 180, theta = (90 - lon) * Math.PI / 180;
    return { x: r * Math.sin(phi) * Math.cos(theta), y: r * Math.cos(phi), z: r * Math.sin(phi) * Math.sin(theta) };
  }
  function terrariumElev(r, g, b) { return r * 256 + g + b / 256 - 32768; }

  async function decodePng(buf) {
    const blob = new Blob([buf], { type: "image/png" });
    const bmp = await createImageBitmap(blob);
    const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);
    const size = bmp.width;
    const img = ctx.getImageData(0, 0, size, bmp.height);
    const data = new Float32Array(size * size);
    for (let i = 0, p = 0; i < img.data.length; i += 4, p++) data[p] = terrariumElev(img.data[i], img.data[i + 1], img.data[i + 2]);
    if (bmp.close) bmp.close();
    return { size: size, data: data };
  }

  async function tileElev(arch, z, x, y, signal, minZ) {
    let zz = z, xx = x, yy = y;
    while (zz >= minZ) {
      const key = zz + "/" + xx + "/" + yy;
      if (cache.has(key)) return { key: key, z: zz, x: xx, y: yy, srcZ: zz, ...(cache.get(key) || {}) };
      let buf = null;
      try { buf = await arch.get(zz, xx, yy, signal); } catch (e) { if (signal && signal.aborted) throw e; buf = null; }
      if (buf) {
        let dec = null;
        try { dec = await decodePng(buf); } catch (e) { dec = null; }
        if (!dec) { cache.set(key, null); zz -= 1; xx = Math.floor(xx / 2); yy = Math.floor(yy / 2); continue; }
        cache.set(key, dec);
        return { key: key, z: zz, x: xx, y: yy, srcZ: zz, size: dec.size, data: dec.data };
      }
      cache.set(key, null);
      zz -= 1; xx = Math.floor(xx / 2); yy = Math.floor(yy / 2);
    }
    return null;
  }

  function ensureGroup() {
    const mesh = earthMesh();
    if (!mesh) return null;
    const THREE = window.SEAGLOBE_THREE || window.THREE;
    if (!THREE) return null;
    if (st.group && st.group.parent === mesh) return st.group;
    if (st.group && st.group.parent) st.group.parent.remove(st.group);
    st.group = new THREE.Group();
    st.group.name = "seaglobe-terrain";
    mesh.add(st.group);
    return st.group;
  }

  function makeTileMesh(tile, globeR) {
    const THREE = window.SEAGLOBE_THREE || window.THREE;
    if (!THREE) return null;
    const n = 24;
    const pos = [], col = [], elevs = [], idx = [];
    const size = tile.size, data = tile.data;
    if (!data || !size) return null;
    const nWorld = 1 << tile.z;
    function sample(u, v) {
      const px = Math.min(size - 1, Math.max(0, Math.floor(u * (size - 1))));
      const py = Math.min(size - 1, Math.max(0, Math.floor(v * (size - 1))));
      return data[py * size + px];
    }
    for (let j = 0; j <= n; j++) {
      for (let i = 0; i <= n; i++) {
        const u = i / n, v = j / n;
        const lon = (tile.x + u) / nWorld * 360 - 180;
        const mer = Math.PI * (1 - 2 * (tile.y + v) / nWorld);
        const lat = Math.atan(Math.sinh(mer)) * 180 / Math.PI;
        const elev = sample(u, v);
        const has = elev !== -32768 && isFinite(elev);
        const rel = has && elev > 0 ? (elev / 6371000) * 12 : 0;
        const p = toCart(lat, lon, rel);
        pos.push(p.x * globeR, p.y * globeR, p.z * globeR);
        const shade = has ? 0.25 + 0.55 * Math.max(0, Math.min(1, (elev + 200) / 2500)) : 0;
        col.push(0.55 + shade * 0.4, 0.48 + shade * 0.28, 0.36);
        elevs.push(has ? elev : -32768);
      }
    }
    const stride = n + 1;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const a = j * stride + i, b = a + 1, c = a + stride, d = c + 1;
      if (Math.max(elevs[a], elevs[b], elevs[c], elevs[d]) <= 5) continue;
      idx.push(a, c, b, b, c, d);
    }
    if (!idx.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.FrontSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.tile = tile.key;
    return mesh;
  }

  function clearMeshes() {
    st.lastKey = "";
    if (!st.group) return;
    while (st.group.children.length) {
      const c = st.group.children[0];
      st.group.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
  }

  async function health(signal) {
    const url = assetUrl();
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

  async function update() {
    if (!enabled() || !st.on) return;
    const sg = window.__sg;
    if (!sg || !sg.globe()) return;
    const my = ++gen;
    if (ctl) ctl.abort();
    ctl = new AbortController();
    const signal = ctl.signal;
    if (st.status === "off" || st.status === "checking") await health(signal);
    if (my !== gen) return;
    syncUi();
    if (st.status !== "ok") { clearMeshes(); return; }
    const url = assetUrl();
    const pov = sg.globe().pointOfView();
    const alt = pov.altitude, lat = pov.lat, lon = ((pov.lng + 540) % 360) - 180;
    const arch = SeaPmtiles.open(url);
    let archiveMax = 6, minZ = MIN_Z;
    try {
      const h = await arch.header(signal);
      if (h && h.maxZoom != null) archiveMax = h.maxZoom;
      if (h && h.minZoom != null) minZ = Math.max(minZ, h.minZoom);
    } catch (e) {
      if (signal.aborted) return;
      st.status = "down"; st.msg = NOTE; syncUi(); clearMeshes(); return;
    }
    st.archiveMax = archiveMax;
    const zCam = (window.SeaRegions && SeaRegions.zoomFromAlt) ? SeaRegions.zoomFromAlt(alt) : zoomFromAlt(alt);
    // Request only zooms the archive actually has (up to 8). If the camera is
    // closer than that, keep drawing the closest available zoom and say so.
    const z = Math.max(minZ, Math.min(zCam, archiveMax, REQ_MAX_Z));
    st.viewZoom = zCam;
    st.closeFallback = zCam > archiveMax;
    const tiles = (window.SeaRegions && SeaRegions.tilesInView) ? SeaRegions.tilesInView(z, lon, lat) : tilesInView(z, lon, lat);
    const key = tiles.map((t) => t.join("/")).join("|");
    if (key === st.lastKey && st.group && st.group.children.length) return;
    const decoded = [];
    const seen = new Set();
    for (const [tz, x, y] of tiles) {
      try {
        const t = await tileElev(arch, tz, x, y, signal, minZ);
        if (t && t.data && !seen.has(t.key)) { seen.add(t.key); decoded.push(t); }
      } catch (e) { if (signal.aborted) return; }
    }
    st.usedZoom = decoded.length ? Math.max.apply(null, decoded.map((t) => t.srcZ != null ? t.srcZ : t.z)) : Math.min(z, archiveMax);
    if (my !== gen) return;
    const group = ensureGroup(); if (!group) return;
    const mesh = earthMesh();
    const globeR = globeRadius(mesh) || 100;
    const sample = toCart(0, 0, 0);
    const scale = (Math.hypot(sample.x, sample.y, sample.z) > 2) ? 1 : globeR;
    while (group.children.length) {
      const c = group.children[0];
      group.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
    decoded.forEach((t) => {
      const m = makeTileMesh(t, scale === globeR ? globeR : 1);
      if (m) group.add(m);
    });
    st.lastKey = key;
    syncUi();
    if (window.SeaRegions) { try { SeaRegions.update(); } catch (e) { /* chip only */ } }
  }

  function enable(on) {
    if (on && window.SeaLayers && !SeaLayers.request("terrain", true)) {
      const cb = $("tTerrain"); if (cb) cb.checked = false;
      return;
    }
    if (!on && window.SeaLayers) SeaLayers.request("terrain", false);
    st.on = !!on;
    remember(st.on);
    if (!st.on) { clearMeshes(); st.status = "off"; st.msg = ""; }
    else st.status = "off";
    syncUi();
    if (st.on) update();
    else if (window.SeaRegions) { try { SeaRegions.update(); } catch (e) { /* chip only */ } }
  }

  function init() {
    if (!enabled()) return;
    const pane = document.querySelector("[data-pane='layers'] .toggles");
    if (pane && !$("tTerrain")) {
      pane.insertAdjacentHTML("beforeend",
        "<label title='Shows USGS 3DEP elevation over the US where tiles exist; elsewhere the globe stays as it is.'><input type='checkbox' id='tTerrain' data-next-layer='terrain'> US terrain (USGS 3DEP; off by default)</label>" +
        "<div id='terrainCredit' class='small' hidden>" + CREDIT + " (" + LIMIT_DEFAULT + ")</div>" +
        "<div id='terrainNote' class='small warn' hidden>" + NOTE + "</div>");
      $("tTerrain").addEventListener("change", (ev) => enable(ev.target.checked));
    }
    let acc = 0;
    if (window.__sg && window.__sg.onFrame) window.__sg.onFrame((dt) => { if (!st.on) return; acc += dt; if (acc > 0.5) { acc = 0; update(); } });
    if (recalled()) enable(true);
    else syncUi();
  }

  window.SeaNext = window.SeaNext || {};
  window.SeaNext[FLAG] = {
    enabled, flag: FLAG, get ready() { return st.ready; },
    enable, update, health,
    credited: () => !!(st.on && st.status === "ok"),
    state: () => ({ on: st.on, status: st.status, msg: st.msg, ready: st.ready, tiles: st.group ? st.group.children.length : 0, archiveMax: st.archiveMax, viewZoom: st.viewZoom, usedZoom: st.usedZoom, closeFallback: st.closeFallback })
  };
  function start() { init(); st.ready = true; }
  start();
  window.addEventListener("seaglobe:ready", start);
})();
