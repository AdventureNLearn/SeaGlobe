/* SeaUpdate: "Up to date" / "Update available" for every copy (Pages, Grok.me, PC).
   One read-only GET of the published version.json (cache-busting query, short timeout, no cookies).
   It never downloads or installs anything, and any failure (offline, blocked, 404, timeout) is silent. */
(function () {
  "use strict";
  var E = window.SEAGLOBE_EDITION || {};
  var V = window.SEAGLOBE_VERSION || { version: "0.0.0" };
  var P = new URLSearchParams(location.search);
  // "3.0.0" < "3.0.1" < "3.1.0"; a pre-release ("3.1.0-dev") is lower than its release; anything unparsable compares as equal
  function parse(v) {
    var m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(String(v || "").trim());
    return m ? { n: [+m[1], +m[2], +m[3]], pre: m[4] || "" } : null;
  }
  function compare(a, b) {
    var x = parse(a), y = parse(b);
    if (!x || !y) return 0;
    for (var i = 0; i < 3; i++) if (x.n[i] !== y.n[i]) return x.n[i] < y.n[i] ? -1 : 1;
    if (x.pre === y.pre) return 0;
    if (!x.pre) return 1;
    if (!y.pre) return -1;
    return x.pre < y.pre ? -1 : 1;
  }
  function url() {
    var u = E.updateUrl || "";
    var q = P.get("updateurl");   // tests: a local version.json on another port (localhost only)
    if (q && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(q)) u = q;
    return u;
  }
  var state = { status: "unknown", latest: null };
  function render() {
    var t = state.status === "update" ? "Update available: v" + state.latest.version
      : state.status === "current" ? "Up to date · v" + V.version : "v" + V.version;
    document.querySelectorAll("[data-sg-version]").forEach(function (el) {
      el.textContent = t;
      if (state.status === "update" && typeof state.latest.changelog_url === "string") el.title = "What changed: " + state.latest.changelog_url;
    });
    var n = document.getElementById("updateNotice");
    if (!n) return;
    var dismissed = false;
    try { dismissed = localStorage.getItem("sg-update-dismissed") === (state.latest && state.latest.version); } catch (e) { /* storage blocked */ }
    if (state.status !== "update" || dismissed) { n.hidden = true; return; }
    var link = /^https:\/\/[^\s'"<>]+$/.test(String(state.latest.changelog_url || "")) ? " <a href='" + encodeURI(state.latest.changelog_url) + "' target='_blank' rel='noopener noreferrer'>What changed</a>" : "";
    n.innerHTML = "<span>Update available: <b>v" + String(state.latest.version).replace(/[^0-9A-Za-z.-]/g, "") + "</b> (this copy is v" + V.version + ")." + link + "</span>" +
      "<button class='btn ghost icon' id='updateDismiss' aria-label='Dismiss update notice'>×</button>";
    n.hidden = false;
    document.getElementById("updateDismiss").onclick = function () {
      try { localStorage.setItem("sg-update-dismissed", state.latest.version); } catch (e) { /* storage blocked */ }
      n.hidden = true;
    };
  }
  function check(timeoutMs) {
    var u = url();
    if (!u || P.get("update") === "0" || P.get("capture") === "1" || P.get("shot") === "1" || !window.fetch) { render(); return Promise.resolve(state); }
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, timeoutMs || 4000);
    return fetch(u + (u.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now(), { method: "GET", mode: "cors", credentials: "omit", cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && parse(j.version)) { state.latest = j; state.status = compare(V.version, j.version) < 0 ? "update" : "current"; }
      })
      .catch(function () { /* offline or blocked: say nothing */ })
      .then(function () { clearTimeout(timer); render(); return state; });
  }
  window.SeaUpdate = { compare: compare, parse: parse, check: check, state: function () { return state; }, render: render };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { check(); });
  else check();
})();
