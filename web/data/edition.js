/* SeaGlobe edition settings. Each entry page loads one edition file (index.html: this one).
   Nothing here is secret. Empty strings mean "not set": the app then stays offline for that feature. */
(function () {
  "use strict";
  var defaults = {
    id: "web",                 // web (GitHub Pages, full), lite (Grok.me and small hosts), byo (PC: bring-your-own feeds)
    lite: false,
    r2Base: "",                // large-file host, e.g. an R2 public URL ending in "/". Empty: every large file uses its repo fallback
    chatUrl: "",               // chat Worker endpoint. Empty: the chat panel says it is offline
    updateUrl: "https://adventurenlearn.github.io/SeaGlobe/version.json",  // read-only version check
    byoFeeds: false,           // live feeds the user brings (satellite elements, ADS-B receiver); off on hosted editions
    byoKey: false              // a chat key the user keeps on this computer only (PC edition)
  };
  var e = window.SEAGLOBE_EDITION || {};
  for (var k in defaults) if (!(k in e)) e[k] = defaults[k];
  // a copy served from this computer (file:// or 127.0.0.1) is the PC edition: the chat key option may be shown there
  var local = location.protocol === "file:" || /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  if (local && e.id !== "lite") e.byoKey = true;
  window.SEAGLOBE_EDITION = e;
})();
