// Coverage: every data entity in the app has an encyclopedia entry, and the chat's retrieval index holds every entry.
// Expected ids are worked out here straight from the bundled data files, not from the encyclopedia's own code.
import assert from "node:assert/strict";
import { startServer, launch, openApp } from "../tools/browser.mjs";

const port = 8600 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1280, 720);
let failed = 0;
const check = async (name, fn) => { try { await fn(); console.log("ok - " + name); } catch (e) { failed++; console.log("not ok - " + name + "\n  " + String(e.message || e).split("\n").slice(0, 12).join("\n  ")); } };
try {
  const p = await openApp(browser, port, "capture=1");
  await p.waitForFunction(() => window.SeaAtlas && window.SeaRegions, { timeout: 60000 });
  await p.evaluate(() => window.SeaAtlas.ensureAll());
  const r = await p.evaluate(() => {
    const D = window.SEAGLOBE_DATA, R = window.SEAGLOBE_REGIONS, A = window.SeaAtlas, low = (x) => String(x).toLowerCase();
    const exp = {};
    const put = (kind, id) => (exp[kind] = exp[kind] || []).push(id);
    D.schema.eras.forEach((e) => put("era", "era:" + e.id));
    D.schema.vehicles.forEach((v) => put("vehicle", "vehicle:" + v.id));
    Object.keys(D).filter((k) => k.startsWith("routes:")).forEach((k) => {
      put("topic", "topic:" + D[k].family);
      (D[k].routes || []).forEach((rt) => { put("route", "route:" + rt.id); ((rt.schedule && rt.schedule.voyages) || []).filter((v) => v.vessel).forEach((v) => put("vessel/aircraft", "vessel:" + v.id)); });
    });
    (D.airports || []).forEach((a) => put("air hub", "place:airport-" + low(a[0])));
    D.gcat.craft.forEach((c) => put("satellite / spacecraft", "spacecraft:" + low(c.jcat)));
    D.gcat.sites.forEach((s) => put("launch site", "place:site-" + low(s.code)));
    Object.keys(D.gcat.launches).forEach((y) => put("launch year", "launches:" + y));
    put("topic", "topic:space");
    D.tours.forEach((t) => put("tour", "tour:" + t.id));
    D.deeper.forEach((d) => put("outside project", "link:" + d.id));
    put("radio", "app:radio");
    ["web", "lite", "byo"].forEach((e) => put("edition", "app:edition-" + e));
    ["chat", "version-check", "starfield", "credit", "how-to-go-deeper"].forEach((e) => put("app feature", "app:" + e));
    if (window.SeaGuide && window.SeaGuide.records) window.SeaGuide.records().forEach((e) => put("app feature", e.id));
    R.index.levels.forEach((l) => put("drill-down level", "level:" + l));
    R.index.regions.forEach((x) => put("region", "region:" + x.id));
    A.sources().forEach((s) => put("source", "source:" + s.id));
    const ids = new Set(A.ids()), indexed = new Set(A.indexed());
    const out = { rows: [], missing: [], unindexed: [], towns: { data: R["towns-index"].towns.length, entries: A.all((e) => e.level === "town" && e.kind === "place").length } };
    for (const [kind, list] of Object.entries(exp)) {
      const uniq = [...new Set(list)], miss = uniq.filter((id) => !ids.has(id));
      out.rows.push([kind, uniq.length, uniq.length - miss.length]); out.missing.push(...miss.slice(0, 5).map((m) => kind + ": " + m));
    }
    out.rows.push(["town", out.towns.data, out.towns.entries]);
    out.unindexed = [...ids].filter((id) => !indexed.has(id));
    out.total = { entities: out.rows.reduce((a, r) => a + r[1], 0), entries: ids.size, indexed: indexed.size };
    out.unknownHistory = A.all((e) => e.sections.some((s) => /\[UNKNOWN\]/.test(s.text))).length;
    return out;
  });
  console.log("   kind | data entities | entries");
  r.rows.forEach(([k, n, m]) => console.log(`   ${k} | ${n} | ${m}`));
  console.log(`   total data entities ${r.total.entities} · encyclopedia entries ${r.total.entries} · in the chat index ${r.total.indexed} · entries whose history is [UNKNOWN]: ${r.unknownHistory}`);
  await check("every data entity has an encyclopedia entry", async () => {
    assert.deepEqual(r.missing, []); assert.equal(r.towns.entries, r.towns.data, "every town has an entry");
  });
  await check("the chat's retrieval index holds every entry", async () => { assert.deepEqual(r.unindexed.slice(0, 10), []); });
  await check("chat retrieval reaches the newly covered kinds (town, launch year, source, radio, edition, tour)", async () => {
    const hits = await p.evaluate(async () => {
      const C = window.SeaChat, first = async (q) => (await C.context(q)).map((c) => c.id);
      return { town: await first("Oranjestad"), year: await first("space launches 1969"), radio: await first("Creedence radio"), lite: await first("lite edition"), tour: await first("tour jet age"), source: await first("OurAirports open data") };
    });
    assert.ok(hits.town.some((id) => id.startsWith("place:town-abw")), "town " + hits.town);
    assert.ok(hits.year.includes("launches:1969"), "year " + hits.year);
    assert.ok(hits.radio.includes("app:radio"), "radio " + hits.radio);
    assert.ok(hits.lite.includes("app:edition-lite"), "lite " + hits.lite);
    assert.ok(hits.tour.some((id) => id.startsWith("tour:")), "tour " + hits.tour);
    assert.ok(hits.source.some((id) => id.startsWith("source:")), "source " + hits.source);
  });
  await check("no console errors", async () => { assert.deepEqual(p._errors, []); });
  await p.close();
} finally { await browser.close(); server.kill(); }
console.log(failed ? failed + " coverage check(s) failed" : "coverage checks passed");
process.exit(failed ? 1 : 0);
