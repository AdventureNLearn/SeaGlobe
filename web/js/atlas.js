/* SeaAtlas: the shared entity, citation and source model behind the encyclopedia, the chat and every layer.
   Every thing on the globe (route, vessel, aircraft or vehicle type, era, topic, place, region, spacecraft) is an
   entity with an article, a timeline, related entries, references and an evidence label (reconstruction /
   dataset / [UNKNOWN] gaps). Built in the browser from the bundled data files; nothing is fetched. */
(function () {
  "use strict";
  const D = () => window.SEAGLOBE_DATA || {};
  const ACCESS = "14 Nov 2026";
  const entities = new Map();
  const sources = new Map();
  let built = false;

  // ---------- sources (one record per cited work or dataset) ----------
  // Datasets we host or derive from: licence and host flag stated by the provider (see DATA.md and research notes).
  const DATASETS = [
    { id: "src-ourairports", type: "dataset", title: "OurAirports open data (airports.csv)", publisher: "OurAirports", url: "https://ourairports.com/data/", licence: "Public domain", host: "hosting permitted", attribution: "Airport data: OurAirports (public domain)", accessed: ACCESS, match: /ourairports/i },
    { id: "src-natural-earth", type: "dataset", title: "Natural Earth vector and raster data", publisher: "Natural Earth", url: "https://www.naturalearthdata.com/", licence: "Public domain", host: "hosting permitted", attribution: "Made with Natural Earth", accessed: ACCESS, match: /natural earth/i },
    { id: "src-gcat", type: "dataset", title: "GCAT: General Catalog of Artificial Space Objects, release 1.8.9 (data update 2026 Nov 13)", author: "Jonathan C. McDowell", url: "https://planet4589.org/space/gcat/", licence: "CC BY 4.0", host: "hosting permitted", attribution: "Data from GCAT (J. McDowell, planet4589.org/space/gcat)", accessed: ACCESS, match: /gcat|planet4589/i },
    { id: "src-cliwoc", type: "dataset", title: "CLIWOC 2.1 ship logbook data (PANGAEA)", author: "Jones et al. (2007); García-Herrera et al. (2010)", url: "https://doi.org/10.1594/PANGAEA.611088", licence: "CC BY 3.0", host: "hosting permitted", attribution: "CLIWOC 2.1, CC BY 3.0", accessed: "13 Nov 2026", match: /cliwoc|pangaea/i },
    { id: "src-nasa-imagery", type: "dataset", title: "Blue Marble Next Generation and Black Marble 2012", publisher: "NASA Earth Observatory", url: "https://earthobservatory.nasa.gov/", licence: "Public domain (NASA)", host: "hosting permitted", attribution: "Earth imagery: NASA Earth Observatory", accessed: "13 Nov 2026", match: /blue marble|black marble|nasa earth observatory/i },
    { id: "src-tigerweb", type: "dataset", title: "TIGERweb map services (live, opt-in)", publisher: "U.S. Census Bureau", url: "https://tigerweb.geo.census.gov/", licence: "U.S. government work (17 U.S.C. § 105); the Census Bureau asks to be cited", host: "linked live service, not hosted", attribution: "Boundaries: U.S. Census Bureau, TIGERweb", accessed: ACCESS, match: /tigerweb/i },
  ];
  const PRIMARY = /herodotus|strabo|pliny|periplus|marco polo|yule 1903|ibn battuta|cieza|logbook|log book|journal of|isidore of charax|ship'?s log|letters? of|original record/i;
  function hashId(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return "src-" + (h >>> 0).toString(36); }
  function sourceFor(text) {
    const t = String(text || "").trim();
    if (!t) return null;
    const ds = DATASETS.find((d) => d.match.test(t));
    if (ds) { if (!sources.has(ds.id)) sources.set(ds.id, Object.assign({ cites: [] }, ds, { match: undefined })); const s = sources.get(ds.id); if (s.notes == null) s.notes = new Set(); s.notes.add(t); return s; }
    const id = hashId(t);
    if (sources.has(id)) return sources.get(id);
    const url = (t.match(/https?:\/\/[^\s)"]+/) || [null])[0];
    const acc = (t.match(/accessed ([0-9]{1,2} [A-Z][a-z]{2,8} [0-9]{4})/i) || [null, null])[1];
    // type by stated rule (shown on the Sources page): encyclopedias are tertiary, named primary texts and records primary, the rest secondary
    const type = /wikipedia|britannica|encyclop/i.test(t) ? "tertiary" : PRIMARY.test(t) ? "primary" : "secondary";
    const s = { id, type, title: t.replace(/\s*\(accessed[^)]*\)/i, ""), url: url ? url.replace(/[.,;]+$/, "") : null, accessed: acc || "[UNKNOWN]",
      licence: "Cited only; not hosted", host: "cited only", cites: [], typeRule: true };
    sources.set(id, s);
    return s;
  }
  function archiveLookup(url) { return url ? "https://web.archive.org/web/*/" + url : null; }

  // ---------- entities ----------
  function gapsIn(...texts) {
    const out = [];
    texts.forEach((x) => { const s = typeof x === "string" ? x : x ? JSON.stringify(x) : ""; const re = /([^.;]*\[UNKNOWN\][^.;]*)/g; let m; while ((m = re.exec(s))) out.push(m[1].trim().replace(/^[",:{\s]+|["}\s]+$/g, "")); });
    return [...new Set(out)].slice(0, 12);
  }
  function add(e) {
    e.citations = [...new Set((e.citations || []).filter(Boolean))];
    e.related = e.related || []; e.timeline = e.timeline || []; e.sections = e.sections || []; e.aliases = e.aliases || [];
    e.evidence = Object.assign({ reconstruction: false, confidence: null, basis: "secondary", gaps: [] }, e.evidence || {});
    e.citations.forEach((sid) => { const s = sources.get(sid); if (s && s.cites.indexOf(e.id) < 0) s.cites.push(e.id); });
    entities.set(e.id, e);
    return e;
  }
  const cite = (texts) => (Array.isArray(texts) ? texts : [texts]).map(sourceFor).filter(Boolean).map((s) => s.id);
  const yr = (t) => (window.SeaTime ? window.SeaTime.yearLabel(t) : String(Math.floor(t)));
  const S = () => D().schema || { eras: [], vehicles: [] };
  const vehName = (id) => (S().vehicles.find((v) => v.id === id) || { name: id }).name;

  function build() {
    if (built) return;
    built = true;
    const data = D();
    const prepared = window.__sg && window.__sg.prepared ? window.__sg.prepared() : [];
    const titles = {};
    Object.keys(data).forEach((k) => { if (k.indexOf("routes:") === 0) titles[data[k].family] = data[k].title; });
    // eras
    S().eras.forEach((e) => add({ id: "era:" + e.id, kind: "era", title: e.name, layer: "time", era: [e.id], time: { start: e.from, end: e.to, precision: "year" },
      summary: e.name + " era on the SeaGlobe timeline, " + yr(e.from) + " – " + yr(e.to) + ".", sections: e.card_note ? [{ label: "Era card", text: e.card_note }] : [],
      evidence: { basis: "our-reconstruction", gaps: [] }, citations: [] }));
    // topics (route families)
    Object.keys(titles).forEach((f) => add({ id: "topic:" + f, kind: "topic", title: titles[f] || f, layer: /^air/.test(f) ? "air" : "sea", summary: "Route family: " + (titles[f] || f) + ".", citations: [] }));
    // vehicle types
    const vi = data.vehicle_info || {};
    S().vehicles.forEach((v) => {
      const c = vi[v.id] || {};
      add({ id: "vehicle:" + v.id, kind: "vehicle", title: v.name, layer: v.type === "air" ? "air" : v.type === "space" ? "space" : "sea", era: v.eras || [],
        summary: c.summary || (v.name + " (procedural model)."), sections: [{ label: "History", text: c.history }, { label: "Story", text: c.story }].filter((x) => x.text),
        facts: c.facts || null, citations: cite(c.content_citations || []), evidence: { basis: "secondary", gaps: gapsIn(c.history, c.story, c.facts) } });
    });
    // routes and named vessels
    prepared.forEach((r) => {
      const voy = (r.schedule && r.schedule.voyages) || [];
      const tl = [];
      if (r.start_date) tl.push({ date: r.start_date, label: "Start of the route as recorded", source: null });
      voy.forEach((v) => { if (v.start) tl.push({ date: v.start, label: (v.ship || r.name) + " departs" + (v.record ? " (" + v.record + ")" : "") }); if (v.end && v.end !== v.start) tl.push({ date: v.end, label: (v.ship || r.name) + " arrives" }); });
      if (r.end_date) tl.push({ date: r.end_date, label: "End of the route as recorded" });
      const related = [{ id: "vehicle:" + r.vehicle, rel: "vehicle" }, { id: "topic:" + r.family, rel: "part of" }, { id: "era:" + r.era, rel: "era" }];
      voy.filter((v) => v.vessel).forEach((v) => {
        const vid = "vessel:" + v.id;
        related.push({ id: vid, rel: r.type === "air" ? "aircraft" : "vessel" });
        add({ id: vid, kind: r.type === "air" ? "aircraft" : "vessel", title: v.vessel.name || v.ship, layer: r.type === "air" ? "air" : "sea", era: [r.era],
          time: { start: v.start, end: v.end, precision: "day" }, summary: (v.vessel.name || v.ship) + " on " + r.name + ".",
          sections: [{ label: "History", text: v.vessel.history }, { label: "Story", text: v.vessel.story }].filter((x) => x.text), facts: v.vessel.facts || null,
          timeline: [{ date: v.start, label: "Departs" }, v.end && v.end !== v.start ? { date: v.end, label: "Arrives" } : null].filter(Boolean),
          related: [{ id: "route:" + r.id, rel: "flew / sailed" }, { id: "vehicle:" + r.vehicle, rel: "type" }],
          citations: cite(v.vessel.content_citations || []), evidence: { reconstruction: !!r.reconstruction, basis: "secondary", gaps: gapsIn(v.vessel.history, v.vessel.story, v.vessel.facts) } });
      });
      const mid = r.path && r.path[Math.floor(r.path.length / 2)];
      add({ id: "route:" + r.id, kind: "route", title: r.name, layer: r.type === "air" ? "air" : "sea", type: r.type, era: [r.era], region: r.region,
        time: { start: r._t0, end: r._t1, precision: r.schedule && r.schedule.kind === "dated" ? "day" : "year" }, geo: mid ? { lat: mid[0], lon: mid[1] } : null,
        summary: r.notes || r.name, sections: [{ label: "History", text: r.history }, { label: "Story", text: r.story }].filter((x) => x.text),
        facts: Object.assign({ Years: yr(r._t0) + " – " + yr(r._t1 - 0.001), Vehicle: vehName(r.vehicle), Goods: (r.goods || []).join(", ") || "—", Source: r.source }, r.facts || {}),
        timeline: tl, related, citations: cite([].concat(r.citations || [r.citation], r.content_citations || [])),
        evidence: { reconstruction: !!r.reconstruction, confidence: r.confidence_level, basis: r.reconstruction ? "our-reconstruction" : "dataset", gaps: gapsIn(r.notes, r.history, r.story, r.facts) } });
    });
    // air hubs (OurAirports)
    (data.airports || []).forEach((a) => add({ id: "place:airport-" + a[0].toLowerCase(), kind: "place", title: a[1], aliases: [a[0], a[6]].filter(Boolean), layer: "air",
      geo: { lat: a[2], lon: a[3] }, summary: a[1] + (a[5] ? ", " + a[5] : "") + " (" + a[4] + "). Airport record from OurAirports; type: " + a[7].replace(/_/g, " ") + ".",
      facts: { ICAO: a[0], IATA: a[6] || "—", Country: a[4], Municipality: a[5] || "[UNKNOWN]", Coordinates: a[2] + ", " + a[3] }, evidence: { basis: "dataset", gaps: [] },
      citations: cite("OurAirports open data, airports.csv (public domain)"), related: [] }));
    // space (GCAT)
    const g = data.gcat, sc = data.space_content || {};
    if (g) {
      g.craft.forEach((c) => {
        const t = sc[c.jcat] || {};
        add({ id: "spacecraft:" + c.jcat.toLowerCase(), kind: "spacecraft", title: t.title || c.name, aliases: [c.name, c.plname, c.jcat].concat(t.aliases || []).filter(Boolean), layer: "space",
          time: { start: c.ldate, precision: "day" }, summary: t.summary || ("GCAT object " + c.jcat + "."), sections: t.history ? [{ label: "History", text: t.history }] : [],
          facts: { "GCAT ID": c.jcat, "GCAT name": c.name, "Launch date (GCAT)": c.ldate, "Owner code (GCAT)": c.owner, "State code (GCAT)": c.state,
            "Orbit as listed in GCAT": (c.perigee_km != null ? c.perigee_km + " × " + c.apogee_km + " km, " + c.inc_deg + "°" : "[UNKNOWN]") + (c.orbit ? " (" + c.orbit + ")" : "") },
          timeline: [{ date: c.ldate, label: "Launch (GCAT)" }], related: [{ id: "topic:space", rel: "part of" }],
          citations: cite([g.citation].concat(t.cite || [])), evidence: { basis: "dataset", gaps: gapsIn(t.history) } });
      });
      g.sites.forEach((s) => add({ id: "place:site-" + s.code.toLowerCase(), kind: "place", title: s.short + " launch site (" + s.code + ")", aliases: [s.name], layer: "space",
        geo: { lat: s.lat, lon: s.lon }, time: { start: s.first, end: s.last + 0.999, precision: "year" },
        summary: s.name + ": " + s.launches + " orbital launch attempts listed in the GCAT launch log, " + s.first + "–" + s.last + ".",
        facts: { "GCAT site code": s.code, "State code (GCAT)": s.state, "Launches listed": s.launches, "First / last": s.first + " / " + s.last, Coordinates: s.lat + ", " + s.lon },
        citations: cite(g.citation), evidence: { basis: "dataset", gaps: [] }, related: [{ id: "topic:space", rel: "part of" }] }));
      add({ id: "topic:space", kind: "topic", title: "Space age: satellites, stations and launch sites (1957–today)", layer: "space",
        summary: "Spacecraft and launch sites from GCAT. Yearly counts of payloads launched and of orbital launch attempts drive the space layer.", citations: cite(g.citation) });
    }
    // regions index (loaded lazily by the drill-down; added when present)
    addRegions();
    // back-links
    for (const e of entities.values()) e.related.forEach((r) => { const t = entities.get(r.id); if (t && !t.related.some((x) => x.id === e.id)) t.related.push({ id: e.id, rel: "see also" }); });
    buildIndex();
  }
  let regionsAdded = false;
  function addRegions() {
    const idx = (window.SEAGLOBE_REGIONS || {}).index;
    if (!idx || regionsAdded) return false;
    regionsAdded = true;
    idx.regions.forEach((r) => add({ id: "region:" + r.id, kind: "region", title: r.name, aliases: [r.a3, r.iso, r.postal, r.fips, r.long].filter(Boolean), layer: "regions",
      level: r.level, parent: r.parent === "world" ? null : "region:" + r.parent, bbox: r.bbox,
      geo: r.bbox ? { lat: (r.bbox[1] + r.bbox[3]) / 2, lon: (r.bbox[0] + r.bbox[2]) / 2 } : null,
      summary: r.name + (r.type ? " (" + r.type + ")" : "") + " — " + r.level + " in the region tree. Boundary from Natural Earth (public domain).",
      sections: [{ label: "History", text: "[UNKNOWN] — no region history has been written and checked yet." }],
      facts: { Level: r.level, Code: r.a3 || r.iso || r.fips || "—", Continent: r.continent || undefined },
      citations: cite("Natural Earth (public domain)"), evidence: { basis: "dataset", gaps: ["Region history [UNKNOWN]"] }, related: [] }));
    if (built) buildIndex();
    return true;
  }

  // ---------- search ----------
  let index = new Map();
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const tokens = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1);
  function buildIndex() {
    index = new Map();
    const put = (w, id, sc) => { let m = index.get(w); if (!m) index.set(w, (m = new Map())); m.set(id, Math.max(m.get(id) || 0, sc)); };
    for (const e of entities.values()) {
      tokens(e.title).forEach((w) => put(w, e.id, 10));
      e.aliases.forEach((a) => tokens(a).forEach((w) => put(w, e.id, 8)));
      tokens(e.summary).forEach((w) => put(w, e.id, 3));
      e.sections.forEach((s) => tokens(s.text).forEach((w) => put(w, e.id, 1)));
      if (e.facts) tokens(Object.values(e.facts).join(" ")).forEach((w) => put(w, e.id, 1));
    }
  }
  function search(q, opts) {
    build();
    const ws = tokens(q);
    if (!ws.length) return [];
    const score = new Map();
    ws.forEach((w, i) => {
      const hit = new Map();
      for (const [k, m] of index) if (k === w || (k.startsWith(w) && w.length >= 2)) m.forEach((sc, id) => hit.set(id, Math.max(hit.get(id) || 0, k === w ? sc : sc * 0.6)));
      if (i === 0) hit.forEach((sc, id) => score.set(id, sc));
      else for (const id of [...score.keys()]) { if (!hit.has(id)) score.delete(id); else score.set(id, score.get(id) + hit.get(id)); }
    });
    let out = [...score.entries()].map(([id, sc]) => ({ e: entities.get(id), sc: sc + (norm(entities.get(id).title) === norm(q) ? 50 : 0) }));
    if (opts && opts.kind) out = out.filter((x) => x.e.kind === opts.kind);
    if (opts && opts.layer) out = out.filter((x) => x.e.layer === opts.layer);
    out.sort((a, b) => b.sc - a.sc || a.e.title.localeCompare(b.e.title));
    return out.slice(0, (opts && opts.limit) || 50).map((x) => x.e);
  }

  // ---------- views ----------
  function all(filter) { build(); const out = [...entities.values()].filter((e) => !filter || filter(e)); out.sort((a, b) => a.title.localeCompare(b.title)); return out; }
  function az(letter) { return all((e) => e.kind !== "region" || e.level !== "county" ? norm(e.title).charAt(0) === letter.toLowerCase() : false); }
  function timeline(filter) {
    build();
    const T = window.SeaTime, rows = [];
    for (const e of entities.values()) {
      if (filter && !filter(e)) continue;
      e.timeline.forEach((t) => { const tv = typeof t.date === "number" ? t.date : T ? T.parse(String(t.date).replace(/\s+/g, " ").replace(/^(\d{4}) ([A-Z][a-z]{2}) +(\d+).*$/, (m, y, mo, d) => y + "-" + ("JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(mo) / 3 + 1).toString().padStart(2, "0") + "-" + d.padStart(2, "0"))) : NaN; if (Number.isFinite(tv)) rows.push({ t: tv, date: t.date, label: t.label, id: e.id, title: e.title, kind: e.kind }); });
    }
    rows.sort((a, b) => a.t - b.t);
    return rows;
  }
  function citeThis(e) {
    const v = (window.SEAGLOBE_VERSION || {}).version || "";
    return "SeaGlobe" + (v ? " v" + v : "") + ", \"" + e.title + "\" (" + e.kind + " entry " + e.id + "), https://adventurenlearn.github.io/SeaGlobe/#/entry/" + encodeURIComponent(e.id) + ". Built from the sources listed in the entry.";
  }
  window.SeaAtlas = {
    build, get: (id) => { build(); return entities.get(id) || null; }, all, az, search, timeline, citeThis, archiveLookup, addRegions,
    sources: () => { build(); return [...sources.values()].sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title)); },
    source: (id) => sources.get(id) || null, datasets: () => DATASETS.map((d) => Object.assign({}, d, { match: undefined })),
    count: () => { build(); const c = {}; for (const e of entities.values()) c[e.kind] = (c[e.kind] || 0) + 1; return c; },
    kinds: ["route", "vessel", "aircraft", "vehicle", "spacecraft", "place", "region", "era", "topic"],
  };
})();
