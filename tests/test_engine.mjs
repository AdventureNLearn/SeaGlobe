// Engine, schema and vehicle tests. Run: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = path.join(root, "web");
const require = createRequire(import.meta.url);
const T = require(path.join(web, "js/timemodel.js"));
const V = require(path.join(web, "js/voyages.js"));

// load the browser data globals the way index.html does
const win = {};
const ctx = vm.createContext({ window: win, globalThis: win });
const run = (rel) => vm.runInContext(fs.readFileSync(path.join(web, rel), "utf8"), ctx, { filename: rel });
run("data/schema.js"); run("data/routes/index.js"); run("data/deeper.js");
const D = win.SEAGLOBE_DATA;
D.route_files.forEach(run);
const S = D.schema;
const families = D.route_files.map((f) => D["routes:" + path.basename(f, ".js")]);
const routes = families.flatMap((f) => f.routes);

test("year labels and BCE handling", () => {
  assert.equal(T.yearLabel(-499), "500 BCE");
  assert.equal(T.yearLabel(0), "1 BCE");
  assert.equal(T.yearLabel(60), "60 CE");
  assert.equal(T.yearLabel(1595), "1595");
  assert.equal(T.dateLabel(T.parse("1595-04-02")), "2 Apr 1595");
  assert.equal(T.dateLabel(T.parse("1320-05-01")), "1 May 1320");
  assert.ok(Math.abs(T.parse("-0479-01-01") - -479) < 1e-9);
});

test("eras cover the timeline 500 BCE to today without gaps", () => {
  assert.equal(S.timeline.min, -499);
  assert.ok(S.timeline.max >= 2026);
  const ids = S.eras.map((e) => e.id);
  assert.deepEqual(JSON.parse(JSON.stringify(ids)), ["classical", "late-antiquity", "medieval", "age-of-sail", "industrial", "modern"]);
  for (let i = 1; i < S.eras.length; i++) assert.equal(S.eras[i].from, S.eras[i - 1].to + 1);
  assert.equal(T.eraAt(S.eras, 1320).id, "medieval");
  assert.equal(T.eraAt(S.eras, -300).id, "classical");
});

test("every record validates against the schema", () => {
  const types = new Set(S.route_types.map((x) => x.id));
  const vehicles = new Set(S.vehicles.map((v) => v.id || v));
  const eras = new Set(S.eras.map((e) => e.id));
  const ids = new Set();
  for (const r of routes) {
    for (const k of S.record_fields) assert.ok(k in r, `${r.id} missing ${k}`);
    assert.ok(!ids.has(r.id), "duplicate id " + r.id); ids.add(r.id);
    assert.ok(types.has(r.type), `${r.id} type ${r.type}`);
    assert.ok(eras.has(r.era), `${r.id} era ${r.era}`);
    assert.ok(vehicles.has(r.vehicle), `${r.id} vehicle ${r.vehicle}`);
    assert.equal(typeof r.reconstruction, "boolean", r.id + " reconstruction flag");
    assert.ok(Array.isArray(r.citations) && r.citations.length > 0, r.id + " citations");
    assert.ok(["high", "medium", "low"].includes(r.confidence_level), r.id + " confidence_level");
    assert.ok(Array.isArray(r.path) && r.path.length >= 2, r.id + " path");
    for (const p of r.path) {
      const [lat, lng] = Array.isArray(p) ? p : [p.lat, p.lng];
      assert.ok(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180, r.id + " coord");
    }
    assert.ok(["dated", "years", "traffic"].includes(r.schedule.kind), r.id + " schedule kind");
  }
  assert.ok(routes.length >= 60, "route count " + routes.length);
});

test("pre-1500 records are all marked as reconstructions", () => {
  const prep = V.prepare(routes);
  for (const r of prep) if (V.isPre1500(r)) assert.equal(r.reconstruction, true, r.id);
});

test("no bundled record derives from a restricted dataset", () => {
  const banned = /DARMC|AWMC|Huygens|resources\.huygens|slavevoyages|OWTRAD|zenodo|openstreetmap|OpenFlights|Comtrade|soundtoll|globalenergymonitor/i;
  for (const r of routes) {
    assert.ok(!banned.test(JSON.stringify(r.derived_from || "")), r.id + " derived_from");
    assert.ok(!banned.test(String(r.path_source || "")), r.id + " path_source");
  }
});

