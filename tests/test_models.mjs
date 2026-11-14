// Vehicle model accuracy: every model's nose (+Z) points along its direction of travel, and the
// reference features of the aircraft sit where they should (fins sweep aft, red light on the left,
// 747 hump forward, Wright Flyer canard forward and pushers aft). Also checks the lite level of detail.
// Needs Chrome and puppeteer-core (PUPPETEER_CORE=<path>). Run: node tests/test_models.mjs
import assert from "node:assert/strict";
import { startServer, launch, openApp } from "../tools/browser.mjs";

const port = 8600 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1280, 720);
let ok = 0, total = 0;
const check = async (name, fn) => { total++; await fn(); ok++; console.log("ok -", name); };
const MAX_DEG = 5;   // "within a few degrees": the model looks 25 km ahead along its route, so a sharp bend shows briefly

async function modelPage(lite) {
  const p = await browser.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.setContent(`<html><body><script>${lite ? "window.SEAGLOBE_EDITION={lite:true};" : ""}</script><script src="http://127.0.0.1:${port}/vendor/three.global.js"></script><script src="http://127.0.0.1:${port}/js/vehicles.js"></script></body></html>`, { waitUntil: "load" });
  await p.waitForFunction(() => window.SeaVehicles && window.SEAGLOBE_THREE, { timeout: 30000 });
  p._errs = errs; return p;
}
// world-space summary of the named parts of every model
const PARTS = () => {
  const THREE = window.SEAGLOBE_THREE, V = window.SeaVehicles, out = {};
  for (const id of V.ids) {
    const o = V.build(id); o.updateMatrixWorld(true);
    const named = {}, v = new THREE.Vector3(); let tris = 0;
    o.traverse((m) => {
      if (m.isMesh && m.geometry) tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
      if (!m.name || !m.name.startsWith("sg-")) return;
      const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3());
      let top = null, bottom = null;   // for fins: the z of the highest and lowest vertices
      if (m.isMesh && m.name === "sg-fin") {
        const pa = m.geometry.attributes.position; let hi = -1e9, lo = 1e9;
        for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld); if (v.y > hi + 1e-6) { hi = v.y; top = v.z; } if (v.y < lo - 1e-6) { lo = v.y; bottom = v.z; } }
        // leading edge: the frontmost vertex at the top and at the root
        let topFront = -1e9, rootFront = -1e9;
        for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld); if (v.y > hi - 0.004) topFront = Math.max(topFront, v.z); if (v.y < lo + 0.004) rootFront = Math.max(rootFront, v.z); }
        top = topFront; bottom = rootFront;
      }
      (named[m.name] = named[m.name] || []).push({ c: [c.x, c.y, c.z], top, bottom });
    });
    const bb = new THREE.Box3().setFromObject(o);
    out[id] = { named, tris: Math.round(tris), min: bb.min.toArray(), max: bb.max.toArray(), parts: Object.fromEntries(Object.entries(o.userData.parts || {}).map(([k, a]) => [k, Array.isArray(a) ? a.length : a ? 1 : 0])) };
  }
  return out;
};
const ang = (a, b) => { const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], n = Math.hypot(...a) * Math.hypot(...b); return Math.acos(Math.max(-1, Math.min(1, d / n))) * 180 / Math.PI; };

