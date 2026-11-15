/* SeaSky: the space layer. Uses the GCAT slice (J. McDowell, CC BY 4.0) shipped in data/space/gcat.js:
   - the decorative satellite dots scale with cumulative payloads launched (GCAT), not a made-up curve;
   - launch sites as points; a launches-per-year readout;
   - an orbit ring for a chosen craft drawn from its GCAT inclination and mean altitude.
   The ring is ILLUSTRATIVE: the orbit plane's orientation (RAAN) and the craft's position are not modelled.
   Live satellite positions are bring-your-own only (PC edition), never fetched here. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const G = () => (window.SEAGLOBE_DATA || {}).gcat;
  let cum = null, cumMax = 1, ring = null, ringCraft = null;
  function cumulative() {
    if (cum) return cum;
    const y = (G() || {}).years || {}; cum = {}; let s = 0;
    Object.keys(y).sort().forEach((k) => { s += y[k]; cum[k] = s; }); cumMax = s || 1;
    return cum;
  }
  function payloadsBy(year) {
    const c = cumulative(), ys = Object.keys(c).sort(); let v = 0;
    for (const k of ys) { if (+k <= Math.floor(year)) v = c[k]; else break; }
    return v;
  }
  function patchCount() {
    if (!window.SeaPlanet || !G()) return;
    const orig = window.SeaPlanet.satelliteCount;
    window.SeaPlanet.satelliteCount = function (year, max) {
      if (year < 1957.75) return 0;
      const v = payloadsBy(year); if (!v) return orig(year, max);
      return Math.max(1, Math.round(max * Math.sqrt(v / cumMax)));
    };
  }
  function sites(on) {
    const g = G(); if (!g || !window.SeaTools) return;
    if (on && window.SeaLayers && !SeaLayers.request("launch", true)) {
      const cb = $("tLaunch"); if (cb) cb.checked = false;
      return;
    }
    if (!on && window.SeaLayers) SeaLayers.request("launch", false);
    window.SeaTools.points("launch", g.sites.map((s) => ({ lat: s.lat, lon: s.lon, color: "#ff9f6e", r: 0.18 + Math.min(0.5, Math.sqrt(s.launches) / 90), alt: 0.004,
      label: "<b>" + esc(s.short || s.name) + "</b><div>" + esc(s.launches) + " launch attempts " + esc(s.first) + "–" + esc(s.last) + " · GCAT (CC BY 4.0)</div>", id: "place:site-" + s.code })), on);
    const cb = $("tLaunch"); if (cb) cb.checked = !!on;
  }
  function orbitRing(craft) {
    const sg = window.__sg, THREE = sg.three(), scene = sg.globe().scene();
    if (ring) { scene.remove(ring); ring.geometry.dispose(); ring = null; ringCraft = null; }
    if (!craft || craft.perigee_km == null || craft.apogee_km == null || craft.inc_deg == null) return null;
    const R = sg.globe().getGlobeRadius(), mean = (craft.perigee_km + craft.apogee_km) / 2, r = R * (1 + mean / 6371);
    const pts = []; const inc = craft.inc_deg * Math.PI / 180;
    for (let i = 0; i <= 256; i++) { const a = i / 256 * Math.PI * 2; const x = Math.cos(a) * r, z = Math.sin(a) * r; pts.push(new THREE.Vector3(x, z * Math.sin(inc), z * Math.cos(inc))); }
    ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.8 }));
    ring.name = "sg-orbit-ring"; scene.add(ring); ringCraft = craft.jcat;
    return ring;
  }
  function readout() {
    const el = $("skyReadout"); const g = G(); if (!el || !g || !window.__sg) return;
    const y = yearNow();
    const n = g.years[String(y)], l = g.launches[String(y)];
    el.innerHTML = y >= 1957 ? "<span class='kicker'>Space · " + y + "</span> " + (l != null ? esc(l) + " orbital launch attempts" : "launches [UNKNOWN]") + " · " + (n != null ? esc(n) + " payloads launched" : "payloads [UNKNOWN]") +
      " · " + esc(payloadsBy(y).toLocaleString("en-US")) + " payloads since 1957<div class='small'>GCAT (J. McDowell), CC BY 4.0. Dots on the globe are decorative, scaled to these counts.</div>"
      : "<span class='kicker'>Space</span> No satellites before 1957.";
  }
  function yearNow() { return Math.floor(window.__sg.timeNow()); }
  function show(e) {
    const g = G(); if (!g) return;
    if (e.kind === "spacecraft") {
      const c = g.craft.find((x) => "spacecraft:" + x.jcat.toLowerCase() === e.id || x.jcat === (e.data && e.data.jcat));
      if (c) { orbitRing(c); const yr = parseInt(c.ldate, 10); if (yr) window.__sg.setTime(yr + "-07-01"); window.__sg.flyTo({ lat: c.inc_deg / 2, lng: 0, altitude: 3.2 }, 2.4); }
    } else if (e.kind === "place" && e.geo) { sites(true); window.__sg.flyTo({ lat: e.geo.lat, lng: e.geo.lon, altitude: 1.2 }, 2.2); }
  }
  function init() {
    patchCount();
    const pane = document.querySelector("[data-pane='layers'] .toggles");
    if (pane && !$("tLaunch") && G()) {
      pane.insertAdjacentHTML("beforeend", "<label title='Shows launch sites from GCAT.'><input type='checkbox' id='tLaunch'> Launch sites (75, GCAT)</label>");
      $("tLaunch").addEventListener("change", (ev) => sites(ev.target.checked));
      pane.insertAdjacentHTML("afterend", "<div class='skyreadout small' id='skyReadout' aria-live='off'></div>");
    }
    let acc = 0; window.__sg.onFrame((dt) => { acc += dt; if (acc > 1) { acc = 0; readout(); } });
    readout();
  }
  window.SeaSky = { show, sites, orbitRing, payloadsBy, ring: () => ringCraft, readout };
  window.addEventListener("seaglobe:ready", init);
})();