test("dated voyages hit their recorded anchors (Patriot at the Cape)", () => {
  const prep = V.prepare(routes);
  const pat = prep.find((r) => r.id === "das-patriot-1780");
  assert.ok(pat, "patriot record");
  const inst = V.activeOn(pat, T.parse("1780-05-01")) || [];
  const list = Array.isArray(inst) ? inst : [inst];
  assert.ok(list.length >= 1, "Patriot sailing on 1 May 1780");
  const s = V.stateAt(list[0], T.parse("1780-05-01"));
  const ll = [s.lat, s.lng];
  assert.ok(Math.abs(ll[0] - -33.9) < 1.5 && Math.abs(ll[1] - 18.4) < 2, "at the Cape: " + ll);
});

test("vehicle cap and traffic gives moving vehicles in every era showcase", () => {
  const prep = V.prepare(routes);
  for (const e of S.eras) {
    const t = T.parse(e.showcase);
    const act = V.activeAll(prep, t, 56);
    assert.ok(act.length >= 4, `${e.id}: ${act.length} active`);
    assert.ok(act.length <= 56);
  }
});

test("great-circle densify is smooth and monotonic", () => {
  const line = V.densify([[51.5, -0.1], [40.7, -74]], 50);
  for (let i = 1; i < line.cum.length; i++) assert.ok(line.cum[i] > line.cum[i - 1]);
  assert.ok(Math.abs(line.total - 5570) < 60, "LHR-NYC km " + line.total);
});

test("go-deeper links are plain https homepages", () => {
  assert.ok(D.deeper.length >= 10);
  for (const d of D.deeper) {
    assert.match(d.url, /^https?:\/\/[^ ]+$/);  // OWTRAD only has an http homepage
    assert.ok(d.name && d.desc && d.credit, d.id);
  }
});

test("all procedural vehicles build", () => {
  const w = { };
  const c2 = vm.createContext({ window: w, globalThis: w, self: w, console });
  vm.runInContext(fs.readFileSync(path.join(web, "vendor/three.global.js"), "utf8"), c2);
  vm.runInContext(fs.readFileSync(path.join(web, "js/vehicles.js"), "utf8"), c2);
  const SV = w.SeaVehicles;
  for (const v of S.vehicles) {
    const id = v.id || v;
    const o = SV.build(id);
    assert.ok(o && o.isObject3D, id);
    let meshes = 0; o.traverse((m) => { if (m.isMesh || m.isPoints || m.isLine) meshes++; });
    assert.ok(meshes > 0, id + " has geometry");
  }
});

function loadVehicles() {
  const w = { };
  const c2 = vm.createContext({ window: w, globalThis: w, self: w, console: { warn() {}, log: console.log } });
  vm.runInContext(fs.readFileSync(path.join(web, "vendor/three.global.js"), "utf8"), c2);
  vm.runInContext(fs.readFileSync(path.join(web, "js/vehicles.js"), "utf8"), c2);
  return { SV: w.SeaVehicles, THREE: w.SEAGLOBE_THREE };
}

test("every vehicle type has its own detailed model (no placeholder fallback)", () => {
  const { SV } = loadVehicles();
  const ids = new Set(S.vehicles.map((v) => v.id));
  for (const r of routes) ids.add(r.vehicle);
  for (const id of ids) {
    assert.ok(SV.ids.includes(id), id + " has a builder");
    const o = SV.build(id);
    assert.equal(o.userData.fallback, false, id + " fell back to a placeholder");
    let meshes = 0; o.traverse((m) => { if (m.isMesh) meshes++; });
    assert.ok(meshes >= 4, id + " is detailed (" + meshes + " meshes)");
  }
  for (const id of SV.ids) assert.ok(S.vehicles.some((v) => v.id === id), id + " is listed in schema.vehicles");
});

