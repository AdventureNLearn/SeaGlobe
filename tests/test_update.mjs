// Version check: semver compare, and the read-only cross-origin check of version.json in the full edition.
// Scenarios: same version, newer version (notice + https changelog link), unsafe changelog URL (no link),
// dismissed notice stays hidden, host without CORS (silent), slow host (times out silently).
// Needs Chrome and puppeteer-core (PUPPETEER_CORE=<path>). Run: node tests/test_update.mjs
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import { startServer, launch, openApp } from "../tools/browser.mjs";

const version = fs.readFileSync(new URL("../VERSION", import.meta.url), "utf8").trim();
const port = 8700 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1280, 720);
let ok = 0, total = 0;
const check = async (name, fn) => { total++; await fn(); ok++; console.log("ok -", name); };
let remote = { body: { name: "SeaGlobe", version }, cors: true, delayMs: 0 };
const ver = http.createServer((q, s) => {
  const send = () => {
    const h = { "content-type": "application/json" }; if (remote.cors) h["access-control-allow-origin"] = "*";
    s.writeHead(200, h); s.end(JSON.stringify(remote.body));
  };
  if (remote.delayMs) setTimeout(send, remote.delayMs); else send();
});
const pv = await new Promise((r) => ver.listen(0, "127.0.0.1", () => r(ver.address().port)));
const verUrl = `http://localhost:${pv}/SeaGlobe/version.json`;   // localhost vs 127.0.0.1: a different origin
async function open(extra) {
  const p = await openApp(browser, port, `capture=0&updateurl=${encodeURIComponent(verUrl)}${extra || ""}`);
  return p;
}
const errs = (p) => p._errors.filter((e) => !e.startsWith(`EXTERNAL REQUEST http://localhost:${pv}/SeaGlobe/version.json?t=`));
const state = (p) => p.evaluate(async () => { await window.SeaUpdate.check(1500); const n = document.getElementById("updateNotice");
  return { s: window.SeaUpdate.state().status, notice: !n.hidden, html: n.innerHTML, label: document.querySelector("[data-sg-version]").textContent }; });
try {
  await check("semver compare: patch, minor, major, pre-release, v prefix, junk", async () => {
    const p = await openApp(browser, port, "capture=1");
    const r = await p.evaluate(() => { const c = window.SeaUpdate.compare;
      return [c("3.0.0", "3.0.1"), c("3.1.0", "3.0.9"), c("2.9.9", "3.0.0"), c("3.1.0-dev", "3.1.0"), c("3.1.0", "3.1.0-rc.1"), c("v3.0.0", "3.0.0"), c("junk", "3.0.0"), c("3.0.0", "3.0.0")]; });
    assert.deepEqual(r, [-1, 1, -1, -1, 1, 0, 0, 0]);
    await p.close();
  });
  await check("same version on the public site: 'Up to date', no notice, 0 console errors", async () => {
    remote = { body: { name: "SeaGlobe", version }, cors: true };
    const p = await open(); const r = await state(p);
    assert.equal(r.s, "current"); assert.equal(r.notice, false); assert.match(r.label, new RegExp("Up to date · v" + version.replace(/\./g, "\\.")));
    assert.deepEqual(errs(p), []); await p.close();
  });
  await check("newer version: notice with an https 'What changed' link that opens in a new tab", async () => {
    remote = { body: { name: "SeaGlobe", version: "99.0.0", changelog_url: "https://adventurenlearn.github.io/SeaGlobe/CHANGELOG.md" }, cors: true };
    const p = await open(); const r = await state(p);
    assert.equal(r.s, "update"); assert.equal(r.notice, true); assert.match(r.html, /v99\.0\.0/);
    assert.match(r.html, /href="https:\/\/adventurenlearn\.github\.io\/SeaGlobe\/CHANGELOG\.md"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
    // dismiss: stays hidden for that version on the next check
    await p.click("#updateDismiss"); const r2 = await state(p); assert.equal(r2.notice, false);
    assert.deepEqual(errs(p), []); await p.close();
  });
  await check("unsafe changelog URL or markup in the version is not rendered", async () => {
    remote = { body: { name: "SeaGlobe", version: "99.1.0", changelog_url: "javascript:alert(1)" }, cors: true };
    const p = await open(); const r = await state(p);
    assert.equal(r.notice, true); assert.doesNotMatch(r.html, /javascript:|<a /);
    await p.close();
  });
  await check("host without CORS headers: the check fails silently and the app keeps working", async () => {
    remote = { body: { name: "SeaGlobe", version: "99.0.0" }, cors: false };
    const p = await open(); const r = await state(p);
    assert.equal(r.s, "unknown"); assert.equal(r.notice, false); assert.equal(r.label, "v" + version);
    assert.equal(await p.evaluate(() => document.documentElement.dataset.ready), "1");
    await p.close();
  });
  await check("slow host: the check times out and says nothing", async () => {
    remote = { body: { name: "SeaGlobe", version: "99.0.0" }, cors: true, delayMs: 4000 };
    const p = await open(); const t0 = Date.now(); const r = await state(p);
    assert.ok(Date.now() - t0 < 3500, "gave up within the timeout"); assert.equal(r.notice, false);
    await p.close();
  });
} catch (e) {
  console.log("not ok -", e.message);
} finally {
  await browser.close(); ver.close(); if (server.kill) server.kill(); else server.close();
}
console.log(`${ok}/${total} update checks passed`);
if (ok !== total) process.exit(1);
