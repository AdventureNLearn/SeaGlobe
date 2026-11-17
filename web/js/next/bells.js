/* Historical bells: a light layer, off by default. Data is fetched only when the
   layer is turned on or when the encyclopedia / chat asks for every entry. */
(function () {
  "use strict";
  if (window.SeaBells) return;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const unk = (v) => (v == null || v === "" || v === "[UNKNOWN]" ? "Unknown" : String(v));
  const hasYear = (v) => v != null && v !== "" && v !== "[UNKNOWN]" && (typeof v === "number" || /^-?\d+(\.\d+)?$/.test(String(v).trim()));
  const FLAG = "historicalBells";
  const st = { on: false, data: null, loading: null, ingested: false };

  function records() {
    const recs = st.data && Array.isArray(st.data.records) ? st.data.records : [];
    return recs.filter((r) => r && r.example !== true);
  }
  function sliderYears(r) {
    if (Array.isArray(r.sliderYears) && r.sliderYears.length) return r.sliderYears.filter((y) => typeof y === "number");
    if (hasYear(r.dateCast)) return [Number(r.dateCast)];
    return [];
  }
  function load() {
    if (st.data) return Promise.resolve(st.data);
    if (!st.loading) {
      st.loading = fetch("data/next/bells/bells.json").then((res) => {
        if (!res.ok) throw new Error("bells data " + res.status);
        return res.json();
      }).then((data) => {
        st.data = data;
        (window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {}).bells = data;
        ingestAtlas();
        return data;
      }).catch((e) => { st.loading = null; console.warn("SeaBells:", e); return null; });
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
          "Cast year": unk(r.dateCast),
          Founder: unk(r.founder),
          Foundry: unk(r.foundry),
          Weight: unk(r.weight),
          Size: unk(r.size),
          Status: unk(r.status)
        };
        if (r.dateInstalled != null && r.dateInstalled !== "" && r.dateInstalled !== "[UNKNOWN]") facts.Installed = String(r.dateInstalled);
        if (r.geo && typeof r.geo.lat === "number") facts.Coordinates = r.geo.lat + ", " + r.geo.lon;
        else facts.Coordinates = "Unknown";
        if (r.location_basis) facts["Location"] = r.location_basis;
        if (r.coordinate_source) facts["Coordinate source"] = r.coordinate_source;
        const timeline = years.map((y) => ({ date: y, label: "Cast year" }));
        if (r.id === "bell:campana-independencia") timeline.length = 0;
        const missing = (v) => v == null || v === "" || v === "[UNKNOWN]";
        const gaps = [];
        if (missing(r.dateCast)) gaps.push("Cast year unknown");
        if (missing(r.founder)) gaps.push("Founder unknown");
        if (missing(r.foundry)) gaps.push("Foundry unknown");
        if (!(r.geo && typeof r.geo.lat === "number")) gaps.push("Location unknown");
        api.add({
          id: r.id, kind: "bell", title: r.title, aliases: r.aliases || [], layer: "bells",
          geo: r.geo && typeof r.geo.lat === "number" ? { lat: r.geo.lat, lon: r.geo.lon } : null,
          time: years.length ? { start: Math.min.apply(null, years), end: Math.max.apply(null, years), precision: "year" } : (r.time || null),
          summary: r.title + " — " + unk(r.place) + (years.length ? ", cast " + years.join(" and ") : "") + ".",
          sections: r.history ? [{ label: "Facts", text: r.history }] : [],
          facts, timeline, citations: api.cite(r.citations || []),
          evidence: { basis: "primary", gaps }
        });
      });
    });
    st.ingested = true;
  }
  function marks() {
    const host = $("bellTicks") || (function () {
      const d = document.createElement("div"); d.id = "bellTicks"; d.className = "bellticks"; d.hidden = true;
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
      return "<button type='button' class='belltick' data-id='" + esc(it.id) + "' data-y='" + it.y + "' data-style='left:" + left + "%' title='" + esc(it.title) + " (" + it.y + ")' aria-label='" + esc(it.title + ", " + it.y) + "'></button>";
    }).join("");
    host.onclick = (ev) => {
      const b = ev.target.closest(".belltick"); if (!b) return;
      const y = Number(b.getAttribute("data-y")), id = b.getAttribute("data-id");
      if (window.__sg) { if (window.__sg.idle) window.__sg.idle(false); if (window.__sg.setTime) window.__sg.setTime(y); }
      if (id && window.SeaEncyclopedia) window.SeaEncyclopedia.show(id);
    };
  }
  function panel() {
    let el = $("bellsPanel");
    if (!el) {
      el = document.createElement("div");
      el.id = "bellsPanel"; el.className = "bellspanel glass"; el.hidden = true;
      el.setAttribute("aria-label", "Historical bells");
      document.body.appendChild(el);
    }
    if (!st.on) { el.hidden = true; return; }
    const pin = [], miss = [];
    records().forEach((r) => (r.geo && typeof r.geo.lat === "number" ? pin : miss).push(r));
    const row = (r) => "<li><a href='#/entry/" + encodeURIComponent(r.id) + "'>" + esc(r.title) + "</a>" +
      (hasYear(r.dateCast) || (r.sliderYears && r.sliderYears.length) ? " <span class='small'>" + esc(unk(r.dateCast)) + "</span>" : "") +
      (r.location_basis ? " <span class='small'>" + esc(r.location_basis) + "</span>" : "") + "</li>";
    el.innerHTML = "<div class='kicker'>Historical bells</div><ul class='bells-pinned'>" + pin.map(row).join("") + "</ul>" +
      (miss.length ? "<div class='kicker'>Location unknown</div><ul class='bells-unknown'>" + miss.map(row).join("") + "</ul>" : "");
    el.hidden = false;
  }
  function pins() {
    if (!window.SeaTools) return;
    if (!st.on) { window.SeaTools.points("bells", [], false); return; }
    const items = records().filter((r) => r.geo && typeof r.geo.lat === "number").map((r) => ({
      lat: r.geo.lat, lon: r.geo.lon, color: "#e7c766", r: 0.16, alt: 0.004, id: r.id,
      label: "<b>" + esc(r.title) + "</b><div>" + esc(unk(r.place)) + " · " + esc(unk(r.dateCast)) + (r.location_basis ? " · " + esc(r.location_basis) : "") + "</div>"
    }));
    window.SeaTools.points("bells", items, true);
  }
  function apply() {
    pins(); panel(); marks();
    const cb = $("tBells"); if (cb) cb.checked = st.on;
  }
  async function enable(on) {
    if (on && window.SeaLayers && !SeaLayers.request("bells", true)) {
      const cb = $("tBells"); if (cb) cb.checked = false;
      return;
    }
    if (!on && window.SeaLayers) SeaLayers.request("bells", false);
    if (on) {
      const data = await load();
      if (!data) { st.on = false; apply(); return; }
      st.on = true;
    } else st.on = false;
    apply();
  }
  function init() {
    const pane = document.querySelector("[data-pane='layers'] .toggles");
    if (pane && !$("tBells")) {
      pane.insertAdjacentHTML("beforeend", "<label title='Shows historical bells on the globe at official coordinates or at the last known building (approximate). Off by default.'><input type='checkbox' id='tBells'> Historical bells</label>");
      $("tBells").addEventListener("change", (ev) => enable(ev.target.checked));
    }
    if (new URLSearchParams(location.search).get("bells") === "1") enable(true);
  }
  window.SeaBells = {
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
  window.SeaNext.historicalBells = { enabled: () => true, flag: FLAG, ready: true, layer: window.SeaBells };
  window.addEventListener("seaglobe:ready", init);
  if (document.documentElement.dataset.ready === "1") init();
})();
