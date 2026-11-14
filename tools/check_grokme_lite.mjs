// Grok.me lite self-test (part of the gate).
//  1. grokme/lite-manifest.json: every listed file exists with the listed size and sha256, nothing excluded is listed,
//     lite.html loads only listed files, and the self-imposed size limits hold.
//  2. Copies ONLY the listed files to a temp folder (proving the lite build stands on its own), serves it on one
//     port and a version.json on ANOTHER port (a different origin, like *.grok.me -> github.io), and opens lite.html
//     in headless Chrome: 0 console errors, 0 failed requests, no request outside the two local origins,
//     "Up to date" / "Update available" shown, credit visible, chat offline, no bring-your-own pieces.
// Usage: node tools/check_grokme_lite.mjs [--clean]   (--clean: check the committed tree via git archive HEAD)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { root, launch } from "./browser.mjs";

let base = root;
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); else console.log("  ok  " + msg); };
if (process.argv.includes("--clean")) {
  base = fs.mkdtempSync(path.join(os.tmpdir(), "sg-clean-"));
  execFileSync("sh", ["-c", `git -C "${root}" archive HEAD | tar -x -C "${base}"`]);
  console.log("clean checkout of HEAD in a temp folder");
}
const web = path.join(base, "web");
const man = JSON.parse(fs.readFileSync(path.join(base, "grokme", "lite-manifest.json"), "utf8"));
const listed = new Set(man.files.map((f) => f.path));
console.log("1. manifest", man.version, "commit", man.commit);
let bad = 0;
for (const f of man.files) {
  const p = path.join(web, f.path);
  if (!fs.existsSync(p)) { bad++; fails.push("missing " + f.path); continue; }
  const b = fs.readFileSync(p);
  if (b.length !== f.bytes || crypto.createHash("sha256").update(b).digest("hex") !== f.sha256) { bad++; fails.push("size/sha mismatch " + f.path); }
}
ok(bad === 0, `all ${man.files.length} listed files exist with matching size and sha256`);
const version = fs.readFileSync(path.join(base, "VERSION"), "utf8").trim();
ok(man.version === version, "manifest version matches VERSION (" + version + ")");
ok(listed.has(man.entry), "entry " + man.entry + " is listed");
for (const x of ["index.html", "byo.html", "js/byo.js", "vendor/satellite.min.js", "data/edition-byo.js"]) ok(!listed.has(x), "excluded: " + x);
const total = man.files.reduce((s, f) => s + f.bytes, 0), biggest = man.files.reduce((m, f) => (f.bytes > m.bytes ? f : m));
ok(total <= man.limits.total_bytes, `total ${(total / 1048576).toFixed(2)} MiB <= ${(man.limits.total_bytes / 1048576)} MiB`);
ok(biggest.bytes <= man.limits.file_bytes, `largest file ${biggest.path} ${(biggest.bytes / 1048576).toFixed(2)} MiB <= ${man.limits.file_bytes / 1048576} MiB`);
ok(man.files.length <= man.limits.files, `${man.files.length} files <= ${man.limits.files}`);
const entryHtml = fs.readFileSync(path.join(web, man.entry), "utf8");
const refs = [...entryHtml.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]);
ok(refs.every((r) => listed.has(r)), "every file lite.html references is in the build" + (refs.filter((r) => !listed.has(r)).join(", ") ? ": missing " + refs.filter((r) => !listed.has(r)).join(", ") : ""));
ok(/Built by AdventureNLearn/.test(entryHtml) && /https:\/\/x\.com\/AdventureNLearn/.test(entryHtml), "credit and link in lite.html");

