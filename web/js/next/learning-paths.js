/* Learning-path explainers: scaffold only. Does nothing unless SeaFlags.on("learningPaths") is true.
   No network, no UI, and no encyclopedia records unless ?exampleData=1. */
(function () {
  "use strict";
  const FLAG = "learningPaths";
  function enabled() { return window.SeaFlags && window.SeaFlags.on(FLAG); }
  function init() {
    if (!enabled()) return;
    document.dispatchEvent(new CustomEvent("seaglobe:next-layer", { detail: { flag: FLAG, example: !!(window.SeaFlags && window.SeaFlags.exampleData) } }));
  }
  window.SeaNext = window.SeaNext || {};
  window.SeaNext["learningPaths"] = { enabled, flag: FLAG, ready: false };
  function start() { init(); const s = window.SeaNext["learningPaths"]; if (s) s.ready = true; }
  start();
  window.addEventListener("seaglobe:ready", start);
})();
