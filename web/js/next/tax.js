/* Federal tax drill-down: scaffold only. Does nothing unless SeaFlags.on("taxDrilldown") is true.
   No network, no UI, and no encyclopedia records unless ?exampleData=1. */
(function () {
  "use strict";
  const FLAG = "taxDrilldown";
  function enabled() { return window.SeaFlags && window.SeaFlags.on(FLAG); }
  function init() {
    if (!enabled()) return;
    document.dispatchEvent(new CustomEvent("seaglobe:next-layer", { detail: { flag: FLAG, example: !!(window.SeaFlags && window.SeaFlags.exampleData) } }));
  }
  window.SeaNext = window.SeaNext || {};
  window.SeaNext["taxDrilldown"] = { enabled, flag: FLAG, ready: false };
  function start() { init(); const s = window.SeaNext["taxDrilldown"]; if (s) s.ready = true; }
  start();
  window.addEventListener("seaglobe:ready", start);
})();
