import assert from "node:assert/strict";
import { startServer, launch, openApp } from "../tools/browser.mjs";

const port = 8900 + Math.floor(Math.random() * 80);
const server = await startServer(port);
const browser = await launch(1280, 720);
const views = [
  { name: "FRA Paris (new 10m pack)", lat: 48.862, lng: 2.36, altitude: 0.6, expectCountry: /France/, expectState: /Paris/, pack: "data/regions/admin1/FRA.js" },
  { name: "MEX Sonora (new 10m pack)", lat: 29.011, lng: -111.246, altitude: 0.7, expectCountry: /Mexico/, expectState: /Sonora/, pack: "data/regions/admin1/MEX.js" },
  { name: "PRI (rest pack)", lat: 18.24625, lng: -66.45125, altitude: 0.5, expectCountry: /Puerto Rico/, expectState: /Puerto Rico/, pack: "data/regions/admin1/rest.js" },
  { name: "FLK (rest pack)", lat: -51.76056, lng: -59.94389, altitude: 0.5, expectCountry: /Falkland/, expectState: /Falkland/, pack: "data/regions/admin1/rest.js" },
];
const cases = [
  { label: "desktop", file: "", phone: false },
  { label: "phone", file: "", phone: true },
  { label: "lite", file: "lite.html", phone: false },
];
let ok = 0, total = 0;
try {
  for (const c of cases) {
    const p = await openApp(browser, port, "capture=1&mute=1&regions=1", c.file);
    if (c.phone) await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const failed = [];
    p.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url()); });
    for (const v of views) {
      total++;
      await p.evaluate((pov) => window.__sg.pov(pov), { lat: v.lat, lng: v.lng, altitude: v.altitude });
      const countryRe = v.expectCountry.source;
      const stateRe = v.expectState.source;
      await p.waitForFunction((lat, lng, countryRe, stateRe) => {
        const pov = window.__sg.globe().pointOfView();
        if (Math.abs(pov.lat - lat) > 0.8 || Math.abs(((pov.lng + 540) % 360) - 180 - lng) > 0.8) return false;
        return window.SeaRegions.update().then(() => {
          const s = window.SeaRegions.state();
          return !!(s.ctx && new RegExp(countryRe).test(String(s.ctx.country)) && new RegExp(stateRe).test(String(s.ctx.state)));
        });
      }, { timeout: 30000, polling: 400 }, v.lat, v.lng, countryRe, stateRe);
      const got = await p.evaluate(() => {
        const s = window.SeaRegions.state();
        const loaded = [...document.querySelectorAll("script[src^='data/regions/']")].map((x) => x.getAttribute("src"));
        const polys = window.__sg.globe().polygonsData() || [];
        const statePolys = polys.filter((d) => d.lvl === 1);
        return { ctx: s.ctx, loaded, stateCount: statePolys.length, named: statePolys.filter((d) => d.name).length, sample: statePolys.slice(0, 3).map((d) => d.name) };
      });
      assert.match(String(got.ctx.country), v.expectCountry, c.label + " " + v.name + " country " + JSON.stringify(got));
      assert.match(String(got.ctx.state), v.expectState, c.label + " " + v.name + " state " + JSON.stringify(got));
      assert.ok(got.loaded.includes(v.pack), c.label + " " + v.name + " missing pack " + got.loaded.join());
      assert.ok(got.stateCount > 0 && got.named === got.stateCount, c.label + " " + v.name + " unlabeled states " + JSON.stringify(got));
      const errs = p._errors.filter((e) => !/update=0|version\.json/.test(e));
      assert.deepEqual(errs, [], c.label + " " + v.name + " console " + JSON.stringify(errs));
      assert.deepEqual(failed, [], c.label + " " + v.name + " http " + JSON.stringify(failed));
      ok++;
      console.log("ok -", c.label, v.name, "→", got.ctx.country, "›", got.ctx.state, "states", got.stateCount);
    }
    await p.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(ok + "/" + total + " admin-1 view checks passed");
if (ok < total) process.exit(1);
