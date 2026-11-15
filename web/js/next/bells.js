/* Historical bells time-slider layer: scaffold only. Does nothing unless SeaFlags.on("historicalBells") is true.
   No network, no UI, and no encyclopedia records unless ?exampleData=1. */
(function () {
  "use strict";
  const FLAG = "historicalBells";
  function enabled() { return window.SeaFlags && window.SeaFlags.on(FLAG); }
  function init() {
    if (!enabled()) return;
    document.dispatchEvent(new CustomEvent("seaglobe:next-layer", { detail: { flag: FLAG, example: !!(window.SeaFlags && window.SeaFlags.exampleData) } }));
  }
  window.SeaNext = window.SeaNext || {};
  window.SeaNext["historicalBells"] = { enabled, flag: FLAG, ready: false };
  function start() { init(); const s = window.SeaNext["historicalBells"]; if (s) s.ready = true; }
  start();
  window.addEventListener("seaglobe:ready", start);
})();
