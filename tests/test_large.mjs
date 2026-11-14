// Large screens (4K and 8K wall displays) at devicePixelRatio 1 and 2: the UI scales with --ui, panels stay on screen
// and in proportion, the globe canvas is not stretched, its drawing buffer is capped near 8K, the 8K day texture loads,
// and there are no console errors. Screenshots (DPR 1) go to qa/ when SEAGLOBE_QA_DIR is set.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { startServer, launch, openApp } from "../tools/browser.mjs";

const port = 8500 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const shots = process.env.SEAGLOBE_QA_DIR || "";
let failed = 0;
const CASES = [[3840, 2160, 1, 2], [3840, 2160, 2, 2], [7680, 4320, 1, 4], [7680, 4320, 2, 4]];
for (const [w, h, dpr, ui] of CASES) {
  const name = `${w}x${h} at DPR ${dpr}`;
  const browser = await launch(w, h);
  try {
    const page0 = await browser.newPage(); await page0.close();
    // openApp uses the browser's default viewport; set the DPR on a fresh page first
    const pages = await browser.pages(); for (const p of pages) await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
    const p = await openApp(browser, port, "capture=1&t=1970-01-23&pov=30,-30,2.2");
    await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
    const reqs = []; p.on("request", (r) => reqs.push(r.url()));
    await p.evaluate(() => { window.dispatchEvent(new Event("resize")); for (let i = 0; i < 20; i++) window.__sg.advance(1 / 30); });
    await new Promise((r) => setTimeout(r, 1500));
    const r = await p.evaluate(() => {
      const rect = (s) => { const e = document.querySelector(s); if (!e || e.hidden) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
      const c = document.querySelector("#globe canvas"), cb = c.getBoundingClientRect();
      const tex = performance.getEntriesByType("resource").map((e) => e.name).filter((n) => /earth-day-8k/.test(n));
      return {
        ui: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui")),
        dpr: devicePixelRatio, vw: innerWidth, vh: innerHeight,
        panels: { topbar: rect("#topbar"), side: rect("#side"), timeline: rect("#timeline") },
        tabFont: parseFloat(getComputedStyle(document.querySelector(".tab")).fontSize),
        titleFont: parseFloat(getComputedStyle(document.querySelector(".topbar h1, .brand, .topbar .title") || document.body).fontSize),
        canvasCss: [cb.width, cb.height], buffer: [c.width, c.height],
        overflow: [document.documentElement.scrollWidth > innerWidth + 1, document.documentElement.scrollHeight > innerHeight + 1],
        tex,
        labels: [...document.querySelectorAll(".vlabel")].filter((e) => !e.hidden && e.textContent).map((e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom, e.textContent]; }),
      };
    });
    assert.equal(r.vw, w); assert.equal(r.dpr, dpr);
    assert.equal(r.ui, ui, "UI scale");
    assert.ok(r.tabFont >= 12 * ui - 0.5, "tab text scales: " + r.tabFont);
    for (const [k, b] of Object.entries(r.panels)) {
      assert.ok(b, k + " shown");
      assert.ok(b[0] >= 0 && b[1] >= 0 && b[2] <= w + 0.5 && b[3] <= h + 0.5, k + " on screen " + b);
    }
    // the side panel keeps the share of the width it has at 1920 (360/1920)
    const share = (r.panels.side[2] - r.panels.side[0]) / w;
    assert.ok(Math.abs(share - 360 / 1920) < 0.02, "side panel share " + share.toFixed(3));
    assert.deepEqual(r.overflow, [false, false], "no page overflow");
    assert.ok(Math.abs(r.canvasCss[0] - w) < 2 && Math.abs(r.canvasCss[1] - h) < 2, "canvas fills the screen " + r.canvasCss);
    assert.ok(Math.abs(r.buffer[0] / r.buffer[1] - w / h) < 0.01, "canvas not stretched " + r.buffer);
    assert.ok(r.buffer[0] * r.buffer[1] <= 7680 * 4320 * 1.01, "drawing buffer capped near 8K " + r.buffer);
    assert.ok(r.buffer[0] >= Math.min(w * dpr, 7680) - 2, "buffer uses the screen's pixels " + r.buffer);
    assert.ok(r.tex.length > 0, "8K day texture loaded");
    // vehicle labels on the globe never sit on top of each other (their spacing scales with --ui)
    const hit = (a, b) => a[0] < b[2] - 1 && b[0] < a[2] - 1 && a[1] < b[3] - 1 && b[1] < a[3] - 1;
    const clash = r.labels.flatMap((a, i) => r.labels.slice(i + 1).filter((b) => hit(a, b)).map((b) => a[4] + " / " + b[4]));
    assert.ok(r.labels.length > 0, "labels shown");
    assert.deepEqual(clash, [], "overlapping labels");
    assert.deepEqual(p._errors, [], "console errors");
    if (shots && dpr === 1) { fs.mkdirSync(shots, { recursive: true }); await p.screenshot({ path: path.join(shots, `large-${w}x${h}.png`) }); }
    console.log(`ok - ${name}: --ui ${r.ui}, tab text ${r.tabFont}px, side panel ${(share * 100).toFixed(1)}% of width, buffer ${r.buffer.join("×")}, ${r.labels.length} labels, none overlapping`);
    await p.close();
  } catch (e) { failed++; console.log(`not ok - ${name}\n  ` + String(e.message || e).split("\n").slice(0, 8).join("\n  ")); }
  finally { await browser.close(); }
}
server.kill();
console.log(failed ? failed + " large-screen check(s) failed" : `${CASES.length}/${CASES.length} large-screen checks passed`);
process.exit(failed ? 1 : 0);