test("vehicles sit on water, ground or air: no floating, no sinking", () => {
  const { SV, THREE } = loadVehicles();
  for (const v of S.vehicles) {
    const o = SV.build(v.id); o.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(o);
    if (["sea", "river", "canal"].includes(v.type)) {
      let hull = null; o.traverse((m) => { if (!hull && m.userData && m.userData.hull) hull = m; });
      assert.ok(hull, v.id + " has a hull");
      const hb = new THREE.Box3().setFromObject(hull);
      const sub = -hb.min.y / (hb.max.y - hb.min.y);  // waterline is local y = 0
      assert.ok(sub > 0.15 && sub < 0.55, `${v.id} hull submerged fraction ${sub.toFixed(2)}`);
    } else if (v.type === "land" || v.type === "rail" || v.type === "pipeline") {
      assert.ok(Math.abs(bb.min.y) < 0.004, `${v.id} touches the ground (min y ${bb.min.y.toFixed(4)})`);
    } else {
      assert.ok(bb.min.y >= -1e-6, `${v.id} is not below its origin`);
    }
  }
});

test("facet surface radius matches the drawn globe sphere", () => {
  const { SV, THREE } = loadVehicles();
  const W = 90, H = 45;  // globe.gl default globeCurvatureResolution 4°
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, W, H), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const rc = new THREE.Raycaster();
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let minK = 1;
  for (let i = 0; i < 300; i++) {
    const d = new THREE.Vector3(rnd() * 2 - 1, rnd() * 1.8 - 0.9, rnd() * 2 - 1).normalize();
    rc.set(new THREE.Vector3(0, 0, 0), d);
    const hit = rc.intersectObject(mesh)[0];
    const k = SV.facetScale(d.x, d.y, d.z, W, H);
    assert.ok(Math.abs(k - hit.distance) < 1e-6, `dir ${i}: facet ${k} vs ray ${hit.distance}`);
    minK = Math.min(minK, k);
  }
  assert.ok(minK < 0.9995, "facets sit measurably inside the ideal sphere, which is why vehicles use them");
});

// ---------- v2.3 air layer ----------
const air = routes.filter((r) => r.family && r.family.startsWith("air-"));
test("air layer: 20-40 historic corridors in air-* family files, all reconstructions with citations", () => {
  const files = D.route_files.filter((f) => /\/air-[a-z-]+\.js$/.test(f));
  assert.deepEqual(JSON.parse(JSON.stringify(files.map((f) => path.basename(f)).sort())), ["air-interwar.js", "air-jet-age.js", "air-pioneers.js"]);
  assert.ok(air.length >= 20 && air.length <= 40, "corridors " + air.length);
  for (const r of air) {
    assert.equal(r.type, "air", r.id);
    assert.equal(r.reconstruction, true, r.id);
    assert.ok(r.citations.some((c) => /^Wikipedia|^[A-Z]/.test(c)) && r.citations.some((c) => /OurAirports/.test(c)), r.id + " cites history and OurAirports");
    assert.ok(T.parse(r.start_date) >= 1903.9 && T.parse(r.end_date) <= 2027, r.id + " dates " + r.start_date + "–" + r.end_date);
    assert.equal(r.era, T.parse(r.start_date) < 1950 ? "industrial" : "modern", r.id + " era");
    assert.ok(!/openflights|ads-b|adsb|flightaware|opensky|flightradar/i.test(JSON.stringify([r.derived_from, r.source, r.citations, r.path_source])), r.id + " no flight-tracking data");
  }
});
test("air layer: Wright Flyer, DC-3 and 747 are in the schema and fly on their eras", () => {
  const prep = V.prepare(routes);
  for (const [veh, t] of [["wright-flyer", "1903-12-20"], ["dc-3", "1948-09-01"], ["boeing-747", "1970-01-25"]]) {
    assert.ok(S.vehicles.some((v) => v.id === veh && v.type === "air"), veh + " in schema");
    const act = V.activeAll(prep, T.parse(t), 56).filter((i) => i.route.vehicle === veh);
    assert.ok(act.length >= 1, `${veh} active on ${t}`);
  }
});
test("air layer: dated corridor flights use only dates from their records", () => {
  for (const r of air.filter((x) => x.schedule.kind === "dated")) {
    for (const v of r.schedule.voyages) {
      assert.equal(v.start, r.start_date, r.id); assert.equal(v.end, r.end_date, r.id);
      assert.ok(v.min_display_days >= 24, r.id + " slowed for display");
    }
  }
});
