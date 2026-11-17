// Official UAP records layer: off by default, heavy, lazy-loaded, encyclopedia and chat coverage.
import assert from "node:assert/strict";
import { startServer, launch, openApp } from "../tools/browser.mjs";

const port = 8700 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1280, 720);
let failed = 0;
const check = async (name, fn) => { try { await fn(); console.log("ok - " + name); } catch (e) { failed++; console.log("not ok - " + name + "\n  " + String(e.message || e).split("\n").slice(0, 16).join("\n  ")); } };
const IDS = ["uap:aaro-al-taqaddum-2017", "uap:aaro-aguadilla-2013", "uap:usaf-edwards-afb-1957", "uap:usaf-roswell-1947"];

try {
  await check("official UAP layer is off, lazy, and missing from a normal visit's loaded data", async () => {
    const p = await openApp(browser, port, "capture=1");
    await p.waitForFunction(() => window.SeaUap && document.getElementById("tUap") && window.SeaFlags && window.SeaLayers, { timeout: 30000 });
    const off = await p.evaluate(() => ({
      checked: document.getElementById("tUap").checked,
      loaded: window.SeaUap.state().loaded,
      on: window.SeaUap.state().on,
      flagOn: window.SeaFlags.on("officialUap"),
      flagNamed: window.SeaFlags.NAMES.includes("officialUap"),
      weight: window.SeaLayers.registry.uap && window.SeaLayers.registry.uap.weight,
      guide: !!(window.SeaGuide && window.SeaGuide.records().some((e) => e.id === "app:guide-uap")),
      data: !!(window.SEAGLOBE_DATA && window.SEAGLOBE_DATA.uap)
    }));
    assert.equal(off.checked, false, "off by default");
    assert.equal(off.on, false);
    assert.equal(off.loaded, false, "data is lazy-loaded");
    assert.equal(off.flagOn, false);
    assert.equal(off.flagNamed, true);
    assert.equal(off.weight, "heavy");
    assert.equal(off.guide, true);
    assert.equal(off.data, false);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("turning Official UAP records on pins the four official records and fills encyclopedia and chat", async () => {
    const p = await openApp(browser, port, "capture=1");
    await p.waitForFunction(() => window.SeaUap && document.getElementById("tUap"), { timeout: 30000 });
    await p.evaluate(() => document.getElementById("tUap").click());
    await p.waitForFunction(() => window.SeaUap.state().on && window.SeaUap.state().loaded, { timeout: 20000 });
    const on = await p.evaluate(() => {
      const s = window.SeaUap.state();
      const recs = window.SeaUap.records();
      const panel = document.getElementById("uapPanel");
      const text = panel ? panel.innerText : "";
      const pinCount = (window.__sg.globe().pointsData() || []).filter((d) => /^uap:/.test(d.id || "")).length;
      const marks = [...document.querySelectorAll("#uapTicks .uaptick")].map((el) => ({ id: el.getAttribute("data-id"), y: el.getAttribute("data-y") }));
      const byId = Object.fromEntries(recs.map((r) => [r.id, r]));
      return {
        s, pinCount, ids: recs.map((r) => r.id).sort(),
        claims: recs.map((r) => r.claim),
        citations: recs.map((r) => (r.citations || []).length),
        taq: byId["uap:aaro-al-taqaddum-2017"] && byId["uap:aaro-al-taqaddum-2017"].geo,
        agd: byId["uap:aaro-aguadilla-2013"] && byId["uap:aaro-aguadilla-2013"].geo,
        edw: byId["uap:usaf-edwards-afb-1957"] && byId["uap:usaf-edwards-afb-1957"].geo,
        rsw: byId["uap:usaf-roswell-1947"] && byId["uap:usaf-roswell-1947"].geo,
        edwFinding: byId["uap:usaf-edwards-afb-1957"] && byId["uap:usaf-edwards-afb-1957"].finding,
        listed: /Al Taqaddum/.test(text) && /Aguadilla/.test(text) && /Edwards/.test(text) && /Roswell/.test(text),
        unknownListed: /Location unknown/i.test(text),
        marks: marks.map((m) => m.id + "@" + m.y).sort(),
        checked: document.getElementById("tUap").checked,
        active: window.SeaLayers.active()
      };
    });
    assert.equal(on.s.total, 4);
    assert.equal(on.s.pinned, 4);
    assert.equal(on.s.unknown, 0);
    assert.equal(on.pinCount, 4);
    assert.deepEqual(on.ids, IDS.slice().sort());
    assert.ok(on.claims.every((c) => c === "we-have-a-record"), "claims " + on.claims);
    assert.ok(on.citations.every((n) => n > 0), "each record has citations");
    assert.equal(on.taq.lat, 33.3); assert.equal(on.taq.lon, 43.6);
    assert.equal(on.agd.lat, 18.5); assert.equal(on.agd.lon, -67.1);
    assert.equal(on.edw.lat, 34.9); assert.equal(on.edw.lon, -117.9);
    assert.equal(on.rsw.lat, 33.3); assert.equal(on.rsw.lon, -104.5);
    assert.match(on.edwFinding, /Was Balloon/);
    assert.equal(on.listed, true);
    assert.equal(on.unknownListed, false);
    assert.equal(on.checked, true);
    assert.ok(on.active.includes("uap"), "heavy layer is active " + on.active);
    assert.ok(on.marks.includes("uap:aaro-al-taqaddum-2017@2017"));
    assert.ok(on.marks.includes("uap:usaf-roswell-1947@1947"));
    await p.evaluate(() => window.SeaAtlas.ensureAll());
    const entry = await p.evaluate(() => {
      const e = window.SeaAtlas.get("uap:usaf-edwards-afb-1957");
      const r = window.SeaAtlas.get("uap:usaf-roswell-1947");
      return {
        title: e && e.title,
        kind: e && e.kind,
        cites: e && e.citations && e.citations.length,
        finding: e && e.facts && e.facts.Finding,
        roswellFinding: r && r.facts && r.facts.Finding,
        chat: window.SeaChat && window.SeaChat.context("How do I see official UAP records?").map((x) => x.id)
      };
    });
    assert.equal(entry.kind, "uap-record");
    assert.match(entry.title, /Edwards AFB/);
    assert.ok(entry.cites > 0, "primary sources on the entry");
    assert.match(entry.finding, /Was Balloon/);
    assert.match(entry.roswellFinding, /MOGUL/);
    assert.ok(entry.chat.includes("app:guide-uap"), "chat " + (entry.chat || []).join());
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("?flag=officialUap loads uap.js once and state() matches the toggle", async () => {
    const p = await openApp(browser, port, "capture=1&flag=officialUap");
    await p.waitForFunction(() => window.SeaFlags && window.SeaFlags.on("officialUap") && window.SeaUap && document.getElementById("tUap"), { timeout: 30000 });
    await p.waitForFunction(() => [...document.querySelectorAll("script[src]")].some((s) => /next\/atlas-types\.js/.test((s.getAttribute("src") || "") + " " + (s.src || ""))), { timeout: 10000 });
    await p.evaluate(() => new Promise((r) => setTimeout(r, 100)));
    const before = await p.evaluate(() => {
      const scripts = [...document.querySelectorAll("script[src]")].filter((s) => {
        const a = (s.getAttribute("src") || "").split("?")[0];
        const abs = (s.src || "").split("?")[0];
        return a === "js/next/uap.js" || a.endsWith("/js/next/uap.js") || abs.endsWith("/js/next/uap.js");
      }).length;
      return {
        flag: window.SeaFlags.on("officialUap"),
        on: window.SeaUap.state().on,
        loaded: window.SeaUap.state().loaded,
        checked: document.getElementById("tUap").checked,
        ready: window.SeaNext && window.SeaNext.officialUap && window.SeaNext.officialUap.ready,
        scripts
      };
    });
    assert.equal(before.flag, true);
    assert.equal(before.on, false);
    assert.equal(before.loaded, false);
    assert.equal(before.checked, false);
    assert.equal(before.ready, true);
    assert.equal(before.scripts, 1, "uap.js script tags: " + before.scripts);
    await p.evaluate(() => document.getElementById("tUap").click());
    await p.waitForFunction(() => window.SeaUap.state().on && window.SeaUap.state().loaded, { timeout: 20000 });
    const on = await p.evaluate(() => ({
      on: window.SeaUap.state().on,
      checked: document.getElementById("tUap").checked,
      scripts: [...document.querySelectorAll("script[src]")].filter((s) => {
        const a = (s.getAttribute("src") || "").split("?")[0];
        const abs = (s.src || "").split("?")[0];
        return a === "js/next/uap.js" || a.endsWith("/js/next/uap.js") || abs.endsWith("/js/next/uap.js");
      }).length
    }));
    assert.equal(on.checked, true);
    assert.equal(on.on, true, "state() should match the on toggle");
    assert.equal(on.scripts, 1);
    await p.evaluate(() => document.getElementById("tUap").click());
    await p.waitForFunction(() => window.SeaUap.state().on === false, { timeout: 20000 });
    const off = await p.evaluate(() => ({
      on: window.SeaUap.state().on,
      checked: document.getElementById("tUap").checked,
      scripts: [...document.querySelectorAll("script[src]")].filter((s) => {
        const a = (s.getAttribute("src") || "").split("?")[0];
        const abs = (s.src || "").split("?")[0];
        return a === "js/next/uap.js" || a.endsWith("/js/next/uap.js") || abs.endsWith("/js/next/uap.js");
      }).length
    }));
    assert.equal(off.checked, false);
    assert.equal(off.on, false, "state() should match the off toggle");
    assert.equal(off.scripts, 1);
    assert.deepEqual(p._errors, []);
    await p.close();
  });

  await check("Official UAP records respects the heavy-layer cap", async () => {
    const p = await openApp(browser, port, "capture=1");
    await p.waitForFunction(() => window.SeaUap && window.SeaLayers && document.getElementById("tUap"), { timeout: 30000 });
    const blocked = await p.evaluate(async () => {
      const heavy = ["wind", "regions", "hubs", "launch", "live"];
      const granted = heavy.map((id) => window.SeaLayers.request(id, true));
      const before = window.SeaLayers.active().slice().sort();
      const ok = window.SeaLayers.request("uap", true);
      await window.SeaUap.enable(true);
      return {
        granted, before, ok,
        on: window.SeaUap.state().on,
        checked: document.getElementById("tUap").checked,
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

  await check("lite edition also has the off-by-default Official UAP records toggle and no console errors", async () => {
    const p = await openApp(browser, port, "capture=1", "lite.html");
    await p.waitForFunction(() => window.SeaUap && document.getElementById("tUap"), { timeout: 30000 });
    const st = await p.evaluate(() => ({
      on: window.SeaUap.state().on,
      checked: document.getElementById("tUap").checked,
      weight: window.SeaLayers.registry.uap.weight
    }));
    assert.equal(st.on, false);
    assert.equal(st.checked, false);
    assert.equal(st.weight, "heavy");
    assert.deepEqual(p._errors, []);
    await p.close();
  });
} finally { await browser.close(); server.kill(); }
console.log(failed ? failed + " UAP layer check(s) failed" : "UAP layer checks passed");
process.exit(failed ? 1 : 0);
