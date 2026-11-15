// Headless browser smoke test: loads the app (served and from file://), checks for errors,
// external requests, moving vehicles in each era, era switching, selection and follow.
// Needs Chrome and puppeteer-core (PUPPETEER_CORE=<path> if not resolvable). Run: node tests/test_app.mjs
import assert from "node:assert/strict";
import path from "node:path";
import { startServer, launch, openApp, root } from "../tools/browser.mjs";

const port = 8700 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1280, 720);
let ok = 0;
const check = (name, fn) => fn().then(() => { ok++; console.log("ok -", name); });
try {
  await check("every era showcase has moving vehicles, no errors, no external requests", async () => {
    for (const t of ["-0479-06-10", "0450-06-01", "1320-05-01", "1595-09-20", "1870-03-01", "1985-06-01"]) {
      const p = await openApp(browser, port, `capture=1&t=${t}`);
      const s = await p.evaluate(() => window.__sg.state());
      assert.ok(s.live >= 3, `${t}: ${s.live} vehicles`);
      assert.deepEqual(p._errors, [], t);
      await p.close();
    }
  });
  await check("era chip switches era and time", async () => {
    const p = await openApp(browser, port, "capture=1&t=1320-05-01");
    const c = await p.evaluate(() => window.__sg.elementCenter("[data-era='industrial']"));
    await p.mouse.click(c.x, c.y);
    const s = await p.evaluate(() => window.__sg.state());
    assert.ok(s.t >= 1830 && s.t < 1950, "t " + s.t);
    assert.deepEqual(p._errors, []);
    await p.close();
  });
  await check("click a ship selects it; follow camera engages", async () => {
    const p = await openApp(browser, port, "capture=1&t=1595-09-20&pov=-20,40,1.9");
    const h = await p.evaluate(() => window.__sg.find((v) => v.route.id === "das-amsterdam-1595"));
    assert.ok(h && h.screen, "ship on screen");
    await p.mouse.click(h.screen.x, h.screen.y);
    let s = await p.evaluate(() => window.__sg.state());
    assert.ok(s.selected && s.selected.startsWith("das-amsterdam-1595"), "selected " + s.selected);
    const txt = await p.evaluate(() => document.body.innerText);
    assert.match(txt, /Amsterdam/); assert.match(txt, /Bruijn/);
    // v2.2 content in the existing card: route history and story, the named ship, the vehicle type, citations
    const notes = await p.evaluate(() => document.getElementById("dNotes").innerText + "\n" + document.getElementById("dCite").innerText);
    assert.match(notes, /History\. /); assert.match(notes, /Story\. /); assert.match(notes, /The ship: Amsterdam \(1595\)/);
    assert.match(notes, /About the east indiaman/); assert.match(notes, /First_Dutch_Expedition_to_the_East_Indies/);
    const fb = await p.evaluate(() => window.__sg.elementCenter("#followBtn"));
    await p.mouse.click(fb.x, fb.y);
    s = await p.evaluate(() => window.__sg.state());
    assert.equal(s.follow, true);
    await p.close();
  });
  await check("idle sampler shows a varied rotating set of vessels", async () => {
    const p = await openApp(browser, port, "capture=1");
    const v0 = await p.evaluate(() => window.__sg.list().map((x) => x.vehicle));
    assert.ok(v0.length >= 12 && v0.length <= 20, "count " + v0.length);
    assert.ok(new Set(v0).size >= 10, "variety " + new Set(v0).size);
    const k0 = await p.evaluate(() => window.__sg.list().map((x) => x.key).sort().join());
    for (let i = 0; i < 300; i++) await p.evaluate(() => window.__sg.advance(1 / 30));
    const k1 = await p.evaluate(() => window.__sg.list().map((x) => x.key).sort().join());
    assert.notEqual(k0, k1, "rotation swaps vessels");
    assert.deepEqual(p._errors, []);
    await p.close();
  });
  await check("Ship's Log: filter, search, keyboard open, CSV", async () => {
    const p = await openApp(browser, port, "capture=1&t=1320-05-01");
    await p.evaluate(() => window.__sg.log(true));
    const all = await p.evaluate(() => window.__sg.logRows().length);
    await p.evaluate(() => window.__sg.logSet("type", "rail"));
    const rail = await p.evaluate(() => window.__sg.logRows());
    assert.ok(rail.length >= 2 && rail.length < all, "rail filter " + rail.length);
    await p.evaluate(() => window.__sg.logSet("type", ""));
    await p.click("#logQ"); await p.keyboard.type("grain");
    await new Promise((r) => setTimeout(r, 300));
    const grain = await p.evaluate(() => window.__sg.logRows());
    assert.ok(grain.length >= 2 && grain.includes("roman-alexandria-ostia-grain"), "search " + grain);
    await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowDown"); await p.keyboard.press("Enter");
    const s = await p.evaluate(() => window.__sg.state());
    assert.ok(s.selected && s.playing, "opened and playing " + JSON.stringify(s));
    const csv = await p.evaluate(() => window.__sg.csv());
    assert.match(csv.split("\n")[0], /^id,name,family,type,era,region/);
    assert.equal(csv.trim().split("\n").length, grain.length + 1);
    assert.deepEqual(p._errors, []);
    await p.close();
  });
  await check("vehicles, wakes and route lines sit on the drawn (faceted) globe surface", async () => {
    const p = await openApp(browser, port, "capture=1&t=1595-09-20");
    const r = await p.evaluate(() => window.__sg.surfCheck(300));
    assert.ok(r.worstVeh < 2e-6 && r.worstRoute < 2e-6, "surface model error " + JSON.stringify(r));
    // the followed Amsterdam: hull crosses the waterline (part below, most above), origin on the surface
    const hit = await p.evaluate(() => window.__sg.find((v) => v.route.id === "das-amsterdam-1595"));
    await p.evaluate((k) => { window.__sg.select(k); window.__sg.follow(true, 1.8, 0.12, 0, 0.8); }, hit.key);
    for (let f = 0; f < 20; f++) await p.evaluate(() => window.__sg.advance(1 / 30));
    const w = await p.evaluate((k) => window.__sg.waterline(k), hit.key);
    assert.ok(Math.abs(w.originAboveSurface) < 1e-6, "origin on the water " + JSON.stringify(w));
    assert.ok(w.lo < -0.02 * w.scale && w.lo > -0.15 * w.scale && w.hi > 0.3 * w.scale, "hull in the water " + JSON.stringify(w));
    assert.deepEqual(p._errors, []);
    await p.close();
    // a train in 1870: wheels on the ground (no floating, no sinking)
    const q = await openApp(browser, port, "capture=1&t=1870-03-01&play=1&speed=1");
    const tr = await q.evaluate(() => window.__sg.find((v) => v.route.type === "rail"));
    const wt = await q.evaluate((k) => window.__sg.waterline(k), tr.key);
    assert.ok(Math.abs(wt.lo) < 0.01 * wt.scale + 0.012, "train on the ground " + JSON.stringify(wt));
    await q.close();
  });
  await check("moving vehicles can be hovered and clicked at default, fastest and sampler speeds", async () => {
    const cases = [{ q: "capture=1&t=1985-06-01&speed=5", name: "5x" }, { q: "capture=1&t=1985-06-01&speed=20", name: "20x" },
      { q: "capture=1&t=1595-09-20&speed=20&pov=-20,40,1.9", name: "20x age of sail" }, { q: "capture=1", name: "sampler" }];
    for (const c of cases) {
      const p = await openApp(browser, port, c.q);
      if (c.name !== "sampler") await p.evaluate(() => window.__sg.play(true));
      for (let f = 0; f < 15; f++) await p.evaluate(() => window.__sg.advance(1 / 30));
      let a = await p.evaluate(() => window.__sg.assist());
      assert.ok(a.speeds.length >= 2, c.name + ": vehicles measured " + a.speeds.length);
      const eff = a.speeds.map((v) => v.pxPerSec * (c.name === "sampler" ? 1 : a.govern));
      const top = Math.max(...eff);
      // nothing outruns the cap (smoothing allowance), and the globe is still lively (something visibly moves)
      assert.ok(top <= a.maxPxPerSec * 1.3, c.name + ": fastest " + top.toFixed(0) + " px/s");
      assert.ok(top > 3, c.name + ": still moving " + top.toFixed(1) + " px/s");
      // aim at the fastest moving vehicle, the hardest one to catch
      const target = a.speeds[eff.indexOf(top)].key;
      const s0 = await p.evaluate((k) => window.__sg.screenOf(k), target);
      await p.mouse.move(s0.x, s0.y);
      assert.equal(await p.evaluate(() => !document.getElementById("tooltip").hidden), true, c.name + ": tooltip on hover");
      for (let f = 0; f < 20; f++) await p.evaluate(() => window.__sg.advance(1 / 30));
      a = await p.evaluate(() => window.__sg.assist());
      assert.ok(a.slow < 0.05, c.name + ": time eases to a stop on hover " + a.slow);
      const s1 = await p.evaluate((k) => window.__sg.screenOf(k), target);
      const drift = Math.hypot(s1.x - s0.x, s1.y - s0.y);
      assert.ok(drift < 30, c.name + ": stays under the pointer, drift " + drift.toFixed(1) + " px");
      const t0 = (await p.evaluate(() => window.__sg.state())).t;
      for (let f = 0; f < 30; f++) await p.evaluate(() => window.__sg.advance(1 / 30));
      if (c.name !== "sampler") assert.ok(Math.abs((await p.evaluate(() => window.__sg.state())).t - t0) < 1e-4, c.name + ": clock held while hovering");
      await p.mouse.click(s0.x, s0.y);
      const st = await p.evaluate(() => window.__sg.state());
      assert.equal(st.selected, target, c.name + ": click selects the hovered vehicle");
      // pointer leaves: the clock picks up again
      await p.mouse.move(5, 360);
      await p.evaluate(() => document.getElementById("globe").dispatchEvent(new PointerEvent("pointerleave")));
      for (let f = 0; f < 60; f++) await p.evaluate(() => window.__sg.advance(1 / 30));
      a = await p.evaluate(() => window.__sg.assist());
      assert.ok(a.slow > 0.9, c.name + ": resumes after the pointer leaves " + a.slow);
      assert.deepEqual(p._errors, [], c.name);
      await p.close();
    }
  });
  await check("a cache-bust ?t= number does not break the clock; a real date still sets it", async () => {
    const p = await openApp(browser, port, "capture=1&t=1794704953840");
    const s = await p.evaluate(() => window.__sg.state());
    assert.deepEqual(p._errors, []);
    assert.ok(s.date && !/bad date/i.test(s.date), "sane date " + s.date);
    assert.ok(s.t >= 1320 && s.t < 1321, "default clock t=" + s.t);
    await p.close();
    const p2 = await openApp(browser, port, "capture=1&t=1320-05-01");
    const s2 = await p2.evaluate(() => window.__sg.state());
    assert.deepEqual(p2._errors, []);
    assert.ok(s2.t >= 1320 && s2.t < 1321, "valid date t=" + s2.t);
    assert.match(s2.date, /1 May 1320/);
    await p2.close();
  });
  await check("lite mode loads", async () => {
    const p = await openApp(browser, port, "capture=1&lite=1&t=1320-05-01");
    assert.ok((await p.evaluate(() => window.__sg.state())).live > 0);
    assert.deepEqual(p._errors, []);
    await p.close();
  });
  await check("opens from file:// without a server", async () => {
    const p = await browser.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e)));
    p.on("request", (r) => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) errs.push("EXTERNAL " + u); });
    await p.goto("file://" + path.join(root, "web", "index.html") + "?capture=1&t=1320-05-01");
    await p.waitForFunction(() => document.documentElement.dataset.ready, { timeout: 180000 });
    assert.equal(await p.evaluate(() => document.documentElement.dataset.ready), "1");
    assert.ok((await p.evaluate(() => window.__sg.state())).live > 0);
    assert.deepEqual(errs, []);
    await p.close();
  });
} finally {
  await browser.close(); server.kill();
}
console.log(`${ok}/10 browser checks passed`);
if (ok !== 10) process.exit(1);
