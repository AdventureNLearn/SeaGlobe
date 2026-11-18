// StarFire sightings layer: off by default, heavy, lazy-loaded, approximate centroid pins.
import assert from "node:assert/strict";
import { startServer, launch, openApp } from "../tools/browser.mjs";

const port = 8800 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1280, 720);
let failed = 0;
const check = async (name, fn) => { try { await fn(); console.log("ok - " + name); } catch (e) { failed++; console.log("not ok - " + name + "\n  " + String(e.message || e).split("\n").slice(0, 16).join("\n  ")); } };
const SNAPSHOT = "starfire:snapshot-2026-11-17";
const CENTROID = "starfire:auto-0e54c4c418d1-2026";
const CREDIT = "StarFire by @wntrslmbr";

try {
  await check("StarFire layer is off, lazy, and missing from a normal visit's loaded data", async () => {
    const p = await openApp(browser, port, "capture=1");
    await p.waitForFunction(() => window.SeaStarfire && document.getElementById("tStarfire") && window.SeaFlags && window.SeaLayers, { timeout: 30000 });
    const off = await p.evaluate(() => ({
      checked: document.getElementById("tStarfire").checked,
      loaded: window.SeaStarfire.state().loaded,
      on: window.SeaStarfire.state().on,
      flagOn: window.SeaFlags.on("starfire"),
      flagNamed: window.SeaFlags.NAMES.includes("starfire"),
      weight: window.SeaLayers.registry.starfire && window.SeaLayers.registry.starfire.weight,
      guide: !!(window.SeaGuide && window.SeaGuide.records().some((e) => e.id === "app:guide-starfire")),
      snapshot: !!(window.SeaAtlas && window.SeaAtlas.get("starfire:snapshot-2026-11-17")),
      data: !!(window.SEAGLOBE_DATA && window.SEAGLOBE_DATA.starfire),
      external: (window.__sg && window.__sg._errors) || null
    }));
    assert.equal(off.checked, false, "off by default");
    assert.equal(off.on, false);
    assert.equal(off.loaded, false, "data is lazy-loaded");
    assert.equal(off.flagOn, false);
    assert.equal(off.flagNamed, true);
    assert.equal(off.weight, "heavy");
    assert.equal(off.guide, true);
    assert.equal(off.snapshot, true, "aggregate encyclopedia entry is present without fetching the pack");
    assert.equal(off.data, false);
    const ext = (p._errors || []).filter((e) => /EXTERNAL REQUEST/.test(String(e)));
    assert.deepEqual(ext, [], "outside requests with the flag off");
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("turning StarFire sightings on pins 206 records, marks centroids as approximate, and keeps the encyclopedia light", async () => {
    const p = await openApp(browser, port, "capture=1");
    await p.waitForFunction(() => window.SeaStarfire && document.getElementById("tStarfire"), { timeout: 30000 });
    await p.evaluate(() => document.getElementById("tStarfire").click());
    await p.waitForFunction(() => window.SeaStarfire.state().on && window.SeaStarfire.state().loaded, { timeout: 20000 });
    const on = await p.evaluate((centroidId) => {
      const s = window.SeaStarfire.state();
      const recs = window.SeaStarfire.records();
      const panel = document.getElementById("starfirePanel");
      const text = panel ? panel.innerText : "";
      const pts = (window.__sg.globe().pointsData() || []).filter((d) => /^starfire:/.test(d.id || ""));
      const approxPts = pts.filter((d) => d.approx);
      const regularPts = pts.filter((d) => !d.approx);
      const colors = window.SeaStarfire.colors;
      const centroid = recs.find((r) => r.id === centroidId);
      return {
        s,
        pinCount: pts.length,
        approxCount: approxPts.length,
        regularCount: regularPts.length,
        claims: recs.map((r) => r.claim),
        citations: recs.map((r) => (r.citations || []).length),
        colors,
        approxColor: approxPts[0] && approxPts[0].color,
        pinColor: regularPts[0] && regularPts[0].color,
        approxR: approxPts[0] && approxPts[0].r,
        pinR: regularPts[0] && regularPts[0].r,
        isApprox: centroid && window.SeaStarfire.isApproximate(centroid),
        listed: /StarFire by @wntrslmbr/.test(text) && /17 November 2026/.test(text) && /no live feed/i.test(text),
        approxListed: /approximate/i.test(text) && /not the sighting position/i.test(text),
        checked: document.getElementById("tStarfire").checked,
        active: window.SeaLayers.active(),
        recordEntry: window.SeaAtlas.get(centroidId),
        snapshot: window.SeaAtlas.get("starfire:snapshot-2026-11-17")
      };
    }, CENTROID);
    assert.equal(on.s.total, 206);
    assert.equal(on.s.pinned, 206);
    assert.equal(on.s.unknown, 0);
    assert.equal(on.s.approximate, 23);
    assert.equal(on.pinCount, 206);
    assert.equal(on.approxCount, 23);
    assert.equal(on.regularCount, 183);
    assert.ok(on.claims.every((c) => c === "not-proven"), "claims " + on.claims.slice(0, 3));
    assert.ok(on.citations.every((n) => n > 0), "each record has citations");
    assert.equal(on.isApprox, true);
    assert.equal(on.approxColor, on.colors.approximate);
    assert.equal(on.pinColor, on.colors.pin);
    assert.notEqual(on.approxColor, on.pinColor, "approximate pins must use a different color");
    assert.ok(on.approxR > on.pinR, "approximate pins must be visibly larger");
    assert.equal(on.listed, true, "panel credit and snapshot");
    assert.equal(on.approxListed, true, "panel states approximate locations");
    assert.equal(on.checked, true);
    assert.ok(on.active.includes("starfire"), "heavy layer is active " + on.active);
    assert.equal(on.recordEntry, null, "individual reports stay out of the encyclopedia");
    assert.ok(on.snapshot, "aggregate snapshot entry remains");
    assert.match(on.snapshot.title, /StarFire/);
    await p.evaluate((id) => window.SeaStarfire.show(id), CENTROID);
    const detail = await p.evaluate(() => {
      const text = (document.getElementById("starfirePanel") || {}).innerText || "";
      const links = [...document.querySelectorAll("#starfirePanel a[href]")].map((a) => a.getAttribute("href"));
      return { text, links };
    });
    assert.match(detail.text, /StarFire by @wntrslmbr/i);
    assert.match(detail.text, /17 November 2026/);
    assert.match(detail.text, /no live feed/i);
    assert.match(detail.text, /Approximate location/i);
    assert.match(detail.text, /not the sighting position/i);
    assert.ok(detail.links.some((u) => /^https?:\/\//.test(u)), "source links in the panel " + detail.links.slice(0, 3));
    const chat = await p.evaluate(() => window.SeaChat && window.SeaChat.context("How do I see StarFire sightings?").map((x) => x.id));
    assert.ok(chat.includes("app:guide-starfire"), "chat " + (chat || []).join());
    const ext = (p._errors || []).filter((e) => /EXTERNAL REQUEST/.test(String(e)));
    assert.deepEqual(ext, [], "outside requests with the layer on");
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("?flag=starfire loads starfire.js once and state() matches the toggle", async () => {
    const p = await openApp(browser, port, "capture=1&flag=starfire");
    await p.waitForFunction(() => window.SeaFlags && window.SeaFlags.on("starfire") && window.SeaStarfire && document.getElementById("tStarfire"), { timeout: 30000 });
    await p.waitForFunction(() => [...document.querySelectorAll("script[src]")].some((s) => /next\/atlas-types\.js/.test((s.getAttribute("src") || "") + " " + (s.src || ""))), { timeout: 10000 });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 100)));
    const before = await p.evaluate(() => {
      const scripts = [...document.querySelectorAll("script[src]")].filter((s) => {
        const a = (s.getAttribute("src") || "").split("?")[0];
        const abs = (s.src || "").split("?")[0];
        return a === "js/next/starfire.js" || a.endsWith("/js/next/starfire.js") || abs.endsWith("/js/next/starfire.js");
      }).length;
      return {
        flag: window.SeaFlags.on("starfire"),
        on: window.SeaStarfire.state().on,
        checked: document.getElementById("tStarfire").checked,
        ready: window.SeaNext && window.SeaNext.starfire && window.SeaNext.starfire.ready,
        scripts
      };
    });
    assert.equal(before.flag, true);
    assert.equal(before.checked, false, "flag does not turn the layer on");
    assert.equal(before.on, false);
    assert.equal(before.ready, true);
    assert.equal(before.scripts, 1, "starfire.js script tags: " + before.scripts);
    await p.evaluate(() => document.getElementById("tStarfire").click());
    await p.waitForFunction(() => window.SeaStarfire.state().on && window.SeaStarfire.state().loaded, { timeout: 20000 });
    const on = await p.evaluate(() => ({
      on: window.SeaStarfire.state().on,
      checked: document.getElementById("tStarfire").checked,
      scripts: [...document.querySelectorAll("script[src]")].filter((s) => {
        const a = (s.getAttribute("src") || "").split("?")[0];
        const abs = (s.src || "").split("?")[0];
        return a === "js/next/starfire.js" || a.endsWith("/js/next/starfire.js") || abs.endsWith("/js/next/starfire.js");
      }).length
    }));
    assert.equal(on.checked, true);
    assert.equal(on.on, true, "state() should match the on toggle");
    assert.equal(on.scripts, 1);
    await p.evaluate(() => document.getElementById("tStarfire").click());
    await p.waitForFunction(() => window.SeaStarfire.state().on === false, { timeout: 20000 });
    const off = await p.evaluate(() => ({
      on: window.SeaStarfire.state().on,
      checked: document.getElementById("tStarfire").checked,
      scripts: [...document.querySelectorAll("script[src]")].filter((s) => {
        const a = (s.getAttribute("src") || "").split("?")[0];
        const abs = (s.src || "").split("?")[0];
        return a === "js/next/starfire.js" || a.endsWith("/js/next/starfire.js") || abs.endsWith("/js/next/starfire.js");
      }).length
    }));
    assert.equal(off.checked, false);
    assert.equal(off.on, false, "state() should match the off toggle");
    assert.equal(off.scripts, 1);
    const ext = (p._errors || []).filter((e) => /EXTERNAL REQUEST/.test(String(e)));
    assert.deepEqual(ext, []);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("StarFire sightings respects the heavy-layer cap", async () => {
    const p = await openApp(browser, port, "capture=1");
    await p.waitForFunction(() => window.SeaStarfire && window.SeaLayers && document.getElementById("tStarfire"), { timeout: 30000 });
    const blocked = await p.evaluate(async () => {
      const heavy = ["wind", "regions", "hubs", "launch", "live"];
      const granted = heavy.map((id) => window.SeaLayers.request(id, true));
      const before = window.SeaLayers.active().slice().sort();
      const ok = window.SeaLayers.request("starfire", true);
      await window.SeaStarfire.enable(true);
      return {
        granted, before, ok,
        on: window.SeaStarfire.state().on,
        checked: document.getElementById("tStarfire").checked,
        active: window.SeaLayers.active().slice().sort(),
        cap: window.SeaLayers.cap(),
        notice: window.SeaLayers.notice()
      };
    });
    assert.equal(blocked.cap, 5);
    assert.ok(blocked.granted.every(Boolean), "setup of five heavy layers failed");
    assert.equal(blocked.ok, false);
    assert.equal(blocked.on, false);
    assert.equal(blocked.checked, false);
    assert.deepEqual(blocked.active, ["hubs", "launch", "live", "regions", "wind"]);
    assert.ok(blocked.notice, "cap notice shown");
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("lite edition also has the off-by-default StarFire sightings toggle and no console errors", async () => {
    const p = await openApp(browser, port, "capture=1", "lite.html");
    await p.waitForFunction(() => window.SeaStarfire && document.getElementById("tStarfire"), { timeout: 30000 });
    const st = await p.evaluate(() => ({
      on: window.SeaStarfire.state().on,
      checked: document.getElementById("tStarfire").checked,
      weight: window.SeaLayers.registry.starfire.weight
    }));
    assert.equal(st.on, false);
    assert.equal(st.checked, false);
    assert.equal(st.weight, "heavy");
    const ext = (p._errors || []).filter((e) => /EXTERNAL REQUEST/.test(String(e)));
    assert.deepEqual(ext, []);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("smoke load with the flag on and off has 0 errors and 0 outside requests", async () => {
    for (const q of ["capture=1", "capture=1&flag=starfire"]) {
      const p = await openApp(browser, port, q);
      await p.waitForFunction(() => window.SeaStarfire && document.getElementById("tStarfire"), { timeout: 30000 });
      if (q.includes("flag=starfire")) {
        await p.waitForFunction(() => window.SeaFlags && window.SeaFlags.on("starfire"), { timeout: 10000 });
      }
      await p.evaluate(() => new Promise((r) => setTimeout(r, 200)));
      const ext = (p._errors || []).filter((e) => /EXTERNAL REQUEST/.test(String(e)));
      assert.deepEqual(ext, [], "outside requests for " + q);
      assert.deepEqual(p._errors, [], "console for " + q + " " + JSON.stringify(p._errors));
      await p.close();
    }
  });
} finally { await browser.close(); server.kill(); }
console.log(failed ? failed + " StarFire layer check(s) failed" : "StarFire layer checks passed");
process.exit(failed ? 1 : 0);
