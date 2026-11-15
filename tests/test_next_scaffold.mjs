// v3.1 flag and layer checks. Flags default off, so a normal load stays unchanged.
// Tile and terrain checks use tiny local fixtures — not the production archives.
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer, launch, openApp } from "../tools/browser.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIX = path.join(root, "tests", "fixtures"); // files live under fixtures/pmtiles/
const port = 8800 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1280, 720);
let ok = 0, total = 0;
const check = async (name, fn) => { total++; await fn(); ok++; console.log("ok -", name); };
const skip = (name, reason) => { console.log("skip -", name, "(" + reason + ")"); };
const noise = (errs, extra = []) => errs.filter((e) => !extra.some((x) => x.test(e)));

function rangeServer(rootDir, { notFound } = {}) {
  const srv = http.createServer((req, res) => {
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "Range, Content-Type",
      "access-control-expose-headers": "Content-Range, Accept-Ranges, Content-Length",
      "access-control-allow-methods": "GET, HEAD, OPTIONS"
    };
    if (req.method === "OPTIONS") { res.writeHead(204, cors); res.end(); return; }
    if (notFound) { res.writeHead(404, { ...cors, "content-type": "text/plain" }); res.end("missing"); return; }
    const rel = decodeURIComponent((req.url || "/").split("?")[0]).replace(/^\/+/, "");
    const web = path.join(root, "web");
    const candidates = [path.normalize(path.join(rootDir, rel)), path.normalize(path.join(web, rel))];
    let file = null;
    for (const c of candidates) {
      const base = c.startsWith(path.normalize(rootDir)) ? path.normalize(rootDir)
        : c.startsWith(path.normalize(web)) ? path.normalize(web) : null;
      if (!base) continue;
      if (fs.existsSync(c) && fs.statSync(c).isFile()) { file = c; break; }
    }
    if (!file) {
      res.writeHead(404, { ...cors, "content-type": "text/plain" }); res.end("missing"); return;
    }
    const buf = fs.readFileSync(file);
    const range = /bytes=(\d+)-(\d*)/.exec(req.headers.range || "");
    if (range) {
      const start = Number(range[1]);
      const end = range[2] ? Number(range[2]) : buf.length - 1;
      const slice = buf.subarray(start, end + 1);
      res.writeHead(206, {
        ...cors,
        "content-type": "application/octet-stream",
        "accept-ranges": "bytes",
        "content-range": "bytes " + start + "-" + (start + slice.length - 1) + "/" + buf.length,
        "content-length": String(slice.length)
      });
      res.end(slice);
      return;
    }
    res.writeHead(200, { ...cors, "content-type": "application/octet-stream", "accept-ranges": "bytes", "content-length": String(buf.length) });
    res.end(buf);
  });
  return new Promise((resolve) => srv.listen(0, "127.0.0.1", () => resolve({ srv, port: srv.address().port })));
}

