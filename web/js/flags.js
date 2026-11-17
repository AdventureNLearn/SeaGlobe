/* SeaFlags: named feature flags for planned layers. All default off, so a normal
   visit is unchanged. Enable only in development or tests with
   ?flag=pmtilesBorders or ?flags=pmtilesBorders,terrain (and optional ?exampleData=1
   to load clearly marked example records — never on the public default). */
(function (root) {
  "use strict";
  const NAMES = [
    "pmtilesBorders",
    "terrain",
    "historicalBells",
    "laws",
    "authorities",
    "taxDrilldown",
    "learningPaths",
    "countyGis",
    "topicNav"
  ];
  function parse(search) {
    const q = new URLSearchParams(typeof search === "string" ? search.replace(/^\?/, "") : (search || ""));
    const on = Object.fromEntries(NAMES.map((n) => [n, false]));
    const raw = [q.get("flag"), q.get("flags")].filter(Boolean).join(",");
    raw.split(",").map((s) => s.trim()).filter(Boolean).forEach((k) => { if (k in on) on[k] = true; });
    return {
      flags: on,
      exampleData: q.get("exampleData") === "1"
    };
  }
  const parsed = parse(typeof location !== "undefined" ? location.search : "");
  const api = {
    NAMES: NAMES.slice(),
    parse,
    all: parsed.flags,
    exampleData: parsed.exampleData,
    on: (k) => !!parsed.flags[k],
    any: () => NAMES.some((k) => parsed.flags[k])
  };
  root.SeaFlags = api;
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("failed to load " + src));
      document.head.appendChild(s);
    });
  }
  async function boot() {
    if (!api.any() || typeof document === "undefined") return;
    const base = (document.querySelector("script[src$='js/flags.js']") || {}).src || "js/flags.js";
    const rootPath = base.replace(/js\/flags\.js(\?.*)?$/, "");
    const load = (rel) => loadScript(rootPath + "js/" + rel).catch((e) => console.warn("SeaFlags:", e));
    await load("next/atlas-types.js");
    if (parsed.flags.pmtilesBorders || parsed.flags.terrain) await load("next/pmtiles-lib.js");
    if (parsed.flags.pmtilesBorders) await load("next/mvt.js");
    const map = {
      pmtilesBorders: "next/pmtiles.js",
      terrain: "next/terrain.js",
      historicalBells: "next/bells.js",
      laws: "next/laws.js",
      authorities: "next/authorities.js",
      taxDrilldown: "next/tax.js",
      learningPaths: "next/learning-paths.js",
      countyGis: "next/county-gis.js",
      topicNav: "next/topics.js"
    };
    for (const k of NAMES) {
      if (parsed.flags[k]) await load(map[k]);
    }
  }
  if (typeof window !== "undefined") {
    window.addEventListener("seaglobe:ready", () => { boot(); });
  }
})(typeof window !== "undefined" ? window : globalThis);
