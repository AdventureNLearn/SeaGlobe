/* SeaAssets: one manifest for every asset, with a base-URL switch.
   Repo-tier files always load from the app folder. Large-tier files load from the R2 base when one is set,
   otherwise from their fallback in the repo (smaller copy) or are reported as not available. */
(function () {
  "use strict";
  var M = window.SEAGLOBE_ASSETS || { assets: [] };
  var E = window.SEAGLOBE_EDITION || {};
  var P = new URLSearchParams(location.search);
  var byId = {};
  M.assets.forEach(function (a) { byId[a.id] = a; });
  // tests and the PC edition may point the large tier at a local mock (localhost only, so a link cannot redirect assets)
  function r2Base() {
    var q = P.get("r2base");
    if (q && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(q)) return q;
    var mode = P.get("assets");
    if (mode === "local") return "";
    return E.r2Base || "";
  }
  function urls(id) {
    var a = byId[id];
    if (!a) return [];
    var out = [], base = r2Base();
    if (base && a.r2) out.push(base + a.r2);
    var root = window.SEAGLOBE_ASSET_ROOT || "";   // pages one folder down set "../"
    if (a.path) out.push(root + a.path);
    else if (a.fallback) out.push(root + a.fallback);
    return out;
  }
  function info(id) { return byId[id] || null; }
  function status(id) {
    var a = byId[id]; if (!a) return "unknown";
    if (r2Base() && a.r2) return "r2";
    if (a.path) return "repo";
    if (a.fallback) return "fallback";
    return "not-available";
  }
  // <video>: one <source> per candidate; the browser moves to the next on error, so a missing R2 copy falls back
  function video(el, id) {
    var list = urls(id); if (!list.length) return false;
    var cur = el.querySelectorAll("source");
    var have = Array.prototype.map.call(cur, function (s) { return s.getAttribute("src"); });
    if (have.join("|") === list.join("|")) return true;
    el.removeAttribute("src");
    Array.prototype.forEach.call(cur, function (s) { s.remove(); });
    list.forEach(function (u) { var s = document.createElement("source"); s.src = u; s.type = "video/mp4"; el.appendChild(s); });
    el.load();
    return true;
  }
  window.SeaAssets = { urls: urls, url: function (id) { return urls(id)[0] || null; }, info: info, status: status, video: video,
    base: function () { return r2Base() ? "r2" : "local"; }, list: function () { return M.assets.slice(); }, version: M.version };
})();