try {
  await check("flags default off and add no next-layer UI", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1");
    const st = await p.evaluate(() => {
      const f = window.SeaFlags;
      return {
        present: !!f,
        names: f && f.NAMES,
        all: f && f.all,
        any: f && f.any(),
        example: f && f.exampleData,
        nextToggles: [...document.querySelectorAll("[data-next-layer], #tPmtiles, #tTerrain, #tBells, #tLaws")].map((e) => e.id || e.dataset.nextLayer),
        exampleEntries: window.SeaAtlas && window.SeaAtlas.get && !!(window.SeaAtlas.get("law:zz-example-instrument") || window.SeaAtlas.get("bell:example-not-a-real-bell"))
      };
    });
    assert.equal(st.present, true, "SeaFlags missing");
    assert.equal(st.any, false);
    assert.equal(st.example, false);
    assert.ok(st.names && st.names.includes("pmtilesBorders"));
    assert.ok(Object.values(st.all).every((v) => v === false));
    assert.deepEqual(st.nextToggles, []);
    assert.equal(st.exampleEntries, false);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("?flag=pmtilesBorders turns only that flag on, toggle is off by default, and does not throw", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1&flag=pmtilesBorders");
    await p.waitForFunction(() => window.SeaNext && window.SeaNext.pmtilesBorders && window.SeaNext.pmtilesBorders.ready, { timeout: 10000 });
    const st = await p.evaluate(() => {
      const f = window.SeaFlags;
      const cb = document.getElementById("tPmtiles");
      return {
        on: f && f.on("pmtilesBorders"), any: f && f.any(), terrain: f && f.on("terrain"),
        ready: window.SeaNext && window.SeaNext.pmtilesBorders && window.SeaNext.pmtilesBorders.ready,
        toggle: !!(cb && cb.getAttribute("data-next-layer") === "pmtilesBorders"),
        checked: !!(cb && cb.checked),
        terrainToggle: !!document.getElementById("tTerrain"),
        layerState: window.SeaNext.pmtilesBorders.state()
      };
    });
    assert.equal(st.on, true);
    assert.equal(st.any, true);
    assert.equal(st.terrain, false);
    assert.equal(st.ready, true);
    assert.equal(st.toggle, true);
    assert.equal(st.checked, false);
    assert.equal(st.terrainToggle, false);
    assert.equal(st.layerState.on, false);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("?flag=terrain turns only that flag on and its toggle is off by default", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1&flag=terrain");
    await p.waitForFunction(() => window.SeaNext && window.SeaNext.terrain && window.SeaNext.terrain.ready, { timeout: 10000 });
    const st = await p.evaluate(() => {
      const f = window.SeaFlags;
      const cb = document.getElementById("tTerrain");
      return {
        on: f && f.on("terrain"), borders: f && f.on("pmtilesBorders"),
        toggle: !!(cb && cb.getAttribute("data-next-layer") === "terrain"),
        checked: !!(cb && cb.checked),
        bordersToggle: !!document.getElementById("tPmtiles"),
        layerState: window.SeaNext.terrain.state()
      };
    });
    assert.equal(st.on, true);
    assert.equal(st.borders, false);
    assert.equal(st.toggle, true);
    assert.equal(st.checked, false);
    assert.equal(st.bordersToggle, false);
    assert.equal(st.layerState.on, false);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("missing archives show layer unavailable and make no throw", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1&flag=pmtilesBorders&assets=local");
    await p.waitForFunction(() => window.SeaNext && window.SeaNext.pmtilesBorders && window.SeaNext.pmtilesBorders.ready, { timeout: 10000 });
    await p.evaluate(() => window.SeaNext.pmtilesBorders.enable(true));
    await p.waitForFunction(() => {
      const s = window.SeaNext.pmtilesBorders.state();
      return s.on && (s.status === "missing" || s.status === "down");
    }, { timeout: 10000 });
    const st = await p.evaluate(() => ({
      state: window.SeaNext.pmtilesBorders.state(),
      note: (document.getElementById("pmtilesNote") || {}).textContent,
      hidden: (document.getElementById("pmtilesNote") || {}).hidden,
      creditHidden: (document.getElementById("pmtilesCredit") || {}).hidden
    }));
    assert.equal(st.state.on, true);
    assert.match(st.note, /layer unavailable/);
    assert.equal(st.hidden, false);
    assert.equal(st.creditHidden, true);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  const missing = await rangeServer(FIX, { notFound: true });
  try {
    await check("a 404 from the asset host shows layer unavailable and does not throw", async () => {
      const r2 = "r2base=" + encodeURIComponent("http://127.0.0.1:" + missing.port + "/");
      const p = await openApp(browser, port, "capture=1&mute=1&flags=pmtilesBorders,terrain&" + r2);
      await p.waitForFunction(() => window.SeaNext && window.SeaNext.pmtilesBorders && window.SeaNext.pmtilesBorders.ready && window.SeaNext.terrain && window.SeaNext.terrain.ready, { timeout: 10000 });
      await p.evaluate(() => { window.SeaNext.pmtilesBorders.enable(true); window.SeaNext.terrain.enable(true); });
      await p.waitForFunction(() => {
        const b = window.SeaNext.pmtilesBorders.state();
        const t = window.SeaNext.terrain.state();
        return b.on && t.on && (b.status === "down" || b.status === "missing") && (t.status === "down" || t.status === "missing");
      }, { timeout: 15000 });
      const st = await p.evaluate(() => ({
        borders: window.SeaNext.pmtilesBorders.state(),
        terrain: window.SeaNext.terrain.state(),
        bNote: (document.getElementById("pmtilesNote") || {}).textContent,
        tNote: (document.getElementById("terrainNote") || {}).textContent
      }));
      assert.match(st.bNote, /layer unavailable/);
      assert.match(st.tNote, /layer unavailable/);
      assert.equal(st.borders.on, true);
      assert.equal(st.terrain.on, true);
      const errs = noise(p._errors, [/Failed to load resource/, /404/, /the server responded with a status/]);
      assert.deepEqual(errs, []);
      await p.close();
    });
  } finally {
    missing.srv.close();
  }

  const tiles = await rangeServer(FIX);
  const r2 = "r2base=" + encodeURIComponent("http://127.0.0.1:" + tiles.port + "/");
  try {
    await check("pmtiles borders draw from a local fixture and credit TIGER/Line 2026", async () => {
      const p = await openApp(browser, port, "capture=1&mute=1&flag=pmtilesBorders&" + r2);
      await p.waitForFunction(() => window.SeaNext && window.SeaNext.pmtilesBorders && window.SeaNext.pmtilesBorders.ready, { timeout: 10000 });
      await p.evaluate(() => {
        window.SeaNext.pmtilesBorders.enable(true);
        window.__sg.pov({ lat: 42.96, lng: -85.67, altitude: 0.2 });
      });
      await p.waitForFunction(() => {
        window.SeaNext.pmtilesBorders.update();
        const s = window.SeaNext.pmtilesBorders.state();
        return s.on && s.status === "ok" && s.features > 0;
      }, { timeout: 20000, polling: 400 });
      const st = await p.evaluate(() => {
        const ids = window.__sg.globe().polygonsData().map((d) => d.id + ":" + d.name);
        return {
          state: window.SeaNext.pmtilesBorders.state(),
          credit: (document.getElementById("pmtilesCredit") || {}).textContent,
          creditHidden: (document.getElementById("pmtilesCredit") || {}).hidden,
          noteHidden: (document.getElementById("pmtilesNote") || {}).hidden,
          ids
        };
      });
      assert.equal(st.state.status, "ok");
      assert.ok(st.state.features > 0, "features " + st.state.features);
      assert.match(st.credit, /TIGER\/Line 2026/);
      assert.equal(st.creditHidden, false);
      assert.equal(st.noteHidden, true);
      assert.ok(st.ids.some((x) => /census-state-.*Michigan/.test(x)), st.ids.join());
      assert.ok(st.ids.some((x) => /census-county-.*Kent/.test(x)), st.ids.join());
      assert.ok(st.ids.some((x) => /census-cousub-/.test(x)), st.ids.join());
      assert.ok(st.ids.some((x) => /census-place-/.test(x)), st.ids.join());
      assert.deepEqual(p._errors, []);
      await p.close();
    });

    await check("terrain relief draws where samples exist and credits 3DEP", async () => {
      const p = await openApp(browser, port, "capture=1&mute=1&flag=terrain&" + r2);
      await p.waitForFunction(() => window.SeaNext && window.SeaNext.terrain && window.SeaNext.terrain.ready, { timeout: 10000 });
      await p.evaluate(() => {
        window.SeaNext.terrain.enable(true);
        window.__sg.pov({ lat: 39.1, lng: -106.3, altitude: 0.4 });
      });
      await p.waitForFunction(() => {
        window.SeaNext.terrain.update();
        const s = window.SeaNext.terrain.state();
        return s.on && s.status === "ok" && s.tiles > 0;
      }, { timeout: 20000, polling: 400 });
      const st = await p.evaluate(() => ({
        state: window.SeaNext.terrain.state(),
        credit: (document.getElementById("terrainCredit") || {}).textContent,
        creditHidden: (document.getElementById("terrainCredit") || {}).hidden,
        noteHidden: (document.getElementById("terrainNote") || {}).hidden
      }));
      assert.equal(st.state.status, "ok");
      assert.ok(st.state.tiles > 0, "tiles " + st.state.tiles);
      assert.match(st.credit, /3DEP/);
      assert.match(st.credit, /zooms 0–6|zoom 6 partial/);
      assert.equal(st.creditHidden, false);
      assert.equal(st.noteHidden, true);
      assert.deepEqual(p._errors, []);
      await p.close();
    });

    await check("toggles stay off and issue no tile request until the user turns them on", async () => {
      const hits = [];
      tiles.srv.on("request", (req) => { if (/\/pmtiles\//.test(req.url || "")) hits.push(req.url); });
      const before = hits.length;
      const p = await openApp(browser, port, "capture=1&mute=1&flags=pmtilesBorders,terrain&" + r2);
      await p.waitForFunction(() => window.SeaNext && window.SeaNext.pmtilesBorders && window.SeaNext.pmtilesBorders.ready && window.SeaNext.terrain && window.SeaNext.terrain.ready, { timeout: 10000 });
      await new Promise((r) => setTimeout(r, 800));
      const st = await p.evaluate(() => ({
        b: window.SeaNext.pmtilesBorders.state(),
        t: window.SeaNext.terrain.state(),
        bChecked: document.getElementById("tPmtiles").checked,
        tChecked: document.getElementById("tTerrain").checked
      }));
      assert.equal(st.b.on, false);
      assert.equal(st.t.on, false);
      assert.equal(st.bChecked, false);
      assert.equal(st.tChecked, false);
      assert.equal(hits.length, before, "pmtiles host was contacted with toggles off: " + hits.slice(before).join());
      assert.deepEqual(p._errors, []);
      await p.close();
    });
  } finally {
    tiles.srv.close();
  }

  await check("frame guard is present on the main page and lite", async () => {
    const js = fs.readFileSync(path.join(root, "web", "js", "frame-guard.js"), "utf8");
    assert.match(js, /window\.top === window\.self/);
    assert.match(js, /window\.top\.location = window\.self\.location\.href/);
    assert.match(js, /SeaGlobe must be opened directly\./);
    assert.match(js, /window\.stop\s*\(/);
    assert.match(js, /__sgFrameBlocked/);
    assert.match(js, /grok\.me/);
    for (const f of ["index.html", "lite.html"]) {
      const html = fs.readFileSync(path.join(root, "web", f), "utf8");
      assert.match(html, /js\/frame-guard\.js/, f + " is missing the frame-guard script");
    }
  });

  const appUrl = (file) => "http://127.0.0.1:" + port + "/" + (file || "") + "?capture=1&mute=1&update=0&assets=local";
  const startHost = (html) => new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(html);
    });
    srv.listen(0, "127.0.0.1", () => resolve({ srv, port: srv.address().port }));
  });
  const childFrame = (page) => page.frames().find((f) => f !== page.mainFrame() && f.url().indexOf("127.0.0.1:" + port) >= 0);

  await check("frame guard: top-level runs", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1");
    const st = await p.evaluate(() => ({
      ready: document.documentElement.dataset.ready || "",
      blocked: !!window.__sgFrameBlocked,
      framed: window.top !== window.self,
      log: !!document.getElementById("logBtn")
    }));
    assert.equal(st.framed, false);
    assert.equal(st.blocked, false);
    assert.equal(st.ready, "1");
    assert.equal(st.log, true);
    await p.close();
  });

  await check("frame guard: a framed non-grok.me parent does not boot", async () => {
    const host = await startHost('<!doctype html><title>host</title><iframe id="sg" sandbox="allow-scripts allow-same-origin" src="' + appUrl("") + '"></iframe>');
    const p = await browser.newPage();
    try {
      await p.goto("http://127.0.0.1:" + host.port + "/", { waitUntil: "load" });
      await p.waitForFunction((port) => [...document.querySelectorAll("iframe")].some((f) => (f.src || "").indexOf("127.0.0.1:" + port) >= 0), { timeout: 10000 }, port);
      const frame = childFrame(p);
      assert.ok(frame, "iframe did not load");
      await frame.waitForFunction(() => window.__sgFrameBlocked === true || /SeaGlobe must be opened directly/.test(document.documentElement.textContent || ""), { timeout: 20000 });
      // ready is set ~50ms after boot; wait long enough that a missed block would have started the app
      for (let i = 0; i < 15; i++) {
        const ready = await frame.evaluate(() => document.documentElement.dataset.ready || "");
        assert.equal(ready, "", "app started inside a blocked frame (ready=" + ready + ")");
        await new Promise((r) => setTimeout(r, 200));
      }
      const st = await frame.evaluate(() => ({
        ready: document.documentElement.dataset.ready || "",
        blocked: !!window.__sgFrameBlocked,
        text: (document.body && document.body.textContent || document.documentElement.textContent || "").trim(),
        log: !!document.getElementById("logBtn")
      }));
      assert.equal(st.ready, "");
      assert.equal(st.blocked, true);
      assert.match(st.text, /SeaGlobe must be opened directly/);
      assert.equal(st.log, false);
    } finally {
      await p.close();
      host.srv.close();
    }
  });

  await check("frame guard: a grok.me parent is allowed", async () => {
    const host = await startHost('<!doctype html><title>host</title><iframe id="sg" src="' + appUrl("") + '"></iframe>');
    const p = await browser.newPage();
    try {
      await p.evaluateOnNewDocument(() => { window.__sgFrameParentStub = "https://app.grok.me"; });
      await p.goto("http://127.0.0.1:" + host.port + "/", { waitUntil: "load" });
      const frame = childFrame(p);
      assert.ok(frame, "iframe did not load");
      await frame.waitForFunction(() => document.documentElement.dataset.ready === "1", { timeout: 180000 });
      const st = await frame.evaluate(() => ({
        ready: document.documentElement.dataset.ready || "",
        blocked: !!window.__sgFrameBlocked,
        text: (document.body && document.body.textContent || "").slice(0, 80),
        log: !!document.getElementById("logBtn"),
        stub: window.__sgFrameParentStub
      }));
      assert.equal(st.stub, "https://app.grok.me");
      assert.equal(st.blocked, false);
      assert.equal(st.ready, "1");
      assert.equal(st.log, true);
    } finally {
      await p.close();
      host.srv.close();
    }
  });

  await check("three how-to questions return the matching Guide entry", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1");
    await p.waitForFunction(() => window.SeaAtlas && window.SeaChat && window.SeaGuide, { timeout: 60000 });
    await p.evaluate(() => window.SeaAtlas.ensureAll());
    const hits = await p.evaluate(() => {
      const ids = (q) => window.SeaChat.context(q).map((c) => c.id);
      return {
        terrain: ids("How do I turn on terrain?"),
        slider: ids("How do I use the time slider?"),
        chat: ids("How do I chat with my own key?"),
        help: !!document.getElementById("helpBtn"),
        routeTip: (document.getElementById("tRoutes") && document.getElementById("tRoutes").closest("label").getAttribute("title")) || ""
      };
    });
    assert.ok(hits.terrain.includes("app:guide-terrain"), "terrain " + hits.terrain);
    assert.ok(hits.slider.includes("app:guide-time-slider"), "slider " + hits.slider);
    assert.ok(hits.chat.includes("app:guide-chat"), "chat " + hits.chat);
    assert.equal(hits.help, true, "Help button missing");
    assert.match(hits.routeTip, /tracks of voyages/);
    await p.close();
  });

  await check("no console errors on desktop, phone or lite with layers on and off", async () => {
    const tiles = await rangeServer(FIX);
    const cases = [
      { file: "", q: "capture=1&mute=1", phone: false },
      { file: "", q: "capture=1&mute=1", phone: true },
      { file: "lite.html", q: "capture=1&mute=1", phone: false },
      { file: "", q: "capture=1&mute=1&flags=pmtilesBorders,terrain&r2base=" + encodeURIComponent("http://127.0.0.1:" + tiles.port + "/"), phone: false },
      { file: "", q: "capture=1&mute=1&flags=pmtilesBorders,terrain&r2base=" + encodeURIComponent("http://127.0.0.1:" + tiles.port + "/"), phone: true },
      { file: "lite.html", q: "capture=1&mute=1&flags=pmtilesBorders,terrain&r2base=" + encodeURIComponent("http://127.0.0.1:" + tiles.port + "/"), phone: false }
    ];
    try {
      for (const c of cases) {
        const p = await openApp(browser, port, c.q, c.file);
        if (c.phone) await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
        if (c.q.includes("flags=")) {
          await p.waitForFunction(() => document.getElementById("tPmtiles") && document.getElementById("tTerrain"), { timeout: 30000 });
        }
        await p.evaluate(async () => {
          const ids = ["tRoutes", "tWakes", "tWind", "tNight", "tSats", "tOrbit", "tRegions", "tHubs", "tCoords", "tLaunch", "tPmtiles", "tTerrain"];
          for (const id of ids) {
            const el = document.getElementById(id);
            if (!el) continue;
            el.click();
            await new Promise((r) => setTimeout(r, 30));
            el.click();
            await new Promise((r) => setTimeout(r, 30));
          }
        });
        const errs = noise(p._errors, [/Failed to load resource/, /404/, /the server responded with a status/]);
        assert.deepEqual(errs, [], (c.file || "index") + (c.phone ? " phone" : " desktop") + " " + JSON.stringify(errs));
        await p.close();
      }
    } finally {
      tiles.srv.close();
    }
  });

    skip("pre-recorded tour clip plays at 1.0 with captions", "todo: no voice picked, no audio generated");
  skip("historical bells appear on the time slider", "todo: no cited records yet");
  skip("quoted laws attach to country entries", "todo: official instruments not re-verified");
  skip("authority entries list verified offices only", "todo: no verified set yet");
  skip("federal tax section cites OLRC / IRS only", "todo: section not wired");
  skip("explainers require a primary-source citation", "todo: none shipped");

  console.log(ok + "/" + total + " next-scaffold checks passed");
} finally {
  await browser.close();
  server.kill();
}
if (ok < total) process.exit(1);
