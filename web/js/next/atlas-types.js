/* Encyclopedia kind stubs for planned layers. Loaded from flags.js only when a
   next-layer flag is on. Does not add example records unless ?exampleData=1. */
(function () {
  "use strict";
  const KINDS = ["law", "authority", "tax", "explainer", "bell"];
  function kinds() { return KINDS.slice(); }
  window.SeaNext = window.SeaNext || {};
  window.SeaNext.atlasTypes = { kinds };
})();
