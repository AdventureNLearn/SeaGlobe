// v3 framework in the browser: encyclopedia, drill-down regions (static packs + opt-in live TIGERweb from recorded
// fixtures), atlas tools, space layer, Listen and tours, chat (offline, local mock Worker), radio (local stand-in for
// YouTube's API; offline message), bring-your-own feeds (PC edition), and the R2 mock with fallback.
// No real outside request is made: live hosts are answered from tests/fixtures. Run: node tests/test_framework.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { root, startServer, launch, openApp, frame } from "../tools/browser.mjs";

const port = 8600 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1280, 800);
const FIX = path.join(root, "tests", "fixtures");
let ok = 0, total = 0;
const check = async (name, fn) => { total++; await fn(); ok++; console.log("ok -", name); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const listen = (srv) => new Promise((r) => srv.listen(0, "127.0.0.1", () => r(srv.address().port)));
// static fixture host with CORS (stands in for outside hosts)
const fixSrv = http.createServer((q, s) => {
  const p = path.join(FIX, decodeURIComponent(new URL(q.url, "http://x").pathname));
  if (!p.startsWith(FIX) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404, { "access-control-allow-origin": "*" }); s.end(); return; }
  s.writeHead(200, { "access-control-allow-origin": "*", "content-type": p.endsWith(".js") ? "text/javascript" : p.endsWith(".json") ? "application/json" : "text/plain" });
  fs.createReadStream(p).pipe(s);
});
const fport = await listen(fixSrv);
// mock chat Worker
let chatSeen = null;
const chatSrv = http.createServer((q, s) => {
  if (q.method === "OPTIONS") { s.writeHead(204, { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST" }); s.end(); return; }
  let b = ""; q.on("data", (c) => (b += c)); q.on("end", () => {
    chatSeen = JSON.parse(b);
    const id = chatSeen.context[0] && chatSeen.context[0].id;
    s.writeHead(200, { "access-control-allow-origin": "*", "content-type": "application/json" });
    s.end(JSON.stringify({ answer: "From the atlas: " + (id ? "[" + id + "]" : "[UNKNOWN]") + " and an invented [route:not-sent]." }));
  });
});
const cport = await listen(chatSrv);
// R2 mock with the textures
const r2dir = fs.mkdtempSync(path.join(os.tmpdir(), "sg-r2-"));
fs.mkdirSync(path.join(r2dir, "textures", "hd"), { recursive: true });
for (const f of ["earth-day-8k.jpg", "earth-night-4k.jpg", "earth-water-4k.png"]) fs.copyFileSync(path.join(root, "web", "textures", "hd", f), path.join(r2dir, "textures", "hd", f));
const r2port = 8700 + Math.floor(Math.random() * 90);
const r2 = spawn("python3", [path.join(root, "tools", "mock_r2.py"), r2dir, "--port", String(r2port)], { stdio: "ignore" });
await sleep(800);
const local = (errs, extra = []) => errs.filter((e) => !extra.some((x) => x.test(e)));

try {
  await check("encyclopedia: open, counts, search, entry with references, A–Z, timeline, compare, bibliography, sources, about", async () => {
    const p = await openApp(browser, port, "capture=1");
    await p.click("#atlasBtn");
    await p.waitForSelector("#atlasPanel:not([hidden])");
    const c = await p.evaluate(() => window.SeaAtlas.count());
    assert.ok(c.route >= 95 && c.place > 1200 && c.spacecraft === 14 && c.era === 6, JSON.stringify(c));
    await p.type("#atlasQ", "comet johannesburg");
    await sleep(500);
    const hits = await p.evaluate(() => window.SeaAtlas.search("comet johannesburg").map((e) => e.id));
    assert.ok(hits.includes("route:boac-comet-1952"), hits.join());
    await p.evaluate(() => window.SeaEncyclopedia.show("route:boac-comet-1952"));
    await p.waitForSelector("#atlasBody .aentry");
    const e = await p.evaluate(() => ({ t: document.querySelector("#atlasBody").innerText, refs: document.querySelectorAll("#atlasBody .arefs li").length }));
    assert.match(e.t, /Reconstruction/i); assert.ok(e.refs >= 1, "references"); assert.match(e.t, /Cite this/);
    await p.evaluate(() => document.querySelector("[data-act='cite']").click());
    assert.match(await p.evaluate(() => document.querySelector(".acite").textContent), /SeaGlobe/);
    for (const [h, sel, re] of [["#/az/s", "#atlasBody", /Sputnik 1/], ["#/timeline", "#atlasBody", /1957/], ["#/bibliography", "#atlasBody", /Primary|Secondary/],
      ["#/sources", "#atlasBody", /CC BY 4\.0/], ["#/about", "#atlasBody", /Built by AdventureNLearn/], ["#/compare/route:boac-comet-1952,route:pan-am-747-1970", ".acmp", /Evidence/]]) {
      await p.evaluate((x) => { location.hash = x; }, h); await sleep(400);
      assert.match(await p.evaluate((s) => document.querySelector(s).innerText, sel), re, h);
    }
    assert.match(await p.evaluate(() => document.querySelector("#pfoot a[href='https://x.com/AdventureNLearn']").textContent), /@AdventureNLearn/);
    assert.match(await p.evaluate(() => document.getElementById("pfoot").innerText), /Built by AdventureNLearn/);
    // region entries join search after the panel opens
    await p.waitForFunction(() => window.SeaAtlas.count().region > 3000, { timeout: 20000 });
    assert.ok((await p.evaluate(() => window.SeaAtlas.search("Michigan").map((e) => e.id))).includes("region:state-us-mi"));
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("drill-down: world › country › state › county with lazily loaded packs and town labels", async () => {
    const p = await openApp(browser, port, "capture=1&regions=1");
    await p.evaluate(() => window.__sg.pov({ lat: 42.96, lng: -85.67, altitude: 0.3 }));
    // capture mode pauses the frame loop, so drive the throttled update by hand
    await p.waitForFunction(() => { window.SeaRegions.update(); return window.SeaRegions.state().ctx.county; }, { timeout: 30000, polling: 500 });
    const s = await p.evaluate(() => window.SeaRegions.state());
    assert.equal(s.ctx.country, "United States of America"); assert.equal(s.ctx.state, "Michigan"); assert.match(s.ctx.county, /Kent/);
    const chip = await p.evaluate(() => document.getElementById("regionChip").innerText);
    assert.match(chip, /World › United States of America › Michigan › Kent/); assert.match(chip, /Made with Natural Earth/);
    const loaded = await p.evaluate(() => [...document.querySelectorAll("script[src^='data/regions/']")].map((x) => x.getAttribute("src")));
    assert.ok(loaded.includes("data/regions/counties/US-MI.js") && !loaded.includes("data/regions/counties/US-TX.js"), "lazy per view: " + loaded.join());
    assert.ok((await p.evaluate(() => window.__sg.globe().labelsData().length)) > 0, "town labels");
    assert.ok(await p.evaluate(() => window.SeaRegions.registry.every((r) => r.attribution && r.maxAlt)), "registry has attribution and zoom range");
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("live TIGERweb (opt-in): healthy host draws town boundaries from the recorded fixture; a down host is skipped with a message", async () => {
    for (const healthy of [true, false]) {
      const p = await openApp(browser, port, "capture=1&regions=1");
      await p.setRequestInterception(true);
      p.on("request", (r) => {
        const u = r.url();
        if (!u.startsWith("https://tigerweb.geo.census.gov/")) return r.continue();
        if (!healthy) return r.abort("connectionrefused");
        const f = u.includes("/4/query") ? "tigerweb-places-sample.json" : "tigerweb-service.json";
        r.respond({ status: 200, headers: { "access-control-allow-origin": "*", "content-type": "application/json" }, body: fs.readFileSync(path.join(FIX, "live", f)) });
      });
      await p.evaluate(() => window.__sg.pov({ lat: 42.95, lng: -85.65, altitude: 0.2 }));
      const st = await p.evaluate(() => window.SeaRegions.enableLive(true).then(() => window.SeaRegions.state()));
      if (healthy) {
        assert.equal(st.liveStatus, "ok");
        await p.waitForFunction(() => { window.SeaRegions.update(); return window.__sg.globe().polygonsData().some((d) => /^live-/.test(d.id)); }, { timeout: 20000, polling: 500 });
        assert.ok(await p.evaluate(() => window.__sg.globe().polygonsData().some((d) => d.name === "Wyoming city")));
        assert.match(await p.evaluate(() => document.getElementById("regionChip").innerText), /TIGERweb/);
      } else {
        assert.equal(st.liveStatus, "down"); assert.match(st.msg, /skipped/);
        await p.evaluate(() => window.SeaRegions.update()); await sleep(300);
        assert.match(await p.evaluate(() => document.getElementById("regionChip").innerText), /skipped/);
      }
      const errs = local(p._errors, [/EXTERNAL REQUEST https:\/\/tigerweb/, /ERR_CONNECTION_REFUSED|Failed to load resource/]);
      assert.deepEqual(errs, [], healthy ? "healthy" : "down");
      await p.close();
    }
  });

  await check("tools: measure (great circle), cursor coordinates, air hubs layer, print view", async () => {
    const p = await openApp(browser, port, "capture=1&noprint=1");
    const km = await p.evaluate(() => window.SeaTools.measurePoints({ lat: 51.4700, lon: -0.4543 }, { lat: 40.6413, lon: -73.7781 }));
    assert.ok(Math.abs(km - 5555) < 15, "LHR-JFK " + km);
    assert.match(await p.evaluate(() => document.getElementById("toolChip").innerText), /km · .* mi · .* nmi/);
    await p.evaluate(() => window.SeaTools.measure(false));
    await p.evaluate(() => window.SeaTools.coords(true));
    await p.mouse.move(640, 400); await sleep(200);
    assert.match(await p.evaluate(() => document.getElementById("toolChip").innerText), /Cursor .*° [NS], .*° [EW]/i);
    await p.evaluate(() => window.SeaTools.layer("hubs", true)); await frame(p);
    assert.ok((await p.evaluate(() => window.__sg.globe().pointsData().length)) > 1000);
    const pv = await p.evaluate(() => { const v = window.SeaTools.print(null); return { h: v.innerHTML.length, img: !!v.querySelector("img"), t: v.innerText }; });
    assert.ok(pv.img && /SeaGlobe — map view/.test(pv.t) && /Natural Earth/.test(pv.t));
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("space: GCAT counts drive the satellite dots, launch sites layer, illustrative orbit ring from an entry", async () => {
    const p = await openApp(browser, port, "capture=1&t=1990-06-01");
    const n = await p.evaluate(() => [window.SeaSky.payloadsBy(1957), window.SeaSky.payloadsBy(1990), window.SeaPlanet.satelliteCount(1990, 420), window.SeaPlanet.satelliteCount(1950, 420)]);
    assert.ok(n[0] === 2 && n[1] > 3000 && n[2] > 0 && n[3] === 0, JSON.stringify(n));
    await p.evaluate(() => window.SeaSky.sites(true)); await frame(p);
    assert.equal(await p.evaluate(() => window.__sg.globe().pointsData().length), 75);
    await p.evaluate(() => window.SeaSky.readout());
    assert.match(await p.evaluate(() => document.getElementById("skyReadout").innerText), /1990 .*orbital launch attempts.*GCAT/);
    await p.evaluate(() => window.SeaEncyclopedia.showOnGlobe(window.SeaAtlas.get("spacecraft:s25544")));
    assert.equal(await p.evaluate(() => window.SeaSky.ring()), "S25544");
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("listen: entry Listen button and a narrated tour with captions (speech muted in tests)", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1");
    await p.evaluate(() => window.SeaEncyclopedia.show("era:age-of-sail")); await p.waitForSelector("#atlasBody [data-listen]");
    await p.evaluate(() => document.querySelector("#atlasBody [data-listen]").click());
    assert.match(await p.evaluate(() => document.getElementById("listenCap").innerText), /Age of Sail/);
    await p.evaluate(() => window.SeaListen.stop());
    await p.evaluate(() => window.SeaListen.tour("space"));
    await p.waitForFunction(() => window.SeaListen.state().i >= 2, { timeout: 30000 });
    assert.match(await p.evaluate(() => document.getElementById("listenCap").innerText), /The space age · 2\/7/);
    await p.evaluate(() => window.SeaListen.stop());
    assert.ok(await p.evaluate(() => document.querySelectorAll("#tourList [data-listen]").length === 3));
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("chat: offline shows matching entries; no match is [UNKNOWN]; a Worker reply is linked and unsent citations are flagged", async () => {
    let p = await openApp(browser, port, "capture=1");
    await p.evaluate(() => { location.hash = "#/ask"; }); await p.waitForSelector("#chatForm");
    assert.equal(await p.evaluate(() => document.getElementById("chatStatus").dataset.mode), "offline");
    const off = await p.evaluate(() => window.SeaChat.ask("Concorde London New York"));
    assert.equal(off.mode, "offline"); assert.ok(off.ctx.some((c) => /concorde/.test(c.id)));
    assert.match(await p.evaluate(() => document.getElementById("chatLog").innerText), /Chat is offline/);
    const none = await p.evaluate(() => window.SeaChat.ask("zzqx unicorn submarine"));
    assert.match(none.answer, /^\[UNKNOWN\]/);
    assert.deepEqual(p._errors, []); await p.close();
    p = await openApp(browser, port, `capture=1&chaturl=${encodeURIComponent(`http://127.0.0.1:${cport}/chat`)}`);
    const on = await p.evaluate(() => window.SeaChat.ask("When did the Comet fly to Johannesburg?"));
    assert.equal(on.mode, "worker"); assert.ok(chatSeen && chatSeen.context.length > 0 && chatSeen.question);
    assert.ok(on.check.bad.includes("route:not-sent") && !on.check.grounded, "unsent citation flagged");
    await p.evaluate(() => { location.hash = "#/ask"; }); await p.waitForSelector("#chatLog");
    assert.match(await p.evaluate(() => document.getElementById("chatLog").innerText), /Warning: this reply cites/);
    assert.deepEqual(p._errors, []); await p.close();
  });

  await check("radio: nothing loads until pressed; one ≥200×200 player, no autoplay; blocked track skipped; offline says Radio needs internet", async () => {
    let p = await openApp(browser, port, `capture=1&radioapi=${encodeURIComponent(`http://127.0.0.1:${fport}/radio/iframe_api.js`)}`);
    await p.click("#radioBtn"); await p.waitForSelector("#radioPanel:not([hidden])");
    assert.equal(await p.evaluate(() => !!window.YT), false, "API not loaded before the user presses Load");
    const links = await p.evaluate(() => [...document.querySelectorAll(".radiolinks a")].map((a) => [a.href, a.target, a.rel]));
    assert.deepEqual(links.map((l) => l[0]), ["https://www.radio.net/s/exclusivelycreedenceclearwaterrevival", "https://www.iheart.com/artist/creedence-clearwater-revival-experience-33410533/"]);
    assert.ok(links.every((l) => l[1] === "_blank" && /noopener/.test(l[2])));
    assert.match(await p.evaluate(() => document.querySelector(".radiolinks").innerText), /outside site: radio\.net[\s\S]*outside site: iHeartRadio/i);
    await p.click("#radioLoad");
    await p.waitForFunction(() => window.SeaRadio.state().api === "ready", { timeout: 10000 });
    const opts = await p.evaluate(() => window.__ytCalls);
    assert.equal(opts.length, 1); assert.equal(opts[0].playerVars.autoplay, 0); assert.equal(opts[0].playerVars.list, "PLtzV2248lUVXcvP3goTFN-IzkrBX0CUye");
    assert.equal(opts[0].host, "https://www.youtube-nocookie.com");
    const box = await p.evaluate(() => { const r = document.getElementById("radioStage").getBoundingClientRect(); return [r.width, r.height]; });
    assert.ok(box[0] >= 200 && box[1] >= 200, "player box " + box);
    await p.click("#radioLoad").catch(() => {}); assert.equal((await p.evaluate(() => window.__ytCalls)).length, 1, "one player only");
    await p.evaluate(() => window.__ytPlayer.fail(150));
    assert.match(await p.evaluate(() => document.getElementById("radioMsg").textContent), /skipped because its owner does not allow embedding/);
    assert.equal(await p.evaluate(() => window.__ytPlayer.nexts), 1);
    await p.click("#radioClose");
    assert.equal(await p.evaluate(() => !!document.getElementById("radioPanel") || window.__ytDestroyed), 1, "closing removes the player");
    assert.deepEqual(p._errors, []); await p.close();
    // YouTube unreachable: clean message, app keeps running
    p = await openApp(browser, port, `capture=1&radioapi=${encodeURIComponent("http://127.0.0.1:9/iframe_api.js")}`);
    await p.evaluate(() => window.SeaRadio.open(true)); await p.click("#radioLoad");
    await p.waitForFunction(() => window.SeaRadio.state().api === "offline", { timeout: 15000 });
    assert.match(await p.evaluate(() => document.getElementById("radioMsg").textContent), /Radio needs internet/);
    assert.ok(await p.evaluate(() => window.__sg.state().routes === 95));
    assert.deepEqual(local(p._errors, [/ERR_CONNECTION_REFUSED|Failed to load resource/]), []); await p.close();
  });

  await check("R2 mock: textures load from the large-file host when set; a dead host falls back to the repo copy", async () => {
    let p = await openApp(browser, port, `capture=1&r2base=${encodeURIComponent(`http://127.0.0.1:${r2port}/`)}`);
    const reqs = []; // reload to capture texture requests from the start
    p.on("request", (r) => reqs.push(r.url()));
    await p.reload({ waitUntil: "load" }); await p.waitForFunction(() => document.documentElement.dataset.ready === "1", { timeout: 180000 });
    assert.ok(reqs.some((u) => u.startsWith(`http://127.0.0.1:${r2port}/textures/hd/earth-day-8k.jpg`)), "8k from R2 mock");
    assert.equal(await p.evaluate(() => window.SeaAssets.status("tex-day-8k")), "r2");
    assert.equal(await p.evaluate(() => window.SeaAssets.status("video-atlas")), "r2");
    assert.deepEqual(p._errors, []); await p.close();
    p = await openApp(browser, port, `capture=1&r2base=${encodeURIComponent("http://127.0.0.1:9/")}`);
    assert.equal(await p.evaluate(() => document.documentElement.dataset.ready), "1");
    assert.ok(await p.evaluate(() => window.SeaAssets.urls("tex-day-8k").length === 2));
    assert.deepEqual(local(p._errors, [/ERR_CONNECTION_REFUSED|Failed to load resource/]), []); await p.close();
  });

  await check("bring-your-own (PC edition only): TLE positions and receiver aircraft from fixtures; absent from the web edition", async () => {
    let p = await openApp(browser, port, "capture=1");
    assert.equal(await p.evaluate(() => !!window.SeaBYO || !!document.getElementById("byoBox")), false); await p.close();
    p = await openApp(browser, port, "capture=1", "byo.html");
    assert.equal(await p.evaluate(() => window.SEAGLOBE_EDITION.id), "byo");
    const tle = fs.readFileSync(path.join(FIX, "byo", "tle.txt"), "utf8");
    const n = await p.evaluate((t) => window.SeaBYO.startSats(t), tle);
    assert.equal(n, 1);
    const pos = await p.evaluate(() => window.SeaBYO.satPositions(new Date(Date.UTC(2026, 10, 14, 12)))[0]);
    assert.ok(Math.abs(pos.lat) <= 52 && pos.km > 350 && pos.km < 500, JSON.stringify(pos));
    await p.evaluate((u) => window.SeaBYO.startAir(u), `http://127.0.0.1:${fport}/byo/aircraft.json`);
    await p.waitForFunction(() => window.SeaBYO.state().air === 2, { timeout: 10000 });
    await p.evaluate(() => window.SeaBYO.stopAll());
    assert.deepEqual(p._errors, []); await p.close();
  });

  await check("phone: encyclopedia, radio and chips fit the screen with no errors", async () => {
    const ph = await launch(390, 844);
    try {
      const p = await openApp(ph, port, "capture=1&regions=1");
      await p.evaluate(() => window.SeaEncyclopedia.open(true)); await sleep(400);
      const a = await p.evaluate(() => { const r = document.getElementById("atlasPanel").getBoundingClientRect(); return [r.left, r.right, r.top, r.bottom]; });
      assert.ok(a[0] >= 0 && a[1] <= 390 && a[3] <= 844, "atlas " + a);
      await p.evaluate(() => { window.SeaEncyclopedia.open(false); window.SeaRadio.open(true); }); await sleep(300);
      const r = await p.evaluate(() => { const b = document.getElementById("radioStage").getBoundingClientRect(); return [b.left, b.right, b.width, b.height]; });
      assert.ok(r[0] >= 0 && r[1] <= 390 && r[2] >= 200 && r[3] >= 200, "radio " + r);
      assert.ok(await p.evaluate(() => !!document.getElementById("mAtlasBtn") && !!document.getElementById("mRadioBtn")));
      assert.deepEqual(p._errors, []); await p.close();
    } finally { await ph.close(); }
  });
} finally {
  await browser.close(); server.kill(); r2.kill(); fixSrv.close(); chatSrv.close(); fs.rmSync(r2dir, { recursive: true, force: true });
}
console.log(`${ok}/${total} framework checks passed`);
if (ok !== total) process.exit(1);
