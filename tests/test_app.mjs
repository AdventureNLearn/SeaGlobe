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
console.log(`${ok}/8 browser checks passed`);
if (ok !== 8) process.exit(1);
