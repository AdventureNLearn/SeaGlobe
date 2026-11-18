/* StarFire sightings: a heavy layer, off by default. Data is fetched only when
   the layer is turned on. Dated archive snapshot from 17 November 2026; there
   is no live feed and no refresh. Separate from official UAP records. */
(function () {
  "use strict";
  if (window.SeaStarfire) return;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const unk = (v) => (v == null || v === "" || v === "[UNKNOWN]" ? "Unknown" : String(v));
  const hasYear = (v) => v != null && v !== "" && v !== "[UNKNOWN]" && (typeof v === "number" || /^-?\d+(\.\d+)?$/.test(String(v).trim()));
  const FLAG = "starfire";
  const SNAPSHOT_ID = "starfire:snapshot-2026-11-17";
  const CREDIT = "StarFire by @wntrslmbr";
  const PIN_COLOR = "#d4a24a";
  const APPROX_COLOR = "#8fd4e8";
  const PIN_R = 0.15;
  const APPROX_R = 0.28;
  const st = { on: false, data: null, loading: null, ingested: false, hookedShow: false, selected: null };

  function records() {
    const recs = st.data && Array.isArray(st.data.records) ? st.data.records : [];
    return recs.filter((r) => r && r.example !== true);
  }
  function isApproximate(r) {
    const t = ((r && r.location_basis) || "") + " " + ((r && r.coordinate_source) || "");
    return /not a sighting position|state\/province-level|population-weighted|centroid/i.test(t);
  }
  function isRecordId(id) {
    return typeof id === "string" && id.indexOf("starfire:") === 0 && id !== SNAPSHOT_ID;
  }
  function sliderYears(r) {
    if (r.time && hasYear(r.time.start)) return [Number(r.time.start)];
    return [];
  }
  function citeLink(c) {
    const s = String(c == null ? "" : c);
    const m = s.match(/https?:\/\/[^\s<>"']+/);
    if (!m) return esc(s);
    const url = m[0].replace(/[),.;]+$/, "");
    const label = s.replace(url, "").replace(/:\s*$/, "").trim() || url;
    return "<a href='" + esc(url) + "' target='_blank' rel='noopener noreferrer'>" + esc(label) + "</a>";
  }
  function load() {
    if (st.data) return Promise.resolve(st.data);
    if (!st.loading) {
      st.loading = fetch("data/next/starfire/starfire.json").then((res) => {
        if (!res.ok) throw new Error("starfire data " + res.status);
        return res.json();
      }).then((data) => {
        st.data = data;
        (window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {}).starfire = data;
        return data;
      }).catch((e) => { st.loading = null; console.warn("SeaStarfire:", e); return null; });
    }
    return st.loading;
  }
  function ingestSnapshot() {
    if (st.ingested || !window.SeaAtlas || !window.SeaAtlas.ingest) return;
    window.SeaAtlas.ingest((api) => {
      api.add({
        id: SNAPSHOT_ID,
        kind: "starfire-archive",
        title: "StarFire sightings (17 November 2026 snapshot)",
        aliases: ["starfire", "starfire sightings", "starfire by @wntrslmbr", "wntrslmbr"],
        layer: "starfire",
        summary: "A dated archive snapshot of 206 StarFire sighting reports, credit StarFire by @wntrslmbr, taken 17 November 2026. The layer is off by default, counts as a heavy layer, and is historical only: there is no live feed and no updates. Individual reports are listed in the layer panel, not as separate encyclopedia entries. State, region or county centroid pins are marked approximate and are not the sighting position. This layer is separate from official UAP records.",
        sections: [
          { label: "How to use it", text: "In Layers, turn on StarFire sightings. The pack is a dated snapshot from 17 November 2026; SeaGlobe does not refresh or poll the archive. Open a pin or a row in the panel for that report's source links. Pins whose coordinates are a state, region or county centroid are drawn in a different style and labelled as an approximate location, not the sighting position." },
          { label: "Credit", text: CREDIT },
          { label: "Snapshot", text: "Taken 17 November 2026 (20:58:45 EST) from the public StarFire archive. There is no live feed and no refresh URL." }
        ],
        facts: {
          Credit: CREDIT,
          Snapshot: "17 November 2026",
          "Live feed": "None",
          Records: "206 sighting reports with coordinates",
          Licence: "MIT (StarFire archive); place data GeoNames, CC BY 4.0"
        },
        citations: api.cite([CREDIT + ", https://wntr-e6040b.gitlab.io/ (snapshot 17 November 2026)"]),
        evidence: {
          basis: "dataset",
          gaps: [
            "Official or archive finding for all 206 records is [UNKNOWN]",
            "Sighting date and/or time is unknown for 79 records",
            "What the reported objects were is [UNKNOWN]"
          ]
        }
      });
    });
    st.ingested = true;
  }
  function hookEncyclopedia() {
    const enc = window.SeaEncyclopedia;
    if (!enc || typeof enc.show !== "function" || st.hookedShow) return;
    const orig = enc.show;
    st.hookedShow = true;
    enc.show = function (id) {
      if (isRecordId(id)) { enable(true).then(() => showRecord(id)); return; }
      return orig.apply(this, arguments);
    };
  }
  function marks() {
    const host = $("starfireTicks") || (function () {
      const d = document.createElement("div"); d.id = "starfireTicks"; d.className = "sfticks"; d.hidden = true;
      const scrub = document.querySelector(".scrub");
      if (scrub) scrub.appendChild(d); else document.body.appendChild(d);
      return d;
    })();
    const schema = (window.SEAGLOBE_DATA || {}).schema;
    const min = schema && schema.timeline ? schema.timeline.min : -499;
    const max = schema && schema.timeline ? schema.timeline.max : 2026;
    const span = max + 1 - min;
    if (!st.on) { host.hidden = true; host.innerHTML = ""; return; }
    const years = {};
    records().forEach((r) => { sliderYears(r).forEach((y) => { years[y] = (years[y] || 0) + 1; }); });
    host.hidden = false;
    host.innerHTML = Object.keys(years).sort().map((y) => {
      const left = ((Number(y) - min) / span * 100);
      return "<button type='button' class='sftick' data-y='" + y + "' data-style='left:" + left + "%' title='" + esc("StarFire snapshot, " + y) + "' aria-label='" + esc("StarFire reports in " + y) + "'></button>";
    }).join("");
    host.onclick = (ev) => {
      const b = ev.target.closest(".sftick"); if (!b) return;
      const y = Number(b.getAttribute("data-y"));
      if (window.__sg) { if (window.__sg.idle) window.__sg.idle(false); if (window.__sg.setTime) window.__sg.setTime(y); }
      st.selected = null;
      panel();
    };
  }
  function recordDetail(r) {
    const approx = isApproximate(r);
    const cites = (r.citations || []).map((c) => "<li>" + citeLink(c) + "</li>").join("");
    return "<button type='button' class='sf-back' data-act='back'>Back to the list</button>" +
      "<div class='kicker'>" + esc(CREDIT) + "</div>" +
      "<h3 class='sf-title'>" + esc(r.title) + "</h3>" +
      "<p class='small'>" + esc(unk(r.place)) + " · " + esc(unk(r.date)) + "</p>" +
      (approx ? "<p class='sf-approx-note'>Approximate location — this pin is a state, region or county centroid, not the sighting position.</p>" : "") +
      "<p class='small'>Dated archive snapshot from 17 November 2026. There is no live feed and no updates.</p>" +
      (r.summary ? "<p>" + esc(r.summary) + "</p>" : "") +
      "<p class='small'>Finding: " + esc(unk(r.finding)) + " · Claim: " + esc(unk(r.claim)) + "</p>" +
      (cites ? "<div class='kicker'>Sources</div><ul class='sf-cites'>" + cites + "</ul>" : "");
  }
  function listHtml() {
    const pin = [], approx = [], miss = [];
    records().forEach((r) => {
      if (!(r.geo && typeof r.geo.lat === "number")) miss.push(r);
      else if (isApproximate(r)) approx.push(r);
      else pin.push(r);
    });
    const row = (r, cls) => "<li class='" + cls + "'><button type='button' class='sf-row' data-id='" + esc(r.id) + "'>" + esc(r.title) +
      (r.date ? " <span class='small'>" + esc(r.date) + "</span>" : "") +
      (cls === "sf-approx" ? " <span class='sf-tag'>Approximate location</span>" : "") +
      "</button></li>";
    return "<div class='kicker'>StarFire sightings</div>" +
      "<p class='small'>" + esc(CREDIT) + "</p>" +
      "<p class='small'>Dated archive snapshot from 17 November 2026. There is no live feed and no updates. " +
      pin.length + " place pins and " + approx.length + " approximate state, region or county centroid pins (not the sighting position).</p>" +
      (pin.length ? "<div class='kicker'>Sighting pins</div><ul class='sf-pinned'>" + pin.map((r) => row(r, "sf-pin")).join("") + "</ul>" : "") +
      (approx.length ? "<div class='kicker'>Approximate locations</div><ul class='sf-approx-list'>" + approx.map((r) => row(r, "sf-approx")).join("") + "</ul>" : "") +
      (miss.length ? "<div class='kicker'>Location unknown</div><ul class='sf-unknown'>" + miss.map((r) => row(r, "sf-miss")).join("") + "</ul>" : "");
  }
  function panel() {
    let el = $("starfirePanel");
    if (!el) {
      el = document.createElement("div");
      el.id = "starfirePanel"; el.className = "sfpanel glass"; el.hidden = true;
      el.setAttribute("aria-label", "StarFire sightings");
      document.body.appendChild(el);
      el.addEventListener("click", (ev) => {
        const back = ev.target.closest("[data-act='back']");
        if (back) { st.selected = null; panel(); return; }
        const b = ev.target.closest("[data-id]");
        if (b) showRecord(b.getAttribute("data-id"));
      });
    }
    if (!st.on) { el.hidden = true; return; }
    const rec = st.selected && records().find((r) => r.id === st.selected);
    el.innerHTML = rec ? recordDetail(rec) : listHtml();
    el.hidden = false;
    if (rec) {
      const note = el.querySelector(".sf-title") || el;
      if (note && note.scrollIntoView) note.scrollIntoView({ block: "nearest" });
    }
  }
  function pins() {
    if (!window.SeaTools) return;
    if (!st.on) { window.SeaTools.points("starfire", [], false); return; }
    const items = records().filter((r) => r.geo && typeof r.geo.lat === "number").map((r) => {
      const approx = isApproximate(r);
      return {
        lat: r.geo.lat, lon: r.geo.lon,
        color: approx ? APPROX_COLOR : PIN_COLOR,
        r: approx ? APPROX_R : PIN_R,
        alt: approx ? 0.008 : 0.004,
        id: r.id,
        approx: approx,
        label: "<b>" + esc(r.title) + "</b><div>" + esc(unk(r.place)) + " · " + esc(unk(r.date)) + "</div>" +
          (approx ? "<div>Approximate location — not the sighting position.</div>" : "")
      };
    });
    window.SeaTools.points("starfire", items, true);
  }
  function showRecord(id) {
    const rec = records().find((r) => r.id === id);
    if (!rec) return;
    st.selected = id;
    panel();
    if (rec.geo && typeof rec.geo.lat === "number" && window.__sg && window.__sg.flyTo) {
      window.__sg.flyTo({ lat: rec.geo.lat, lng: rec.geo.lon, altitude: 0.6 }, 2);
    }
  }
  function apply() {
    pins(); panel(); marks();
    const cb = $("tStarfire"); if (cb) cb.checked = st.on;
  }
  async function enable(on) {
    if (on && window.SeaLayers && !SeaLayers.request("starfire", true)) {
      const cb = $("tStarfire"); if (cb) cb.checked = false;
      return;
    }
    if (!on && window.SeaLayers) SeaLayers.request("starfire", false);
    if (on) {
      const data = await load();
      if (!data) { st.on = false; apply(); return; }
      st.on = true;
    } else {
      st.on = false;
      st.selected = null;
    }
    apply();
  }
  function init() {
    const pane = document.querySelector("[data-pane='layers'] .toggles");
    if (pane && !$("tStarfire")) {
      pane.insertAdjacentHTML("beforeend", "<label title='Shows a dated 17 November 2026 snapshot of StarFire sighting reports (StarFire by @wntrslmbr) at coarse (0.1 degree) pins. State, region or county centroids are marked as approximate and are not the sighting position. Historical only; no live feed and no updates. Off by default, and counts as a heavy layer.'><input type='checkbox' id='tStarfire'> StarFire sightings</label>");
      $("tStarfire").addEventListener("change", (ev) => enable(ev.target.checked));
    }
    ingestSnapshot();
    hookEncyclopedia();
    if (new URLSearchParams(location.search).get("starfire") === "1") enable(true);
  }
  window.SeaStarfire = {
    load, enable, enabled: () => st.on, records, sliderYears, isApproximate, show: showRecord,
    credit: CREDIT, snapshotId: SNAPSHOT_ID,
    colors: { pin: PIN_COLOR, approximate: APPROX_COLOR },
    state: () => ({
      on: st.on,
      loaded: !!st.data,
      total: records().length,
      pinned: records().filter((r) => r.geo && typeof r.geo.lat === "number").length,
      unknown: records().filter((r) => !(r.geo && typeof r.geo.lat === "number")).length,
      approximate: records().filter((r) => r.geo && typeof r.geo.lat === "number" && isApproximate(r)).length
    })
  };
  window.SeaNext = window.SeaNext || {};
  window.SeaNext.starfire = { enabled: () => true, flag: FLAG, ready: true, layer: window.SeaStarfire };
  window.addEventListener("seaglobe:ready", init);
  if (document.documentElement.dataset.ready === "1") init();
})();
