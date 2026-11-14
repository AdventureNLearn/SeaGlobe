/* Year model. t is a fractional astronomical year: t = 1595.25 is about 1 Apr 1595.
   Astronomical year 0 is 1 BCE, -499 is 500 BCE. Works in the browser and in node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SeaTime = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  // "1595-04-02", "1769-09-07T16:00", "1250", "-0479" (480 BCE), "0060-05-01"
  function parse(s) {
    if (typeof s === "number") return s;
    const m = /^(-?\d{1,4})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}))?)?)?$/.exec(String(s).trim());
    if (!m) throw new Error("bad date: " + s);
    const y = parseInt(m[1], 10);
    const mo = m[2] ? parseInt(m[2], 10) : 1;
    const d = m[3] ? parseInt(m[3], 10) : 1;
    const h = m[4] ? parseInt(m[4], 10) + parseInt(m[5], 10) / 60 : 0;
    const doy = CUM[mo - 1] + (d - 1) + h / 24;
    return y + doy / 365.25;
  }

  function yearLabel(y) {
    y = Math.floor(y);
    if (y <= 0) return (1 - y) + " BCE";
    if (y < 1000) return y + " CE";
    return String(y);
  }

  function parts(t) {
    const y = Math.floor(t);
    let doy = Math.floor((t - y) * 365.25 + 1e-6);
    let mo = 11;
    while (mo > 0 && CUM[mo] > doy) mo--;
    return { year: y, month: mo, day: Math.min(31, doy - CUM[mo] + 1) };
  }

  function dateLabel(t) {
    const p = parts(t);
    return p.day + " " + MONTHS[p.month] + " " + yearLabel(p.year);
  }

  function monthLabel(t) {
    const p = parts(t);
    return MONTHS[p.month] + " " + yearLabel(p.year);
  }

  function eraAt(eras, t) {
    for (const e of eras) if (t >= e.from && t < e.to + 1) return e;
    return t < eras[0].from ? eras[0] : eras[eras.length - 1];
  }

  return { parse, yearLabel, dateLabel, monthLabel, parts, eraAt, DAYS: 365.25 };
});