// 2. serve only the listed files, plus a different-origin version.json
const lite = fs.mkdtempSync(path.join(os.tmpdir(), "sg-lite-"));
for (const f of man.files) { const d = path.join(lite, f.path); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(web, f.path), d); }
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".md": "text/markdown" };
const serveDir = (dir) => http.createServer((q, s) => {
  const u = decodeURIComponent(new URL(q.url, "http://x").pathname); const p = path.join(dir, u === "/" ? "lite.html" : u);
  if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); s.end(); return; }
  s.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" }); fs.createReadStream(p).pipe(s);
});
let remote = { version: version };
const verServer = http.createServer((q, s) => {
  if (!q.url.startsWith("/SeaGlobe/version.json?t=")) { s.writeHead(404, { "access-control-allow-origin": "*" }); s.end(); return; }
  s.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "max-age=600" });
  s.end(JSON.stringify({ name: "SeaGlobe", version: remote.version, changelog_url: "https://adventurenlearn.github.io/SeaGlobe/CHANGELOG.md" }));
});
const listen = (srv) => new Promise((r) => srv.listen(0, "127.0.0.1", () => r(srv.address().port)));
const appSrv = serveDir(lite), pa = await listen(appSrv), pv = await listen(verServer);
const verUrl = `http://localhost:${pv}/SeaGlobe/version.json`;   // localhost vs 127.0.0.1 = a different origin too
console.log(`2. lite served alone on 127.0.0.1:${pa}; version.json on localhost:${pv} (different origin)`);
const browser = await launch(1280, 800);
async function run(label, expect, opts = {}) {
  const page = await browser.newPage();
  const errors = [], failed = [], outside = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("requestfailed", (r) => failed.push(r.url()));
  page.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url()); });
  page.on("request", (r) => { const u = r.url(); if (!u.startsWith(`http://127.0.0.1:${pa}/`) && !u.startsWith(`http://localhost:${pv}/`) && !/^(data|blob):/.test(u)) outside.push(u); });
  await page.goto(`http://127.0.0.1:${pa}/lite.html?updateurl=${encodeURIComponent(verUrl)}`, { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "1" || document.documentElement.dataset.ready === "error", { timeout: 180000 });
  await page.waitForFunction((e) => [...document.querySelectorAll("[data-sg-version]")].some((x) => x.textContent.includes(e)), { timeout: 15000 }, expect).catch(() => {});
  const r = await page.evaluate(() => ({
    ready: document.documentElement.dataset.ready, lite: !!(window.__sg && window.__sg.isLite), edition: (window.SEAGLOBE_EDITION || {}).id,
    ver: [...document.querySelectorAll("[data-sg-version]")].map((x) => x.textContent), notice: !document.getElementById("updateNotice").hidden,
    credit: /Built by AdventureNLearn/.test(document.getElementById("pfoot").textContent), byo: !!window.SeaBYO || !!document.getElementById("byoBox"),
    chat: window.SeaChat ? window.SeaChat.mode() : "missing",
  }));
  // About panel shows the credit and version too
  await page.evaluate(() => { location.hash = "#/about"; });
  await page.waitForSelector("#atlasBody .credit", { timeout: 10000 }).catch(() => {});
  const about = await page.evaluate(() => { const b = document.getElementById("atlasBody"); return b ? b.textContent : ""; });
  await page.close();
  const ignore = opts.offline ? (e) => /ERR_CONNECTION_REFUSED|Failed to load resource/.test(e) : () => false;
  console.log(`  ${label}: ${JSON.stringify(r)}`);
  ok(r.ready === "1" && r.lite && r.edition === "lite", label + ": lite edition boots");
  ok(r.ver.some((t) => t.includes(expect)), label + `: shows "${expect}"`);
  ok(r.notice === !!opts.notice, label + ": update notice " + (opts.notice ? "shown" : "hidden"));
  ok(r.credit && /Built by AdventureNLearn/.test(about) && about.includes(version), label + ": credit in footer and About, version in About");
  ok(!r.byo, label + ": no bring-your-own pieces");
  ok(r.chat === "offline", label + ": chat offline until the visitor adds their own xAI key");
  ok(errors.filter((e) => !ignore(e)).length === 0, label + ": 0 console errors" + (errors.length ? " (" + errors.join(" | ").slice(0, 300) + ")" : ""));
  ok((opts.offline ? failed.filter((u) => !u.includes(`localhost:${pv}`)) : failed).length === 0, label + ": 0 failed requests" + (failed.length ? " (" + failed.join(", ").slice(0, 300) + ")" : ""));
  ok(outside.length === 0, label + ": no request outside the two local origins" + (outside.length ? " (" + outside[0] + ")" : ""));
}
try {
  await run("same version", "Up to date · v" + version);
  remote.version = "99.0.0";
  await run("newer version", "Update available: v99.0.0", { notice: true });
  verServer.close();
  await run("version host down", "v" + version, { offline: true });
} finally { await browser.close(); appSrv.close(); verServer.close(); }
fs.rmSync(lite, { recursive: true, force: true });
if (base !== root) fs.rmSync(base, { recursive: true, force: true });
if (fails.length) { console.log("\nFAIL\n - " + fails.join("\n - ")); process.exit(1); }
console.log("\nGrok.me lite self-test: PASS");
