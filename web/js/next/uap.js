/* Official UAP records: a heavy layer, off by default. Data is fetched only when
   the layer is turned on or when the encyclopedia / chat asks for every entry.
   Historical records only; there is no live tracking. */
(function () {
  "use strict";
  if (window.SeaUap) return;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const unk = (v) => (v == null || v === "" || v === "[UNKNOWN]" ? "Unknown" : String(v));
  const hasYear = (v) => v != null && v !== "" && v !== "[UNKNOWN]" && (typeof v === "number" || /^-?\d+(\.\d+)?$/.test(String(v).trim()));
  const FLAG = "officialUap";
  const st = { on: false, data: null, loading: null, ingested: false };

  function records() {
    const recs = st.data && Array.isArray(st.data.records) ? st.data.records : [];
    return recs.filter((r) => r && r.example !== true);
  }
  function sliderYears(r) {
    if (r.time && hasYear(r.time.start)) return [Number(r.time.start)];
    return [];
  }
  function load() {
    if (st.data) return Promise.resolve(st.data);
    if (!st.loading) {
      st.loading = fetch("data/next/uap/uap.json").then((res) => {
        if (!res.ok) throw new Error("uap data " + res.status);
        return res.json();
      }).then((data) => {
        st.data = data;
        (window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {}).uap = data;
        ingestAtlas();
        return data;
      }).catch((e) => { st.loading = null; console.warn("SeaUap:", e); return null; });
    }
    return st.loading;
  }
  function ingestAtlas() {
    if (st.ingested || !window.SeaAtlas || !window.SeaAtlas.ingest) return;
    const recs = records();
    if (!recs.length) return;
    window.SeaAtlas.ingest((api) => {
      recs.forEach((r) => {
        const years = sliderYears(r);
        const facts = {
          Place: unk(r.place),
          Date: unk(r.date),
          Agency: unk(r.agency),
          Finding: unk(r.finding),
          Claim: unk(r.claim)
        };
        if (r.status) facts.Status = String(r.status);
        if (r.geo && typeof r.geo.lat === "number") facts.Coordinates = r.geo.lat + ", " + r.geo.lon;
        else facts.Coordinates = "Unknown";
        if (r.location_basis) facts.Location = r.location_basis;
        if (r.coordinate_source) facts["Coordinate source"] = r.coordinate_source;
        const missing = (v) => v == null || v === "" || v === "[UNKNOWN]";
        const gaps = [];
        if (r.evidence && Array.isArray(r.evidence.gaps)) r.evidence.gaps.forEach((g) => gaps.push(g));
        if (missing(r.finding)) gaps.push("Official finding unknown");
        if (!(r.geo && typeof r.geo.lat === "number")) gaps.push("Location unknown");
        const sections = [];
        if (r.summary) sections.push({ label: "Official record", text: r.summary });
        if (r.finding) sections.push({ label: "Official finding", text: r.finding });
        if (r.claim_note) sections.push({ label: "Claim", text: r.claim_note });
        (r.other_claims || []).forEach((c, i) => {
          if (!c || !c.text) return;
          sections.push({ label: "Other claim" + (c.label ? " (" + c.label + ")" : ""), text: c.text });
        });
        api.add({
          id: r.id, kind: "uap-record", title: r.title, aliases: r.aliases || [], layer: "uap",
          geo: r.geo && typeof r.geo.lat === "number" ? { lat: r.geo.lat, lon: r.geo.lon } : null,
          time: r.time || (years.length ? { start: Math.min.apply(null, years), end: Math.max.apply(null, years), precision: "year" } : null),
          summary: r.title + " — " + unk(r.place) + (r.date ? ", " + r.date : "") + ".",
          sections, facts, timeline: years.map((y) => ({ date: y, label: "Record year" })),
          citations: api.cite(r.citations || []),
          evidence: { basis: "primary", gaps }
        });
      });
    });
    st.ingested = true;
  }
  function marks() {
    const host = $("uapTicks") || (function () {
      const d = document.createElement("div"); d.id = "uapTicks"; d.className = "uapticks"; d.hidden = true;
      const scrub = document.querySelector(".scrub");
      if (scrub) scrub.appendChild(d); else document.body.appendChild(d);
      return d;
    })();
    const schema = (window.SEAGLOBE_DATA || {}).schema;
    const min = schema && schema.timeline ? schema.timeline.min : -499;
    const max = schema && schema.timeline ? schema.timeline.max : 2026;
    const span = max + 1 - min;
    if (!st.on) { host.hidden = true; host.innerHTML = ""; return; }
    const items = [];
    records().forEach((r) => {
      sliderYears(r).forEach((y) => items.push({ y, id: r.id, title: r.title }));
    });
    host.hidden = false;
    host.innerHTML = items.map((it) => {
      const left = ((it.y - min) / span * 100);
      return "<button type='button' class='uaptick' data-id='" + esc(it.id) + "' data-y='" + it.y + "' data-style='left:" + left + "%' title='" + esc(it.title) + " (" + it.y + ")' aria-label='" + esc(it.title + ", " + it.y) + "'></button>";
    }).join("");
    host.onclick = (ev) => {
      const b = ev.target.closest(".uaptick"); if (!b) return;
      const y = Number(b.getAttribute("data-y")), id = b.getAttribute("data-id");
      if (window.__sg) { if (window.__sg.idle) window.__sg.idle(false); if (window.__sg.setTime) window.__sg.setTime(y); }
      if (id && window.SeaEncyclopedia) window.SeaEncyclopedia.show(id);
    };
  }
  function panel() {
    let el = $("uapPanel");
    if (!el) {
      el = document.createElement("div");
      el.id = "uapPanel"; el.className = "uappanel glass"; el.hidden = true;
      el.setAttribute("aria-label", "Official UAP records");
      document.body.appendChild(el);
    }
    if (!st.on) { el.hidden = true; return; }
    const pin = [], miss = [];
    records().forEach((r) => (r.geo && typeof r.geo.lat === "number" ? pin : miss).push(r));
    const row = (r) => "<li><a href='#/entry/" + encodeURIComponent(r.id) + "'>" + esc(r.title) + "</a>" +
      (r.date ? " <span class='small'>" + esc(r.date) + "</span>" : "") +
      (r.location_basis ? " <span class='small'>" + esc(r.location_basis) + "</span>" : "") + "</li>";
    el.innerHTML = "<div class='kicker'>Official UAP records</div><ul class='uap-pinned'>" + pin.map(row).join("") + "</ul>" +
      (miss.length ? "<div class='kicker'>Location unknown</div><ul class='uap-unknown'>" + miss.map(row).join("") + "</ul>" : "");
    el.hidden = false;
  }
  function pins() {
    if (!window.SeaTools) return;
    if (!st.on) { window.SeaTools.points("uap", [], false); return; }
    const items = records().filter((r) => r.geo && typeof r.geo.lat === "number").map((r) => ({
      lat: r.geo.lat, lon: r.geo.lon, color: "#b7c4d4", r: 0.16, alt: 0.004, id: r.id,
      label: "<b>" + esc(r.title) + "</b><div>" + esc(unk(r.place)) + " · " + esc(unk(r.date)) + (r.location_basis ? " · " + esc(r.location_basis) : "") + "</div>"
    }));
    window.SeaTools.points("uap", items, true);
  }
  function apply() {
    pins(); panel(); marks();
    const cb = $("tUap"); if (cb) cb.checked = st.on;
  }
  async function enable(on) {
    if (on && window.SeaLayers && !SeaLayers.request("uap", true)) {
      const cb = $("tUap"); if (cb) cb.checked = false;
      return;
    }
    if (!on && window.SeaLayers) SeaLayers.request("uap", false);
    if (on) {
      const data = await load();
      if (!data) { st.on = false; apply(); return; }
      st.on = true;
    } else st.on = false;
    apply();
  }
  function init() {
    const pane = document.querySelector("[data-pane='layers'] .toggles");
    if (pane && !$("tUap")) {
      pane.insertAdjacentHTML("beforeend", "<label title='Shows official, declassified UAP records on the globe at coarse (0.1 degree) coordinates from a cited gazetteer. Historical records only; no live tracking. Off by default, and counts as a heavy layer.'><input type='checkbox' id='tUap'> Official UAP records</label>");
      $("tUap").addEventListener("change", (ev) => enable(ev.target.checked));
    }
    if (new URLSearchParams(location.search).get("uap") === "1") enable(true);
  }
  window.SeaUap = {
    load, enable, enabled: () => st.on,
    records, sliderYears,
    state: () => ({
      on: st.on,
      loaded: !!st.data,
      total: records().length,
      pinned: records().filter((r) => r.geo && typeof r.geo.lat === "number").length,
      unknown: records().filter((r) => !(r.geo && typeof r.geo.lat === "number")).length
    })
  };
  window.SeaNext = window.SeaNext || {};
  window.SeaNext.officialUap = { enabled: () => true, flag: FLAG, ready: true, layer: window.SeaUap };
  window.addEventListener("seaglobe:ready", init);
  if (document.documentElement.dataset.ready === "1") init();
})();
