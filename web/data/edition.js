/* SeaGlobe edition settings. Each entry page loads one edition file (index.html: this one).
   Nothing here is secret. Empty strings mean "not set": the app then stays offline for that feature. */
(function () {
  "use strict";
  var defaults = {
    id: "web",                 // web (GitHub Pages, full), lite (Grok.me and small hosts), byo (PC: bring-your-own feeds)
    lite: false,
    r2Base: "",                // large-file host, e.g. an R2 public URL ending in "/". Empty: every large file uses its repo fallback
    updateUrl: "https://adventurenlearn.github.io/SeaGlobe/version.json",  // read-only version check
    byoFeeds: false            // live feeds the user brings (satellite elements, ADS-B receiver); off on hosted editions
    // chat: every edition can use the visitor's OWN xAI key (chat settings); there is no SeaGlobe chat server or key
  };
  var e = window.SEAGLOBE_EDITION || {};
  for (var k in defaults) if (!(k in e)) e[k] = defaults[k];
  window.SEAGLOBE_EDITION = e;
})();
