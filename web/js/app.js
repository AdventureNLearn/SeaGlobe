/* SeaGlobe app: a planet of routes with moving vehicles, 500 BCE to today.
   Static: every file is local. The only outside requests are opt-in or have a fallback: the read-only version check
   (js/update.js), large files from the R2 base when one is set (js/assets.js), the chat (js/chat.js: only after the visitor
   saves their own xAI key, sent straight to api.x.ai; the optional Worker in worker/chat is a pass-through a visitor may run on
   their own Cloudflare account) and feeds the user brings in the BYO edition (js/byo.js). */
(function () {
  "use strict";
  if (window.__sgFrameBlocked) return;
  const THREE = window.SEAGLOBE_THREE;
  const D = window.SEAGLOBE_DATA;
  const S = D.schema;
  const T = window.SeaTime, V = window.SeaVoyages;
  const $ = (id) => document.getElementById(id);
  // UI scale from the CSS (--ui: 1 on ordinary screens, larger on 4K/8K wall displays)
  const uiScale = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui")) || 1;
  let uiK = 1; window.addEventListener("resize", () => { uiK = uiScale(); }); setTimeout(() => { uiK = uiScale(); }, 0);
  const P = new URLSearchParams(location.search);
  // The clock is ?t= as a year or date (for example 1320-05-01). Use ?cb= to cache-bust the page;
  // a bare number in t (epoch milliseconds, and so on) is ignored so it cannot throw "bad date".
  function parseClockParam(raw) {
    if (raw == null || raw === "") return null;
    const s = String(raw).trim();
    if (!/^(-?\d{1,4})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}))?)?)?$/.test(s)) return null;
    try { return T.parse(s); } catch (e) { return null; }
  }
  const clockParam = parseClockParam(P.get("t"));
  const capture = P.get("capture") === "1";
  const shot = P.get("shot") === "1" || capture;
  const fileMode = location.protocol === "file:";
  const E = window.SEAGLOBE_EDITION || {};
  const lite = P.get("lite") === "1" || fileMode || E.lite === true;
  const CAP = parseInt(P.get("cap") || (lite ? "28" : "56"), 10);
  const DAYS_PER_SEC = 3; // at 1x
  const R = 100; // globe.gl radius
  const WATER = new Set(["sea", "river", "canal"]);
  // v2.2 selectability assist (no visual change): vehicles ease to a stop as the pointer closes on one,
  // and no vehicle may cross the screen faster than MAX_PX_PER_SEC at any time speed. Dates stay true;
  // only the clock rate eases (timeline) or the sample vessel's own pace (sampler).
  const HIT_HOVER = 30, HIT_CLICK = 36, SLOW_NEAR = 150, MAX_PX_PER_SEC = 140, STICKY_SEC = 0.6;
  const HIT_TOUCH = 44; // a fingertip is less precise than a mouse pointer (touch only)

  const st = {
    t: clockParam != null ? clockParam : T.parse("1320-05-01"),
    playing: P.get("play") !== "0" && !shot,
    speed: parseFloat(P.get("speed") || "5"),
    selected: null, follow: P.get("follow") === "1", orbit: false,
    fly: null, lastYear: null, now: 0, shipsWork: 0, layers: { routes: true, wakes: true, wind: false, night: true, sats: true, ships: true },
    // "idle": a rotating sample of vessels from every era; "timeline": the real timeline at st.t
    mode: clockParam != null || P.get("era") || P.get("select") || P.get("idle") === "0" ? "timeline" : "idle",
    focus: {},            // era, type, family, goods, region, evidence, routeId, q
    slots: [], lastSwap: 0, idleSeq: 0, pendingKey: null, orbitIdleUntil: 0,
    ptr: null, slow: 1, govern: 1, hoverKey: null, hoverAt: -9,
  };
  const IDLE_N = lite ? 10 : 16;
  // curated idle pool: mixed eras, types and regions (the Middle Passage is deliberately not used as decoration)
  const IDLE_POOL = ["athens-black-sea-grain", "indian-ocean-hormuz-calicut", "zheng-he-trunk", "hanseatic-baltic-trunk", "manila-galleon-outbound",
    "das-amsterdam-1595", "silk-road-changan-samarkand", "first-transcontinental", "transpacific-containers", "air-lhr-jfk",
    "roman-alexandria-ostia-grain", "viking-norway-iceland", "venetian-alexandria-muda", "qhapaq-nan-quito-cusco", "trans-saharan-gold-salt",
    "suez-steam-bombay", "cliwoc-launceston-1769", "grand-canal-yuan-ming", "trans-siberian-railway", "air-hkg-syd", "incense-route",
    "voc-return-fleet", "maritime-silk-road-polo-1291", "eic-london-madras", "erie-canal", "shanghai-rotterdam-containers", "air-gru-jnb",
    "persian-royal-road", "red-sea-muziris", "genoese-black-sea", "liverpool-manchester-railway", "air-pvg-lax", "varangian-route", "zheng-he-west"];
  // one colour per route family (legend); the Atlantic family keeps its own muted colours
  const FAMILY_PALETTE = ["#f6c65b", "#5ee7ff", "#ff8a5b", "#9bf06b", "#c59bff", "#ff6fae", "#6fa8ff", "#ffd8a0", "#59d4a8", "#e0e070",
    "#ff9f43", "#8ad1ff", "#d7a6ff", "#a3e635", "#f472b6", "#38bdf8", "#facc15", "#fb7185", "#34d399", "#c4b5fd", "#fdba74", "#67e8f9", "#bef264", "#f9a8d4"];
  const famColor = {};
  const AIR_COLORS = { "air-pioneers": "#ffe08a", "air-interwar": "#ffb3c7", "air-jet-age": "#b8f3ff" };
  const GHOST = new THREE.MeshBasicMaterial({ color: 0x9fb4cc, transparent: true, opacity: 0.12, depthWrite: false });
  let satModels = null, scene3 = null;
  let sun = null, bloom = null, globe, routes = [], prepared = [], live = new Map(), earthMat, sunLight, stars, moon, sats, vehGroup;
  const tmp = { a: new THREE.Vector3(), b: new THREE.Vector3(), n: new THREE.Vector3(), f: new THREE.Vector3(), x: new THREE.Vector3(), m: new THREE.Matrix4(), q: new THREE.Quaternion(), c: new THREE.Vector3() };

  // ---------- loading ----------
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src)); document.head.appendChild(s); });
  }
  async function loadAll() {
    for (const f of D.route_files || []) await loadScript(f);
    for (const k of Object.keys(D)) if (k.indexOf("routes:") === 0) routes = routes.concat(D[k].routes);
    if (lite) await loadScript("data/texture.js");
  }
  function loadTex1(url) {
    return new Promise((res) => { const L = new THREE.TextureLoader(); if (/^https?:/.test(url)) L.setCrossOrigin("anonymous"); L.load(url, (t) => res(t), undefined, () => res(null)); });
  }
  // an asset id goes through the asset manifest (R2 copy first when a base is set, then the repo file); a plain path loads as is
  async function loadTex(idOrUrl) {
    const list = window.SeaAssets && SeaAssets.info(idOrUrl) ? SeaAssets.urls(idOrUrl) : [idOrUrl];
    for (const u of list) { const t = await loadTex1(u); if (t) return t; }
    return null;
  }
  async function textures() {
    const day = await loadTex(lite ? D.texture : "tex-day-8k");
    if (day) { day.colorSpace = THREE.SRGBColorSpace; day.anisotropy = 8; }
    let night = null, water = null;
    if (!lite) {
      night = await loadTex("tex-night-4k");
      water = await loadTex("tex-water-4k");
      if (night) night.colorSpace = THREE.SRGBColorSpace;
    }
    return { day, night, water };
  }

  // ---------- helpers ----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const vehicleName = (id) => (S.vehicles.find((v) => v.id === id) || { name: id }).name;
  function hexA(hex, a) {
    const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }
  // altitude above the drawn (faceted) globe surface, as a fraction of R; sea vessels sit at 0 = the waterline
  function altFor(route, frac) {
    // v2.3: arcs scale down for routes shorter than ~1,900 km (a Berlin Airlift hop, the 260 m Kitty Hawk flight); long routes unchanged
    if (route.type === "air") return (route._line ? Math.min(1, Math.max(0.03, route._line.total / 1900)) : 1) * (0.012 + 0.05 * Math.sin(Math.PI * Math.max(0, Math.min(1, frac))));
    if (route.type === "rail" || route.type === "land") return 0.0001;
    return 0.0;
  }
  // world position on the globe mesh's real (flat-triangle) surface + alt; see SeaVehicles.facetScale
  const surfInv = new THREE.Matrix4(), surfV = new THREE.Vector3();
  let surfMesh = null;
  function surfCoords(lat, lng, alt) {
    const c = globe.getCoords(lat, lng, 0);
    if (!surfMesh) globe.scene().traverse((o) => { if (!surfMesh && o.isMesh && o.material === earthMat && o.geometry && o.geometry.parameters && o.geometry.parameters.widthSegments) surfMesh = o; });
    let k = 1;
    if (surfMesh) {
      const gp = surfMesh.geometry.parameters;
      surfMesh.updateMatrixWorld(); surfInv.copy(surfMesh.matrixWorld).invert();
      surfV.set(c.x, c.y, c.z).applyMatrix4(surfInv).normalize();
      k = SeaVehicles.facetScale(surfV.x, surfV.y, surfV.z, gp.widthSegments, gp.heightSegments);
    }
    const f = (k + alt);
    return { x: c.x * f, y: c.y * f, z: c.z * f };
  }
  // facet surface altitude (k - 1, <= 0) for globe.gl's default 4° sphere, without needing the scene yet
  const GLOBE_SEGS = [90, 45];
  function facetAlt(lat, lng) {
    const ph = (90 - lat) * Math.PI / 180, th = (90 - lng) * Math.PI / 180;
    const x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
    // world -> globe mesh local: three-globe turns its sphere by -90° about Y, so undo it (+90°)
    return SeaVehicles.facetScale(z, y, -x, GLOBE_SEGS[0], GLOBE_SEGS[1]) - 1;
  }
  function yearsText(r) {
    const a = T.yearLabel(r._t0), b = T.yearLabel(r._t1 - 0.001);
    return a === b ? a : a + " – " + b;
  }
  function eraOf(t) { return T.eraAt(S.eras, t); }
  const GOODS = [["grain", /grain|wheat|barley|rice|annona/i], ["spices & incense", /spice|pepper|clove|nutmeg|cinnamon|incense|frankincense|myrrh/i],
    ["textiles & silk", /silk|cotton|textile|cloth|wool|linen/i], ["metals & gold", /gold|silver|copper|tin|iron|metal|bullion/i],
    ["porcelain & tea", /porcelain|tea|ceramic/i], ["oil & gas", /oil|gas|crude/i], ["amber & furs", /amber|fur|wax/i],
    ["salt", /salt/i], ["people", /enslaved|captive|slave|passenger|emigrant|mail|troops/i], ["manufactured goods", /manufactur|container|machine|goods/i]];
  function goodsCats(r) { const g = (r.goods || []).join(" ") + " " + (r.goods_source || ""); return GOODS.filter(([, re]) => re.test(g)).map(([n]) => n); }
  function evidenceOf(r) { return !r.reconstruction ? "dataset" : (r.schedule && r.schedule.kind === "dated") ? "dated" : "reconstruction"; }
  function focusActive() { const f = st.focus; return !!(f.era || f.type || f.family || f.goods || f.region || f.evidence || f.routeId || f.q); }
  function matches(r, f) {
    f = f || st.focus;
    if (f.routeId && r.id !== f.routeId) return false;
    if (f.era && r.era !== f.era && !(r._t0 <= eraById(f.era).to + 1 && r._t1 >= eraById(f.era).from)) return false;
    if (f.type && r.type !== f.type) return false;
    if (f.family && r.family !== f.family) return false;
    if (f.region && r.region !== f.region) return false;
    if (f.goods && !goodsCats(r).includes(f.goods)) return false;
    if (f.evidence === "dataset" && r.reconstruction) return false;
    if (f.evidence === "reconstruction" && !r.reconstruction) return false;
    if (f.evidence === "dated" && !(r.schedule && r.schedule.kind === "dated")) return false;
    if (f.q) { const h = (r.name + " " + r.id + " " + (r.goods || []).join(" ") + " " + r.family + " " + r.vehicle + " " + (r.citations || []).join(" ") + " " + (r.history || "") + " " + (r.story || "") + " " + ((r.schedule && r.schedule.voyages) || []).map((v) => v.ship || "").join(" ")).toLowerCase(); if (!f.q.toLowerCase().split(/\s+/).every((w) => h.includes(w))) return false; }
    return true;
  }
  function eraById(id) { return S.eras.find((e) => e.id === id) || S.eras[0]; }
  function colorOf(r) { return r.family === "atlantic" ? r.color : (famColor[r.family] || r.color); }

  // ---------- scene ----------
  function buildScene(tex) {
    const el = $("globe");
    earthMat = SeaPlanet.earthMaterial({ day: tex.day, night: tex.night, water: tex.water });
    globe = new Globe(el, { rendererConfig: { antialias: true, preserveDrawingBuffer: capture, powerPreference: "high-performance" }, animateIn: false })
      .backgroundColor("#000000")
      .globeMaterial(earthMat)
      .showAtmosphere(true).atmosphereColor("#62b6ff").atmosphereAltitude(0.2)
      .showGraticules(false)
      .pathPoints((d) => d._pts).pathPointLat((p) => p[0]).pathPointLng((p) => p[1]).pathPointAlt((p) => p[2])
      .pathColor((d) => d._color).pathStroke((d) => d._stroke)
      .pathDashLength(1).pathDashGap(0).pathDashAnimateTime(0).pathTransitionDuration(0)
      .onPathHover((d) => tip(d ? "<b>" + esc(d.name) + "</b><div>" + esc(yearsText(d)) + " · " + esc(d.reconstruction ? "Reconstruction" : "Record") + "</div>" : null))
      .htmlLat((d) => d.lat).htmlLng((d) => d.lon).htmlAltitude(0.02).htmlElement(windElement).htmlTransitionDuration(0);
    const r3 = globe.renderer();
    r3.setPixelRatio(pixelRatio());
    const cam = globe.camera();
    cam.far = 30000; cam.near = 0.05; cam.updateProjectionMatrix();
    const scene = globe.scene();
    sunLight = new THREE.DirectionalLight(0xfff2dd, 1.6);
    scene.add(sunLight); scene.add(sunLight.target);
    scene.add(new THREE.HemisphereLight(0x9ec8ff, 0x101820, 0.35));
    stars = SeaPlanet.starfield(lite ? 2500 : 9000, 12000); scene.add(stars);
    moon = SeaPlanet.moon(lite); scene.add(moon);
    sats = SeaPlanet.satellites(lite ? 120 : 420); scene.add(sats);
    vehGroup = new THREE.Group(); scene.add(vehGroup); scene3 = scene;
    sun = SeaPlanet.sun(); scene.add(sun.group); window.__sunObj = sun;
    if (!lite && window.SEAGLOBE_THREE_ADDONS && P.get("bloom") !== "0") {
      const A = window.SEAGLOBE_THREE_ADDONS;
      const comp = globe.postProcessingComposer();
      r3.toneMapping = THREE.ACESFilmicToneMapping; r3.toneMappingExposure = 1.0;
      bloom = new A.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.42, 0.5, 0.9);
      comp.addPass(bloom);
      comp.addPass(new A.OutputPass());
    }
    const ctl = globe.controls();
    ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.minDistance = R * 1.06; ctl.maxDistance = R * 30; ctl.rotateSpeed = 0.6; ctl.zoomSpeed = 0.8;
    const pov = (P.get("pov") || "").split(",").map(Number);
    if (pov.length === 3 && pov.every(Number.isFinite)) globe.pointOfView({ lat: pov[0], lng: pov[1], altitude: pov[2] }, 0);
    else globe.pointOfView(eraOf(st.t).camera, 0);
    resize();
    window.addEventListener("resize", resize);
  }
  // cap the drawing buffer at about 8K (7680×4320) so 4K/8K wall displays stay smooth
  function pixelRatio() { return Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2, Math.max(1, Math.sqrt(7680 * 4320 / Math.max(1, innerWidth * innerHeight)))); }
  function resize() {
    if (!globe) return;
    const pr = pixelRatio(), r3 = globe.renderer();
    if (r3.getPixelRatio() !== pr) { r3.setPixelRatio(pr); const comp = globe.postProcessingComposer && globe.postProcessingComposer(); if (comp && comp.setPixelRatio) comp.setPixelRatio(pr); }
    globe.width(window.innerWidth).height(window.innerHeight);
  }

  // ---------- routes on the globe ----------
  function refreshRoutes() {
    const y = st.t;
    const sel = st.selected && st.selected.route.id;
    const foc = focusActive();
    let vis;
    if (st.allGold) vis = prepared.slice();
    else if (st.mode === "idle") { const ids = new Set(st.slots.map((x) => x.route.id)); vis = prepared.filter((r) => ids.has(r.id) && (!foc || matches(r))); }
    else vis = prepared.filter((r) => (y >= r._t0 - 1 && y <= r._t1 + 1) || (foc && (st.focus.routeId || st.focus.era) && matches(r)));
    vis.forEach((r) => {
      if (st.allGold) { r._color = "rgba(255,200,110,0.55)"; r._stroke = 0.9; return; }
      const strong = r.id === sel, m = !foc || matches(r);
      const base = st.mode === "idle" ? 0.22 : foc ? 0.62 : 0.32;
      r._color = hexA(colorOf(r), !m ? 0.06 : strong ? 0.95 : r.type === "pipeline" ? Math.max(base, 0.6) : base);
      r._stroke = r.type === "pipeline" ? 1.6 : strong ? 1.5 : m && foc ? 0.95 : (r.type === "air" ? 0.5 : 0.7);
      r._match = m;
    });
    globe.pathsData(st.layers.routes ? vis.slice() : vis.filter((r) => r.type === "pipeline"));
    $("visibleCount").textContent = st.mode === "idle" ? vis.length + " sample routes across 2,500 years" : vis.length + " route lines in " + T.yearLabel(y);
    renderLegend(vis);
    const ul = $("routelist"); ul.innerHTML = "";
    vis.forEach((r) => {
      const li = document.createElement("li");
      if (r.id === sel) li.classList.add("active");
      li.innerHTML = "<span class='rn'><span class='dot' data-style='background:" + esc(colorOf(r)) + "'></span>" + esc(r.name) + "</span><span class='rm'>" +
        esc(r.type) + " · " + esc(yearsText(r)) + " · " + (r.reconstruction ? "reconstruction" : "record") + " · confidence " + esc(r.confidence_level) + "</span>";
      li.addEventListener("click", () => openRoute(r));
      ul.appendChild(li);
    });
    globe.htmlElementsData(st.layers.wind ? windItems() : []);
  }
  function windItems() {
    const w = D.wind || {}, out = [];
    (w.schematic || []).forEach((x) => out.push(x));
    if (st.t >= 1769 && st.t < 1770) (w.logbook_sample || []).forEach((x) => out.push(x));
    return out;
  }
  function windElement(d) {
    const el = document.createElement("div");
    el.className = "wind-arrow " + d.kind;
    el.style.transform = "translate(-50%,-70%) rotate(" + ((Number(d.from_deg) + 180) % 360) + "deg)";
    el.title = (d.label || "Wind") + " · from " + d.from_deg + "°";
    return el;
  }

  // ---------- vehicles ----------
  function makeLive(inst) {
    const obj = SeaVehicles.build(inst.route.vehicle);
    const N = 44;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N * 2 * 3), 3));
    const idx = [];
    for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx);
    const base = new THREE.Color(colorOf(inst.route));
    const kind = inst.route.type;
    const tint = kind === "air" ? new THREE.Color(0xffffff) : kind === "land" ? new THREE.Color(0xd8b98a) : kind === "rail" ? new THREE.Color(0xc8c8c8) : base.clone().lerp(new THREE.Color(0xffffff), 0.55);
    const col = g.attributes.color.array;
    for (let i = 0; i < N; i++) {
      const f = Math.pow(1 - i / (N - 1), 2.2) * (kind === "pipeline" ? 0 : WATER.has(kind) ? 0.3 : 0.4);
      for (let s = 0; s < 2; s++) col.set([tint.r * f, tint.g * f, tint.b * f], (i * 2 + s) * 3);
    }
    const wake = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    wake.frustumCulled = false;
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 40), new THREE.MeshBasicMaterial({ color: base, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    halo.rotation.x = -Math.PI / 2;
    obj.add(halo);
    vehGroup.add(obj); vehGroup.add(wake);
    return { inst, obj, wake, halo, N, phase: Math.random() * 6.28 };
  }
  function dropLive(key) {
    const l = live.get(key); if (!l) return;
    vehGroup.remove(l.obj); vehGroup.remove(l.wake); l.wake.geometry.dispose(); live.delete(key);
  }
  function vehicleScale(alt) { return 3.0 * Math.pow(Math.max(alt, 0.12), 0.6); }

  function vehicleItems() {
    if (st.mode === "idle") return st.slots.filter((x) => x.inst).map((x) => ({ inst: x.inst, t: x.t, a: x.a }));
    const keep = st.selected ? st.selected.key : st.pendingKey;
    return V.activeAll(prepared, st.t, CAP, keep).map((inst) => ({ inst, t: st.t, a: 1 }));
  }
  function setGhost(l, on) {
    if (l.ghost === on) return; l.ghost = on;
    l.obj.traverse((m) => { if (m.isMesh && m !== l.halo) { if (on) { m.userData.mat = m.material; m.material = GHOST; } else if (m.userData.mat) m.material = m.userData.mat; } });
  }
  function placeVehicles(dtReal) {
    if (!st.layers.ships) {
      vehGroup.visible = false;
      if (live.size) { for (const k of [...live.keys()]) dropLive(k); }
      const n = $("activeCount"); if (n) n.textContent = "Ships and assets off";
      return;
    }
    vehGroup.visible = true;
    st.shipsWork++;
    const items = vehicleItems();
    const act = items.map((x) => x.inst);
    const foc = focusActive();
    const seen = new Set();
    const camAlt = st.chasing || (st.follow && st.selected) ? (st.chaseScaleAlt || 0.2) : globe.pointOfView().altitude;
    const sc = vehicleScale(camAlt);
    for (const it of items) {
      const inst = it.inst;
      seen.add(inst.key);
      let l = live.get(inst.key);
      if (!l) { l = makeLive(inst); live.set(inst.key, l); }
      l.inst = inst; l.t = it.t;
      const m = !foc || matches(inst.route) || !!(st.selected && st.selected.key === inst.key);
      setGhost(l, !m); l.match = m;
      const s = V.stateAt(inst, it.t);
      const alt = altFor(inst.route, s.frac);
      const p = surfCoords(s.lat, s.lng, alt), a = surfCoords(s.aheadLat, s.aheadLng, altFor(inst.route, Math.min(1, s.frac + 0.002)));
      tmp.a.set(p.x, p.y, p.z); tmp.b.set(a.x, a.y, a.z);
      tmp.n.copy(tmp.a).normalize();
      tmp.f.subVectors(tmp.b, tmp.a); tmp.f.addScaledVector(tmp.n, -tmp.f.dot(tmp.n));
      if (tmp.f.lengthSq() < 1e-12) tmp.f.set(0, 0, 1);
      tmp.f.normalize(); tmp.x.crossVectors(tmp.n, tmp.f).normalize();
      tmp.m.makeBasis(tmp.x, tmp.n, tmp.f);
      l.obj.position.copy(tmp.a);
      l.obj.quaternion.setFromRotationMatrix(tmp.m);
      const isSea = WATER.has(inst.route.type);
      if (isSea) { // gentle roll and pitch on the swell
        const w = st.now * 1.6 + l.phase;
        tmp.q.setFromAxisAngle(tmp.f, Math.sin(w) * 0.06); l.obj.quaternion.premultiply(tmp.q);
      }
      if (inst.route.type === "air") { // bank into turns: left turn (heading toward +X) puts the left wing down
        const c = surfCoords(s.aheadLat, s.aheadLng, 0), d2 = surfCoords(s.ahead2Lat, s.ahead2Lng, 0);
        tmp.b.set(d2.x - c.x, d2.y - c.y, d2.z - c.z); tmp.b.addScaledVector(tmp.n, -tmp.b.dot(tmp.n));
        let turn = 0;
        if (tmp.b.lengthSq() > 1e-12) { tmp.b.normalize(); turn = Math.atan2(tmp.c.crossVectors(tmp.f, tmp.b).dot(tmp.n), tmp.f.dot(tmp.b)); }
        const target = Math.max(-0.44, Math.min(0.44, -turn * 3));
        l.bank = l.bank == null ? target : l.bank + (target - l.bank) * Math.min(1, (dtReal || 0.016) * 2);
        if (Math.abs(l.bank) > 1e-4) { tmp.q.setFromAxisAngle(tmp.f, l.bank); l.obj.quaternion.premultiply(tmp.q); }
      }
      const ud = l.obj.userData, near = camAlt < 0.6 || !!(st.selected && st.selected.key === inst.key);
      if (ud.setDetail && l.detail !== near) { ud.setDetail(near); l.detail = near; }
      const gearDown = inst.route.type === "air" && (s.frac < 0.03 || s.frac > 0.97);
      if (ud.setGear && l.gear !== gearDown) { ud.setGear(gearDown); l.gear = gearDown; }
      if (ud.animate && near) ud.animate(dtReal || 0.016, st.now, 0.7);
      const big = (st.selected && st.selected.key === inst.key) ? 1.35 : 1;
      const typeScale = inst.route.type === "pipeline" ? 0.5 : inst.route.type === "rail" ? 1.1 : inst.route.type === "land" ? 1.0 : 1.0;
      const fa = it.a == null ? 1 : it.a;
      l.obj.scale.setScalar(Math.max(1e-4, sc * big * typeScale * (0.15 + 0.85 * fa)));
      l.obj.visible = fa > 0.02;
      const isSel = st.selected && st.selected.key === inst.key;
      l.halo.material.opacity = st.chasing ? 0.0 : (isSel ? 0.85 : m ? 0.18 * fa : 0.0);
      l.halo.visible = inst.route.type !== "pipeline";
      l.screen = null;
      // wake
      l.wake.visible = st.layers.wakes && inst.route.type !== "pipeline" && m && fa > 0.05;
      if (l.wake.visible) updateWake(l, s, sc * (0.15 + 0.85 * fa));
    }
    for (const k of [...live.keys()]) if (!seen.has(k)) dropLive(k);
    $("activeCount").textContent = st.mode === "idle" ? live.size + " sample vessels · all eras" : live.size + " moving" + (act.length >= CAP ? " (capped at " + CAP + ")" : "");
  }
  function updateWake(l, s, sc) {
    const inst = l.inst, N = l.N, type = inst.route.type;
    const lenKm = (type === "air" ? 2200 : type === "rail" ? 200 : type === "land" ? 140 : 380) * sc / 2.4;
    const pts = V.trail(inst, l.t == null ? st.t : l.t, lenKm, N);
    const pos = l.wake.geometry.attributes.position.array;
    const w0 = sc * (type === "air" ? 0.012 : WATER.has(type) ? 0.07 : 0.06);
    let prev = null;
    for (let i = 0; i < N; i++) {
      const fr = Math.max(0, s.frac - (i / (N - 1)) * (lenKm / Math.max(1, inst.route._line.total)));
      const alt = type === "air" ? altFor(inst.route, fr) : 0.00012;  // wakes lie on the water / ground
      const c = surfCoords(pts[i][0], pts[i][1], alt);
      tmp.a.set(c.x, c.y, c.z);
      if (prev) tmp.f.subVectors(prev, tmp.a); else { const c2 = surfCoords(pts[1][0], pts[1][1], alt); tmp.f.set(c.x - c2.x, c.y - c2.y, c.z - c2.z); }
      tmp.n.copy(tmp.a).normalize();
      tmp.x.crossVectors(tmp.n, tmp.f).normalize();
      const u = i / (N - 1);
      const w = WATER.has(type) ? w0 * (0.35 + 1.4 * Math.sqrt(u)) : w0 * (1 - 0.6 * u);
      pos[i * 6] = tmp.a.x + tmp.x.x * w; pos[i * 6 + 1] = tmp.a.y + tmp.x.y * w; pos[i * 6 + 2] = tmp.a.z + tmp.x.z * w;
      pos[i * 6 + 3] = tmp.a.x - tmp.x.x * w; pos[i * 6 + 4] = tmp.a.y - tmp.x.y * w; pos[i * 6 + 5] = tmp.a.z - tmp.x.z * w;
      prev = prev || new THREE.Vector3(); prev.copy(tmp.a);
    }
    l.wake.geometry.attributes.position.needsUpdate = true;
  }

  // ---------- planet dressing ----------
  function updatePlanet() {
    const cam = globe.camera();
    const c = tmp.a.copy(cam.position).normalize();
    const up = tmp.b.set(0, 1, 0);
    const right = tmp.x.crossVectors(up, c).normalize();
    const ang = st.sunAng == null ? 1.05 : st.sunAng;
    const sun = tmp.n.copy(c).multiplyScalar(Math.cos(ang)).addScaledVector(right, Math.sin(ang)).addScaledVector(up, 0.28).normalize();
    earthMat.uniforms.sunDir.value.copy(sun);
    earthMat.uniforms.time.value = st.now;
    sunLight.position.copy(sun).multiplyScalar(1000);
    if (window.__sunObj) window.__sunObj.place(sun, cam);
    const y = st.t;
    const lights = y < 1880 ? 0 : Math.min(1, Math.pow((y - 1880) / 130, 1.4));
    earthMat.uniforms.nightAmount.value = st.forceNight != null ? st.forceNight : (st.layers.night ? lights : 0);
    const ma = st.now * 0.02 + 2.2;
    moon.position.set(Math.cos(ma) * 430, 110 + Math.sin(ma * 0.7) * 30, Math.sin(ma) * 430);
    moon.rotation.y = -ma;
    sats.visible = st.layers.sats && y >= 1957.75;
    sats.visible = sats.visible || st.satOverride != null;
    if (sats.visible) sats.userData.update(st.now * 0.5, st.satOverride != null ? st.satOverride : SeaPlanet.satelliteCount(y, lite ? 120 : 420));
    // the first few satellites are drawn as detailed models (decorative), the rest stay as points
    if (!satModels) { satModels = []; for (let i = 0; i < 10; i++) { const m = SeaVehicles.build("satellite"); m.visible = false; scene3.add(m); satModels.push(m); } }
    const sp = sats.geometry.attributes.position.array, sn = sats.geometry.drawRange.count;
    const ssc = 0.5 * vehicleScale(globe.pointOfView().altitude);
    satModels.forEach((m, i) => {
      m.visible = sats.visible && i < sn;
      if (!m.visible) return;
      m.position.set(sp[i * 3], sp[i * 3 + 1], sp[i * 3 + 2]); m.lookAt(0, 0, 0); m.rotateX(Math.PI / 2); m.scale.setScalar(ssc);
    });
    stars.position.copy(cam.position).multiplyScalar(0); // fixed at origin, huge radius
  }

  // ---------- camera ----------
  const ease = (f) => f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
  function flyTo(pov, dur, bump) {
    const from = globe.pointOfView();
    let dl = ((pov.lng - from.lng + 540) % 360) - 180;
    st.fly = { from, to: { lat: pov.lat, lng: from.lng + dl, altitude: pov.altitude }, t: 0, dur: dur || 2.5, bump: bump == null ? Math.min(1.2, Math.abs(dl) / 120 + Math.abs(pov.lat - from.lat) / 120) : bump };
    st.orbitPaused = true;
  }
  function updateCamera(dt) {
    if (st.fly) {
      const F = st.fly; F.t += dt;
      const f = ease(Math.min(1, F.t / F.dur));
      const pov = { lat: F.from.lat + (F.to.lat - F.from.lat) * f, lng: F.from.lng + (F.to.lng - F.from.lng) * f,
        altitude: F.from.altitude + (F.to.altitude - F.from.altitude) * f + F.bump * Math.sin(Math.PI * f) };
      globe.pointOfView(pov, 0);
      if (F.t >= F.dur) st.fly = null;
      return;
    }
    const ctl = globe.controls();
    if (st.follow && st.selected && live.has(st.selected.key)) {
      // Chase camera: behind and above the vehicle, looking at it (tilted, not top-down).
      const l = live.get(st.selected.key);
      const sc = l.obj.scale.x;
      const n = tmp.n.copy(l.obj.position).normalize();
      const fwd = tmp.f.set(0, 0, 1).applyQuaternion(l.obj.quaternion);
      fwd.addScaledVector(n, -fwd.dot(n)).normalize();
      const dist = (st.followDist || 3.0) * sc;
      const swing = st.followSwing == null ? 0.0 : st.followSwing;
      if (st.swingA == null) st.swingA = st.followAngle == null ? 0.65 : st.followAngle;
      st.swingA += dt * swing;
      const back = fwd.clone().multiplyScalar(-Math.cos(st.swingA)).add(tmp.x.crossVectors(n, fwd).multiplyScalar(Math.sin(st.swingA)));
      const want = l.obj.position.clone().addScaledVector(back, dist).addScaledVector(n, dist * (st.followPitch || 0.38));
      const look = l.obj.position.clone().addScaledVector(n, sc * 0.25);
      const k = st.followSnap ? 1 : 1 - Math.exp(-dt * 2.4);
      st.followSnap = false;
      const cam = globe.camera();
      if (!st.chasing) { st.chasing = true; ctl.enabled = false; ctl.minDistance = 0.001; st.chaseLook = ctl.target.clone(); }
      cam.position.lerp(want, k);
      st.chaseLook.lerp(look, k);
      ctl.target.copy(st.chaseLook);
      cam.up.lerp(n, k).normalize();
      cam.lookAt(st.chaseLook);
      return;
    }
    if (st.chasing) {
      st.chasing = false; ctl.enabled = true; ctl.minDistance = R * 1.06; ctl.target.set(0, 0, 0); globe.camera().up.set(0, 1, 0);
      const pv = globe.pointOfView(); globe.pointOfView({ lat: pv.lat, lng: pv.lng, altitude: Math.max(pv.altitude, 0.25) }, 0);
    }
    if (st.orbit) {
      const cur = globe.pointOfView();
      globe.pointOfView({ lat: cur.lat + (st.orbitLat == null ? 0 : (st.orbitLat - cur.lat) * 0.01), lng: cur.lng + dt * (st.orbitSpeed || 3) * st.slow, altitude: cur.altitude }, 0);
    }
  }

  // ---------- selection & detail ----------
  function select(key) {
    const l = live.get(key);
    if (!l) { st.selected = null; renderDetail(); return; }
    st.selected = l.inst;
    switchTab("voyage");
    renderDetail();
    refreshRoutes();
  }
  function renderDetail() {
    const inst = st.selected;
    $("detail").hidden = !inst; $("voyageEmpty").hidden = !!inst;
    if (!inst) return;
    const r = inst.route;
    $("dVehicle").textContent = vehicleName(r.vehicle) + " · " + r.type;
    $("dShip").textContent = inst.ship || vehicleName(r.vehicle);
    $("dRoute").textContent = r.name;
    const pills = [];
    pills.push(r.reconstruction ? "<span class='pill recon'>Reconstruction</span>" : "<span class='pill log'>Logbook record</span>");
    if (V.isPre1500(r)) pills.push("<span class='pill recon'>Pre-1500 · reconstructed</span>");
    pills.push(inst.timing === "dated" ? "<span class='pill log'>Real dates</span>" : "<span class='pill recon'>Reconstructed timing</span>");
    pills.push("<span class='pill conf'>Confidence: " + esc(r.confidence_level) + "</span>");
    if (r.citation_check) pills.push("<span class='pill seed'>Seed · check citation</span>");
    $("dPills").innerHTML = pills.join("");
    $("dYears").textContent = inst.timing === "dated" ? T.dateLabel(inst.t0) + " → " + T.dateLabel(inst.t1) : "Route active " + yearsText(r) + (inst.year != null ? " · sailing of " + T.yearLabel(inst.year) : "");
    $("dTiming").textContent = V.timingLabel(inst) + (inst.record && inst.timing === "dated" ? " · " + inst.record : "");
    $("dGoods").textContent = (r.goods && r.goods.length ? r.goods.join(", ") : "—") + (r.goods_source ? " (" + r.goods_source + ")" : "");
    $("dSource").textContent = r.source;
    // v2.2: history, story, facts for the route, the named vessel and the vehicle type, in the existing notes/cite lines
    const c = cardContent(r, inst);
    $("dNotes").innerHTML = c.html;
    window.dispatchEvent(new CustomEvent("seaglobe:detail", { detail: { route: r, inst } }));
    $("dCite").textContent = c.cites.join(" · ");
    const ids = (D.deeper_by_line || {})[r.line] || [];
    const links = ids.map((id) => (D.deeper || []).find((x) => x.id === id)).filter(Boolean);
    $("dDeeper").hidden = !links.length;
    $("dDeeper").innerHTML = links.length ? "Go deeper: " + links.map((x) => "<a href='" + esc(x.url) + "' target='_blank' rel='noopener noreferrer'>" + esc(x.name) + "</a>").join(" · ") : "";
    $("followBtn").setAttribute("aria-pressed", String(st.follow));
  }
  function cardContent(r, inst) {
    const sec = (label, txt) => (txt ? "<b>" + esc(label) + ".</b> " + esc(txt) : "");
    const facts = (f) => (f ? Object.keys(f).map((k) => k + ": " + f[k]).join(" · ") : "");
    const vi = (D.vehicle_info || {})[r.vehicle];
    const ves = inst.voyage && inst.voyage.vessel;
    const parts = [esc(r.notes), sec("History", r.history), sec("Story", r.story), sec("Key facts", facts(r.facts))];
    if (ves) parts.push(sec("The " + (r.type === "air" ? "aircraft" : "ship") + ": " + ves.name, ves.history + " " + ves.story), sec("Ship facts", facts(ves.facts)));
    if (vi) parts.push(sec("About the " + vehicleName(r.vehicle).toLowerCase(), vi.history + " " + vi.story));
    const cites = [...new Set([].concat(r.citations || [r.citation], r.content_citations || [], ves ? ves.content_citations : [], vi ? vi.content_citations : []))];
    return { html: parts.filter(Boolean).join("<br><br>"), cites };
  }
  function updateProgress() {
    if (!st.selected) return;
    const l = live.get(st.selected.key);
    const s = V.stateAt(st.selected, l && l.t != null ? l.t : st.t);
    $("dBar").style.width = (s.frac * 100).toFixed(1) + "%";
  }
  function setFollow(on) {
    st.follow = !!on; st.fly = null;
    if (on) st.orbit = false;
    $("followBtn").setAttribute("aria-pressed", String(st.follow));
  }

  // ---------- selectability assist ----------
  const sp = { a: new THREE.Vector3(), b: new THREE.Vector3() };
  function projPx(v, cam) { v.project(cam); return v.z > 1 ? null : { x: (v.x + 1) / 2 * window.innerWidth, y: (1 - v.y) / 2 * window.innerHeight }; }
  // on-screen speed of every vehicle in pixels per year of its own clock (camera held still)
  function measureSpeeds() {
    const cam = globe.camera(); let worst = 0;
    for (const l of live.values()) {
      const t = l.t != null ? l.t : st.t, pos = l.obj.position;
      if (l._pp && t !== l._pt && l._pp.angleTo(pos) < 0.05) {
        const a = projPx(sp.a.copy(l._pp), cam), b = projPx(sp.b.copy(pos), cam);
        const seen = l.obj.visible && screenOf(l);
        if (a && b && seen) {
          const v = Math.hypot(a.x - b.x, a.y - b.y) / Math.abs(t - l._pt);
          l._pxy = l._pxy ? l._pxy * 0.6 + v * 0.4 : v;
          worst = Math.max(worst, l._pxy);
        }
      }
      if (!l._pp) l._pp = new THREE.Vector3();
      l._pp.copy(pos); l._pt = t;
    }
    // timeline: one clock for all, so the fastest on-screen vehicle sets the cap
    const yps = st.speed * DAYS_PER_SEC / T.DAYS;
    const g = worst > 0 ? Math.min(1, MAX_PX_PER_SEC / (worst * yps)) : 1;
    st.govern = st.govern + (g - st.govern) * (g < st.govern ? 0.5 : 0.08);
  }
  function nearestPx() {
    if (!st.ptr || st.ptr.drag) return Infinity;
    let d = Infinity;
    for (const l of live.values()) { if (!l.obj.visible) continue; const p = screenOf(l); if (p) d = Math.min(d, Math.hypot(p.x - st.ptr.x, p.y - st.ptr.y)); }
    return d;
  }
  // ease the clock toward a stop as the pointer closes on a vehicle; resume gently when it leaves
  function updateAssist(dt) {
    const d = nearestPx();
    const target = d <= HIT_HOVER ? 0 : d >= SLOW_NEAR ? 1 : Math.pow((d - HIT_HOVER) / (SLOW_NEAR - HIT_HOVER), 1.5);
    st.slow += (target - st.slow) * (1 - Math.exp(-dt * (target < st.slow ? 14 : 2.5)));
    if (target === 0 && st.slow < 0.01) st.slow = 0;
  }

  // ---------- picking ----------
  function screenOf(l) {
    const cam = globe.camera();
    tmp.b.copy(l.obj.position);
    const facing = tmp.b.clone().normalize().dot(tmp.a.copy(cam.position).normalize());
    if (facing < 0.08) return null;
    tmp.b.project(cam);
    if (tmp.b.z > 1) return null;
    return { x: (tmp.b.x + 1) / 2 * window.innerWidth, y: (1 - tmp.b.y) / 2 * window.innerHeight };
  }
  function pick(x, y, radius) {
    let best = null, bd = radius || 28;
    for (const l of live.values()) {
      const p = screenOf(l); if (!p) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = l; }
    }
    return best;
  }
  function wirePicking() {
    const el = $("globe"); let down = null;
    el.addEventListener("pointerdown", (e) => {
      down = { x: e.clientX, y: e.clientY };
      // touch has no hover: brake the clock under the finger while it is down, so a tap lands on a slow target
      if (e.pointerType === "touch") st.ptr = { x: e.clientX, y: e.clientY, drag: false };
    });
    el.addEventListener("pointerup", (e) => {
      if (e.pointerType === "touch") st.ptr = null;
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      let l = pick(e.clientX, e.clientY, e.pointerType === "touch" ? HIT_TOUCH : HIT_CLICK);
      // sticky: a vehicle hovered a moment ago still counts if it slipped out from under the pointer
      if (!l && st.hoverKey && st.now - st.hoverAt < STICKY_SEC && live.has(st.hoverKey)) l = live.get(st.hoverKey);
      if (l) select(l.inst.key);
    });
    el.addEventListener("pointermove", (e) => {
      st.ptr = { x: e.clientX, y: e.clientY, drag: !!e.buttons };
      if (e.buttons) return;
      const l = pick(e.clientX, e.clientY, HIT_HOVER);
      if (l) { st.hoverKey = l.inst.key; st.hoverAt = st.now; }
      el.style.cursor = l ? "pointer" : "";
      tip(l ? "<b>" + esc(l.inst.ship || vehicleName(l.inst.route.vehicle)) + "</b><div>" + esc(l.inst.route.name) + "</div><div class='src'>" + esc(V.timingLabel(l.inst)) + "</div>" : null, e);
    });
    el.addEventListener("pointerleave", () => { st.ptr = null; });
    window.addEventListener("blur", () => { st.ptr = null; });
    el.addEventListener("pointerdown", () => { if (!capture) { st.fly = null; st.orbitIdleUntil = st.now + 10; if (st.orbit) st.orbitPaused = true; } });
  }
  function tip(html, e) {
    const t = $("tooltip");
    if (!html) { t.hidden = true; return; }
    t.innerHTML = html; t.hidden = false;
    if (e) { const u = uiScale(); t.style.left = Math.min(window.innerWidth - 340 * u, e.clientX + 14 * u) + "px"; t.style.top = Math.min(window.innerHeight - 120 * u, e.clientY + 14 * u) + "px"; }
  }

  // ---------- UI ----------
  function switchTab(name) {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".tabpane").forEach((p) => { p.hidden = p.dataset.pane !== name; });
  }
  function setSpeed(x) {
    st.speed = x;
    document.querySelectorAll("[data-speed]").forEach((b) => b.classList.toggle("active", parseFloat(b.dataset.speed) === x));
  }
  function setPlaying(on) { st.playing = !!on; $("playBtn").textContent = st.playing ? "❚❚" : "▶"; $("playBtn").setAttribute("aria-label", st.playing ? "Pause" : "Play"); }
  function setTime(t) {
    st.t = Math.max(S.timeline.min, Math.min(S.timeline.max + 0.999, t));
    if (st.mode === "timeline" && st.focus.era) { const e = eraById(st.focus.era); if (st.t < e.from - 0.5 || st.t > e.to + 1.5) { st.focus.era = null; syncFocusUI(); } }
    if (st.mode === "timeline" && st.selected && !V.activeOn(st.selected.route, st.t).some((i) => i.key === st.selected.key)) { st.selected = null; renderDetail(); }
  }
  let cardTimer = null;
  function eraCard(e, force) {
    if (!e.card || (capture && !force)) return;
    const c = $("card");
    c.innerHTML = "<div class='eracard'><img src='" + esc(e.card) + "' alt=''><div class='ec-t'><div class='kicker'>" + esc(T.yearLabel(e.from)) + " – " + esc(T.yearLabel(e.to)) + "</div><h2>" + esc(e.name) + "</h2>" + (e.card_note ? "<div class='ec-n'>" + esc(e.card_note) + "</div>" : "") + "</div></div>";
    c.style.background = "transparent"; c.hidden = false; c.style.opacity = "1";
    clearTimeout(cardTimer);
    if (force) return;
    cardTimer = setTimeout(() => { c.style.opacity = "0"; setTimeout(() => { c.hidden = true; c.style.opacity = "1"; }, 800); }, 1700);
  }
  function goEra(id, opts) {
    const e = S.eras.find((x) => x.id === id); if (!e) return;
    enterTimeline(); st.focus.era = id; syncFocusUI();
    if (!opts || opts.card !== false) eraCard(e);
    setTime(T.parse(e.showcase));
    if (!opts || opts.fly !== false) flyTo(e.camera, (opts && opts.dur) || 3.2);
    refreshRoutes();
  }
  function buildUI() {
    const span = S.timeline.max + 1 - S.timeline.min;
    $("bands").innerHTML = S.eras.map((e) => "<div data-style='width:" + ((e.to + 1 - e.from) / span * 100) + "%;background:" + e.color + "'>" + esc(e.name) + "</div>").join("");
    const ticks = [-399, -199, 1, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 1950];
    $("ticks").innerHTML = ticks.map((y) => "<span data-style='left:" + ((y - S.timeline.min) / span * 100) + "%'>" + esc(T.yearLabel(y)) + "</span>").join("");
    const counts = {}; prepared.forEach((r) => { counts[r.era] = (counts[r.era] || 0) + 1; });
    $("eraChips").innerHTML = S.eras.map((e) => "<button class='btn" + (counts[e.id] ? "" : " empty-era") + "' data-era='" + e.id + "' title='" + esc(e.name + (e.subtitle ? " (" + e.subtitle + ")" : "")) + "'><span class='sw' data-style='background:" + e.color + "'></span>" + esc(e.name) + "</button>").join("");
    $("eraChips").addEventListener("click", (ev) => { const b = ev.target.closest("[data-era]"); if (b) goEra(b.dataset.era); });
    document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
    document.querySelectorAll("[data-speed]").forEach((b) => b.addEventListener("click", () => setSpeed(parseFloat(b.dataset.speed))));
    $("playBtn").addEventListener("click", () => { if (st.mode === "idle") { enterTimeline(); setPlaying(true); } else setPlaying(!st.playing); });
    $("scrubber").addEventListener("input", (e) => { enterTimeline(); setTime(parseFloat(e.target.value)); refreshRoutes(); });
    $("followBtn").addEventListener("click", () => setFollow(!st.follow));
    $("clearBtn").addEventListener("click", () => { st.selected = null; setFollow(false); renderDetail(); refreshRoutes(); });
    if (window.SeaWindows && SeaWindows.layerPref) {
      const pref = SeaWindows.layerPref("ships");
      if (pref === false || pref === true) {
        st.layers.ships = pref;
        const cb = $("tShips"); if (cb) cb.checked = pref;
      }
    }
    const lay = { tRoutes: "routes", tWakes: "wakes", tWind: "wind", tNight: "night", tSats: "sats", tShips: "ships" };
    for (const [id, k] of Object.entries(lay)) $(id).addEventListener("change", (e) => {
      if (window.SeaLayers && !SeaLayers.request(k, e.target.checked)) { e.target.checked = false; return; }
      st.layers[k] = e.target.checked;
      if (k === "ships" && window.SeaWindows && SeaWindows.layerPref) SeaWindows.layerPref("ships", e.target.checked);
      refreshRoutes(); placeVehicles(0);
    });
    $("tOrbit").addEventListener("change", (e) => { st.orbit = e.target.checked; st.orbitPaused = false; if (st.orbit) setFollow(false); });
    const types = {}; prepared.forEach((r) => { types[r.line] = types[r.line] || r.color; });
    $("legend").innerHTML = Object.entries(types).map(([k, c]) => "<div><i data-style='background:" + c + "'></i>" + esc(k) + "</div>").join("");
    $("deeperList").innerHTML = (D.deeper || []).map((x) => "<li><a href='" + esc(x.url) + "' target='_blank' rel='noopener noreferrer'>" + esc(x.name) + " ↗</a><div class='dd'>" + esc(x.desc) + "</div><div class='dc'>Credit: " + esc(x.credit) + "</div></li>").join("");
    $("liteBadge").hidden = !lite;
    setSpeed(st.speed); setPlaying(st.playing);
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || (e.target.closest && e.target.closest("#logList"))) return;
      if (e.code === "Space") { setPlaying(!st.playing); e.preventDefault(); }
      if (e.key === "c") document.body.classList.toggle("cinema");
      if (e.key === "f") setFollow(!st.follow);
      if (e.key === "l" || e.key === "L") { toggleLog(); e.preventDefault(); }
      if (e.key === "/") { toggleLog(true); e.preventDefault(); }
      if (e.key === "Escape") { if (!$("log").hidden) toggleLog(false); else if (focusActive()) clearFocus(); }
    });
  }
  function updateClock() {
    const e = eraOf(st.t);
    $("eraName").textContent = e.name + (e.subtitle ? " · " + e.subtitle : "");
    if (st.mode === "idle") { $("eraName").textContent = "Sampler · vessels from every era"; $("dateLabel").textContent = "500 BCE – today"; return; }
    $("dateLabel").textContent = T.dateLabel(st.t);
    const sc = $("scrubber"); if (document.activeElement !== sc) sc.value = String(st.t);
  }

  // ---------- loop ----------
  function step(dt) {
    st.now += dt;
    if (st.mode === "idle") updateIdle(dt);
    else if (st.playing) setTime(st.t + dt * st.speed * DAYS_PER_SEC / T.DAYS * st.slow * st.govern);
    const y = Math.floor(st.t * 4);
    if (y !== st.lastYear) { st.lastYear = y; refreshRoutes(); }
    updateCamera(dt);
    placeVehicles(dt);
    measureSpeeds();
    updateAssist(dt);
    updatePlanet();
    updateClock();
    updateProgress();
    updateLabels();
    for (const h of FRAME_HOOKS) { try { h(dt, st.t); } catch (e) { console.error(e); FRAME_HOOKS.splice(FRAME_HOOKS.indexOf(h), 1); } }
  }
  const FRAME_HOOKS = [];
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!capture) step(dt);
    requestAnimationFrame(loop);
  }

  // ---------- idle sampler ----------
  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function startInstance(r, seed) {
    // find an instance of route r near its departure, somewhere inside the route's active span
    const span = Math.max(0.05, r._t1 - r._t0);
    for (let tries = 0; tries < 6; tries++) {
      let t = r._t0 + hash(seed + tries * 7.3) * Math.max(0, span - 1);
      for (let d = 0; d < 1460; d += 2) {
        const tt = t + d / T.DAYS;
        if (tt > r._t1) break;
        const list = V.activeOn(r, tt);
        if (list.length) {
          let best = null, bf = 2;
          for (const inst of list) { const f = V.stateAt(inst, tt).frac; if (f < bf) { bf = f; best = inst; } }
          if (best && bf < 0.25) return { inst: best, t: tt };
        }
      }
    }
    return null;
  }
  function newSlot() {
    const used = new Set(st.slots.map((x) => x.route.id)), usedV = new Set(st.slots.map((x) => x.route.vehicle));
    const pool = IDLE_POOL.map((id) => prepared.find((r) => r.id === id)).filter((r) => r && (!focusActive() || matches(r)));
    for (let k = 0; k < pool.length; k++) {
      const r = pool[(st.idleSeq++) % pool.length];
      if (used.has(r.id) || (usedV.has(r.vehicle) && k < pool.length / 2)) continue;
      const si = startInstance(r, st.idleSeq * 13.7);
      if (!si) continue;
      const dur = Math.max(1 / T.DAYS, si.inst.t1 - si.inst.t0);
      return { route: r, inst: si.inst, t: si.t, rate: dur / (22 + hash(st.idleSeq) * 16), a: 0, phase: "in", key: si.inst.key };
    }
    return null;
  }
  function fillSlots() {
    let guard = 0;
    while (st.slots.length < IDLE_N && guard++ < IDLE_N * 2) { const x = newSlot(); if (!x) break; st.slots.push(x); }
    refreshRoutes();
  }
  function updateIdle(dt) {
    if (!st.slots.length) fillSlots();
    let changed = false;
    for (const x of st.slots) {
      const l = live.get(x.key), cap = l && l._pxy ? MAX_PX_PER_SEC / (l._pxy * x.rate) : 1;
      x.t += dt * x.rate * st.slow * Math.min(1, cap);
      if (x.phase === "in") { x.a = Math.min(1, x.a + dt / 1.2); if (x.a >= 1) x.phase = "run"; }
      if (x.phase === "out") x.a = Math.max(0, x.a - dt / 1.2);
      if (x.phase !== "out" && V.stateAt(x.inst, x.t).frac > 0.96) x.phase = "out";
    }
    // rotate one vessel every few seconds
    if (st.now - st.lastSwap > 3.5) {
      st.lastSwap = st.now;
      const run = st.slots.filter((x) => x.phase === "run" && (!st.selected || st.selected.key !== x.key));
      if (run.length) { run.sort((a, b) => V.stateAt(b.inst, b.t).frac - V.stateAt(a.inst, a.t).frac); run[0].phase = "out"; }
    }
    const before = st.slots.length;
    st.slots = st.slots.filter((x) => !(x.phase === "out" && x.a <= 0 && (!st.selected || st.selected.key !== x.key)));
    if (st.slots.length !== before) changed = true;
    while (st.slots.length < IDLE_N) { const x = newSlot(); if (!x) break; st.slots.push(x); changed = true; }
    if (changed) refreshRoutes();
    if (!capture && !st.follow && !st.fly && st.now > st.orbitIdleUntil) {
      const cur = globe.pointOfView();
      globe.pointOfView({ lat: cur.lat + (18 - cur.lat) * 0.002, lng: cur.lng + dt * 2.2 * st.slow, altitude: cur.altitude }, 0);
    }
  }
  function enterTimeline() {
    if (st.mode === "timeline") return;
    st.mode = "timeline"; st.slots = [];
    if (st.selected) { st.selected = null; renderDetail(); }
    document.body.classList.remove("idle");
    $("modeBtn").setAttribute("aria-pressed", "false");
    refreshRoutes();
  }
  function enterIdle() {
    st.mode = "idle"; st.focus = {}; st.selected = null; setFollow(false); renderDetail();
    document.body.classList.add("idle");
    $("modeBtn").setAttribute("aria-pressed", "true");
    syncFocusUI(); fillSlots(); refreshRoutes(); renderLog();
  }

  // ---------- focus chip, legend, labels ----------
  function syncFocusUI() {
    const f = st.focus, parts = [];
    if (f.routeId) { const r = prepared.find((x) => x.id === f.routeId); parts.push(r ? r.name : f.routeId); }
    if (f.era) parts.push(eraById(f.era).name);
    if (f.type) parts.push(f.type); if (f.family) parts.push(f.family); if (f.region) parts.push(f.region);
    if (f.goods) parts.push(f.goods); if (f.evidence) parts.push(f.evidence); if (f.q) parts.push("“" + f.q + "”");
    const chip = $("focusChip");
    chip.hidden = !parts.length;
    $("focusText").textContent = parts.join(" · ");
    document.querySelectorAll("[data-era]").forEach((b) => b.classList.toggle("active", b.dataset.era === f.era));
    document.body.classList.toggle("focused", !!parts.length);
  }
  function clearFocus() { st.focus = {}; const L = $("logFilters"); if (L) L.querySelectorAll("select").forEach((x) => { x.value = ""; }); if ($("logQ")) $("logQ").value = ""; syncFocusUI(); refreshRoutes(); renderLog(); if (window.SeaLayers && SeaLayers.reapply) SeaLayers.reapply(); }
  function renderLegend(vis) {
    const el = $("legendFloat"); if (!el) return;
    const fams = new Map();
    vis.forEach((r) => { if (r._match === false) return; if (!fams.has(r.family)) fams.set(r.family, { c: colorOf(r), n: 0, title: (D["routes:" + r.family] || {}).title || r.family }); fams.get(r.family).n++; });
    const list = [...fams.values()].sort((a, b) => b.n - a.n).slice(0, 9);
    el.hidden = !list.length || st.allGold;
    el.innerHTML = "<div class='kicker'>" + (focusActive() ? "In focus" : st.mode === "idle" ? "Sampler" : "On the globe") + "</div>" +
      list.map((x) => "<div class='lg'><i data-style='background:" + esc(x.c) + "'></i>" + esc(x.title) + "</div>").join("") + (fams.size > 9 ? "<div class='lg more'>+" + (fams.size - 9) + " more families</div>" : "");
  }
  const labelEls = [];
  function updateLabels() {
    const layer = $("labels"); if (!layer) return;
    let want = [];
    if (!st.chasing && !st.allGold && !document.body.classList.contains("cinema")) {
      const alt = globe.pointOfView().altitude;
      const max = alt > 2.2 ? 5 : alt > 1.2 ? 10 : 22;     // level of detail: fewer labels when zoomed out
      const cand = [];
      for (const l of live.values()) {
        if (l.match === false || !l.obj.visible) continue;
        const p = screenOf(l); if (!p) continue;
        const sel = st.selected && st.selected.key === l.inst.key;
        const pri = sel ? -1 : l.inst.timing === "dated" ? 0 : l.inst.timing === "years" ? 1 : 2;
        cand.push({ l, p, pri, sel });
      }
      cand.sort((a, b) => a.pri - b.pri || (a.l.inst.key < b.l.inst.key ? -1 : 1));
      const placed = [];
      for (const c of cand) {
        if (want.length >= max && !c.sel) continue;
        if (!c.sel && placed.some((q) => Math.abs(q.x - c.p.x) < 120 * uiK && Math.abs(q.y - c.p.y) < 22 * uiK)) continue;   // spacing grows with the UI scale so big-screen labels never overlap
        placed.push(c.p); want.push(c);
      }
    }
    while (labelEls.length < want.length) { const d = document.createElement("div"); d.className = "vlabel"; layer.appendChild(d); labelEls.push(d); }
    labelEls.forEach((d, i) => {
      const c = want[i];
      if (!c) { d.hidden = true; return; }
      const inst = c.l.inst, y = c.l.t != null ? c.l.t : st.t;
      const txt = (inst.ship || vehicleName(inst.route.vehicle)) + " · " + T.yearLabel(Math.floor(y));
      if (d.textContent !== txt) d.textContent = txt;
      d.hidden = false; d.classList.toggle("sel", c.sel);
      d.style.transform = "translate(" + Math.round(c.p.x + 12 * uiK) + "px," + Math.round(c.p.y - 9 * uiK) + "px)";
    });
  }

  // ---------- Ship's Log ----------
  const LOG = { rows: [], sel: -1 };
  function buildLog() {
    const f = $("logFilters");
    const opt = (id, label, vals) => "<label><span>" + label + "</span><select id='" + id + "'><option value=''>All</option>" + vals.map(([v, n]) => "<option value='" + esc(v) + "'>" + esc(n) + "</option>").join("") + "</select></label>";
    const uniq = (fn) => [...new Set(prepared.map(fn).filter(Boolean))].sort();
    f.innerHTML = opt("logEra", "Era", S.eras.map((e) => [e.id, e.name])) +
      opt("logType", "Type", uniq((r) => r.type).map((x) => [x, x])) +
      opt("logGoods", "Goods", GOODS.map(([n]) => [n, n]).filter(([n]) => prepared.some((r) => goodsCats(r).includes(n)))) +
      opt("logRegion", "Region", uniq((r) => r.region).map((x) => [x, x])) +
      opt("logEvidence", "Evidence", [["dataset", "Dataset-derived"], ["dated", "Real dates"], ["reconstruction", "Reconstruction"]]) +
      "<label><span>Sort</span><select id='logSort'><option value='date'>Date ↑</option><option value='date-desc'>Date ↓</option><option value='name'>Name</option></select></label>";
    const map = { logEra: "era", logType: "type", logGoods: "goods", logRegion: "region", logEvidence: "evidence" };
    Object.keys(map).forEach((id) => $(id).addEventListener("change", (e) => { setFocusField(map[id], e.target.value || null); }));
    $("logSort").addEventListener("change", renderLog);
    let qt = null;
    $("logQ").addEventListener("input", (e) => { clearTimeout(qt); qt = setTimeout(() => setFocusField("q", e.target.value.trim() || null), 120); });
    $("logQ").addEventListener("keydown", (e) => { if (e.key === "ArrowDown") { e.preventDefault(); moveLog(0, true); } if (e.key === "Escape") toggleLog(false); });
    $("logList").addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); moveLog(LOG.sel + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (LOG.sel <= 0) $("logQ").focus(); else moveLog(LOG.sel - 1); }
      else if (e.key === "Home") { e.preventDefault(); moveLog(0); }
      else if (e.key === "End") { e.preventDefault(); moveLog(LOG.rows.length - 1); }
      else if (e.key === "PageDown") { e.preventDefault(); moveLog(LOG.sel + 8); }
      else if (e.key === "PageUp") { e.preventDefault(); moveLog(LOG.sel - 8); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (LOG.rows[LOG.sel]) openRoute(LOG.rows[LOG.sel]); }
      else if (e.key === "Escape") toggleLog(false);
    });
    $("logList").addEventListener("click", (e) => { const li = e.target.closest("[data-i]"); if (li) { moveLog(+li.dataset.i, true); openRoute(LOG.rows[+li.dataset.i]); } });
    $("logCsv").addEventListener("click", exportCsv);
    $("logClose").addEventListener("click", () => toggleLog(false));
    $("logBtn").addEventListener("click", () => toggleLog());
  }
  function setFocusField(k, v) {
    if (k !== "routeId") st.focus.routeId = null;
    st.focus[k] = v;
    if (k === "era" && v) { if (st.mode === "idle") enterTimeline(); const e = eraById(v); if (st.t < e.from || st.t > e.to + 1) { setTime(T.parse(e.showcase)); flyTo(e.camera, 2.6); } }
    if (st.mode === "idle") { st.slots.forEach((x) => { if (focusActive() && !matches(x.route)) x.phase = "out"; }); }
    syncFocusUI(); refreshRoutes(); renderLog();
    if (window.SeaLayers && SeaLayers.reapply) SeaLayers.reapply();
  }
  function logRows() {
    const f = Object.assign({}, st.focus, { routeId: null });
    const rows = prepared.filter((r) => matches(r, f));
    const so = $("logSort") ? $("logSort").value : "date";
    rows.sort(so === "name" ? (a, b) => a.name.localeCompare(b.name) : so === "date-desc" ? (a, b) => b._t0 - a._t0 || a.name.localeCompare(b.name) : (a, b) => a._t0 - b._t0 || a.name.localeCompare(b.name));
    return rows;
  }
  function renderLog() {
    const ul = $("logList"); if (!ul || $("log").hidden) return;
    LOG.rows = logRows();
    $("logCount").textContent = LOG.rows.length + " of " + prepared.length + " records";
    ul.innerHTML = LOG.rows.map((r, i) => {
      const ev = evidenceOf(r);
      return "<li role='option' id='log-" + i + "' data-i='" + i + "' aria-selected='" + (i === LOG.sel) + "'" + (st.focus.routeId === r.id ? " class='on'" : "") + ">" +
        "<div class='lt'><span class='dot' data-style='background:" + esc(colorOf(r)) + "'></span><b>" + esc(r.name) + "</b></div>" +
        "<div class='lm'>" + esc(yearsText(r)) + " · " + esc(r.type) + " · " + esc(vehicleName(r.vehicle)) + "</div>" +
        "<div class='lm'>Goods: " + esc(r.goods && r.goods.length ? r.goods.join(", ") : "[UNKNOWN]") + "</div>" +
        "<div class='lp'><span class='pill " + (ev === "reconstruction" ? "recon" : "log") + "'>" + (ev === "dataset" ? "Dataset" : ev === "dated" ? "Real dates · reconstruction" : "Reconstruction") + "</span>" +
        "<span class='pill conf'>" + esc(r.confidence_level) + "</span><span class='pill reg'>" + esc(r.region) + "</span></div>" +
        "<div class='ls'>" + esc((r.citations || []).join(" · ")) + "</div></li>";
    }).join("");
    if (LOG.sel >= LOG.rows.length) LOG.sel = LOG.rows.length - 1;
  }
  function moveLog(i, focus) {
    if (!LOG.rows.length) return;
    LOG.sel = Math.max(0, Math.min(LOG.rows.length - 1, i));
    const ul = $("logList");
    ul.querySelectorAll("li").forEach((li) => li.setAttribute("aria-selected", String(+li.dataset.i === LOG.sel)));
    ul.setAttribute("aria-activedescendant", "log-" + LOG.sel);
    const li = $("log-" + LOG.sel); if (li) li.scrollIntoView({ block: "nearest" });
    if (focus !== false) ul.focus({ preventScroll: true });
  }
  function toggleLog(on) {
    const el = $("log"); const show = on == null ? el.hidden : on;
    el.hidden = !show; $("logBtn").setAttribute("aria-pressed", String(show));
    document.body.classList.toggle("log-open", show);
    if (show) { renderLog(); if (!capture) $("logQ").focus(); }
  }
  // Fly to a route, start one of its voyages at departure, play it and open its info.
  function openRoute(r) {
    enterTimeline();
    st.focus.routeId = r.id; syncFocusUI();
    const si = startInstance(r, 1) || startInstance(r, 2);
    if (!si) { const mid = r.path[Math.floor(r.path.length / 2)]; flyTo({ lat: mid[0], lng: mid[1], altitude: 1.4 }, 2.2); refreshRoutes(); return; }
    setTime(si.t + 0.5 / T.DAYS);
    st.pendingKey = si.inst.key;
    placeVehicles(0);
    select(si.inst.key);
    st.pendingKey = null;
    setFollow(false);
    const s = V.stateAt(si.inst, st.t);
    flyTo({ lat: s.lat, lng: s.lng, altitude: r.type === "air" ? 1.6 : 1.1 }, 2.4);
    setSpeed(1); setPlaying(true);
    refreshRoutes(); renderLog();
  }
  function exportCsv() {
    const cols = ["id", "name", "family", "type", "era", "region", "start_date", "end_date", "vehicle", "goods", "evidence", "reconstruction", "confidence_level", "timing", "citations", "history", "story", "content_citations"];
    const q = (v) => { const x = String(v == null ? "" : v); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
    const lines = [cols.join(",")].concat(logRows().map((r) => [r.id, r.name, r.family, r.type, r.era, r.region, r.start_date, r.end_date, r.vehicle,
      (r.goods || []).join("; "), evidenceOf(r), r.reconstruction, r.confidence_level, r.schedule && r.schedule.kind, (r.citations || []).join(" | "), r.history, r.story, (r.content_citations || []).join(" | ")].map(q).join(",")));
    const blob = new Blob(["\ufeff" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "seaglobe-ships-log.csv";
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    window.__lastCsv = lines.join("\n");
  }

  // ---------- capture / scripting API ----------
  window.__sg = {
    // v3 framework hooks (layers, encyclopedia, tools): read-only access plus a per-frame callback list
    globe: () => globe, three: () => THREE, scene: () => scene3, prepared: () => prepared, edition: E, isLite: lite,
    onFrame: (fn) => { FRAME_HOOKS.push(fn); },
    openRouteId: (id) => { const r = prepared.find((x) => x.id === id); if (r) openRoute(r); return !!r; },
    timeNow: () => st.t,
    // for a live vehicle: lowest and highest point of its mesh relative to the drawn surface below it (units of R)
    waterline: (key) => {
      const l = live.get(key); if (!l) return null;
      l.obj.updateMatrixWorld(true);
      const bb = { lo: Infinity, hi: -Infinity }, v = new THREE.Vector3();
      const o = l.obj.position.clone().normalize(), ll = { r: l.obj.position.length() };
      const lat = Math.asin(o.y) * 180 / Math.PI; const c0 = globe.toGeoCoords(l.obj.position);
      const sr = Math.hypot(...Object.values(surfCoords(c0.lat, c0.lng, 0)));
      l.obj.traverse((m) => { if (!m.isMesh || m === l.halo || !m.geometry.attributes.position) return; const pa = m.geometry.attributes.position;
        for (let i = 0; i < pa.count; i += 3) { v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld); const h = v.length() - sr; bb.lo = Math.min(bb.lo, h); bb.hi = Math.max(bb.hi, h); } });
      return { originAboveSurface: (ll.r - sr), lo: bb.lo, hi: bb.hi, scale: l.obj.scale.x };
    },
    // max error of the vehicle/route surface model against a real raycast on the drawn globe mesh (units of R)
    surfCheck: (n) => {
      let mesh = null, worstVeh = 0, worstRoute = 0;
      globe.scene().traverse((o) => { if (!mesh && o.isMesh && o.material === earthMat) mesh = o; });
      mesh.updateMatrixWorld();
      // brute-force ray/triangle test on the drawn sphere's own triangles, in world space
      const pa = mesh.geometry.attributes.position, ix = mesh.geometry.index.array, P = [];
      for (let k = 0; k < pa.count; k++) P.push(new THREE.Vector3(pa.getX(k), pa.getY(k), pa.getZ(k)).applyMatrix4(mesh.matrixWorld));
      const ray = new THREE.Ray(), hitP = new THREE.Vector3();
      for (let i = 0; i < (n || 200); i++) {
        // sample points off the exact grid lines (a ray along a shared edge can slip between two triangles)
        const lat = -79.87 + 159.7 * ((i * 0.618034 + 0.0137) % 1), lng = -179.71 + 359.4 * ((i * 0.414214 + 0.0291) % 1);
        const c = globe.getCoords(lat, lng, 0);
        ray.set(new THREE.Vector3(0, 0, 0), new THREE.Vector3(c.x, c.y, c.z).normalize());
        let dist = null;
        for (let t = 0; t < ix.length && dist == null; t += 3) if (ray.intersectTriangle(P[ix[t]], P[ix[t + 1]], P[ix[t + 2]], false, hitP)) dist = hitP.length();
        if (dist == null) return { error: "no hit", lat, lng };
        const p = surfCoords(lat, lng, 0), rv = Math.hypot(p.x, p.y, p.z);
        worstVeh = Math.max(worstVeh, Math.abs(rv - dist) / R);
        worstRoute = Math.max(worstRoute, Math.abs((1 + facetAlt(lat, lng)) * R - dist) / R);
      }
      return { worstVeh, worstRoute };
    },
    advance: (dt) => step(dt),
    setTime: (s) => { setTime(typeof s === "number" ? s : T.parse(s)); refreshRoutes(); },
    play: setPlaying, setSpeed, goEra, flyTo: (pov, dur, bump) => flyTo(pov, dur, bump),
    select: (key) => select(key),
    selectFirst: (pred) => { for (const l of live.values()) if (!pred || pred(l.inst)) { select(l.inst.key); return l.inst.key; } return null; },
    follow: (on, dist, pitch, swing, angle) => { st.followDist = dist; st.followPitch = pitch; st.followSwing = swing; st.followAngle = angle; st.swingA = null; st.followSnap = !!on && !st.follow; setFollow(on); },
    orbit: (on, speed, lat) => { st.orbit = !!on; st.orbitSpeed = speed; st.orbitLat = lat; $("tOrbit").checked = !!on; },
    pov: (p) => (p ? globe.pointOfView(p, 0) : globe.pointOfView()),
    cinema: (on, soft) => { document.body.classList.toggle("cinema", !!on); document.body.classList.toggle("cinema-soft", !!soft); },
    caption: (html) => { const c = $("caption"); c.hidden = !html; if (html) c.innerHTML = html; },
    card: (html, bg) => { const c = $("card"); c.hidden = !html; if (html) { c.innerHTML = html; c.style.background = bg || "transparent"; } },
    cursor: (x, y, down) => { const c = $("fakecursor"); if (x == null) { c.hidden = true; return; } c.hidden = false; c.style.left = x + "px"; c.style.top = y + "px"; c.classList.toggle("down", !!down); },
    screenPos: (key) => { const l = live.get(key); return l ? screenOf(l) : null; },
    elementCenter: (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; },
    clickAt: (x, y) => { const l = pick(x, y, 40); if (l) select(l.inst.key); return l ? l.inst.key : null; },
    list: () => [...live.values()].map((l) => ({ key: l.inst.key, route: l.inst.route.id, vehicle: l.inst.route.vehicle, timing: l.inst.timing, screen: screenOf(l) })),
    assist: () => ({ slow: st.slow, govern: st.govern, hoverKey: st.hoverKey, maxPxPerSec: MAX_PX_PER_SEC,
      speeds: [...live.values()].filter((l) => l._pxy && l.obj.visible && screenOf(l)).map((l) => ({ key: l.inst.key, pxPerSec: l._pxy * (st.mode === "idle" ? (st.slots.find((x) => x.key === l.inst.key) || {}).rate || 0 : st.speed * DAYS_PER_SEC / T.DAYS) })) }),
    screenOf: (key) => { const l = live.get(key); return l ? screenOf(l) : null; },
    // world position, nose (+Z) and up (+Y) of a live vehicle model, plus its level-of-detail state (for orientation tests)
    pose: (key) => { const l = live.get(key); if (!l) return null; const q = l.obj.quaternion;
      const f = new THREE.Vector3(0, 0, 1).applyQuaternion(q), u = new THREE.Vector3(0, 1, 0).applyQuaternion(q), p = l.obj.position;
      return { vehicle: l.inst.route.vehicle, type: l.inst.route.type, pos: [p.x, p.y, p.z], fwd: [f.x, f.y, f.z], up: [u.x, u.y, u.z], bank: l.bank || 0, detail: !!l.detail, gear: !!l.gear, visible: l.obj.visible }; },
    poses: () => [...live.keys()],
    state: () => ({ t: st.t, date: T.dateLabel(st.t), speed: st.speed, playing: st.playing, selected: st.selected && st.selected.key, follow: st.follow, live: live.size, routes: prepared.length, ships: !!st.layers.ships, shipsWork: st.shipsWork }),
    sunAngle: (a) => { st.sunAng = a; },
    gold: (on) => { st.allGold = !!on; refreshRoutes(); },
    night: (v) => { st.forceNight = v; },
    sats: (n) => { st.satOverride = n; },
    bloom: (strength) => { if (bloom) bloom.strength = strength; },
    layers: (o) => { Object.assign(st.layers, o); if (o && Object.prototype.hasOwnProperty.call(o, "ships")) { const cb = $("tShips"); if (cb) cb.checked = !!st.layers.ships; if (window.SeaWindows && SeaWindows.layerPref) SeaWindows.layerPref("ships", !!st.layers.ships); } refreshRoutes(); placeVehicles(0); },
    tab: switchTab,
    idle: (on) => (on ? enterIdle() : enterTimeline()),
    focus: (f) => { st.focus = Object.assign({}, f || {}); syncFocusUI(); refreshRoutes(); renderLog(); },
    log: (on) => toggleLog(on),
    logOpen: (i) => { renderLog(); if (LOG.rows[i]) { moveLog(i, false); openRoute(LOG.rows[i]); } },
    logRows: () => logRows().map((r) => r.id),
    logSet: (k, v) => { const ids = { era: "logEra", type: "logType", goods: "logGoods", region: "logRegion", evidence: "logEvidence" }; if (ids[k]) $(ids[k]).value = v || ""; if (k === "q") $("logQ").value = v || ""; setFocusField(k, v || null); },
    csv: () => { exportCsv(); return window.__lastCsv; },
    labels: () => labelEls.filter((d) => !d.hidden).map((d) => d.textContent),
    // shift the picture vertically (fraction of the height); used by the title shot
    viewShift: (fy) => { const cam = globe.camera(), w = window.innerWidth, h = window.innerHeight; if (fy) cam.setViewOffset(w, h, 0, -fy * h, w, h); else cam.clearViewOffset(); cam.updateProjectionMatrix(); },
    eraCard: (id) => { const e = S.eras.find((x) => x.id === id); if (e) eraCard(e, true); },
    // first live vehicle matching pred, preferring the one with the most voyage left
    find: (pred, maxFrac) => {
      let best = null;
      for (const l of live.values()) {
        if (!pred(l.inst)) continue;
        const left = 1 - V.stateAt(l.inst, st.t).frac;
        if (maxFrac != null && 1 - left > maxFrac) continue;
        if (!best || left > best.left) best = { key: l.inst.key, screen: screenOf(l), left };
      }
      return best;
    },
  };

  // ---------- boot ----------
  loadAll().then(async () => {
    routes.forEach((r) => { if (!r.citations) r.citations = [r.citation]; });
    // v2.3: the air-* corridor families keep their own colours so every earlier family keeps its palette slot
    [...new Set(routes.map((r) => r.family))].filter((f) => !AIR_COLORS[f]).sort().forEach((f, i) => { famColor[f] = FAMILY_PALETTE[i % FAMILY_PALETTE.length]; });
    Object.assign(famColor, AIR_COLORS);
    prepared = V.prepare(routes);
    prepared.forEach((r) => {
      // route lines ride 0.08 % of R above the drawn (faceted) surface: close to the vehicles, clear of depth fighting
      r._pts = r._line.pts.map((v, i) => { const ll = V.toLatLng(v); return [ll[0], ll[1], Math.max(facetAlt(ll[0], ll[1]) + 0.0008, altFor(r, r._line.cum[i] / Math.max(1, r._line.total)) * 0.9)]; });
    });
    const tex = await textures();
    buildScene(tex);
    buildUI();
    buildLog();
    $("modeBtn").addEventListener("click", () => (st.mode === "idle" ? enterTimeline() : enterIdle()));
    $("focusClear").addEventListener("click", clearFocus);
    wirePicking();
    if (st.mode === "idle") { document.body.classList.add("idle"); $("modeBtn").setAttribute("aria-pressed", "true"); if (!P.get("pov")) globe.pointOfView({ lat: 18, lng: 30, altitude: 2.5 }, 0); fillSlots(); }
    refreshRoutes();
    if (P.get("era")) goEra(P.get("era"), { fly: false });
    for (let i = 0; i < 3; i++) step(0.016);
    if (P.get("select")) select(P.get("select"));
    if (st.follow && !st.selected) window.__sg.selectFirst();
    if (P.get("cinema") === "1") window.__sg.cinema(true);
    requestAnimationFrame(loop);
    window.dispatchEvent(new CustomEvent("seaglobe:ready"));
    setTimeout(() => { document.documentElement.dataset.ready = "1"; }, shot ? 600 : 50);
  }).catch((err) => {
    console.error(err);
    document.documentElement.dataset.ready = "error";
    document.body.insertAdjacentHTML("beforeend", "<div class='caption'>SeaGlobe could not load: " + esc(err.message) + "</div>");
  });
})();