try {
  let M, L;
  await check("every model builds without errors in the full and lite levels of detail", async () => {
    const p = await modelPage(false); M = await p.evaluate(PARTS); assert.deepEqual(p._errs, []); await p.close();
    const q = await modelPage(true); L = await q.evaluate(PARTS); assert.deepEqual(q._errs, []); await q.close();
    for (const [id, m] of Object.entries(M)) assert.ok(m.tris > 0 && m.max[2] > m.min[2], id + " has geometry");
  });
  await check("aircraft fins sweep aft: the leading edge at the top of each fin is behind the root", async () => {
    for (const id of ["jet", "comet", "concorde", "boeing-747", "dc-3"]) {
      const fins = M[id].named["sg-fin"]; assert.ok(fins && fins.length, id + " has a fin");
      for (const f of fins) assert.ok(f.top < f.bottom - 0.02, `${id} fin top leading edge z ${f.top.toFixed(3)} is aft of root ${f.bottom.toFixed(3)}`);
    }
  });
  await check("navigation lights: red on the left wing tip (+X), green on the right (-X)", async () => {
    for (const id of ["jet", "comet", "concorde", "boeing-747", "dc-3", "prop-airliner"]) {
      const n = M[id].named; assert.ok(n["sg-nav-port"][0].c[0] > 0.1 && n["sg-nav-stbd"][0].c[0] < -0.1, id);
    }
  });
  await check("reference features: engines, hump, droop nose, props, canard", async () => {
    const eng = (id) => (M[id].named["sg-engine"] || []).length, props = (id) => (M[id].named["sg-prop"] || []);
    for (const id of ["jet", "boeing-747", "concorde"]) assert.equal(eng(id), 4, id + " has four engines");
    const wingY = M["boeing-747"].named["sg-wing"][0].c[1];
    for (const e of M["boeing-747"].named["sg-engine"]) assert.ok(e.c[1] < wingY && Math.abs(e.c[0]) > 0.08, "747 engines podded under the wing");
    for (const e of M["concorde"].named["sg-engine"]) assert.ok(e.c[2] < 0, "Concorde nacelles under the rear of the wing");
    assert.ok(M["boeing-747"].named["sg-hump"][0].c[2] > 0.15, "747 hump forward");
    assert.equal(eng("comet"), 0, "Comet engines are inside the wing roots (no pods)");
    assert.ok(M["concorde"].parts.droop === 1, "Concorde droop nose hinge");
    assert.ok(!M["concorde"].named["sg-wing"].some((w) => w.c[2] < -0.3 && w.c[1] > 0.0), "no tailplane on Concorde");
    assert.equal(props("dc-3").length, 2); assert.equal(props("prop-airliner").length, 4);
    for (const pr of props("dc-3")) assert.ok(pr.c[2] > 0.1, "DC-3 tractor props ahead of the wing");
    const w = M["wright-flyer"].named;
    assert.equal(props("wright-flyer").length, 2);
    for (const pr of props("wright-flyer")) assert.ok(pr.c[2] < -0.1, "Wright pushers behind the wings");
    for (const c of w["sg-canard"]) assert.ok(c.c[2] > 0.3, "Wright canard forward");
    assert.ok(w["sg-pilot"][0].c[0] > 0 && w["sg-engine"][0].c[0] < 0, "Wright pilot left of centre, engine right");
  });
  await check("lite level of detail: no close-up detail groups and fewer triangles", async () => {
    for (const id of Object.keys(M)) {
      assert.equal(L[id].parts.detail || 0, 0, id + " lite has no detail group");
      assert.ok(L[id].tris <= M[id].tris, `${id} lite ${L[id].tris} <= full ${M[id].tris}`);
    }
    const sum = (X) => Object.values(X).reduce((a, m) => a + m.tris, 0);
    console.log(`   triangles: full ${sum(M)}, lite ${sum(L)}`);
  });
  // in the running app: each vehicle's nose follows its velocity (sea, land, rail and air, including banked turns)
  const scenes = [["-0400-06-01", "40,25,2.2"], ["1292-06-01", "10,100,2.4"], ["1769-09-20", "42,-50,2.2"], ["1410-06-01", "5,80,2.4"], ["0100-06-01", "30,30,2.2"], ["0900-06-01", "55,0,2.2"], ["1300-06-01", "30,60,2.4"], ["1420-06-01", "10,90,2.4"], ["1550-06-01", "-15,-70,2.4"],
    ["1700-06-01", "20,-30,2.2"], ["1880-06-01", "45,0,2.2"], ["1903-12-20", "-20,-75,1.6"], ["1948-09-01", "52,11,1.4"], ["1954-11-15", "60,-60,2.4"], ["1850-06-01", "30,0,2.2"], ["1952-05-02", "20,20,2.4"], ["1976-01-21", "40,0,2.4"], ["1985-06-01", "30,-40,2.4"], ["2010-06-01", "10,80,2.4"]];
  const seen = new Set();
  for (const [t, pov] of scenes) {
    await check(`on ${t} every moving model points its nose along its travel within ${MAX_DEG} degrees`, async () => {
      const p = await openApp(browser, port, `capture=1&t=${t}&pov=${pov}`);
      await p.evaluate(() => { window.__sg.setSpeed && window.__sg.setSpeed(1); window.__sg.play(true); window.__sg.advance(0.05); });
      const res = await p.evaluate(() => {
        const keys = window.__sg.poses(), a = Object.fromEntries(keys.map((k) => [k, window.__sg.pose(k)]));
        window.__sg.advance(0.004);   // a short step, so the measured velocity is close to instantaneous
        return keys.map((k) => ({ k, a: a[k], b: window.__sg.pose(k) })).filter((x) => x.a && x.b);
      });
      let n = 0; const errs = [];
      for (const { k, a, b } of res) {
        if (!a.visible || a.type === "pipeline") continue;
        const v = [b.pos[0] - a.pos[0], b.pos[1] - a.pos[1], b.pos[2] - a.pos[2]];
        const up = a.pos.map((x) => x / Math.hypot(...a.pos)), vd = v[0] * up[0] + v[1] * up[1] + v[2] * up[2];
        const vt = v.map((x, i) => x - vd * up[i]);
        if (Math.hypot(...vt) < 1e-5 * Math.hypot(...a.pos)) continue;   // parked or too slow to measure
        const e = ang(a.fwd, vt); n++; seen.add(a.vehicle); errs.push(e);
        if (process.env.MODEL_DEBUG && e > 2) console.log("   ", a.vehicle, k, e.toFixed(2));
        assert.ok(e < MAX_DEG, `${a.vehicle} (${k}) nose is ${e.toFixed(1)} degrees off its travel`);
        assert.ok(ang(a.up, up) < 30, `${a.vehicle} up vector within 30 degrees of local vertical (bank ${(a.bank * 57.3).toFixed(1)})`);
      }
      assert.ok(n > 0, "measured some vehicles");
      errs.sort((x, y) => x - y); console.log(`   ${n} vehicles, median ${errs[n >> 1].toFixed(2)} deg, worst ${errs[n - 1].toFixed(2)} deg`);
      assert.deepEqual(p._errors, []);
      await p.close();
    });
  }
  console.log("   vehicles measured in motion: " + [...seen].sort().join(", "));
  const missing = Object.keys(M).filter((id) => !seen.has(id) && !["satellite", "pipeline-flow"].includes(id));
  console.log("   not seen moving in these scenes (checked by the geometry tests and contact sheet only): " + (missing.join(", ") || "none"));
} catch (e) {
  console.log("not ok -", e.message);
} finally {
  await browser.close(); if (server && server.close) server.close(); else if (server && server.kill) server.kill();
}
console.log(`${ok}/${total} model checks passed`);
if (ok !== total) process.exit(1);
