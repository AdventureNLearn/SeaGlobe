// v2.3 air layer in the browser: corridors load, the three new aircraft can be found, selected and show
// their cited cards; air arcs ride above the sea lanes; the Ship's Log Type filter shows the air layer.
// Needs Chrome and puppeteer-core (PUPPETEER_CORE=<path>). Run: node tests/test_air.mjs
import assert from "node:assert/strict";
import { startServer, launch, openApp } from "../tools/browser.mjs";

const port = 8500 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1280, 720);
let ok = 0, total = 0;
const check = async (name, fn) => { total++; await fn(); ok++; console.log("ok -", name); };
const CASES = [
  ["wright-flyer", "1903-12-20", "-20,-75,1.6", /Wright Flyer \(1903\)/, /About the wright flyer \(1903\)/, /Wright_Flyer/],
  ["dc-3", "1948-09-01", "52,11,1.4", /C-47|Dakota/, /About the douglas dc-3 \/ c-47/, /Berlin_Blockade/],
  ["boeing-747", "1970-01-25", "48,-38,1.6", /Clipper Victor/, /About the boeing 747/, /Boeing_747/],
];
try {
  await check("air corridors load into the app with the rest of the atlas", async () => {
    const p = await openApp(browser, port, "capture=1&t=1985-06-01");
    const n = await p.evaluate(() => Object.keys(window.SEAGLOBE_DATA).filter((k) => /^routes:air-/.test(k)).map((k) => window.SEAGLOBE_DATA[k].routes.length));
    assert.equal(n.length, 3, "three air-* families"); assert.ok(n.reduce((a, b) => a + b) >= 20, "corridors " + n);
    assert.equal((await p.evaluate(() => window.__sg.state())).routes, 95, "all records prepared");
    assert.deepEqual(p._errors, []);
    await p.close();
  });
  for (const [veh, t, pov, ship, about, cite] of CASES) {
    await check(`${veh}: on ${t} it can be found, selected and shows its cited card with the reconstruction label`, async () => {
      const p = await openApp(browser, port, `capture=1&t=${t}&pov=${pov}`);
      const h = await p.evaluate((v) => window.__sg.find((x) => x.route.vehicle === v), veh);
      assert.ok(h, veh + " live");
      await p.evaluate((k) => window.__sg.select(k), h.key);
      const s = await p.evaluate(() => window.__sg.state());
      assert.equal(s.selected, h.key);
      const card = await p.evaluate(() => ({ ship: document.getElementById("dShip").innerText, pills: document.getElementById("dPills").innerText,
        notes: document.getElementById("dNotes").innerText, cite: document.getElementById("dCite").innerText }));
      assert.match(card.ship + " " + card.notes, ship);
      assert.match(card.pills, /Reconstruction/i);
      assert.match(card.notes, /History\. /); assert.match(card.notes, about);
      assert.match(card.cite, cite); assert.match(card.cite, /OurAirports/);
      // flies above the drawn surface (sea vessels sit at 0)
      const wl = await p.evaluate((k) => window.__sg.waterline(k), h.key);
      assert.ok(wl && wl.originAboveSurface > 0, veh + " above the surface " + JSON.stringify(wl));
      assert.deepEqual(p._errors, []);
      await p.close();
    });
  }
  await check("clicking a jet-age aircraft on screen selects it (speed cap keeps it clickable at 20x)", async () => {
    const p = await openApp(browser, port, "capture=1&t=1970-01-25&pov=48,-38,1.6&speed=20");
    await p.evaluate(() => window.__sg.play(true));
    for (let f = 0; f < 15; f++) await p.evaluate(() => window.__sg.advance(1 / 30));
    const a = await p.evaluate(() => window.__sg.assist());
    const max = Math.max(...a.speeds.map((x) => x.pxPerSec * a.govern));
    assert.ok(max <= a.maxPxPerSec * 1.3, "speed cap " + max.toFixed(0));
    const h = await p.evaluate(() => window.__sg.find((x) => x.route.vehicle === "boeing-747"));
    assert.ok(h && h.screen, "747 on screen");
    await p.mouse.click(h.screen.x, h.screen.y);
    assert.equal((await p.evaluate(() => window.__sg.state())).selected, h.key, "click selects the 747");
    assert.deepEqual(p._errors, []);
    await p.close();
  });
  await check("Ship's Log Type = air lists the corridors with the reconstruction flag", async () => {
    const p = await openApp(browser, port, "capture=1&t=1950-01-01");
    await p.evaluate(() => { window.__sg.log(true); window.__sg.logSet("type", "air"); });
    const ids = await p.evaluate(() => window.__sg.logRows());
    const recs = await p.evaluate(() => Object.keys(window.SEAGLOBE_DATA).filter((k) => /^routes:/.test(k)).flatMap((k) => window.SEAGLOBE_DATA[k].routes).map((r) => ({ id: r.id, type: r.type, rec: r.reconstruction })));
    const by = Object.fromEntries(recs.map((r) => [r.id, r]));
    assert.ok(ids.length >= 40, "air rows " + ids.length);
    assert.ok(ids.every((i) => by[i].type === "air" && by[i].rec === true), "all air, all reconstructions");
    for (const id of ["wright-kitty-hawk-1903", "berlin-airlift-frankfurt-tempelhof", "pan-am-747-1970", "concorde-london-new-york"]) assert.ok(ids.includes(id), id);
    assert.match(await p.evaluate(() => document.getElementById("logList").innerText), /Wright Flyer/);
    assert.deepEqual(p._errors, []);
    await p.close();
  });
} finally {
  await browser.close(); server.kill();
}
console.log(`${ok}/${total} air-layer checks passed`);
if (ok !== total) process.exit(1);
