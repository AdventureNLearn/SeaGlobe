/* Voyage engine: turns route records into moving vehicles.
   Pure math, no three.js, so it runs in node tests too.
   Timing kinds:
     dated   - real start/end dates from a record (optional dated anchors at waypoints)
     years   - sailing years from published history; months and pace reconstructed
     traffic - illustrative traffic: reconstructed timing, markers stand for typical traffic */
(function (root, factory) {
  const T = (typeof module === "object" && module.exports) ? require("./timemodel.js") : root.SeaTime;
  const api = factory(T);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SeaVoyages = api;
})(typeof window !== "undefined" ? window : globalThis, function (T) {
  const R_KM = 6371;
  const D2R = Math.PI / 180;

  function toVec(lat, lng) {
    const a = lat * D2R, b = lng * D2R;
    return [Math.cos(a) * Math.cos(b), Math.sin(a), Math.cos(a) * Math.sin(b)];
  }
  function toLatLng(v) {
    const n = Math.hypot(v[0], v[1], v[2]);
    return [Math.asin(v[1] / n) / D2R, Math.atan2(v[2], v[0]) / D2R];
  }
  function angle(a, b) {
    const d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    return Math.acos(d);
  }
  function slerp(a, b, f) {
    const w = angle(a, b);
    if (w < 1e-9) return a.slice();
    const s = Math.sin(w), k0 = Math.sin((1 - f) * w) / s, k1 = Math.sin(f * w) / s;
    return [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1];
  }

  // Great-circle polyline with cumulative km and the km mark of each original waypoint.
  function densify(path, stepDeg) {
    stepDeg = stepDeg || 1;
    const pts = [], cum = [], marks = [0];
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const a = toVec(path[i][0], path[i][1]), b = toVec(path[i + 1][0], path[i + 1][1]);
      const w = angle(a, b);
      const n = Math.max(1, Math.ceil(w / D2R / stepDeg));
      for (let k = 0; k < n; k++) {
        const v = slerp(a, b, k / n);
        if (pts.length) total += angle(pts[pts.length - 1], v) * R_KM;
        pts.push(v); cum.push(total);
      }
      if (i === path.length - 2) {
        total += angle(pts[pts.length - 1], b) * R_KM;
        pts.push(b); cum.push(total);
        marks.push(total);
      } else {
        marks.push(total + angle(pts[pts.length - 1], b) * R_KM);
      }
    }
    if (path.length === 1) { pts.push(toVec(path[0][0], path[0][1])); cum.push(0); }
    return { pts, cum, marks, total };
  }

  function pointAt(line, km) {
    const { pts, cum } = line;
    if (km <= 0) return pts[0];
    if (km >= line.total) return pts[pts.length - 1];
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= km) lo = m; else hi = m; }
    const seg = cum[hi] - cum[lo];
    return slerp(pts[lo], pts[hi], seg > 0 ? (km - cum[lo]) / seg : 0);
  }

  // Simple deterministic hash -> [0,1)
  function rnd(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 100000) / 100000;
  }

  function prepare(routes) {
    return routes.map((r) => {
      const line = densify(r.path, r.type === "air" ? 2 : 1);
      return Object.assign({}, r, {
        _line: line,
        _t0: T.parse(r.start_date),
        _t1: T.parse(r.end_date) + (String(r.end_date).length <= 5 ? 1 : 0),
      });
    });
  }

  function durationYears(route, sched) {
    let days = sched.duration_days || (route._line.total / (sched.speed_km_day || 100));
    if (sched.min_display_days) days = Math.max(days, sched.min_display_days);
    return Math.max(days, 2) / T.DAYS;
  }

  // Every voyage instance of a route that is under way at time t.
  function activeOn(route, t) {
    const s = route.schedule || {};
    const out = [];
    if (s.kind === "dated") {
      for (const v of s.voyages || []) {
        const t0 = T.parse(v.start);
        let t1 = T.parse(v.end);
        if (v.min_display_days) t1 = Math.max(t1, t0 + v.min_display_days / T.DAYS);
        if (t >= t0 && t <= t1 + 0.5 / T.DAYS) {
          out.push({ key: route.id + "|" + v.id, route, voyage: v, t0, t1, reverse: false, lateral: v.lateral_km || 0,
            timing: "dated", ship: v.ship, record: v.record });
        }
      }
      return out;
    }
    if (t < route._t0 || t > route._t1 + 1) return out;
    const dur = durationYears(route, s);
    if (s.kind === "years") {
      const years = s.every_year ? null : s.years;
      const yNow = Math.floor(t);
      const span = Math.ceil(dur) + 1;
      for (let y = yNow - span; y <= yNow; y++) {
        if (years && years.indexOf(y) < 0) continue;
        if (!years && (y < Math.floor(route._t0) || y > route._t1)) continue;
        const t0 = y + (s.start_day || 0) / T.DAYS;
        if (t < t0 || t > t0 + dur) continue;
        const convoy = s.convoy || 1;
        for (let c = 0; c < convoy; c++) {
          const lag = c * 2.5 / T.DAYS;
          if (t < t0 + lag) continue;
          out.push({ key: route.id + "|" + y + "|" + c, route, t0: t0 + lag, t1: t0 + lag + dur, reverse: false,
            lateral: (c - (convoy - 1) / 2) * 45, timing: "years", ship: s.label + (convoy > 1 ? " " + (c + 1) : ""),
            record: s.years_source, year: y });
        }
      }
      return out;
    }
    // traffic: departures spaced so about `active` markers are under way at once.
    const active = Math.max(1, s.active || 1);
    const spacing = dur / active;
    const phase = rnd(route.id) * spacing;
    const kNow = Math.floor((t - route._t0 - phase) / spacing);
    const kMin = kNow - Math.ceil(dur / spacing) - 1;
    for (let k = kMin; k <= kNow; k++) {
      const jitter = (rnd(route.id + ":" + k) - 0.5) * spacing * 0.5;
      const t0 = route._t0 + phase + k * spacing + jitter;
      const t1 = t0 + dur;
      if (t0 < route._t0 || t0 > route._t1 || t < t0 || t > t1) continue;
      const reverse = !!s.both_directions && (Math.abs(k) % 2 === 1);
      const convoy = s.convoy || 1;
      for (let c = 0; c < convoy; c++) {
        const lag = c * 1.2 / T.DAYS;
        if (t < t0 + lag || t > t1 + lag) continue;
        out.push({ key: route.id + "|" + k + "|" + c, route, t0: t0 + lag, t1: t1 + lag, reverse,
          lateral: (c - (convoy - 1) / 2) * 35, timing: "traffic", ship: s.label, record: null });
      }
    }
    return out;
  }

  // km along the line at time t, honoring dated anchors (e.g. a month at the Cape).
  function kmAt(inst, t) {
    const line = inst.route._line;
    const anchors = [[inst.t0, 0]];
    if (inst.voyage && inst.voyage.anchors && inst.voyage.anchors.length) {
      for (const a of inst.voyage.anchors) anchors.push([T.parse(a.date), line.marks[a.index] || 0]);
    }
    anchors.push([inst.t1, line.total]);
    anchors.sort((a, b) => a[0] - b[0]);
    let km = line.total;
    if (t <= anchors[0][0]) km = anchors[0][1];
    else {
      for (let i = 0; i < anchors.length - 1; i++) {
        const [ta, ka] = anchors[i], [tb, kb] = anchors[i + 1];
        if (t <= tb) { km = tb > ta ? ka + (kb - ka) * (t - ta) / (tb - ta) : kb; break; }
      }
    }
    km = Math.max(0, Math.min(line.total, km));
    return inst.reverse ? line.total - km : km;
  }

  // Position (lat,lng), heading vector info, and fraction for a vehicle at t.
  function stateAt(inst, t) {
    const line = inst.route._line;
    const km = kmAt(inst, t);
    const dir = inst.reverse ? -1 : 1;
    let p = pointAt(line, km);
    let ahead = pointAt(line, Math.max(0, Math.min(line.total, km + dir * 25)));
    if (angle(p, ahead) < 1e-7) {
      const back = pointAt(line, Math.max(0, Math.min(line.total, km - dir * 25)));
      ahead = [2 * p[0] - back[0], 2 * p[1] - back[1], 2 * p[2] - back[2]];
    }
    if (inst.lateral) {
      const side = cross(p, sub(ahead, p));
      const n = Math.hypot(side[0], side[1], side[2]) || 1;
      const off = inst.lateral / R_KM;
      p = [p[0] + side[0] / n * off, p[1] + side[1] / n * off, p[2] + side[2] / n * off];
      ahead = [ahead[0] + side[0] / n * off, ahead[1] + side[1] / n * off, ahead[2] + side[2] / n * off];
    }
    const ll = toLatLng(p), la = toLatLng(ahead);
    return { lat: ll[0], lng: ll[1], aheadLat: la[0], aheadLng: la[1], km, frac: line.total ? (inst.reverse ? 1 - km / line.total : km / line.total) : 0 };
  }

  // Trail points behind the vehicle (lat,lng), newest first.
  function trail(inst, t, lengthKm, n) {
    const line = inst.route._line;
    const km = kmAt(inst, t);
    const dir = inst.reverse ? -1 : 1;
    const out = [];
    for (let i = 0; i < n; i++) {
      const k = Math.max(0, Math.min(line.total, km - dir * lengthKm * i / (n - 1)));
      let p = pointAt(line, k);
      if (inst.lateral) {
        const q = pointAt(line, Math.max(0, Math.min(line.total, k + dir * 25)));
        const side = cross(p, sub(q, p));
        const m = Math.hypot(side[0], side[1], side[2]) || 1;
        const off = inst.lateral / R_KM;
        p = [p[0] + side[0] / m * off, p[1] + side[1] / m * off, p[2] + side[2] / m * off];
      }
      out.push(toLatLng(p));
    }
    return out;
  }

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  // All active vehicles at t, dated first, capped.
  function activeAll(prepared, t, cap, keepKey) {
    let all = [];
    for (const r of prepared) all = all.concat(activeOn(r, t));
    const rank = { dated: 0, years: 1, traffic: 2 };
    all.sort((a, b) => (a.key === keepKey ? -1 : b.key === keepKey ? 1 : 0) || rank[a.timing] - rank[b.timing] || (a.key < b.key ? -1 : 1));
    return cap ? all.slice(0, cap) : all;
  }

  function timingLabel(inst) {
    if (inst.timing === "dated") return inst.route.confidence === "logbook record" ? "Real dates: daily logbook positions" : "Real dates from the voyage record";
    if (inst.timing === "years") return "Reconstructed timing (" + (inst.record || "years from published history") + ")";
    return "Reconstructed timing: illustrative traffic, not a recorded voyage";
  }

  function isPre1500(route) { return route._t0 < 1500; }

  return { densify, pointAt, prepare, activeOn, activeAll, stateAt, trail, kmAt, timingLabel, isPre1500, toLatLng, toVec, R_KM };
});
