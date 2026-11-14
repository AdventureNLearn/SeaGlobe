/* SeaBYO: bring-your-own live feeds, PC edition only (byo.html). Nothing here runs in the web or lite editions,
   and nothing is fetched until you press Start.
   - Satellites: paste TLE sets (or give a URL you are allowed to use); positions computed in the browser with
     satellite.js (MIT) at the current real time, independent of the history timeline.
   - Aircraft: the aircraft.json URL of YOUR OWN ADS-B receiver (dump1090 / readsb / tar1090 format), polled every 5 s.
   SeaGlobe ships no satellite or aircraft feed and stores your URLs and TLE text only in this browser. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const E = () => window.SEAGLOBE_EDITION || {};
  const st = { sats: [], satTimer: null, airTimer: null, airUrl: "", air: [], airStatus: "", satStatus: "" };
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage off */ } };
  const load = (k) => { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } };
  function parseTLE(text) {
    const L = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean), out = [];
    for (let i = 0; i < L.length; i++) {
      if (/^1 /.test(L[i]) && /^2 /.test(L[i + 1] || "")) {
        const name = i > 0 && !/^[12] /.test(L[i - 1]) ? L[i - 1].replace(/^0 /, "") : "NORAD " + L[i].slice(2, 7).trim();
        try { const rec = window.satellite.twoline2satrec(L[i], L[i + 1]); if (!rec.error) out.push({ name, rec, id: L[i].slice(2, 7).trim() }); } catch (e) { /* skip bad set */ }
        i++;
      }
    }
    return out;
  }
  function satPositions(date) {
    const S = window.satellite, d = date || new Date(), gm = S.gstime(d), out = [];
    st.sats.forEach((s) => {
      const p = S.propagate(s.rec, d); if (!p || !p.position || isNaN(p.position.x)) return;
      const g = S.eciToGeodetic(p.position, gm);
      out.push({ lat: S.degreesLat(g.latitude), lon: S.degreesLong(g.longitude), alt: Math.min(0.6, g.height / 6371), color: "#9fe8ff", r: 0.25,
        label: "<b>" + esc(s.name) + "</b><div>" + g.height.toFixed(0) + " km · from your TLE, now</div>", id: "byo-sat-" + s.id, km: g.height });
    });
    return out;
  }
  function satTick() { if (window.SeaTools) window.SeaTools.points("byo-sats", satPositions(), true); }
  function startSats(text) {
    if (!window.satellite) { st.satStatus = "satellite.js is missing from this copy."; status(); return 0; }
    st.sats = parseTLE(text); st.satStatus = st.sats.length ? st.sats.length + " satellites from your TLEs." : "No valid TLE sets found.";
    clearInterval(st.satTimer); if (st.sats.length) { satTick(); st.satTimer = setInterval(satTick, 2000); }
    status(); return st.sats.length;
  }
  async function loadTleUrl(url) {
    try { const r = await fetch(url, { credentials: "omit" }); if (!r.ok) throw new Error(r.status); const t = await r.text(); $("byoTle").value = t; save("sg-byo-tle", t); return startSats(t); }
    catch (e) { st.satStatus = "Could not read that URL (" + esc(e.message || "network") + "); nothing loaded."; status(); return 0; }
  }
  function aircraft(j) {
    return ((j && j.aircraft) || []).filter((a) => typeof a.lat === "number" && typeof a.lon === "number").map((a) => ({
      lat: a.lat, lon: a.lon, alt: 0.004 + Math.min(0.02, (+a.alt_baro || 0) / 3e6), color: "#ffe08a", r: 0.09,
      label: "<b>" + esc((a.flight || a.hex || "").trim()) + "</b><div>" + esc(a.alt_baro != null ? a.alt_baro + " ft" : "alt [UNKNOWN]") + (a.gs != null ? " · " + esc(Math.round(a.gs)) + " kt" : "") + " · your receiver</div>", id: "byo-air-" + a.hex }));
  }
  async function airTick() {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
    try { const r = await fetch(st.airUrl + (st.airUrl.includes("?") ? "&" : "?") + "t=" + Date.now(), { signal: ctl.signal, credentials: "omit", cache: "no-store" });
      const j = await r.json(); st.air = aircraft(j); st.airStatus = st.air.length + " aircraft with positions from your receiver.";
      if (window.SeaTools) window.SeaTools.points("byo-air", st.air, true); }
    catch (e) { st.airStatus = "Receiver did not answer; retrying every 5 s."; }
    clearTimeout(t); status();
  }
  function startAir(url) { st.airUrl = String(url || "").trim(); clearInterval(st.airTimer); if (!st.airUrl) return; save("sg-byo-air", st.airUrl); airTick(); st.airTimer = setInterval(airTick, 5000); }
  function stopAll() { clearInterval(st.satTimer); clearInterval(st.airTimer); st.sats = []; st.air = []; if (window.SeaTools) { window.SeaTools.points("byo-sats", [], false); window.SeaTools.points("byo-air", [], false); } st.satStatus = st.airStatus = "Stopped."; status(); }
  function status() { const el = $("byoStatus"); if (el) el.textContent = [st.satStatus, st.airStatus].filter(Boolean).join(" "); }
  function init() {
    if (!E().byoFeeds) return;
    const pane = document.querySelector("[data-pane='layers']"); if (!pane || $("byoBox")) return;
    pane.insertAdjacentHTML("beforeend", "<details class='byo' id='byoBox' open><summary class='kicker'>Your own live feeds (this PC)</summary>" +
      "<p class='small'>Nothing is fetched until you press Start. SeaGlobe ships no live data; use sources you are allowed to use.</p>" +
      "<label class='small'>Satellite TLE sets (paste)<textarea id='byoTle' rows='4' spellcheck='false' placeholder='NAME&#10;1 …&#10;2 …'></textarea></label>" +
      "<div class='row'><button class='btn' id='byoSatGo'>Start satellites</button><input id='byoTleUrl' placeholder='or a TLE URL you may use' aria-label='TLE URL'><button class='btn ghost' id='byoTleLoad'>Load URL</button></div>" +
      "<label class='small'>Your ADS-B receiver aircraft.json<input id='byoAir' placeholder='http://192.168.1.50/tar1090/data/aircraft.json'></label>" +
      "<div class='row'><button class='btn' id='byoAirGo'>Start aircraft</button><button class='btn ghost' id='byoStop'>Stop all</button></div><div class='small' id='byoStatus' aria-live='polite'></div></details>");
    $("byoTle").value = load("sg-byo-tle"); $("byoAir").value = load("sg-byo-air");
    $("byoSatGo").addEventListener("click", () => { save("sg-byo-tle", $("byoTle").value); startSats($("byoTle").value); });
    $("byoTleLoad").addEventListener("click", () => { const u = $("byoTleUrl").value.trim(); if (u) loadTleUrl(u); });
    $("byoAirGo").addEventListener("click", () => startAir($("byoAir").value));
    $("byoStop").addEventListener("click", stopAll);
  }
  window.SeaBYO = { parseTLE, satPositions, startSats, startAir, stopAll, aircraft, state: () => ({ sats: st.sats.length, air: st.air.length, satStatus: st.satStatus, airStatus: st.airStatus }) };
  window.addEventListener("seaglobe:ready", init);
})();
