// Phone layout (v2.3) and desktop-unchanged checks. Needs Chrome and puppeteer-core (PUPPETEER_CORE=<path>).
// Run: node tests/test_mobile.mjs        (write the desktop baseline: node tests/test_mobile.mjs --write-fixture)
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { startServer, launch, openApp, root, layoutSnapshot } from "../tools/browser.mjs";

const FIXTURE = path.join(root, "tests", "fixtures", "desktop-layout.json");
const DESKTOP = [[1536, 864], [1920, 1080]];
const PHONES = [[390, 844], [360, 800]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// wait until the sheet slide (CSS transitions) has finished; the software renderer can be slow
const settle = async (p) => { await sleep(60); await p.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"), { timeout: 20000, polling: 100 }); };

// Deterministic desktop states (capture mode, fixed date and camera).
async function desktopStates(browser, port, w, h) {
  const out = {};
  const p = await openApp(browser, port, "capture=1&t=1595-09-20&pov=-20,40,1.9");
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await settle(p);
  out.home = await layoutSnapshot(p);
  const hit = await p.evaluate(() => window.__sg.find((v) => v.route.id === "das-amsterdam-1595"));
  await p.evaluate((k) => window.__sg.select(k), hit.key);
  out.voyage = await layoutSnapshot(p);
  await p.evaluate(() => window.__sg.tab("layers"));
  out.layers = await layoutSnapshot(p);
  await p.evaluate(() => { window.__sg.tab("voyage"); window.__sg.log(true); });
  out.log = await layoutSnapshot(p);
  await p.close();
  return out;
}

const port = 8600 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1536, 864);
const writeFixture = process.argv.includes("--write-fixture");
let ok = 0, total = 0;
const check = async (name, fn) => { total++; await fn(); ok++; console.log("ok -", name); };

const UA = "Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36";
// open the app, then switch on phone emulation (touch, mobile viewport) and reload under it
async function phone(w, h, query) {
  const q = await openApp(browser, port, query);
  await q.emulate({ viewport: { width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, userAgent: UA });
  await q.reload({ waitUntil: "load" });
  await q.waitForFunction(() => document.documentElement.dataset.ready === "1", { timeout: 180000 });
  await settle(q);
  return q;
}
// visible fixed panels, their boxes, and any pair that overlaps
const panels = (p) => p.evaluate(() => {
  const ids = ["topbar", "side", "timeline", "log", "legendFloat"];
  const vis = ids.map((id) => document.getElementById(id)).filter((el) => el && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden" && +getComputedStyle(el).opacity > 0.05)
    .map((el) => { const b = el.getBoundingClientRect(); return { id: el.id, l: b.left, t: b.top, r: b.right, b: b.bottom }; });
  const overlaps = [];
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
    const a = vis[i], c = vis[j];
    if (Math.min(a.r, c.r) - Math.max(a.l, c.l) > 0.5 && Math.min(a.b, c.b) - Math.max(a.t, c.t) > 0.5) overlaps.push(a.id + "/" + c.id);
  }
  const offscreen = vis.filter((v) => v.l < -0.5 || v.t < -0.5 || v.r > innerWidth + 0.5 || v.b > innerHeight + 0.5).map((v) => v.id);
  return { vis: vis.map((v) => v.id), overlaps, offscreen, scrollW: document.documentElement.scrollWidth, w: innerWidth };
});
// tap targets smaller than 44 px among visible controls inside the given panels
const smallTargets = (p, sel) => p.evaluate((sel) => {
  const bad = [];
  for (const el of document.querySelectorAll(sel)) {
    if (!el.getClientRects().length) continue;
    const cs = getComputedStyle(el); if (cs.visibility === "hidden") continue;
    const panel = el.closest(".glass"); if (panel && getComputedStyle(panel).visibility === "hidden") continue;
    const b = el.getBoundingClientRect();
    if (b.right < 0 || b.left > innerWidth || b.bottom < 0 || b.top > innerHeight) continue; // scrolled out of a strip
    if (b.height < 43.5 || b.width < 43.5) bad.push((el.id || el.className || el.tagName) + " " + Math.round(b.width) + "x" + Math.round(b.height));
  }
  return bad;
}, sel);
const CONTROLS = (scope) => [`${scope} button`, `${scope} select`, `${scope} input[type=search]`, `${scope} input[type=range]`, `${scope} .toggles label`, `${scope} .routelist li`, `${scope} .loglist li`, `${scope} .deeper a`].join(",");
// a live vehicle well inside the visible globe area
const onScreenVehicle = (p, top, bottom) => p.evaluate((top, bottom) => {
  const seen = new Set();
  for (let i = 0; i < 120; i++) {
    const h = window.__sg.find((x) => !seen.has(x.key)); if (!h) break; seen.add(h.key);
    if (h.screen && h.screen.x > 40 && h.screen.x < innerWidth - 40 && h.screen.y > top && h.screen.y < bottom) return h;
  }
  return null;
}, top, bottom);

try {
  if (writeFixture) {
    const fx = {};
    for (const [w, h] of DESKTOP) fx[w + "x" + h] = await desktopStates(browser, port, w, h);
    fs.writeFileSync(FIXTURE, JSON.stringify(fx, null, 1) + "\n");
    console.log("wrote", path.relative(root, FIXTURE));
  } else {
    await check("desktop layout at 1536x864 and 1920x1080 is unchanged (home, voyage card, layers, Ship's Log)", async () => {
      const fx = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
      // v2.3: the Ship's Log lists every record, so the 26 air corridors add 26 data rows (#log-N) and the record
      // count text is a few tenths of a pixel wider. Rows are counted, not compared; every other box,
      // font, colour and transform must still match the v2.2.1 baseline exactly.
      // v3.0: the baseline was regenerated on purpose (--write-fixture) for the new top-bar buttons (Go deeper,
      // Radio) and the footer credit and version line; the desktop layout is otherwise compared exactly as before.
      const ROW = /^#log-(\d+)(>|$)/, ADDED_ROWS = 0;
      // footer version width ("v3.0.0" vs "v3.0.1") changes with VERSION; position, font and colour still match
      const COUNT_TEXT = new Set(["#logCount", "#log>div.loghead:0>div:0", "#log>div.loghead:0>div:0>div.kicker:0", "#pfoot>span.vline:0>span:0"]);
      const norm = (k, v) => (v && COUNT_TEXT.has(k) ? v.split(" ").filter((_, i) => i !== 2).join(" ") : v);
      const rows = (o) => new Set(Object.keys(o).map((k) => (ROW.exec(k) || [])[1]).filter(Boolean)).size;
      for (const [w, h] of DESKTOP) {
        const now = await desktopStates(browser, port, w, h);
        for (const state of Object.keys(fx[w + "x" + h])) {
          const a = fx[w + "x" + h][state], b = now[state];
          const diff = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !ROW.test(k) && norm(k, a[k]) !== norm(k, b[k])).map((k) => k + ": " + a[k] + " -> " + b[k]);
          assert.deepEqual(diff, [], `${w}x${h} ${state}`);
          assert.equal(rows(b), rows(a) + (rows(a) ? ADDED_ROWS : 0), `${w}x${h} ${state} log rows`);
        }
      }
    });
  }
  for (const [w, h] of writeFixture || process.argv.includes("--desktop-only") ? [] : PHONES) {
    await check(`${w}x${h}: home is globe + slim top strip + one bottom bar, nothing overlaps or overflows, 44 px targets`, async () => {
      const p = await phone(w, h, "capture=1&t=1595-09-20");
      const s = await panels(p);
      assert.deepEqual(s.vis, ["topbar", "timeline"], "visible panels");
      assert.deepEqual(s.overlaps, []); assert.deepEqual(s.offscreen, []);
      assert.ok(s.scrollW <= s.w, "no horizontal overflow " + s.scrollW);
      const tb = await p.evaluate(() => [document.getElementById("topbar").offsetHeight, document.getElementById("timeline").offsetHeight]);
      assert.ok(tb[0] <= 52 && tb[1] <= 120, "compact bars " + tb);
      assert.deepEqual(await smallTargets(p, CONTROLS("#topbar") + "," + CONTROLS("#timeline")), []);
      assert.equal(await p.evaluate(() => [...document.querySelectorAll(".vlabel:not(.sel)")].filter((d) => d.getClientRects().length).length), 0, "no label crowd");
      assert.deepEqual(p._errors, []);
      await p.close();
    });
    await check(`${w}x${h}: menu button opens one slide-up sheet (eras, layers, routes, Ship's Log) and closes it`, async () => {
      const p = await phone(w, h, "capture=1&t=1595-09-20");
      await p.tap("#menuBtn"); await settle(p);
      let s = await panels(p);
      assert.deepEqual(s.vis, ["topbar", "side", "timeline"]); assert.deepEqual(s.overlaps, []); assert.deepEqual(s.offscreen, []);
      assert.equal(await p.evaluate(() => document.getElementById("menuBtn").getAttribute("aria-expanded")), "true");
      assert.ok(await p.evaluate(() => document.querySelectorAll("#mEras [data-mera]").length) >= 5, "era chips in the sheet");
      for (const tab of ["layers", "routes", "deeper"]) {
        await p.tap(`.tab[data-tab='${tab}']`); await settle(p);
        assert.deepEqual(await smallTargets(p, CONTROLS("#side")), [], tab);
      }
      await p.tap("#mClose"); await settle(p);
      s = await panels(p); assert.deepEqual(s.vis, ["topbar", "timeline"], "closed");
      // an era chip in the sheet switches era (and closes the sheet)
      await p.tap("#menuBtn"); await settle(p); await p.tap("#mEras [data-mera='industrial']"); await settle(p);
      const t = (await p.evaluate(() => window.__sg.state())).t;
      assert.ok(t >= 1830 && t < 1950, "era chip in the sheet: t " + t);
      assert.equal(await p.evaluate(() => window.__sgMobile.mode()), null, "sheet closed after choosing an era");
      // menu again, then the Ship's Log: its own sheet, the bottom bar steps aside
      await p.tap("#menuBtn"); await settle(p); await p.tap("#mLogBtn"); await settle(p);
      s = await panels(p); assert.deepEqual(s.vis, ["topbar", "log"]); assert.deepEqual(s.overlaps, []); assert.deepEqual(s.offscreen, []);
      assert.deepEqual(await smallTargets(p, CONTROLS("#log")), []);
      // pick a voyage from the log: the log closes and the voyage card opens
      await p.tap("#logList li[data-i='2']"); await settle(p);
      assert.ok((await p.evaluate(() => window.__sg.state())).selected, "log row selects");
      s = await panels(p); assert.deepEqual(s.vis, ["topbar", "side", "timeline"]); assert.deepEqual(s.overlaps, []);
      assert.equal(await p.evaluate(() => window.__sgMobile.mode()), "voyage");
      assert.deepEqual(p._errors, []);
      await p.close();
    });
    await check(`${w}x${h}: tap selects a vehicle; the voyage card opens as a readable bottom sheet and dismisses`, async () => {
      const p = await phone(w, h, "capture=1&t=1595-09-20");
      const v = await onScreenVehicle(p, 80, h - 140);
      assert.ok(v, "a vehicle on screen");
      await p.touchscreen.tap(v.screen.x, v.screen.y); await settle(p);
      assert.equal((await p.evaluate(() => window.__sg.state())).selected, v.key, "tap selects");
      let s = await panels(p);
      assert.deepEqual(s.vis, ["topbar", "side", "timeline"]); assert.deepEqual(s.overlaps, []); assert.deepEqual(s.offscreen, []);
      const card = await p.evaluate(() => ({ fs: parseFloat(getComputedStyle(document.getElementById("dNotes")).fontSize), txt: document.getElementById("dNotes").innerText,
        top: document.getElementById("side").getBoundingClientRect().top, mode: window.__sgMobile.mode() }));
      assert.equal(card.mode, "voyage"); assert.ok(card.fs >= 14, "notes font " + card.fs); assert.match(card.txt, /History\. /);
      assert.ok(card.top > h * 0.3, "globe stays visible above the card");
      assert.deepEqual(await smallTargets(p, CONTROLS("#side")), []);
      await p.tap("#mClose"); await settle(p);
      s = await panels(p); assert.deepEqual(s.vis, ["topbar", "timeline"], "card dismissed");
      // re-open by tapping the vehicle again, then dismiss by tapping empty space on the globe
      const v2 = await p.evaluate((k) => window.__sg.screenOf(k), v.key);
      await p.touchscreen.tap(v2.x, v2.y); await settle(p);
      assert.equal(await p.evaluate(() => window.__sgMobile.mode()), "voyage", "re-opened");
      await p.touchscreen.tap(w / 2, 70); await settle(p);
      assert.equal(await p.evaluate(() => window.__sgMobile.mode()), null, "tap on empty globe dismisses");
      assert.deepEqual(p._errors, []);
      await p.close();
    });
    await check(`${w}x${h}: speed fix with touch: the fastest vehicle at 20x (modern) can be tapped`, async () => {
      const p = await phone(w, h, "capture=1&t=1985-06-01&speed=20");
      await p.evaluate(() => window.__sg.play(true));
      for (let f = 0; f < 15; f++) await p.evaluate(() => window.__sg.advance(1 / 30));
      const a = await p.evaluate(() => window.__sg.assist());
      const inView = [];
      for (const sp of a.speeds) { const sc = await p.evaluate((k) => window.__sg.screenOf(k), sp.key); if (sc && sc.x > 30 && sc.x < w - 30 && sc.y > 70 && sc.y < h - 130) inView.push({ ...sp, sc }); }
      assert.ok(inView.length >= 1, "vehicles in view " + inView.length);
      const eff = inView.map((x) => x.pxPerSec * a.govern);
      assert.ok(Math.max(...eff) <= a.maxPxPerSec * 1.3, "speed cap holds on a phone " + Math.max(...eff).toFixed(0));
      const target = inView[eff.indexOf(Math.max(...eff))];
      await p.touchscreen.tap(target.sc.x, target.sc.y); await settle(p);
      assert.equal((await p.evaluate(() => window.__sg.state())).selected, target.key, "tap selects the fastest vehicle");
      assert.equal(await p.evaluate(() => window.__sgMobile.mode()), "voyage");
      assert.deepEqual(p._errors, []);
      await p.close();
    });
  }
} finally {
  await browser.close(); server.kill();
}
if (!writeFixture) { console.log(`${ok}/${total} mobile + desktop checks passed`); if (ok !== total) process.exit(1); }
