/* SeaGlobe encyclopedia: search, A–Z, browse by era / topic / layer / region, entry pages with timeline, related
   entries and references, comparisons, a global timeline, a bibliography and a sources & licences page.
   Hash routes: #/entry/<id>, #/search/<q>, #/az/<letter>, #/browse, #/guide, #/timeline, #/compare/<a>,<b>, #/bibliography, #/sources */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const A = () => window.SeaAtlas;
  const KIND = { route: "Route", vessel: "Ship", aircraft: "Aircraft", vehicle: "Vehicle type", spacecraft: "Spacecraft", "launch-year": "Launch year", place: "Place", region: "Region", level: "Drill-down level", era: "Era", topic: "Topic", tour: "Tour", link: "Outside project", app: "SeaGlobe feature", source: "Source", bell: "Bell", "uap-record": "UAP record", "starfire-archive": "StarFire archive", "starfire-record": "StarFire sighting" };
  const compareSet = [];
  let panel, body, q, last = "";

  function make() {
    panel = document.createElement("aside");
    panel.className = "panel glass atlaspanel"; panel.id = "atlasPanel"; panel.hidden = true; panel.setAttribute("aria-label", "Encyclopedia");
    panel.innerHTML = "<div class='loghead'><div><div class='kicker'>Encyclopedia</div><div class='psub' id='atlasCount'>—</div></div>" +
      "<div class='row'><button class='btn ghost icon' id='atlasBack' aria-label='Back' title='Back'>‹</button><button class='btn ghost icon' id='atlasClose' aria-label='Close encyclopedia'>×</button></div></div>" +
      "<input id='atlasQ' type='search' placeholder='Search ships, aircraft, routes, places, spacecraft, regions…' aria-label='Search the encyclopedia' autocomplete='off'>" +
      "<nav class='atabs' role='tablist'>" + [["guide", "Guide"], ["browse", "Browse"], ["az", "A–Z"], ["timeline", "Timeline"], ["compare", "Compare"], ["bibliography", "Bibliography"], ["sources", "Sources & licences"], ["ask", "Ask"], ["about", "About"]]
        .map(([k, l]) => "<button class='atab' data-av='" + k + "'>" + l + "</button>").join("") + "</nav>" +
      "<div class='abody' id='atlasBody' tabindex='0'></div>";
    document.body.appendChild(panel);
    body = $("atlasBody"); q = $("atlasQ");
    const btn = document.createElement("button");
    btn.className = "btn"; btn.id = "atlasBtn"; btn.setAttribute("aria-pressed", "false"); btn.setAttribute("aria-controls", "atlasPanel");
    btn.title = "Encyclopedia: every ship, aircraft, route, place and source (E)"; btn.textContent = "Encyclopedia";
    const logBtn = $("logBtn"); logBtn.parentNode.insertBefore(btn, logBtn.nextSibling);
    const mq = $("mQuick");
    if (mq) { const m = document.createElement("button"); m.className = "btn"; m.id = "mAtlasBtn"; m.textContent = "Encyclopedia"; m.addEventListener("click", () => { if (window.__sgMobile) window.__sgMobile.sheet(null); open(true); }); mq.appendChild(m); }
    btn.addEventListener("click", () => { if (window.SeaWindows && window.SeaWindows.state("atlas") && window.SeaWindows.state("atlas").minimized) { window.SeaWindows.expand("atlas"); open(true); return; } open(panel.hidden); });
    $("atlasClose").addEventListener("click", () => open(false));
    if (window.SeaWindows) window.SeaWindows.register("atlas", panel, { title: "Encyclopedia", minW: 320, minH: 240, sheet: true,
      onMinimize: () => { document.body.classList.remove("atlas-open"); },
      onExpand: () => { if (panel.hidden) open(true); else document.body.classList.add("atlas-open"); } });
    $("atlasBack").addEventListener("click", () => history.back());
    q.addEventListener("input", () => {
      const v = q.value.trim();
      if (/^#\/guide/.test(location.hash)) { if (window.SeaGuide) window.SeaGuide.render(body, v); return; }
      go(v ? "#/search/" + encodeURIComponent(v) : "#/browse", true);
    });
    panel.querySelectorAll("[data-av]").forEach((b) => b.addEventListener("click", () => go("#/" + b.dataset.av)));
    body.addEventListener("click", onClick);
    window.addEventListener("hashchange", route);
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") { if (e.key === "Escape" && e.target === q) open(false); return; }
      if (e.key === "e" || e.key === "E") { open(panel.hidden); e.preventDefault(); }
      if (e.key === "Escape" && !panel.hidden) open(false);
    });
  }
  function open(on) {
    panel.hidden = !on;
    document.body.classList.toggle("atlas-open", !!on);
    $("atlasBtn").setAttribute("aria-pressed", String(!!on));
    if (on && A().ensureAll) A().ensureAll().then(count);   // region and town entries join search on first open
    if (on) { if (window.__sg && window.__sg.log) window.__sg.log(false); if (!/^#\//.test(location.hash) || /^#\/topic(\/|$)/.test(location.hash)) go("#/browse"); else route(); setTimeout(() => q.focus(), 0); }
    else if (/^#\//.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
  }
  function go(h, replace) { if (location.hash === h) { route(); return; } if (replace) { history.replaceState(null, "", h); route(); } else location.hash = h; }
  function tabOn(k) { panel.querySelectorAll("[data-av]").forEach((b) => b.classList.toggle("active", b.dataset.av === k)); }
  function count() { const c = A().count(); $("atlasCount").textContent = Object.keys(c).sort().map((k) => c[k] + " " + (KIND[k] || k).toLowerCase() + (c[k] === 1 ? "" : "s")).join(" · "); }

  function route() {
    if (!panel) return;
    const h = decodeURIComponent(location.hash || "");
    const m = /^#\/([a-z]+)\/?(.*)$/.exec(h);
    if (!m) return;
    if (m[1] === "topic") return; // Topics owns #/topic/; do not open the encyclopedia
    if (panel.hidden) { panel.hidden = false; document.body.classList.add("atlas-open"); $("atlasBtn").setAttribute("aria-pressed", "true"); }
    count();
    const [, view, arg] = m;
    tabOn(view === "entry" || view === "search" ? "" : view);
    if (view === "entry") return entry(arg);
    if (view === "search") { if (q.value.trim() !== arg) q.value = arg; return results(A().search(arg, { limit: 80 }), "Results for “" + arg + "”"); }
    if (view === "az") return azView(arg || "a");
    if (view === "timeline") return timelineView(arg);
    if (view === "compare") return compareView(arg);
    if (view === "bibliography") return bibliography();
    if (view === "sources") return sourcesView();
    if (view === "about") return aboutView();
    if (view === "guide") { tabOn("guide"); if (window.SeaGuide) window.SeaGuide.render(body, q.value.trim()); else body.innerHTML = "<p class='small'>The Guide is not part of this copy.</p>"; return; }
    if (view === "ask") { if (window.SeaChat) window.SeaChat.view(body, arg); else body.innerHTML = "<p class='small'>Chat is not part of this copy.</p>"; tabOn("ask"); return; }
    if (view === "region") return regionTree(arg);
    return browse(arg);
  }
  function item(e) {
    return "<li><a href='#/entry/" + encodeURIComponent(e.id) + "'><b>" + esc(e.title) + "</b></a> <span class='akind'>" + esc(KIND[e.kind] || e.kind) + "</span>" +
      (e.evidence.reconstruction ? " <span class='pill recon'>Reconstruction</span>" : "") + "<div class='asum'>" + esc(String(e.summary || "").slice(0, 160)) + "</div></li>";
  }
  function results(list, head) { body.innerHTML = "<div class='psub'>" + esc(head) + " · " + list.length + "</div><ul class='alist'>" + list.map(item).join("") + "</ul>"; body.scrollTop = 0; }
  function browse(arg) {
    const p = new URLSearchParams(arg || "");
    const kind = p.get("kind") || "", era = p.get("era") || "", layer = p.get("layer") || "";
    const S = window.SEAGLOBE_DATA.schema;
    const list = A().all((e) => (!kind || e.kind === kind) && (!era || (e.era || []).indexOf(era) >= 0) && (!layer || e.layer === layer) && !(e.kind === "region" && e.level === "county"));
    const ORDER = ["era", "topic", "route", "vessel", "aircraft", "vehicle", "spacecraft", "place", "region"];
    if (!kind) list.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.title.localeCompare(b.title));
    const sel = (name, opts, v) => "<select data-bf='" + name + "'><option value=''>" + esc(name === "kind" ? "Every kind" : name === "era" ? "Every era" : "Every layer") + "</option>" + opts.map(([k, l]) => "<option value='" + esc(k) + "'" + (k === v ? " selected" : "") + ">" + esc(l) + "</option>").join("") + "</select>";
    body.innerHTML = "<div class='afilters'>" + sel("kind", A().kinds.map((k) => [k, KIND[k]]), kind) + sel("era", S.eras.map((e) => [e.id, e.name]), era) +
      sel("layer", [["sea", "Sea and land"], ["air", "Air"], ["space", "Space"], ["regions", "Regions"], ["time", "Eras"]], layer) + "</div>" +
      "<div class='arow'><a href='#/region/world'>Browse by region (world › country › state › county)</a></div>" +
      "<div class='psub'>" + list.length + " entries</div><ul class='alist'>" + list.slice(0, 300).map(item).join("") + "</ul>" + (list.length > 300 ? "<div class='psub'>Showing 300; search or filter to narrow.</div>" : "");
    body.querySelectorAll("[data-bf]").forEach((s) => s.addEventListener("change", () => {
      const o = new URLSearchParams(); body.querySelectorAll("[data-bf]").forEach((x) => { if (x.value) o.set(x.dataset.bf, x.value); }); go("#/browse/" + o.toString(), true);
    }));
    tabOn("browse");
  }
  function azView(letter) {
    const L = "abcdefghijklmnopqrstuvwxyz".split("");
    body.innerHTML = "<div class='azbar'>" + L.map((l) => "<a href='#/az/" + l + "'" + (l === letter ? " class='on'" : "") + ">" + l.toUpperCase() + "</a>").join("") + "</div><ul class='alist'>" + A().az(letter).map(item).join("") + "</ul>";
    body.scrollTop = 0; tabOn("az");
  }
  function regionTree(id) {
    const R = window.SEAGLOBE_REGIONS || {};
    if (!R.index) { body.innerHTML = "<div class='psub'>Loading the region index…</div>"; window.SeaRegions && window.SeaRegions.loadIndex().then(() => regionTree(id)); return; }
    A().addRegions();
    const kids = R.index.regions.filter((r) => (id === "world" ? r.parent === "world" : r.parent === id));
    const self = id === "world" ? null : A().get("region:" + id);
    const crumbs = [];
    let cur = self; while (cur) { crumbs.unshift(cur); cur = cur.parent ? A().get(cur.parent) : null; }
    body.innerHTML = "<div class='crumbs'><a href='#/region/world'>World</a>" + crumbs.map((c) => " › <a href='#/region/" + esc(c.id.slice(7)) + "'>" + esc(c.title) + "</a>").join("") + "</div>" +
      (self ? "<div class='arow'><a href='#/entry/" + esc(self.id) + "'>Open the " + esc(self.title) + " entry</a></div>" : "") +
      (kids.length ? "<ul class='alist cols'>" + kids.sort((a, b) => a.name.localeCompare(b.name)).map((r) => "<li><a href='#/region/" + esc(r.id) + "'>" + esc(r.name) + "</a></li>").join("") + "</ul>"
        : "<div class='psub'>No smaller open regions are packed below this level. Towns show on the globe when you zoom in.</div>");
    tabOn("browse");
  }
  function fmtDate(d) { return typeof d === "number" ? (window.SeaTime ? window.SeaTime.yearLabel(d) : String(d)) : esc(d); }
  function entry(id) {
    let e = A().get(id);
    if (!e && /^region:/.test(id) && window.SeaRegions) { body.innerHTML = "<div class='psub'>Loading regions…</div>"; window.SeaRegions.loadIndex().then(() => { A().addRegions(); if (A().get(id)) entry(id); else body.innerHTML = "<div class='psub'>No entry " + esc(id) + ".</div>"; }); return; }
    if (!e) { body.innerHTML = "<div class='psub'>No entry “" + esc(id) + "”. [UNKNOWN]</div>"; return; }
    const pills = [];
    pills.push(e.evidence.reconstruction ? "<span class='pill recon'>Reconstruction</span>" : e.evidence.basis === "dataset" ? "<span class='pill log'>From a dataset</span>" : "<span class='pill conf'>From cited sources</span>");
    if (e.evidence.confidence) pills.push("<span class='pill conf'>Confidence: " + esc(e.evidence.confidence) + "</span>");
    if (e.evidence.gaps.length) pills.push("<span class='pill seed'>[UNKNOWN] gaps: " + e.evidence.gaps.length + "</span>");
    const facts = e.facts ? "<dl class='facts'>" + Object.keys(e.facts).filter((k) => e.facts[k] != null && e.facts[k] !== "").map((k) => "<dt>" + esc(k) + "</dt><dd>" + esc(e.facts[k]) + "</dd>").join("") + "</dl>" : "";
    const secs = e.sections.map((s) => "<h3>" + esc(s.label) + "</h3><p>" + esc(s.text) + "</p>").join("");
    const tl = e.timeline.length ? "<h3>Timeline</h3><ul class='atl'>" + e.timeline.map((t) => "<li><b>" + fmtDate(t.date) + "</b> " + esc(t.label) + "</li>").join("") + "</ul>" : "";
    const rel = e.related.map((r) => ({ r, t: A().get(r.id) })).filter((x) => x.t);
    const related = rel.length ? "<h3>Related entries</h3><ul class='arel'>" + rel.slice(0, 40).map((x) => "<li><span class='akind'>" + esc(x.r.rel) + "</span> <a href='#/entry/" + encodeURIComponent(x.t.id) + "'>" + esc(x.t.title) + "</a></li>").join("") + "</ul>" : "";
    const gaps = e.evidence.gaps.length ? "<h3>Gaps</h3><ul class='agaps'>" + e.evidence.gaps.map((g) => "<li>" + esc(g) + "</li>").join("") + "</ul>" : "";
    const refs = "<h3>References</h3>" + (e.citations.length ? "<ol class='arefs'>" + e.citations.map((sid) => ref(A().source(sid))).join("") + "</ol>" : "<p class='small'>[UNKNOWN] — no reference recorded for this entry.</p>");
    body.innerHTML = "<article class='aentry' data-entry='" + esc(e.id) + "'><div class='kicker'>" + esc(KIND[e.kind] || e.kind) + (e.level ? " · " + esc(e.level) : "") + "</div><h2>" + esc(e.title) + "</h2>" +
      (e.aliases.length ? "<div class='small'>Also: " + esc(e.aliases.join(" · ")) + "</div>" : "") + "<div class='pills'>" + pills.join("") + "</div>" +
      "<div class='row actions aact'><button class='btn' data-act='show'>Show on globe</button><button class='btn ghost' data-act='compare'>Compare</button><button class='btn ghost' data-act='print'>Print</button><button class='btn ghost' data-act='cite'>Cite this</button><button class='btn ghost' data-listen='" + esc(e.id) + "' aria-pressed='false'>Listen</button></div>" +
      "<p class='alead'>" + esc(e.summary) + "</p>" + facts + secs + tl + related + gaps + refs + "<p class='small acite' hidden></p></article>";
    body.scrollTop = 0;
    window.dispatchEvent(new CustomEvent("seaglobe:entry", { detail: { entity: e, el: body.querySelector(".aentry") } }));
  }
  function ref(s) {
    if (!s) return "";
    const link = s.url ? " <a href='" + esc(s.url) + "' target='_blank' rel='noopener noreferrer'>link ↗</a> · <a href='" + esc(A().archiveLookup(s.url)) + "' target='_blank' rel='noopener noreferrer' title='Search the Internet Archive for saved copies (a lookup, not a checked snapshot)'>archive lookup ↗</a>" : "";
    return "<li><span class='stype " + esc(s.type) + "'>" + esc(s.type) + "</span> " + esc(s.title) + (s.author ? " — " + esc(s.author) : "") + link +
      "<div class='small'>Accessed: " + esc(s.accessed || "[UNKNOWN]") + " · Licence: " + esc(s.licence) + " · " + esc(s.host) + "</div></li>";
  }
  function onClick(ev) {
    const b = ev.target.closest("[data-act]"); if (!b) return;
    const id = (body.querySelector("[data-entry]") || {}).dataset ? body.querySelector("[data-entry]").dataset.entry : null;
    const e = id && A().get(id); if (!e) return;
    const act = b.dataset.act;
    if (act === "show") showOnGlobe(e);
    if (act === "compare") { if (compareSet.indexOf(e.id) < 0) compareSet.push(e.id); while (compareSet.length > 2) compareSet.shift(); go("#/compare/" + compareSet.map(encodeURIComponent).join(",")); }
    if (act === "print") { if (window.SeaTools) window.SeaTools.print(e); else window.print(); }
    if (act === "cite") { const c = body.querySelector(".acite"); c.hidden = false; c.textContent = A().citeThis(e); try { navigator.clipboard && navigator.clipboard.writeText(c.textContent).catch(() => {}); } catch (x) { /* clipboard blocked */ } }
  }
  function showOnGlobe(e) {
    const sg = window.__sg; if (!sg) return;
    if (e.kind === "route" && sg.openRouteId(e.id.slice(6))) return;
    const via = e.related.find((r) => /^route:/.test(r.id)); if ((e.kind === "vessel" || e.kind === "aircraft") && via && sg.openRouteId(via.id.slice(6))) return;
    if (e.kind === "era") { sg.goEra(e.id.slice(4)); return; }
    if (e.kind === "spacecraft" && window.SeaSky) { window.SeaSky.show(e); return; }
    if (e.kind === "region" && window.SeaRegions) { window.SeaRegions.focus(e); return; }
    if (e.kind === "bell" && window.SeaBells) window.SeaBells.enable(true);
    if (e.kind === "uap-record" && window.SeaUap) window.SeaUap.enable(true);
    if ((e.kind === "starfire-archive" || e.kind === "starfire-record" || e.layer === "starfire") && window.SeaStarfire) window.SeaStarfire.enable(true);
    if (e.geo) { if (e.layer === "air" && window.SeaTools) window.SeaTools.layer("hubs", true); if (e.layer === "space" && window.SeaSky) window.SeaSky.sites(true); sg.flyTo({ lat: e.geo.lat, lng: e.geo.lon, altitude: e.kind === "place" || e.kind === "bell" || e.kind === "uap-record" || e.kind === "starfire-record" ? 0.6 : 1.4 }, 2); }
  }
  function compareView(arg) {
    const ids = (arg || "").split(",").map(decodeURIComponent).filter(Boolean);
    const es = ids.map((id) => A().get(id)).filter(Boolean);
    if (es.length < 2) { body.innerHTML = "<p class='small'>Open an entry and press Compare, then open another and press Compare again. " + (es[0] ? "Chosen so far: <b>" + esc(es[0].title) + "</b>." : "") + "</p>"; tabOn("compare"); return; }
    const keys = [...new Set([].concat(Object.keys(es[0].facts || {}), Object.keys(es[1].facts || {})))];
    const row = (k, a, b) => "<tr><th>" + esc(k) + "</th><td>" + a + "</td><td>" + b + "</td></tr>";
    const ev = (e) => esc(e.evidence.reconstruction ? "Reconstruction" : e.evidence.basis) + (e.evidence.gaps.length ? " · " + e.evidence.gaps.length + " [UNKNOWN] gaps" : "");
    const span = (e) => e.time && e.time.start != null ? fmtDate(e.time.start) + (e.time.end != null ? " – " + fmtDate(e.time.end) : "") : "[UNKNOWN]";
    body.innerHTML = "<table class='acmp'><thead><tr><th></th>" + es.map((e) => "<th><a href='#/entry/" + encodeURIComponent(e.id) + "'>" + esc(e.title) + "</a></th>").join("") + "</tr></thead><tbody>" +
      row("Kind", esc(KIND[es[0].kind]), esc(KIND[es[1].kind])) + row("When", span(es[0]), span(es[1])) + row("Evidence", ev(es[0]), ev(es[1])) +
      keys.map((k) => row(k, esc((es[0].facts || {})[k] != null ? es[0].facts[k] : "—"), esc((es[1].facts || {})[k] != null ? es[1].facts[k] : "—"))).join("") +
      row("References", es[0].citations.length, es[1].citations.length) + "</tbody></table>";
    tabOn("compare");
  }
  function timelineView(arg) {
    const kind = arg || "";
    const rows = A().timeline((e) => !kind || e.kind === kind);
    body.innerHTML = "<div class='afilters'><select id='tlKind'><option value=''>Every kind</option>" + A().kinds.map((k) => "<option value='" + k + "'" + (k === kind ? " selected" : "") + ">" + esc(KIND[k]) + "</option>").join("") + "</select></div>" +
      "<div class='psub'>" + rows.length + " dated events, earliest first. Click a year to move the globe there.</div><ul class='atl big'>" +
      rows.slice(0, 600).map((r) => "<li><button class='linkbtn' data-t='" + r.t + "'>" + fmtDate(r.date) + "</button> <a href='#/entry/" + encodeURIComponent(r.id) + "'>" + esc(r.title) + "</a> — " + esc(r.label) + "</li>").join("") + "</ul>";
    $("tlKind").addEventListener("change", (e) => go("#/timeline/" + e.target.value, true));
    body.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => { window.__sg.setTime(parseFloat(b.dataset.t)); window.__sg.play(false); }));
    tabOn("timeline");
  }
  function bibliography() {
    const src = A().sources();
    const groups = { primary: [], secondary: [], tertiary: [], dataset: [] };
    src.forEach((s) => (groups[s.type] || (groups[s.type] = [])).push(s));
    body.innerHTML = "<p class='small'>Every work and dataset cited anywhere in the atlas, with the entries that cite it. Primary = original records and texts; secondary = histories and studies; tertiary = encyclopedias. Types are assigned by a stated rule (see Sources & licences).</p>" +
      Object.keys(groups).filter((k) => groups[k].length).map((k) => "<h3>" + esc(k[0].toUpperCase() + k.slice(1)) + " (" + groups[k].length + ")</h3><ol class='arefs'>" + groups[k].map((s) => ref(s).replace("</li>", "<div class='small'>Cited by: " +
        s.cites.slice(0, 8).map((id) => { const e = A().get(id); return e ? "<a href='#/entry/" + encodeURIComponent(id) + "'>" + esc(e.title) + "</a>" : ""; }).join(", ") + (s.cites.length > 8 ? " and " + (s.cites.length - 8) + " more" : "") + "</div></li>")).join("") + "</ol>").join("");
    tabOn("bibliography");
  }
  function sourcesView() {
    const ds = A().datasets();
    const V = window.SEAGLOBE_VERSION || {};
    const assets = window.SeaAssets ? window.SeaAssets.list() : [];
    body.innerHTML = "<h3>Datasets</h3><table class='acmp'><thead><tr><th>Dataset</th><th>Licence</th><th>Hosting</th><th>Attribution</th></tr></thead><tbody>" +
      ds.map((d) => "<tr><td><a href='" + esc(d.url) + "' target='_blank' rel='noopener noreferrer'>" + esc(d.title) + "</a></td><td>" + esc(d.licence) + "</td><td>" + esc(d.host) + "</td><td>" + esc(d.attribution) + "</td></tr>").join("") + "</tbody></table>" +
      "<h3>Rules</h3><ul class='small'><li>Only public-domain, CC0, CC BY, MIT and OFL material is bundled; share-alike, non-commercial and restricted sets are linked under Go deeper, never copied.</li>" +
      "<li>Every entry says whether it is a reconstruction. Anything a source does not state is marked [UNKNOWN].</li>" +
      "<li>Reference types: an encyclopedia is tertiary; named original texts, logbooks and records are primary; everything else is secondary. Datasets are listed separately.</li>" +
      "<li>Archive links are Internet Archive lookups, not checked snapshots.</li>" +
      "<li>No OpenFlights, ADS-B Exchange, CelesTrak or Space-Track data and no Google imagery is bundled. Live satellites and aircraft are bring-your-own in the PC edition only.</li></ul>" +
      "<h3>Large files</h3><table class='acmp'><thead><tr><th>Asset</th><th>Where it loads from now</th><th>Size</th><th>Licence</th></tr></thead><tbody>" +
      assets.map((a) => "<tr><td>" + esc(a.title || a.id) + "</td><td>" + esc(window.SeaAssets.status(a.id)) + "</td><td>" + (a.bytes ? (a.bytes / 1048576).toFixed(1) + " MiB" : "[UNKNOWN]") + "</td><td>" + esc(a.licence || "") + "</td></tr>").join("") + "</tbody></table>" +
      "<p class='small'>This copy: SeaGlobe v" + esc(V.version || "?") + " · build " + esc(V.commit || "?") + " · <span data-sg-version></span>. Full lists: DATA.md, SOURCES.md, ASSETS-LICENSES.md and THIRD-PARTY-NOTICES.md in the repository.</p>";
    if (window.SeaUpdate) window.SeaUpdate.render();
    tabOn("sources");
  }
  function aboutView() {
    const V = window.SEAGLOBE_VERSION || {}, E = window.SEAGLOBE_EDITION || {};
    body.innerHTML = "<h3>SeaGlobe</h3><p>An interactive globe and encyclopedia of historical routes by sea, land, air and space, with every route a cited reconstruction and every gap marked [UNKNOWN].</p>" +
      "<p class='credit'>Built by AdventureNLearn · <a href='https://x.com/AdventureNLearn' target='_blank' rel='noopener noreferrer'>@AdventureNLearn</a></p>" +
      "<p class='small'>Version " + esc(V.version || "?") + " (" + esc(E.id || "web") + " edition) · build " + esc(V.commit || "?") + " · " + esc(V.date || "") + " · <span data-sg-version></span> · <a href='CHANGELOG.md' target='_blank' rel='noopener'>Changelog</a></p>" +
      "<p class='small'>Keys: E encyclopedia · L Ship’s Log · Esc closes. Data, licences and credits: Sources & licences tab, DATA.md and THIRD-PARTY-NOTICES.md.</p>" +
      (window.SeaRadio ? "<div class='radioslot' id='radioSlot'><span class='kicker'>Radio</span> <button class='btn ghost small' id='aboutRadio'>Creedence Clearwater Revival Radio</button> <span class='small'>Needs internet; played by YouTube and outside radio sites. SeaGlobe hosts no audio.</span></div>" : "");
    if (window.SeaUpdate) window.SeaUpdate.render();
    const ar = $("aboutRadio"); if (ar) ar.addEventListener("click", () => window.SeaRadio.open(true));
    tabOn("about");
  }
  function init() { make(); if (/^#\//.test(location.hash)) setTimeout(route, 0); }
  function openGuide() { open(true); go("#/guide"); }
  window.SeaEncyclopedia = { open, go, openGuide, showOnGlobe, show: (id) => go("#/entry/" + encodeURIComponent(id)), compare: compareSet };
  window.addEventListener("seaglobe:ready", () => { if (!panel) init(); });
  if (window.__sg && window.__sg.globe && window.__sg.globe()) init();
})();
