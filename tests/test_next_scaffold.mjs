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
        nextToggles: [...document.querySelectorAll("[data-next-layer], #tPmtiles, #tTerrain, #tLaws")].map((e) => e.id || e.dataset.nextLayer),
        exampleEntries: window.SeaAtlas && window.SeaAtlas.get && !!(window.SeaAtlas.get("law:zz-example-instrument") || window.SeaAtlas.get("bell:example-not-a-real-bell")),
        topicsBtn: !!document.getElementById("topicsBtn"),
        mTopicsBtn: !!document.getElementById("mTopicsBtn"),
        topicsPanel: !!document.getElementById("topicsPanel")
      };
    });
    assert.equal(st.present, true, "SeaFlags missing");
    assert.equal(st.any, false);
    assert.equal(st.example, false);
    assert.ok(st.names && st.names.includes("pmtilesBorders"));
    assert.ok(st.names && st.names.includes("topicNav"));
    assert.ok(Object.values(st.all).every((v) => v === false));
    assert.deepEqual(st.nextToggles, []);
    assert.equal(st.exampleEntries, false);
    assert.equal(st.topicsBtn, false, "Topics button must stay out of a normal visit");
    assert.equal(st.mTopicsBtn, false);
    assert.equal(st.topicsPanel, false);
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

    await check("terrain at zoom 7-8 falls back to the closest archive zoom and does not throw", async () => {
      const p = await openApp(browser, port, "capture=1&mute=1&flag=terrain&" + r2);
      await p.waitForFunction(() => window.SeaNext && window.SeaNext.terrain && window.SeaNext.terrain.ready, { timeout: 10000 });
      const run = async (altitude) => {
        await p.evaluate((altitude) => {
          window.SeaNext.terrain.enable(true);
          window.__sg.pov({ lat: 39.1, lng: -106.3, altitude });
        }, altitude);
        await p.waitForFunction(() => {
          window.SeaNext.terrain.update();
          const s = window.SeaNext.terrain.state();
          return s.on && s.status === "ok" && s.tiles > 0 && s.closeFallback === true;
        }, { timeout: 20000, polling: 400 });
        return p.evaluate(() => {
          const s = window.SeaNext.terrain.state();
          return {
            state: s,
            credit: (document.getElementById("terrainCredit") || {}).textContent,
            creditHidden: (document.getElementById("terrainCredit") || {}).hidden,
            noteHidden: (document.getElementById("terrainNote") || {}).hidden
          };
        });
      };
      const z7 = await run(0.35);
      const z8 = await run(0.18);
      for (const st of [z7, z8]) {
        assert.equal(st.state.status, "ok");
        assert.ok(st.state.tiles > 0, "tiles " + st.state.tiles);
        assert.equal(st.state.archiveMax, 6);
        assert.equal(st.state.closeFallback, true);
        assert.ok(st.state.usedZoom <= 6, "usedZoom " + st.state.usedZoom);
        assert.match(st.credit, /3DEP/);
        assert.match(st.credit, /Zoom 7.8 tiles are not in this archive/);
        assert.equal(st.creditHidden, false);
        assert.equal(st.noteHidden, true);
      }
      assert.ok(z7.state.viewZoom >= 7, "z7 view " + z7.state.viewZoom);
      assert.ok(z8.state.viewZoom >= 8, "z8 view " + z8.state.viewZoom);
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

  const clickLayer = async (page, id, on) => {
    await page.evaluate((id, on) => {
      const el = document.getElementById(id);
      if (!el) throw new Error("missing " + id);
      if (el.checked !== on) el.click();
    }, id, on);
  };

  await check("the cap blocks the next heavy layer and shows the notice", async () => {
    const tiles = await rangeServer(FIX);
    const p = await openApp(browser, port, "capture=1&mute=1&flags=pmtilesBorders,terrain&r2base=" + encodeURIComponent("http://127.0.0.1:" + tiles.port + "/"));
    try {
      await p.waitForFunction(() => window.SeaLayers && document.getElementById("tPmtiles") && document.getElementById("tTerrain"), { timeout: 30000 });
      const cap = await p.evaluate(() => window.SeaLayers.cap());
      assert.equal(cap, 5);
      const heavy = ["tWind", "tRegions", "tHubs", "tLaunch", "tPmtiles"];
      for (const id of heavy) await clickLayer(p, id, true);
      const atCap = await p.evaluate(() => {
        const on = (id) => document.getElementById(id).checked;
        return {
          active: window.SeaLayers.active().slice().sort(),
          wind: on("tWind"),
          regions: window.SeaRegions.state().on,
          tools: window.SeaTools.state().layers.slice().sort(),
          pmtiles: window.SeaNext.pmtilesBorders.state().on,
          defaults: { routes: on("tRoutes"), wakes: on("tWakes"), night: on("tNight"), sats: on("tSats") }
        };
      });
      assert.deepEqual(atCap.active, ["hubs", "launch", "pmtilesBorders", "regions", "wind"]);
      assert.equal(atCap.wind, true);
      assert.equal(atCap.regions, true);
      assert.deepEqual(atCap.tools, ["hubs", "launch"]);
      assert.equal(atCap.pmtiles, true);
      assert.deepEqual(atCap.defaults, { routes: true, wakes: true, night: true, sats: true });
      await clickLayer(p, "tTerrain", true);
      const blocked = await p.evaluate(() => ({
        checked: document.getElementById("tTerrain").checked,
        on: window.SeaNext.terrain.state().on,
        notice: window.SeaLayers.notice(),
        noticeEl: (document.getElementById("layerNotice") || {}).textContent,
        hidden: document.getElementById("layerNotice") && document.getElementById("layerNotice").hidden,
        active: window.SeaLayers.active().slice().sort(),
        orbit: document.getElementById("tOrbit").checked
      }));
      assert.equal(blocked.checked, false);
      assert.equal(blocked.on, false);
      assert.match(blocked.notice, /Only 5 heavier layers can be on at once/);
      assert.match(blocked.notice, /Turn one off to add another/);
      assert.equal(blocked.noticeEl, blocked.notice);
      assert.equal(blocked.hidden, false);
      assert.deepEqual(blocked.active, ["hubs", "launch", "pmtilesBorders", "regions", "wind"]);
      // a light layer still turns on past the cap
      await clickLayer(p, "tOrbit", true);
      assert.equal(await p.evaluate(() => document.getElementById("tOrbit").checked), true);
      assert.deepEqual(p._errors.filter((e) => !/Failed to load resource|404|the server responded with a status/.test(e)), []);
    } finally {
      await p.close();
      tiles.srv.close();
    }
  });

  await check("phone and lite use the lower cap", async () => {
    // phone
    const ph = await openApp(browser, port, "capture=1&mute=1");
    await ph.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await ph.waitForFunction(() => window.SeaLayers && document.getElementById("tLaunch"), { timeout: 30000 });
    const phoneCap = await ph.evaluate(() => window.SeaLayers.state());
    assert.equal(phoneCap.cap, 3);
    assert.equal(phoneCap.phone, true);
    for (const id of ["tWind", "tRegions", "tHubs"]) await clickLayer(ph, id, true);
    await clickLayer(ph, "tLaunch", true);
    const phoneBlocked = await ph.evaluate(() => ({
      checked: document.getElementById("tLaunch").checked,
      tools: window.SeaTools.state().layers.slice().sort(),
      notice: window.SeaLayers.notice(),
      active: window.SeaLayers.active().slice().sort()
    }));
    assert.equal(phoneBlocked.checked, false);
    assert.deepEqual(phoneBlocked.tools, ["hubs"]);
    assert.match(phoneBlocked.notice, /Only 3 heavier layers can be on at once on a phone/);
    assert.deepEqual(phoneBlocked.active, ["hubs", "regions", "wind"]);
    const phoneErrs = ph._errors.filter((e) => !/Failed to load resource|404|the server responded with a status/.test(e));
    assert.deepEqual(phoneErrs, []);
    await ph.close();

    // lite (wide window still uses the lower cap)
    const lite = await openApp(browser, port, "capture=1&mute=1", "lite.html");
    await lite.waitForFunction(() => window.SeaLayers && document.getElementById("tLaunch"), { timeout: 30000 });
    const liteSt = await lite.evaluate(() => window.SeaLayers.state());
    assert.equal(liteSt.cap, 3);
    assert.equal(liteSt.lite, true);
    for (const id of ["tWind", "tRegions", "tHubs"]) await clickLayer(lite, id, true);
    await clickLayer(lite, "tLaunch", true);
    const liteBlocked = await lite.evaluate(() => ({
      checked: document.getElementById("tLaunch").checked,
      notice: window.SeaLayers.notice(),
      active: window.SeaLayers.active().slice().sort()
    }));
    assert.equal(liteBlocked.checked, false);
    assert.match(liteBlocked.notice, /Only 3 heavier layers can be on at once in the lite edition/);
    assert.deepEqual(liteBlocked.active, ["hubs", "regions", "wind"]);
    assert.deepEqual(lite._errors.filter((e) => !/Failed to load resource|404|the server responded with a status/.test(e)), []);
    await lite.close();
  });

  await check("turning a layer off frees its slot", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1");
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.waitForFunction(() => window.SeaLayers && document.getElementById("tLaunch"), { timeout: 30000 });
    for (const id of ["tWind", "tRegions", "tHubs"]) await clickLayer(p, id, true);
    await clickLayer(p, "tLaunch", true);
    assert.equal(await p.evaluate(() => document.getElementById("tLaunch").checked), false);
    await clickLayer(p, "tHubs", false);
    const freed = await p.evaluate(() => ({
      hubs: window.SeaTools.state().layers,
      hubItemsGone: !(window.SeaTools.state().layers.includes("hubs")),
      active: window.SeaLayers.active().slice().sort()
    }));
    assert.deepEqual(freed.active, ["regions", "wind"]);
    assert.equal(freed.hubItemsGone, true);
    await clickLayer(p, "tLaunch", true);
    const after = await p.evaluate(() => ({
      checked: document.getElementById("tLaunch").checked,
      tools: window.SeaTools.state().layers.slice().sort(),
      notice: window.SeaLayers.notice(),
      noticeHidden: document.getElementById("layerNotice") && document.getElementById("layerNotice").hidden,
      active: window.SeaLayers.active().slice().sort(),
      defaults: { routes: document.getElementById("tRoutes").checked, wakes: document.getElementById("tWakes").checked, night: document.getElementById("tNight").checked, sats: document.getElementById("tSats").checked }
    }));
    assert.equal(after.checked, true);
    assert.deepEqual(after.tools, ["launch"]);
    assert.equal(after.notice, "");
    assert.equal(after.noticeHidden, true);
    assert.deepEqual(after.active, ["launch", "regions", "wind"]);
    assert.deepEqual(after.defaults, { routes: true, wakes: true, night: true, sats: true });
    assert.deepEqual(p._errors.filter((e) => !/Failed to load resource|404|the server responded with a status/.test(e)), []);
    await p.close();
  });

  await check("the layer test hook is present only in test mode", async () => {
    const tes = await openApp(browser, port, "capture=1&mute=1");
    await tes.waitForFunction(() => window.SeaLayers, { timeout: 30000 });
    const on = await tes.evaluate(() => {
      const h = window.__sgLayerHook;
      return {
        hasHook: !!h,
        cap: h && h.cap(),
        state: h && h.state(),
        layers: h && h.state() && h.state().active,
        hasReapply: !!(h && h.reapply)
      };
    });
    assert.equal(on.hasHook, true);
    assert.equal(on.cap, 5);
    assert.deepEqual(on.layers, []);
    assert.equal(on.hasReapply, true);
    assert.equal(on.state.cap, 5);
    await tes.close();
    const plain = await openApp(browser, port, "mute=1");
    await plain.waitForFunction(() => window.SeaLayers, { timeout: 30000 });
    const off = await plain.evaluate(() => window.__sgLayerHook);
    assert.equal(off, undefined);
    await plain.close();
  });

  await check("narrowing the window re-applies the cap and keeps the allowed layers on", async () => {
    const tiles = await rangeServer(FIX);
    const p = await openApp(browser, port, "capture=1&mute=1&flag=pmtilesBorders&r2base=" + encodeURIComponent("http://127.0.0.1:" + tiles.port + "/"));
    try {
      await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
      await p.waitForFunction(() => window.SeaLayers && document.getElementById("tLaunch") && document.getElementById("tPmtiles"), { timeout: 30000 });
      assert.equal(await p.evaluate(() => window.SeaLayers.cap()), 5);
      for (const id of ["tWind", "tRegions", "tHubs", "tLaunch", "tPmtiles"]) await clickLayer(p, id, true);
      const atFive = await p.evaluate(() => ({
        cap: window.SeaLayers.cap(),
        active: window.SeaLayers.active().slice(),
        hook: window.__sgLayerHook && window.__sgLayerHook.state()
      }));
      assert.equal(atFive.cap, 5);
      assert.deepEqual(atFive.active.slice().sort(), ["hubs", "launch", "pmtilesBorders", "regions", "wind"]);
      assert.deepEqual(atFive.hook.active.slice().sort(), atFive.active.slice().sort());
      await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
      const afterResize = await p.evaluate(() => {
        window.dispatchEvent(new Event("resize"));
        let applied = null, err = null;
        try { applied = window.SeaLayers.reapply(); } catch (e) { err = String(e && e.stack || e); }
        return { applied, err, after: window.SeaLayers.state() };
      });
      assert.equal(afterResize.err, null, "reapply threw: " + afterResize.err + " " + JSON.stringify(afterResize));
      const after = await p.evaluate(() => ({
        cap: window.SeaLayers.cap(),
        phone: window.SeaLayers.isPhone(),
        active: window.SeaLayers.active().slice(),
        hook: window.__sgLayerHook && window.__sgLayerHook.state(),
        checks: {
          wind: document.getElementById("tWind").checked,
          regions: document.getElementById("tRegions").checked,
          hubs: document.getElementById("tHubs").checked,
          launch: document.getElementById("tLaunch").checked,
          pmtiles: document.getElementById("tPmtiles").checked
        },
        regionsOn: window.SeaRegions.state().on,
        pmtilesOn: window.SeaNext.pmtilesBorders.state().on,
        tools: window.SeaTools.state().layers.slice().sort(),
        notice: window.SeaLayers.notice()
      }));
      assert.equal(after.cap, 3);
      assert.equal(after.phone, true);
      assert.deepEqual(after.active, ["wind", "regions", "hubs"]);
      assert.deepEqual(after.hook.active, ["wind", "regions", "hubs"]);
      assert.deepEqual(after.checks, { wind: true, regions: true, hubs: true, launch: false, pmtiles: false });
      assert.equal(after.regionsOn, true);
      assert.equal(after.pmtilesOn, false);
      assert.deepEqual(after.tools, ["hubs"]);
      assert.match(after.notice, /Only 3 heavier layers can be on at once on a phone/);
      assert.deepEqual(p._errors.filter((e) => !/Failed to load resource|404|the server responded with a status/.test(e)), []);
    } finally {
      await p.close();
      tiles.srv.close();
    }
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
          const ids = ["tRoutes", "tWakes", "tShips", "tWind", "tNight", "tSats", "tOrbit", "tRegions", "tHubs", "tCoords", "tLaunch", "tBells", "tPmtiles", "tTerrain"];
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

  await check("ships and assets toggle hides moving models and frees their work", async () => {
    const p = await openApp(browser, port, "capture=1");
    await p.waitForFunction(() => window.__sg && window.__sg.state && window.__sg.state().live > 0, { timeout: 30000 });
    const on = await p.evaluate(() => {
      const s = window.__sg.state();
      const cb = document.getElementById("tShips");
      return { live: s.live, ships: s.ships, shipsWork: s.shipsWork, checked: !!(cb && cb.checked), tip: (cb && cb.parentElement && cb.parentElement.getAttribute("title")) || "" };
    });
    assert.equal(on.ships, true); assert.equal(on.checked, true); assert.ok(on.live > 0, "models present by default: " + on.live);
    assert.match(on.tip, /moving ships, aircraft and vehicles/i);
    const off = await p.evaluate(() => {
      window.__sg.layers({ ships: false });
      const s = window.__sg.state();
      const w1 = s.shipsWork;
      window.__sg.layers({ ships: false });
      const s2 = window.__sg.state();
      return { live: s.live, ships: s.ships, checked: document.getElementById("tShips").checked, w1, w2: s2.shipsWork, count: (document.getElementById("activeCount") || {}).textContent };
    });
    assert.equal(off.ships, false); assert.equal(off.checked, false); assert.equal(off.live, 0);
    assert.equal(off.w1, off.w2, "turning the layer off must not keep stepping models");
    assert.match(off.count, /Ships and assets off/);
    const back = await p.evaluate(() => { window.__sg.layers({ ships: true }); return window.__sg.state(); });
    assert.equal(back.ships, true); assert.ok(back.live > 0, "models return when the toggle is on");
    assert.ok(back.shipsWork > off.w2, "work resumes only when the toggle is on");
    // capture=1 must not write the layout
    assert.equal(await p.evaluate(() => { try { return localStorage.getItem("seaglobe-windows"); } catch (e) { return null; } }), null);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("below state level, only the selected state's counties are drawn and packs unload on change", async () => {
    const p = await openApp(browser, port, "capture=1&regions=1");
    await p.evaluate(() => window.__sg.pov({ lat: 42.96, lng: -85.67, altitude: 0.3 }));
    await p.waitForFunction(() => { window.SeaRegions.update(); const s = window.SeaRegions.state(); return s.ctx.state === "Michigan" && /Kent/.test(s.ctx.county || ""); }, { timeout: 30000, polling: 200 });
    const mi = await p.evaluate(() => {
      const drawn = (window.__sg.globe().polygonsData() || []).filter((d) => d.lvl === 2);
      const s = window.SeaRegions.state();
      const towns = window.__sg.globe().labelsData() || [];
      return { n: drawn.length, packs: s.packs, drawn: s.drawn, adm1: [...new Set(towns.map((t) => t.adm1).filter(Boolean))], state: s.ctx.state };
    });
    assert.equal(mi.n, 83, "Michigan counties drawn, not the full US set: " + mi.n);
    assert.ok(mi.n < 3224);
    assert.deepEqual(mi.packs.filter((k) => k.startsWith("counties/")), ["counties/US-MI"]);
    assert.ok(mi.adm1.every((a) => a === "Michigan"), "towns of the selected state only: " + mi.adm1.join());
    await p.evaluate(() => window.__sg.pov({ lat: 30.267, lng: -97.743, altitude: 0.3 }));
    await p.waitForFunction(() => { window.SeaRegions.update(); const s = window.SeaRegions.state(); return s.ctx.state === "Texas" && s.ctx.county; }, { timeout: 30000, polling: 200 });
    const tx = await p.evaluate(() => {
      const drawn = (window.__sg.globe().polygonsData() || []).filter((d) => d.lvl === 2);
      const s = window.SeaRegions.state();
      const mem = (s.packs || []).filter((k) => k.startsWith("counties/"));
      let inMem = 0;
      const R = window.SEAGLOBE_REGIONS || {};
      for (const k of mem) inMem += (R[k].counties || []).length;
      return { n: drawn.length, packs: mem, inMem, state: s.ctx.state, county: s.ctx.county, towns: (s.drawn || {}).towns };
    });
    assert.equal(tx.state, "Texas");
    assert.equal(tx.n, 254, "Texas counties only: " + tx.n);
    assert.deepEqual(tx.packs, ["counties/US-TX"]);
    assert.equal(tx.inMem, 254);
    assert.ok(!tx.packs.includes("counties/US-MI"), "Michigan pack unloaded");
    assert.ok(tx.inMem < 3224);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("returning to a state fetches its county pack again after eviction", async () => {
    const p = await openApp(browser, port, "capture=1&regions=1");
    const fetched = [];
    p.on("request", (r) => {
      const u = r.url();
      if (/\/counties\/US-MI\.js(\?|$)/.test(u)) fetched.push("MI");
      if (/\/counties\/US-OH\.js(\?|$)/.test(u)) fetched.push("OH");
    });
    await p.evaluate(() => window.__sg.pov({ lat: 42.96, lng: -85.67, altitude: 0.3 }));
    await p.waitForFunction(() => { window.SeaRegions.update(); return window.SeaRegions.state().ctx.state === "Michigan"; }, { timeout: 30000, polling: 200 });
    const first = await p.evaluate(() => [...document.querySelectorAll("script[src*='counties/US-MI.js']")].length);
    assert.ok(first >= 1, "Michigan pack loaded first: " + first);
    await p.evaluate(() => window.__sg.pov({ lat: 39.96, lng: -83.00, altitude: 0.3 }));
    await p.waitForFunction(() => { window.SeaRegions.update(); return window.SeaRegions.state().ctx.state === "Ohio"; }, { timeout: 45000, polling: 200 });
    const mid = await p.evaluate(() => window.SeaRegions.state().packs || []);
    assert.ok(!mid.includes("counties/US-MI"), "Michigan pack evicted in memory: " + mid.join());
    assert.ok(mid.includes("counties/US-OH"), "Ohio pack loaded: " + mid.join());
    await p.evaluate(() => window.__sg.pov({ lat: 42.96, lng: -85.67, altitude: 0.3 }));
    await p.waitForFunction(() => { window.SeaRegions.update(); return window.SeaRegions.state().ctx.state === "Michigan"; }, { timeout: 30000, polling: 200 });
    const back = await p.evaluate(() => ({
      packs: window.SeaRegions.state().packs || [],
      miScripts: [...document.querySelectorAll("script[src*='counties/US-MI.js']")].length,
      state: window.SeaRegions.state().ctx.state
    }));
    assert.equal(back.state, "Michigan");
    assert.ok(back.packs.includes("counties/US-MI"), "Michigan pack present again");
    assert.ok(!back.packs.includes("counties/US-OH"), "Ohio pack evicted: " + back.packs.join());
    assert.ok(back.miScripts >= 2, "Michigan pack fetched again (script tags " + back.miScripts + ", requests " + fetched.filter((x) => x === "MI").length + ")");
    assert.deepEqual(p._errors, []);
    await p.close();
  });


    skip("pre-recorded tour clip plays at 1.0 with captions", "todo: no voice picked, no audio generated");
  await check("historical bells: pins, last-known buildings, time slider and encyclopedia", async () => {
    const p = await openApp(browser, port, "capture=1");
    await p.waitForFunction(() => window.SeaBells && document.getElementById("tBells"), { timeout: 30000 });
    const off = await p.evaluate(() => ({
      checked: document.getElementById("tBells").checked,
      loaded: window.SeaBells.state().loaded,
      on: window.SeaBells.state().on
    }));
    assert.equal(off.checked, false, "off by default");
    assert.equal(off.on, false);
    assert.equal(off.loaded, false, "data is lazy-loaded");
    await p.evaluate(() => document.getElementById("tBells").click());
    await p.waitForFunction(() => window.SeaBells.state().on && window.SeaBells.state().loaded, { timeout: 20000 });
    const on = await p.evaluate(() => {
      const s = window.SeaBells.state();
      const recs = window.SeaBells.records();
      const campana = recs.find((r) => r.id === "bell:campana-independencia");
      const bigBen = recs.find((r) => r.id === "bell:great-bell-elizabeth-tower");
      const official = recs.filter((r) => r.location_basis === "official coordinates");
      const approx = recs.filter((r) => r.location_basis === "last known location (approximate, building)");
      const marks = [...document.querySelectorAll("#bellTicks .belltick")].map((el) => ({ id: el.getAttribute("data-id"), y: el.getAttribute("data-y") }));
      const panel = document.getElementById("bellsPanel");
      const text = panel ? panel.innerText : "";
      const pinCount = (window.__sg.globe().pointsData() || []).filter((d) => /^bell:/.test(d.id || "")).length;
      return {
        s, pinCount, marks: marks.length,
        official: official.length,
        approx: approx.length,
        officialIds: official.map((r) => r.id),
        campanaYear: campana && campana.dateCast,
        campanaHistory: campana && campana.history,
        campanaLat: campana && campana.geo && campana.geo.lat,
        campanaLon: campana && campana.geo && campana.geo.lon,
        campanaBasis: campana && campana.location_basis,
        bigBenLat: bigBen && bigBen.geo && bigBen.geo.lat,
        bigBenLon: bigBen && bigBen.geo && bigBen.geo.lon,
        bigBenBasis: bigBen && bigBen.location_basis,
        unknownListed: /Location unknown/i.test(text),
        officialListed: /official coordinates/.test(text),
        approxListed: /last known location \(approximate, building\)/.test(text),
        pinnedListed: /Centennial Bell/.test(text) && /Liberty Bell/.test(text) && /Campana de la Independencia/.test(text),
        campanaOnSlider: marks.some((m) => m.id === "bell:campana-independencia"),
        libertyOnSlider: marks.some((m) => m.id === "bell:liberty" && m.y === "1753")
      };
    });
    assert.equal(on.s.total, 25);
    assert.equal(on.s.pinned, 25);
    assert.equal(on.s.unknown, 0);
    assert.equal(on.pinCount, 25);
    assert.equal(on.official, 4);
    assert.equal(on.approx, 21);
    assert.deepEqual(on.officialIds.sort(), ["bell:centennial", "bell:japanese-peace", "bell:justice", "bell:wilbank"].sort());
    assert.equal(on.campanaYear, null);
    assert.equal(on.campanaLat, 19.4325543);
    assert.equal(on.campanaLon, -99.1312673);
    assert.equal(on.campanaBasis, "last known location (approximate, building)");
    assert.equal(on.bigBenLat, 51.5006944, "Elizabeth Tower OSM building coordinate, not an OS grid conversion");
    assert.equal(on.bigBenLon, -0.1245749);
    assert.equal(on.bigBenBasis, "last known location (approximate, building)");
    assert.match(on.campanaHistory, /1891/);
    assert.doesNotMatch(on.campanaHistory, /1768|1776/);
    assert.equal(on.campanaOnSlider, false);
    assert.equal(on.libertyOnSlider, true);
    assert.ok(on.marks > 0, "cast-year marks on the time slider");
    assert.equal(on.unknownListed, false, "all bells are pinned");
    assert.ok(on.officialListed, "official basis shown in the panel");
    assert.ok(on.approxListed, "approximate basis shown in the panel");
    assert.ok(on.pinnedListed, "pinned bells listed");
    await p.evaluate(() => window.SeaAtlas.ensureAll());
    const entry = await p.evaluate(() => {
      const e = window.SeaAtlas.get("bell:liberty");
      const c = window.SeaAtlas.get("bell:campana-independencia");
      return {
        title: e && e.title,
        kind: e && e.kind,
        cites: e && e.citations && e.citations.length,
        citeUrls: (function () {
          const ids = (e && e.citations) || [];
          const src = (window.SeaAtlas.sources && window.SeaAtlas.sources()) || [];
          const byId = Object.fromEntries(src.map((s) => [s.id, s]));
          return ids.map((id) => ((byId[id] && byId[id].url) || id) + "");
        })(),
        libertyLocation: e && e.facts && e.facts.Location,
        libertyGaps: e && e.evidence && e.evidence.gaps,
        campanaCast: c && c.facts && c.facts["Cast year"],
        campanaLocation: c && c.facts && c.facts.Location,
        campanaGaps: c && c.evidence && c.evidence.gaps,
        chat: window.SeaChat && window.SeaChat.context("How do I see historical bells?").map((x) => x.id)
      };
    });
    assert.equal(entry.title, "Liberty Bell");
    assert.equal(entry.kind, "bell");
    assert.ok(entry.cites > 0, "primary sources on the entry");
    assert.equal(entry.citeUrls.some((u) => /openstreetmap\.org|wikidata\.org/.test(u)), false, "coordinate links stay out of citations");
    assert.equal(entry.libertyLocation, "last known location (approximate, building)");
    assert.ok(!(entry.libertyGaps || []).includes("Location unknown"), "pinned bell does not show Location unknown");
    assert.equal(entry.campanaCast, "Unknown");
    assert.equal(entry.campanaLocation, "last known location (approximate, building)");
    assert.ok(!(entry.campanaGaps || []).includes("Location unknown"), "pinned Campana does not show Location unknown");
    assert.ok((entry.campanaGaps || []).includes("Cast year unknown"), "Campana has a named cast-year gap");
    assert.ok(entry.chat.includes("app:guide-bells"), "chat " + (entry.chat || []).join());
    assert.deepEqual(p._errors, []);
    await p.close();
  });


  await check("topics.js ships only Historical Bells and matches the schema", async () => {
    const src = fs.readFileSync(path.join(root, "web", "data", "topics.js"), "utf8");
    const sandbox = { SEAGLOBE_DATA: {} };
    const fn = new Function("window", src);
    fn(sandbox);
    const list = sandbox.SEAGLOBE_DATA.topics;
    assert.ok(Array.isArray(list), "topics list");
    const shipped = list.filter((row) => row.example !== true);
    const inFileExamples = list.filter((row) => row.example === true);
    assert.equal(shipped.length, 1, "shipped list has one topic");
    assert.equal(inFileExamples.length, 0, "example rows must not ship in topics.js");
    const tpc = shipped[0];
    assert.equal(tpc.id, "topic-nav:historical-bells");
    assert.equal(tpc.title, "Historical Bells");
    assert.equal(tpc.order, 1);
    assert.equal(tpc.example, undefined);
    assert.deepEqual(tpc.layersLight, ["bells"]);
    assert.ok(!tpc.layersHeavy || tpc.layersHeavy.length === 0, "no heavy layers on the first row");
    const lines = String(tpc.summary || "").trim().split(/\n/).filter(Boolean);
    assert.ok(lines.length >= 1 && lines.length <= 2, "summary must be one or two lines");
    const schema = JSON.parse(fs.readFileSync(path.join(root, "web", "data", "next", "topics", "schema.json"), "utf8"));
    assert.deepEqual(schema.required, ["id", "title", "summary", "order"]);
    assert.equal(schema.properties.id.pattern, "^topic-nav:");
    assert.deepEqual(schema.properties.camera.type, ["object", "null"]);
    assert.equal(schema.properties.focus.type, "object");
    for (const key of Object.keys(tpc)) {
      assert.ok(schema.properties[key], "unexpected field " + key);
    }
    const exampleFile = JSON.parse(fs.readFileSync(path.join(root, "web", "data", "next", "topics", "example.json"), "utf8"));
    const examples = exampleFile.topics || [];
    assert.equal(exampleFile.example, true);
    assert.ok(examples.length >= 2, "test-only example rows are present");
    assert.deepEqual(examples.map((row) => row.id), ["topic-nav:example-show", "topic-nav:example-heavy"]);
    examples.forEach((row) => {
      assert.equal(row.example, true);
      for (const key of Object.keys(row)) {
        assert.ok(schema.properties[key], "unexpected example field " + key);
      }
    });
    assert.deepEqual(examples[1].layersHeavy, ["wind", "pmtilesBorders", "terrain"]);
    for (const req of schema.required) assert.ok(tpc[req] != null && tpc[req] !== "", "missing " + req);
    assert.match(tpc.id, new RegExp(schema.properties.id.pattern));
    const bells = JSON.parse(fs.readFileSync(path.join(root, "web", "data", "next", "bells", "bells.json"), "utf8"));
    const bellIds = (bells.records || []).filter((r) => r && r.example !== true).map((r) => r.id);
    assert.deepEqual(tpc.entities, bellIds, "entities must be the existing encyclopedia bell ids");
    assert.equal(tpc.entities.length, 25);
    const man = JSON.parse(fs.readFileSync(path.join(root, "grokme", "lite-manifest.json"), "utf8"));
    assert.ok(man.file_count <= 600, "lite file count " + man.file_count);
    assert.ok((man.files || []).some((f) => f.path === "data/next/topics/example.json"), "example file is in the lite manifest so lite tests can load it");
    assert.equal(src.includes("topic-nav:example-show"), false, "example id must not appear in shipped topics.js");
    assert.equal(src.includes("topic-nav:example-heavy"), false, "heavy example id must not appear in shipped topics.js");
  });

  const snapGlobe = () => ({
    mode: document.getElementById("modeBtn") && document.getElementById("modeBtn").getAttribute("aria-pressed"),
    date: document.getElementById("dateLabel") && document.getElementById("dateLabel").textContent,
    layers: window.SeaLayers && window.SeaLayers.active ? window.SeaLayers.active() : [],
    atlasOpen: !!(document.getElementById("atlasPanel") && !document.getElementById("atlasPanel").hidden)
  });

  await check("#/topic/ is ignored when topicNav is off", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1");
    const before = await p.evaluate(snapGlobe);
    await p.evaluate(() => { location.hash = "#/topic/topic-nav:historical-bells"; });
    await p.waitForFunction(() => location.hash.indexOf("#/topic/") === 0);
    const after = await p.evaluate(() => {
      const s = {
        mode: document.getElementById("modeBtn") && document.getElementById("modeBtn").getAttribute("aria-pressed"),
        date: document.getElementById("dateLabel") && document.getElementById("dateLabel").textContent,
        layers: window.SeaLayers && window.SeaLayers.active ? window.SeaLayers.active() : [],
        atlasOpen: !!(document.getElementById("atlasPanel") && !document.getElementById("atlasPanel").hidden),
        topicsBtn: !!document.getElementById("topicsBtn"),
        topicsPanel: !!document.getElementById("topicsPanel"),
        topicsOpen: !!(document.getElementById("topicsPanel") && !document.getElementById("topicsPanel").hidden),
        hash: location.hash
      };
      return s;
    });
    assert.equal(after.topicsBtn, false);
    assert.equal(after.topicsPanel, false);
    assert.equal(after.topicsOpen, false);
    assert.equal(after.atlasOpen, false, "encyclopedia must not steal #/topic/");
    assert.equal(after.mode, before.mode);
    assert.equal(after.date, before.date);
    assert.deepEqual(after.layers, before.layers);
    assert.match(after.hash, /#\/topic\//);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("topicNav opens glance and overview without touching Sampler, layers or the clock", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1&flag=topicNav");
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready, { timeout: 10000 });
    const fetched = [];
    const onReq = (r) => fetched.push(r.url());
    p.on("request", onReq);
    const before = await p.evaluate(snapGlobe);
    const ui = await p.evaluate(() => {
      const btn = document.getElementById("topicsBtn");
      const m = document.getElementById("mTopicsBtn");
      return {
        btn: !!(btn && btn.textContent.trim() === "Topics"),
        mBtn: !!(m && m.textContent.trim() === "Topics"),
        afterHelp: !!(btn && btn.previousElementSibling && btn.previousElementSibling.id === "helpBtn"),
        panelHidden: !!(document.getElementById("topicsPanel") && document.getElementById("topicsPanel").hidden),
        showOnGlobe: !!document.getElementById("topicsShow")
      };
    });
    assert.equal(ui.btn, true, "header Topics button");
    assert.equal(ui.mBtn, true, "phone quick Topics button is in the document");
    assert.equal(ui.afterHelp, true, "Topics sits after Help");
    assert.equal(ui.panelHidden, true);
    assert.equal(ui.showOnGlobe, false);
    await p.click("#topicsBtn");
    await p.waitForFunction(() => document.getElementById("topicsPanel") && !document.getElementById("topicsPanel").hidden);
    const glance = await p.evaluate(() => {
      const body = document.getElementById("topicsBody");
      const text = (body && body.textContent) || "";
      const links = [...(body ? body.querySelectorAll("a[href*='topic']") : [])].map((a) => a.getAttribute("href"));
      return {
        text,
        links,
        backHidden: !!(document.getElementById("topicsBack") && document.getElementById("topicsBack").hidden),
        layers: window.SeaLayers.active(),
        mode: document.getElementById("modeBtn").getAttribute("aria-pressed"),
        date: document.getElementById("dateLabel").textContent
      };
    });
    assert.match(glance.text, /Historical Bells/);
    assert.match(glance.text, /Twenty-five sourced bells/);
    assert.ok(glance.links.some((h) => decodeURIComponent(h).indexOf("topic-nav:historical-bells") >= 0));
    assert.equal(glance.backHidden, true);
    assert.deepEqual(glance.layers, before.layers);
    assert.equal(glance.mode, before.mode);
    assert.equal(glance.date, before.date);
    await p.click("#topicsBody a[href*='topic']");
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.state && window.SeaTopics.state().view === "overview");
    const over = await p.evaluate(() => {
      const body = document.getElementById("topicsBody");
      const hrefs = [...(body ? body.querySelectorAll("a[href^='#/entry/']") : [])].map((a) => decodeURIComponent(a.getAttribute("href")));
      return {
        text: (body && body.textContent) || "",
        hrefs,
        hash: decodeURIComponent(location.hash || ""),
        backHidden: !!(document.getElementById("topicsBack") && document.getElementById("topicsBack").hidden),
        showOnGlobe: /Show on the globe/i.test((body && body.textContent) || ""),
        layers: window.SeaLayers.active(),
        mode: document.getElementById("modeBtn").getAttribute("aria-pressed"),
        date: document.getElementById("dateLabel").textContent,
        bellsToggle: !!(document.getElementById("tBells") && document.getElementById("tBells").checked)
      };
    });
    assert.match(over.text, /Historical Bells/);
    assert.match(over.text, /Each bell is in the encyclopedia/);
    assert.equal(over.backHidden, false);
    assert.equal(over.showOnGlobe, true, "Show on the globe is a second press");
    assert.match(over.hash, /#\/topic\/topic-nav:historical-bells/);
    assert.ok(over.hrefs.includes("#/entry/bell:liberty"), over.hrefs.join(","));
    assert.equal(over.hrefs.length, 25);
    assert.deepEqual(over.layers, before.layers);
    assert.equal(over.mode, before.mode);
    assert.equal(over.date, before.date);
    assert.equal(over.bellsToggle, false, "bells layer must stay off until Show on the globe");
    p.off("request", onReq);
    assert.equal(fetched.filter((u) => /bells\.json/.test(u)).length, 0, "overview must not fetch bells.json");
    await p.close();
  });

  await check("#/topic/<id> opens overview when topicNav is on", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1&flag=topicNav");
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready, { timeout: 10000 });
    const before = await p.evaluate(snapGlobe);
    await p.evaluate(() => { location.hash = "#/topic/" + encodeURIComponent("topic-nav:historical-bells"); });
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.state && window.SeaTopics.state().view === "overview" && document.getElementById("topicsPanel") && !document.getElementById("topicsPanel").hidden);
    const st = await p.evaluate(() => ({
      text: (document.getElementById("topicsBody") && document.getElementById("topicsBody").textContent) || "",
      atlasOpen: !!(document.getElementById("atlasPanel") && !document.getElementById("atlasPanel").hidden),
      layers: window.SeaLayers.active(),
      mode: document.getElementById("modeBtn").getAttribute("aria-pressed"),
      date: document.getElementById("dateLabel").textContent
    }));
    assert.match(st.text, /Historical Bells/);
    assert.equal(st.atlasOpen, false);
    assert.deepEqual(st.layers, before.layers);
    assert.equal(st.mode, before.mode);
    assert.equal(st.date, before.date);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("Topics phone quick button opens a sheet at glance, and a smoke load stays clean", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1&flag=topicNav");
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready, { timeout: 10000 });
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await new Promise((r) => setTimeout(r, 250));
    const phone = await p.evaluate(() => {
      const btn = document.getElementById("topicsBtn");
      const m = document.getElementById("mTopicsBtn");
      const cs = btn && getComputedStyle(btn);
      return {
        headerHidden: !!(cs && cs.display === "none"),
        mBtn: !!(m && m.textContent.trim() === "Topics"),
        inQuick: !!(m && m.closest("#mQuick"))
      };
    });
    assert.equal(phone.headerHidden, true, "header Topics hides on a phone; the quick button is used");
    assert.equal(phone.mBtn, true);
    assert.equal(phone.inQuick, true);
    await p.evaluate(() => { if (window.__sgMobile) window.__sgMobile.sheet("menu"); });
    await p.waitForFunction(() => {
      const m = document.getElementById("mTopicsBtn");
      if (!m || !document.body.classList.contains("m-sheet-menu")) return false;
      const r = m.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!(top && (top === m || m.contains(top)));
    });
    await p.evaluate(() => document.getElementById("mTopicsBtn").click());
    await p.waitForFunction(() => document.getElementById("topicsPanel") && !document.getElementById("topicsPanel").hidden);
    const glance = await p.evaluate(() => ({
      text: (document.getElementById("topicsBody") && document.getElementById("topicsBody").textContent) || "",
      errors: 0
    }));
    assert.match(glance.text, /Historical Bells/);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("Topics lite smoke load shows the same Historical Bells list", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1&flag=topicNav", "lite.html");
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready, { timeout: 10000 });
    const st = await p.evaluate(() => ({
      ready: document.documentElement.dataset.ready,
      btn: !!(document.getElementById("topicsBtn") && document.getElementById("topicsBtn").textContent.trim() === "Topics"),
      rows: window.SeaTopics.rows().map((t) => t.id)
    }));
    assert.equal(st.ready, "1");
    assert.equal(st.btn, true);
    assert.deepEqual(st.rows, ["topic-nav:historical-bells"]);
    await p.click("#topicsBtn");
    await p.waitForFunction(() => document.getElementById("topicsPanel") && !document.getElementById("topicsPanel").hidden);
    const text = await p.evaluate(() => (document.getElementById("topicsBody") && document.getElementById("topicsBody").textContent) || "");
    assert.match(text, /Historical Bells/);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("Show on the globe applies Historical Bells light layer and Clear restores it", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1&flag=topicNav");
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready, { timeout: 10000 });
    const fetched = [];
    const onReq = (r) => fetched.push(r.url());
    p.on("request", onReq);
    const before = await p.evaluate(() => ({
      mode: document.getElementById("modeBtn").getAttribute("aria-pressed"),
      date: document.getElementById("dateLabel").textContent,
      bells: !!(window.SeaBells && SeaBells.enabled()),
      tBells: !!(document.getElementById("tBells") && document.getElementById("tBells").checked),
      pov: window.__sg.pov(),
      t: window.__sg.state().t,
      focusOn: !!(document.getElementById("focusChip") && !document.getElementById("focusChip").hidden)
    }));
    await p.evaluate(() => { location.hash = "#/topic/" + encodeURIComponent("topic-nav:historical-bells"); });
    await p.waitForFunction(() => document.getElementById("topicsShow"));
    assert.equal(fetched.filter((u) => /bells\.json/.test(u)).length, 0, "no bells.json before Show on the globe");
    const beforeShow = await p.evaluate(() => ({
      mode: document.getElementById("modeBtn").getAttribute("aria-pressed"),
      date: document.getElementById("dateLabel").textContent,
      pov: window.__sg.pov(),
      t: window.__sg.state().t,
      focusOn: !!(document.getElementById("focusChip") && !document.getElementById("focusChip").hidden)
    }));
    await p.evaluate(() => document.getElementById("topicsShow").click());
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.state().applied === "topic-nav:historical-bells" && window.SeaBells && SeaBells.enabled());
    const on = await p.evaluate(() => ({
      applied: window.SeaTopics.state().applied,
      bells: !!(window.SeaBells && SeaBells.enabled()),
      tBells: !!(document.getElementById("tBells") && document.getElementById("tBells").checked),
      pins: window.SeaBells.state().pinned,
      mode: document.getElementById("modeBtn").getAttribute("aria-pressed"),
      date: document.getElementById("dateLabel").textContent,
      t: window.__sg.state().t,
      pov: window.__sg.pov(),
      chip: !!(document.getElementById("topicChip") && !document.getElementById("topicChip").hidden),
      chipText: (document.getElementById("topicChipText") && document.getElementById("topicChipText").textContent) || "",
      focusOn: !!(document.getElementById("focusChip") && !document.getElementById("focusChip").hidden)
    }));
    assert.equal(on.applied, "topic-nav:historical-bells");
    assert.equal(on.bells, true);
    assert.equal(on.tBells, true);
    assert.equal(on.pins, 25);
    assert.equal(on.mode, beforeShow.mode, "no time on the Bells row, Sampler stays");
    assert.equal(on.date, beforeShow.date);
    assert.equal(on.t, beforeShow.t);
    assert.ok(Math.abs(on.pov.lat - beforeShow.pov.lat) < 0.05 && Math.abs(on.pov.lng - beforeShow.pov.lng) < 0.05, "no camera on the Bells row");
    assert.equal(on.chip, true);
    assert.match(on.chipText, /Historical Bells/);
    assert.equal(on.focusOn, beforeShow.focusOn, "no Focus on the Bells row");
    p.off("request", onReq);
    assert.ok(fetched.filter((u) => /bells\.json/.test(u)).length >= 1, "Show on the globe may fetch bells.json");
    await p.evaluate(() => document.getElementById("topicChipClear").click());
    await p.waitForFunction(() => window.SeaTopics && !window.SeaTopics.state().applied && window.SeaBells && !SeaBells.enabled());
    const after = await p.evaluate(() => ({
      applied: window.SeaTopics.state().applied,
      bells: !!(window.SeaBells && SeaBells.enabled()),
      tBells: !!(document.getElementById("tBells") && document.getElementById("tBells").checked),
      mode: document.getElementById("modeBtn").getAttribute("aria-pressed"),
      date: document.getElementById("dateLabel").textContent,
      t: window.__sg.state().t,
      chip: !!(document.getElementById("topicChip") && !document.getElementById("topicChip").hidden),
      focusOn: !!(document.getElementById("focusChip") && !document.getElementById("focusChip").hidden)
    }));
    assert.equal(after.applied, null);
    assert.equal(after.bells, false);
    assert.equal(after.tBells, false);
    assert.equal(after.mode, beforeShow.mode);
    assert.equal(after.date, beforeShow.date);
    assert.equal(after.t, beforeShow.t);
    assert.equal(after.chip, false);
    assert.equal(after.focusOn, beforeShow.focusOn);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("exampleData Show on the globe sets time, Focus, camera and a light layer, and Clear restores Sampler", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1&flag=topicNav&exampleData=1");
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready, { timeout: 10000 });
    const ids = await p.evaluate(() => window.SeaTopics.rows().map((row) => row.id));
    assert.deepEqual(ids, ["topic-nav:historical-bells", "topic-nav:example-show", "topic-nav:example-heavy"]);
    const before = await p.evaluate(() => ({
      idle: document.body.classList.contains("idle"),
      mode: document.getElementById("modeBtn").getAttribute("aria-pressed"),
      date: document.getElementById("dateLabel").textContent,
      t: window.__sg.state().t,
      pov: window.__sg.pov(),
      coords: !!(document.getElementById("tCoords") && document.getElementById("tCoords").checked),
      focusOn: !!(document.getElementById("focusChip") && !document.getElementById("focusChip").hidden)
    }));
    assert.equal(before.idle, true);
    assert.equal(before.coords, false);
    await p.evaluate(() => { location.hash = "#/topic/" + encodeURIComponent("topic-nav:example-show"); });
    await p.waitForFunction(() => document.getElementById("topicsShow"));
    const still = await p.evaluate(() => ({
      idle: document.body.classList.contains("idle"),
      date: document.getElementById("dateLabel").textContent,
      coords: !!(document.getElementById("tCoords") && document.getElementById("tCoords").checked),
      focusOn: !!(document.getElementById("focusChip") && !document.getElementById("focusChip").hidden)
    }));
    assert.equal(still.idle, true, "overview must not apply the example");
    assert.equal(still.date, before.date);
    assert.equal(still.coords, false);
    assert.equal(still.focusOn, false);
    await p.evaluate(() => document.getElementById("topicsShow").click());
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.state().applied === "topic-nav:example-show" && /20 Sep 1595/.test((document.getElementById("dateLabel") && document.getElementById("dateLabel").textContent) || ""));
    const on = await p.evaluate(() => {
      const pov = window.__sg.pov();
      return {
        idle: document.body.classList.contains("idle"),
        mode: document.getElementById("modeBtn").getAttribute("aria-pressed"),
        date: document.getElementById("dateLabel").textContent,
        t: window.__sg.state().t,
        pov,
        coords: !!(document.getElementById("tCoords") && document.getElementById("tCoords").checked),
        focusOn: !!(document.getElementById("focusChip") && !document.getElementById("focusChip").hidden),
        focusText: (document.getElementById("focusText") && document.getElementById("focusText").textContent) || "",
        chip: !!(document.getElementById("topicChip") && !document.getElementById("topicChip").hidden),
        clearLabel: ((document.getElementById("topicsClear") && document.getElementById("topicsClear").textContent) || "")
      };
    });
    assert.equal(on.idle, false, "leaves Sampler when a time is named");
    assert.equal(on.mode, "false");
    assert.match(on.date, /20 Sep 1595/);
    assert.ok(Math.abs(on.pov.lat - 0) < 0.05, "camera lat " + on.pov.lat);
    assert.ok(Math.abs(on.pov.lng - 20) < 0.05, "camera lng " + on.pov.lng);
    assert.ok(Math.abs(on.pov.altitude - 2.4) < 0.05, "camera alt " + on.pov.altitude);
    assert.equal(on.coords, true);
    assert.equal(on.focusOn, true);
    assert.match(on.focusText, /Age of Sail/);
    assert.equal(on.chip, true);
    assert.match(on.clearLabel, /Back to Sampler/);
    await p.evaluate(() => document.getElementById("topicsClear").click());
    await p.waitForFunction(() => window.SeaTopics && !window.SeaTopics.state().applied && document.body.classList.contains("idle") && ((document.getElementById("dateLabel") && document.getElementById("dateLabel").textContent) || "") === "500 BCE – today");
    const after = await p.evaluate(() => ({
      idle: document.body.classList.contains("idle"),
      mode: document.getElementById("modeBtn").getAttribute("aria-pressed"),
      date: document.getElementById("dateLabel").textContent,
      t: window.__sg.state().t,
      pov: window.__sg.pov(),
      coords: !!(document.getElementById("tCoords") && document.getElementById("tCoords").checked),
      focusOn: !!(document.getElementById("focusChip") && !document.getElementById("focusChip").hidden),
      chip: !!(document.getElementById("topicChip") && !document.getElementById("topicChip").hidden)
    }));
    assert.equal(after.idle, true);
    assert.equal(after.mode, before.mode);
    assert.equal(after.date, before.date);
    assert.equal(after.t, before.t);
    assert.ok(Math.abs(after.pov.lat - before.pov.lat) < 0.05, "restored camera lat");
    assert.ok(Math.abs(after.pov.lng - before.pov.lng) < 0.05, "restored camera lng");
    assert.equal(after.coords, false, "cursor coordinates restored off");
    assert.equal(after.focusOn, false, "no stray Focus");
    assert.equal(after.chip, false);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("example then Bells then Back to Sampler restores the start camera", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1&flag=topicNav&exampleData=1");
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready, { timeout: 10000 });
    const before = await p.evaluate(() => ({
      idle: document.body.classList.contains("idle"),
      pov: window.__sg.pov(),
      t: window.__sg.state().t,
      date: document.getElementById("dateLabel").textContent
    }));
    assert.equal(before.idle, true);
    assert.ok(Math.abs(before.pov.lat - 18) < 0.05, "start camera lat " + before.pov.lat);
    await p.evaluate(() => { location.hash = "#/topic/" + encodeURIComponent("topic-nav:example-show"); });
    await p.waitForFunction(() => document.getElementById("topicsShow"));
    await p.evaluate(() => document.getElementById("topicsShow").click());
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.state().applied === "topic-nav:example-show" && Math.abs((window.__sg.pov() || {}).lat) < 0.05);
    await p.evaluate(() => { location.hash = "#/topic/" + encodeURIComponent("topic-nav:historical-bells"); });
    await p.waitForFunction(() => document.getElementById("topicsShow") && window.SeaTopics && window.SeaTopics.state().selected === "topic-nav:historical-bells");
    await p.evaluate(() => document.getElementById("topicsShow").click());
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.state().applied === "topic-nav:historical-bells" && window.SeaBells && SeaBells.enabled());
    const mid = await p.evaluate(() => ({
      applied: window.SeaTopics.state().applied,
      clearLabel: ((document.getElementById("topicsClear") && document.getElementById("topicsClear").textContent) || "")
    }));
    assert.equal(mid.applied, "topic-nav:historical-bells");
    assert.match(mid.clearLabel, /Back to Sampler/);
    await p.evaluate(() => document.getElementById("topicsClear").click());
    await p.waitForFunction(() => window.SeaTopics && !window.SeaTopics.state().applied && document.body.classList.contains("idle") && ((document.getElementById("dateLabel") && document.getElementById("dateLabel").textContent) || "") === "500 BCE – today");
    const after = await p.evaluate(() => ({
      idle: document.body.classList.contains("idle"),
      pov: window.__sg.pov(),
      t: window.__sg.state().t,
      date: document.getElementById("dateLabel").textContent,
      bells: !!(window.SeaBells && SeaBells.enabled()),
      chip: !!(document.getElementById("topicChip") && !document.getElementById("topicChip").hidden)
    }));
    assert.equal(after.idle, true);
    assert.equal(after.date, before.date);
    assert.equal(after.t, before.t);
    assert.equal(after.bells, false);
    assert.equal(after.chip, false);
    assert.ok(Math.abs(after.pov.lat - 18) < 0.05, "cleared camera lat " + after.pov.lat);
    assert.ok(Math.abs(after.pov.lat - before.pov.lat) < 0.05, "restored start camera lat");
    assert.ok(Math.abs(after.pov.lng - before.pov.lng) < 0.05, "restored start camera lng");
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("example-heavy applies wind under the cap and skips Census and terrain when their flags are off", async () => {
    const p = await openApp(browser, port, "capture=1&mute=1&flag=topicNav&exampleData=1");
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready, { timeout: 10000 });
    const before = await p.evaluate(() => ({
      wind: !!(document.getElementById("tWind") && document.getElementById("tWind").checked),
      active: window.SeaLayers.active().slice().sort(),
      pmtilesToggle: !!document.getElementById("tPmtiles"),
      terrainToggle: !!document.getElementById("tTerrain")
    }));
    assert.equal(before.wind, false);
    assert.equal(before.pmtilesToggle, false);
    assert.equal(before.terrainToggle, false);
    await p.evaluate(() => { location.hash = "#/topic/" + encodeURIComponent("topic-nav:example-heavy"); });
    await p.waitForFunction(() => document.getElementById("topicsShow"));
    await p.evaluate(() => document.getElementById("topicsShow").click());
    await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.state().applied === "topic-nav:example-heavy" && document.getElementById("tWind") && document.getElementById("tWind").checked);
    const on = await p.evaluate(() => ({
      wind: document.getElementById("tWind").checked,
      active: window.SeaLayers.active().slice().sort(),
      heavyOn: window.SeaTopics.state().heavyOn.slice().sort(),
      skipped: window.SeaTopics.state().skipped.slice().sort(),
      ask: window.SeaTopics.state().ask,
      notes: (document.getElementById("topicsSkipped") && document.getElementById("topicsSkipped").textContent) || "",
      pmtiles: !!document.getElementById("tPmtiles"),
      terrain: !!document.getElementById("tTerrain"),
      hook: !!(window.__sgLayerHook && window.__sgLayerHook.reapply === window.SeaLayers.reapply)
    }));
    assert.equal(on.wind, true);
    assert.deepEqual(on.active, ["wind"]);
    assert.deepEqual(on.heavyOn, ["wind"]);
    assert.deepEqual(on.skipped, ["pmtilesBorders", "terrain"]);
    assert.equal(on.ask, null);
    assert.match(on.notes, /US Census boundaries were skipped because the Census boundaries flag is off/);
    assert.match(on.notes, /US terrain was skipped because the terrain flag is off/);
    assert.equal(on.pmtiles, false);
    assert.equal(on.terrain, false);
    assert.equal(on.hook, true, "topic path uses SeaLayers.reapply");
    await p.evaluate(() => window.SeaTopics.clear());
    await p.waitForFunction(() => window.SeaTopics && !window.SeaTopics.state().applied && document.getElementById("tWind") && !document.getElementById("tWind").checked);
    const after = await p.evaluate(() => ({
      wind: document.getElementById("tWind").checked,
      active: window.SeaLayers.active().slice().sort()
    }));
    assert.equal(after.wind, false);
    assert.deepEqual(after.active, []);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("when a topic heavy layer would pass the desktop cap, Topics asks which layer to turn off and never drops one silently", async () => {
    const tiles = await rangeServer(FIX);
    const p = await openApp(browser, port, "capture=1&mute=1&flags=topicNav,pmtilesBorders,terrain&exampleData=1&r2base=" + encodeURIComponent("http://127.0.0.1:" + tiles.port + "/"));
    try {
      await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready && document.getElementById("tPmtiles") && document.getElementById("tTerrain"), { timeout: 30000 });
      assert.equal(await p.evaluate(() => window.SeaLayers.cap()), 5);
      for (const id of ["tRegions", "tHubs", "tLaunch", "tPmtiles", "tTerrain"]) await clickLayer(p, id, true);
      const atCap = await p.evaluate(() => window.SeaLayers.active().slice().sort());
      assert.deepEqual(atCap, ["hubs", "launch", "pmtilesBorders", "regions", "terrain"]);
      await p.evaluate(() => { location.hash = "#/topic/" + encodeURIComponent("topic-nav:example-heavy"); });
      await p.waitForFunction(() => document.getElementById("topicsShow"));
      await p.evaluate(() => document.getElementById("topicsShow").click());
      await p.waitForFunction(() => document.getElementById("topicsCapAsk"));
      const ask = await p.evaluate(() => {
        const on = (id) => document.getElementById(id).checked;
        return {
          want: window.SeaTopics.state().ask,
          active: window.SeaLayers.active().slice().sort(),
          wind: on("tWind"),
          regions: on("tRegions"),
          hubs: on("tHubs"),
          launch: on("tLaunch"),
          pmtiles: on("tPmtiles"),
          terrain: on("tTerrain"),
          text: (document.getElementById("topicsCapAsk") && document.getElementById("topicsCapAsk").textContent) || "",
          choices: [...document.querySelectorAll("#topicsCapAsk [data-act='cap-off']")].map((b) => b.getAttribute("data-layer")).sort()
        };
      });
      assert.equal(ask.want, "wind");
      assert.deepEqual(ask.active, atCap, "no layer dropped silently");
      assert.equal(ask.wind, false);
      assert.equal(ask.regions, true);
      assert.equal(ask.hubs, true);
      assert.equal(ask.launch, true);
      assert.equal(ask.pmtiles, true);
      assert.equal(ask.terrain, true);
      assert.match(ask.text, /Wind belts/);
      assert.match(ask.text, /only 5 heavier layers can be on at once/);
      assert.deepEqual(ask.choices, ["hubs", "launch", "pmtilesBorders", "regions", "terrain"]);
      await p.evaluate(() => document.querySelector("#topicsCapAsk [data-act='cap-off'][data-layer='hubs']").click());
      await p.waitForFunction(() => window.SeaTopics && !window.SeaTopics.state().ask && document.getElementById("tWind") && document.getElementById("tWind").checked);
      const after = await p.evaluate(() => {
        const on = (id) => document.getElementById(id).checked;
        return {
          active: window.SeaLayers.active().slice().sort(),
          wind: on("tWind"),
          hubs: on("tHubs"),
          launch: on("tLaunch"),
          regions: on("tRegions"),
          pmtiles: on("tPmtiles"),
          terrain: on("tTerrain"),
          heavyOn: window.SeaTopics.state().heavyOn.slice().sort(),
          ask: !!document.getElementById("topicsCapAsk")
        };
      });
      assert.equal(after.wind, true);
      assert.equal(after.hubs, false);
      assert.equal(after.launch, true);
      assert.equal(after.regions, true);
      assert.equal(after.pmtiles, true);
      assert.equal(after.terrain, true);
      assert.deepEqual(after.active, ["launch", "pmtilesBorders", "regions", "terrain", "wind"]);
      assert.deepEqual(after.heavyOn, ["wind"]);
      assert.equal(after.ask, false);
      await p.evaluate(() => window.SeaTopics.clear());
      await p.waitForFunction(() => window.SeaTopics && !window.SeaTopics.state().applied && !document.getElementById("tWind").checked);
      const cleared = await p.evaluate(() => window.SeaLayers.active().slice().sort());
      assert.deepEqual(cleared, ["launch", "pmtilesBorders", "regions", "terrain"], "clear turns off only the topic's heavy layers");
      assert.deepEqual(p._errors.filter((e) => !/Failed to load resource|404|the server responded with a status/.test(e)), []);
    } finally {
      await p.close();
      tiles.srv.close();
    }
  });

  await check("phone and lite cap 3: Topics asks, never drops a layer silently, and Not now leaves the set as it is", async () => {
    // phone: ask, then pick
    const ph = await openApp(browser, port, "capture=1&mute=1&flag=topicNav&exampleData=1");
    await ph.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready, { timeout: 10000 });
    await ph.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await ph.waitForFunction(() => window.SeaLayers && window.SeaLayers.cap() === 3, { timeout: 10000 });
    await ph.waitForFunction(() => document.getElementById("tLaunch"));
    for (const id of ["tRegions", "tHubs", "tLaunch"]) await clickLayer(ph, id, true);
    const phoneBefore = await ph.evaluate(() => window.SeaLayers.active().slice().sort());
    assert.deepEqual(phoneBefore, ["hubs", "launch", "regions"]);
    await ph.evaluate(() => { location.hash = "#/topic/" + encodeURIComponent("topic-nav:example-heavy"); });
    await ph.waitForFunction(() => document.getElementById("topicsShow"));
    await ph.evaluate(() => document.getElementById("topicsShow").click());
    await ph.waitForFunction(() => document.getElementById("topicsCapAsk"));
    const phoneAsk = await ph.evaluate(() => ({
      cap: window.SeaLayers.cap(),
      active: window.SeaLayers.active().slice().sort(),
      wind: document.getElementById("tWind").checked,
      text: (document.getElementById("topicsCapAsk") && document.getElementById("topicsCapAsk").textContent) || "",
      panelOpen: !!(document.getElementById("topicsPanel") && !document.getElementById("topicsPanel").hidden)
    }));
    assert.equal(phoneAsk.cap, 3);
    assert.deepEqual(phoneAsk.active, phoneBefore, "no layer dropped silently on a phone");
    assert.equal(phoneAsk.wind, false);
    assert.match(phoneAsk.text, /on a phone/);
    assert.equal(phoneAsk.panelOpen, true, "ask stays visible on a phone");
    await ph.evaluate(() => document.querySelector("#topicsCapAsk [data-act='cap-off'][data-layer='launch']").click());
    await ph.waitForFunction(() => window.SeaTopics && !window.SeaTopics.state().ask && document.getElementById("tWind") && document.getElementById("tWind").checked);
    const phoneAfter = await ph.evaluate(() => ({
      active: window.SeaLayers.active().slice().sort(),
      launch: document.getElementById("tLaunch").checked,
      wind: document.getElementById("tWind").checked
    }));
    assert.equal(phoneAfter.wind, true);
    assert.equal(phoneAfter.launch, false);
    assert.deepEqual(phoneAfter.active, ["hubs", "regions", "wind"]);
    assert.deepEqual(ph._errors, []);
    await ph.close();

    // lite: ask, then Not now
    const lite = await openApp(browser, port, "capture=1&mute=1&flag=topicNav&exampleData=1", "lite.html");
    await lite.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready && document.getElementById("tLaunch"), { timeout: 10000 });
    assert.equal(await lite.evaluate(() => window.SeaLayers.cap()), 3);
    for (const id of ["tRegions", "tHubs", "tLaunch"]) await clickLayer(lite, id, true);
    const liteBefore = await lite.evaluate(() => window.SeaLayers.active().slice().sort());
    assert.deepEqual(liteBefore, ["hubs", "launch", "regions"]);
    await lite.evaluate(() => { location.hash = "#/topic/" + encodeURIComponent("topic-nav:example-heavy"); });
    await lite.waitForFunction(() => document.getElementById("topicsShow"));
    await lite.evaluate(() => document.getElementById("topicsShow").click());
    await lite.waitForFunction(() => document.getElementById("topicsCapAsk"));
    const liteAsk = await lite.evaluate(() => ({
      active: window.SeaLayers.active().slice().sort(),
      wind: document.getElementById("tWind").checked,
      text: (document.getElementById("topicsCapAsk") && document.getElementById("topicsCapAsk").textContent) || ""
    }));
    assert.deepEqual(liteAsk.active, liteBefore, "no layer dropped silently in lite");
    assert.equal(liteAsk.wind, false);
    assert.match(liteAsk.text, /in the lite edition/);
    await lite.evaluate(() => document.getElementById("topicsCapCancel").click());
    await lite.waitForFunction(() => window.SeaTopics && !window.SeaTopics.state().ask && (document.getElementById("topicsSkipped") || {}).textContent);
    const liteAfter = await lite.evaluate(() => ({
      active: window.SeaLayers.active().slice().sort(),
      wind: document.getElementById("tWind").checked,
      heavyOn: window.SeaTopics.state().heavyOn,
      skipped: window.SeaTopics.state().skipped.slice(),
      notes: (document.getElementById("topicsSkipped") && document.getElementById("topicsSkipped").textContent) || ""
    }));
    assert.deepEqual(liteAfter.active, liteBefore);
    assert.equal(liteAfter.wind, false);
    assert.deepEqual(liteAfter.heavyOn, []);
    assert.ok(liteAfter.skipped.includes("wind"));
    assert.match(liteAfter.notes, /Wind belts was not added/);
    assert.deepEqual(lite._errors, []);
    await lite.close();
  });

  await check("Topics flag-on smoke load on desktop, phone and lite", async () => {
    for (const [label, file, size] of [
      ["desktop", "", null],
      ["phone", "", { width: 390, height: 844, deviceScaleFactor: 1 }],
      ["lite", "lite.html", null]
    ]) {
      const p = await openApp(browser, port, "capture=1&mute=1&flag=topicNav", file);
      await p.waitForFunction(() => window.SeaTopics && window.SeaTopics.ready, { timeout: 10000 });
      if (size) {
        await p.setViewport(size);
        await new Promise((r) => setTimeout(r, 250));
      }
      const st = await p.evaluate(() => ({
        ready: document.documentElement.dataset.ready,
        topicsBtn: !!(document.getElementById("topicsBtn") && document.getElementById("topicsBtn").textContent.trim() === "Topics"),
        mTopicsBtn: !!(document.getElementById("mTopicsBtn") && document.getElementById("mTopicsBtn").textContent.trim() === "Topics"),
        applied: window.SeaTopics.state().applied,
        rows: window.SeaTopics.rows().map((row) => row.id),
        log: !!document.getElementById("logBtn")
      }));
      assert.equal(st.ready, "1", label + " ready");
      assert.equal(st.topicsBtn, true, label + " Topics button");
      assert.equal(st.mTopicsBtn, true, label + " phone Topics button");
      assert.equal(st.applied, null, label + " does not auto-apply");
      assert.deepEqual(st.rows, ["topic-nav:historical-bells"], label + " list");
      assert.equal(st.log, true, label + " log");
      assert.deepEqual(p._errors, [], label + " errors: " + (p._errors || []).join(" | "));
      await p.close();
    }
  });

  await check("Topics flag-off smoke load on desktop, phone and lite", async () => {
    for (const [label, file, size] of [
      ["desktop", "", null],
      ["phone", "", { width: 390, height: 844, deviceScaleFactor: 1 }],
      ["lite", "lite.html", null]
    ]) {
      const p = await openApp(browser, port, "capture=1&mute=1", file);
      if (size) {
        await p.setViewport(size);
        await new Promise((r) => setTimeout(r, 250));
      }
      const st = await p.evaluate(() => ({
        ready: document.documentElement.dataset.ready,
        topicsBtn: !!document.getElementById("topicsBtn"),
        mTopicsBtn: !!document.getElementById("mTopicsBtn"),
        log: !!document.getElementById("logBtn"),
        mode: document.getElementById("modeBtn") && document.getElementById("modeBtn").getAttribute("aria-pressed")
      }));
      assert.equal(st.ready, "1", label + " ready");
      assert.equal(st.topicsBtn, false, label + " Topics button");
      assert.equal(st.mTopicsBtn, false, label + " phone Topics button");
      assert.equal(st.log, true, label + " log");
      assert.deepEqual(p._errors, [], label + " errors: " + (p._errors || []).join(" | "));
      await p.close();
    }
  });

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
