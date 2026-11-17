// Lite-only region bundles: every per-country pack is in exactly one bundle, and the
// bundled data matches the source. Optional smoke load of lite.html with a country selected.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const regions = path.join(root, "web", "data", "regions");
const bundleDir = path.join(regions, "lite-bundles");
const FILE_LIMIT = 5 * 1024 * 1024;

function extractAssignment(text) {
  const m = /\)\["([^"]+)"\]\s*=\s*/.exec(text);
  assert.ok(m, "pack assignment");
  let raw = text.slice(m.index + m[0].length).trim();
  if (raw.endsWith(";")) raw = raw.slice(0, -1).trim();
  return { key: m[1], value: JSON.parse(raw) };
}

function sourcePacks() {
  const out = new Map();
  for (const kind of ["towns", "admin1", "counties"]) {
    const dir = path.join(regions, kind);
    for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) {
      const text = fs.readFileSync(path.join(dir, name), "utf8");
      const { key, value } = extractAssignment(text);
      out.set(key, value);
    }
  }
  return out;
}

function loadMap() {
  const text = fs.readFileSync(path.join(bundleDir, "map.js"), "utf8");
  const m = /window\.SEAGLOBE_LITE_REGION_MAP\s*=\s*/.exec(text);
  assert.ok(m, "map assignment");
  let raw = text.slice(m.index + m[0].length).trim();
  if (raw.endsWith(";")) raw = raw.slice(0, -1).trim();
  return JSON.parse(raw);
}

function loadBundle(id) {
  const file = path.join(bundleDir, id + ".js");
  assert.ok(fs.existsSync(file), "missing bundle " + id);
  const st = fs.statSync(file);
  assert.ok(st.size <= FILE_LIMIT, id + " is " + st.size + " bytes");
  const text = fs.readFileSync(file, "utf8");
  const m = /\)\[("[^"]+")\]\s*=\s*/.exec(text);
  assert.ok(m, "bundle assignment " + id);
  let raw = text.slice(m.index + m[0].length).trim();
  if (raw.endsWith(";")) raw = raw.slice(0, -1).trim();
  return JSON.parse(raw);
}

const sources = sourcePacks();
const map = loadMap();
assert.equal(Object.keys(map).sort().join("\n"), [...sources.keys()].sort().join("\n"), "map keys must be exactly the source pack ids");

const seen = new Map();
for (const [key, id] of Object.entries(map)) {
  assert.equal(typeof id, "string");
  assert.ok(!seen.has(key), "duplicate map key " + key);
  seen.set(key, id);
}
const bundleIds = [...new Set(Object.values(map))].sort();
const onDisk = fs.readdirSync(bundleDir).filter((f) => f.endsWith(".js")).sort();
assert.deepEqual(onDisk, bundleIds.map((id) => id + ".js").concat(["map.js"]).sort());

let compared = 0;
for (const id of bundleIds) {
  const packs = loadBundle(id);
  const keys = Object.keys(packs);
  assert.ok(keys.length > 0, id + " empty");
  for (const key of keys) {
    assert.equal(map[key], id, key + " in " + id + " but map says " + map[key]);
    assert.deepEqual(packs[key], sources.get(key), "data mismatch for " + key);
    compared++;
  }
}
assert.equal(compared, sources.size);
assert.ok(!map["world"] && !map["index"] && !map["towns-index"], "shared packs stay unbundled");

const chk = spawnSync("python3", [path.join(root, "tools", "build_lite_region_bundles.py"), "--check"], { cwd: root, encoding: "utf8" });
assert.equal(chk.status, 0, chk.stderr || chk.stdout);

console.log("ok - every source pack equals its lite bundle (" + compared + " packs, " + bundleIds.length + " bundles)");

const skipSmoke = process.argv.includes("--no-smoke");
if (skipSmoke) process.exit(0);

const { startServer, launch, openApp } = await import("../tools/browser.mjs");
const port = 8900 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1280, 720);
try {
  const p = await openApp(browser, port, "capture=1&mute=1&regions=1", "lite.html");
  const edition = await p.evaluate(() => ({ lite: !!(window.SEAGLOBE_EDITION && window.SEAGLOBE_EDITION.lite), id: window.SEAGLOBE_EDITION && window.SEAGLOBE_EDITION.id }));
  assert.equal(edition.lite, true);
  assert.equal(edition.id, "lite");
  await p.evaluate(() => window.__sg.pov({ lat: 42.96, lng: -85.67, altitude: 0.3 }));
  await p.waitForFunction(() => { window.SeaRegions.update(); return window.SeaRegions.state().ctx.county; }, { timeout: 30000, polling: 500 });
  const s = await p.evaluate(() => {
    const st = window.SeaRegions.state();
    const scripts = [...document.querySelectorAll("script[src^='data/regions/']")].map((x) => x.getAttribute("src"));
    const drawn = (window.__sg.globe().polygonsData() || []).filter((d) => d.lvl === 2).length;
    const labels = (window.__sg.globe().labelsData() || []).length;
    return { st, scripts, drawn, labels, packs: Object.keys(window.SEAGLOBE_REGIONS || {}) };
  });
  assert.equal(s.st.ctx.country, "United States of America");
  assert.equal(s.st.ctx.state, "Michigan");
  assert.match(s.st.ctx.county, /Kent/);
  assert.equal(s.drawn, 83, "selected state only, not all US counties: " + s.drawn);
  assert.ok(s.labels > 0, "town labels");
  assert.ok(s.scripts.includes("data/regions/lite-bundles/map.js"), "map loaded: " + s.scripts.join());
  assert.ok(s.scripts.includes("data/regions/lite-bundles/counties-midwest.js"), "county bundle: " + s.scripts.join());
  assert.ok(s.scripts.includes("data/regions/lite-bundles/admin1-north-america.js"), "admin1 bundle: " + s.scripts.join());
  assert.ok(s.scripts.includes("data/regions/lite-bundles/towns-north-america.js"), "towns bundle: " + s.scripts.join());
  const leaked = s.scripts.filter((src) => /data\/regions\/(towns|admin1|counties)\//.test(src));
  assert.deepEqual(leaked, [], "lite must not load per-country files: " + leaked.join());
  assert.ok(s.packs.includes("counties/US-MI"), s.packs.join());
  assert.ok(!s.packs.includes("counties/US-TX"), "other state county pack must not stay registered: " + s.packs.join());
  assert.deepEqual(p._errors, []);
  await p.close();
  console.log("ok - lite smoke load with a country selected uses bundles only");
} finally {
  await browser.close();
  server.kill();
}
