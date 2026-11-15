/* Framing is allowed only for a Grok.me parent. GitHub Pages cannot send X-Frame-Options or CSP frame-ancestors. */
(function () {
  "use strict";
  var MESSAGE = "SeaGlobe must be opened directly.";

  function grokMe(s) {
    try {
      if (!/^https:\/\//i.test(String(s || ""))) return false;
      var u = new URL(s);
      if (u.protocol !== "https:") return false;
      var h = u.hostname.toLowerCase();
      return h === "grok.me" || (h.length > 8 && h.slice(-8) === ".grok.me");
    } catch (e) {
      return false;
    }
  }

  function parentHints() {
    if (typeof window.__sgFrameParentStub === "string") return [window.__sgFrameParentStub];
    if (Array.isArray(window.__sgFrameParentStub)) return window.__sgFrameParentStub.slice();
    try {
      var a = location.ancestorOrigins;
      if (a && a.length) {
        var out = [];
        for (var i = 0; i < a.length; i++) out.push(a[i]);
        return out;
      }
    } catch (e) {}
    return document.referrer ? [document.referrer] : [];
  }

  function allowedParent() {
    var hints = parentHints();
    if (!hints.length) return false;
    for (var i = 0; i < hints.length; i++) if (!grokMe(hints[i])) return false;
    return true;
  }

  function painted() {
    return /SeaGlobe must be opened directly/.test((document.documentElement && document.documentElement.textContent) || "");
  }
  function paint() {
    try {
      var html = document.documentElement;
      while (html.firstChild) html.removeChild(html.firstChild);
      var body = document.createElement("body");
      body.textContent = MESSAGE;
      html.appendChild(body);
    } catch (e) {
      try { document.documentElement.textContent = MESSAGE; } catch (e2) {}
    }
  }
  function block() {
    window.__sgFrameBlocked = true;
    try { window.stop(); } catch (e) {}
    try {
      document.open();
      document.write("<!doctype html><title>SeaGlobe</title><meta charset=\"utf-8\"><body>" + MESSAGE + "</body>");
      document.close();
    } catch (e) {}
    if (!painted()) paint();
  }

  if (window.top === window.self) return;
  if (allowedParent()) return;
  try { window.top.location = window.self.location.href; } catch (e) { block(); }
})();
