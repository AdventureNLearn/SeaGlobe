/* Short in-app Guide: one or two lines on each feature, shared with the encyclopedia and offline chat. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const TIPS = {
    tRoutes: "Shows the tracks of voyages on the globe.",
    tWakes: "Shows wakes and trails behind moving vehicles.",
    tShips: "Shows moving ships, aircraft and vehicles on the globe. Turn off to hide them and stop their animation.",
    tWind: "Shows schematic wind belts and logbook wind arrows.",
    tNight: "Shows city lights on the night side, in the modern era.",
    tSats: "Shows decorative satellite markers in the space age.",
    tOrbit: "Slowly rotates the camera around the globe.",
    tRegions: "Shows country, then state, then county, then town borders as you zoom in.",
    tLive: "Shows live US town boundaries from Census TIGERweb. Needs the internet.",
    tPmtiles: "Shows US Census TIGER/Line 2026 state, county, county-subdivision and place boundaries.",
    tTerrain: "Shows USGS 3DEP elevation over the US where tiles exist; elsewhere the globe stays as it is.",
    tHubs: "Shows airport hubs from OurAirports.",
    tCoords: "Shows latitude and longitude at the cursor.",
    tLaunch: "Shows launch sites from GCAT.",
    tBells: "Shows historical bells on the globe at official coordinates or at the last known building (approximate). Off by default."
  };

  const ITEMS = [
    { id: "layers", title: "Layers", lines: "Open the Layers tab to turn overlays on or off. Hover a toggle for a one-line tip about what it shows.", aliases: ["how to use layers", "layers tab"] },
    { id: "layer-cap", title: "Layer limit", lines: "Heavier overlays (wind, borders, live town boundaries, air hubs, launch sites, Census boundaries and terrain) have a cap: 5 at once on a desktop, 3 on a phone or in the lite edition. Turning on one more shows a short notice and leaves the others as they are. Turn one off to add another. If the window narrows so the cap drops, the extra layers turn off and the ones that still fit stay on.", aliases: ["how many layers can I turn on", "layer cap", "too many layers"] },
    { id: "bells", title: "Historical bells", lines: "In Layers, turn on Historical bells. Each bell is pinned at official coordinates when the source gives them, or at its last known building (marked approximate). The layer panel shows that basis. Each bell is in the encyclopedia, and bells with a known cast year appear on the time slider.", aliases: ["how to see historical bells", "historical bells", "bells layer", "show bells"] },
    { id: "ships", title: "Ships and assets", lines: "The Ships and assets toggle is on by default. Turn it off in Layers to hide every moving ship, aircraft and vehicle and stop their animation. The setting is remembered with the window layout.", aliases: ["how to hide ships", "ships and assets", "hide vehicles", "turn off ships"] },
    { id: "borders", title: "Borders and regions", lines: "Turn on Borders and regions, then zoom in: country, then state or province (every country), then county, then towns. Country and state names keep the same zoom ranges. County and town shapes load only for the state or country in view and unload when you move on. A breadcrumb follows the view.", aliases: ["how to see borders", "how to zoom to a county", "borders and regions", "states and provinces"] },
    { id: "census-borders", title: "US Census boundaries", lines: "On a visit with the borders flag, turn on US Census boundaries in Layers. It shows TIGER/Line 2026 state, county, county-subdivision and place lines.", aliases: ["how to turn on census boundaries", "pmtiles borders", "tiger line"] },
    { id: "terrain", title: "US terrain", lines: "On a visit with the terrain flag, turn on US terrain in Layers. It shows USGS 3DEP elevation where tiles exist, and leaves the globe as it is everywhere else. The current archive covers zooms 0–6 (zoom 6 partial); at closer zooms the closest available tile is used. Zoom 7–8 tiles are not in the archive.", aliases: ["how to turn on terrain", "turn terrain", "usgs 3dep"] },
    { id: "time-slider", title: "Time slider", lines: "Use the time bar at the bottom to play, change speed, or jump to an era. The date at the top follows the clock.", aliases: ["how to use the time slider", "time bar", "era chips"] },
    { id: "encyclopedia", title: "Encyclopedia", lines: "Press Encyclopedia (or E) to search ships, aircraft, routes, places and sources. The Guide tab is a short index of how to use each feature.", aliases: ["how to use the encyclopedia", "search the encyclopedia"] },
    { id: "radio", title: "Radio", lines: "Press Radio to open the optional radio panel. It needs the internet and loads only when you press it; SeaGlobe hosts no audio.", aliases: ["how to use radio", "open the radio"] },
    { id: "windows", title: "Windows", lines: "Drag a panel's header to move it, drag a corner to resize, and use Window controls to minimize, lock, or zoom that panel (not the globe). Reset layout is in the dock.", aliases: ["how to minimize a window", "how to move a window", "how to resize a window", "how to lock a window", "how to zoom a window", "window controls", "reset layout"] },
    { id: "chat", title: "Chat with your own key", lines: "Open Encyclopedia, then Ask. Without a key, it shows matching entries offline. With your own xAI API key it sends the question and those entries to xAI; you pay xAI, and Forget key removes it.", aliases: ["how to chat with my own key", "chat with my own key", "ask with my own key"] },
    { id: "lite", title: "Lite", lines: "The lite edition is a smaller copy of the same app, for small hosts and slower devices. Open lite.html, or the Grok.me build.", aliases: ["how to use lite", "lite.html"] },
    { id: "phone", title: "Phone", lines: "On a narrow screen the menu button opens a sheet with Layers, routes and eras. Encyclopedia and Radio sit in the quick buttons; a swipe down or × closes the sheet.", aliases: ["how to use the phone layout", "phone menu", "mobile sheet"] },
    { id: "route-lines", title: "Route lines", lines: "In Layers, turn on Route lines to show the tracks of voyages on the globe.", aliases: ["how to show route lines"] },
    { id: "wakes", title: "Wakes and trails", lines: "In Layers, turn on Wakes and trails to show the wakes behind moving vehicles.", aliases: ["how to show wakes"] },
    { id: "wind", title: "Wind belts", lines: "In Layers, turn on Wind belts to show schematic wind bands and logbook wind arrows.", aliases: ["how to show wind"] },
    { id: "night-lights", title: "Night lights", lines: "In Layers, turn on Night lights to show city lights on the night side, in the modern era.", aliases: ["how to show night lights"] },
    { id: "satellites", title: "Satellites", lines: "In Layers, turn on Satellites to show decorative satellite markers in the space age.", aliases: ["how to show satellites"] },
    { id: "orbit", title: "Slow orbit camera", lines: "In Layers, turn on Slow orbit camera to slowly rotate the view around the globe.", aliases: ["how to orbit the camera"] },
    { id: "live-towns", title: "Live US town boundaries", lines: "In Layers, turn on Live US town boundaries for Census TIGERweb outlines. It stays off until you choose it, and it needs the internet.", aliases: ["how to show live town boundaries", "tigerweb"] },
    { id: "air-hubs", title: "Air hubs", lines: "In Layers, turn on Air hubs to show airports from OurAirports.", aliases: ["how to show air hubs"] },
    { id: "launch-sites", title: "Launch sites", lines: "In Layers, turn on Launch sites to show the 75 GCAT launch sites.", aliases: ["how to show launch sites"] },
    { id: "cursor", title: "Cursor coordinates", lines: "In Layers, turn on Cursor coordinates to see latitude and longitude at the pointer.", aliases: ["how to show cursor coordinates"] },
    { id: "measure", title: "Measure distance", lines: "On the Layers tab, press Measure distance, then tap two points on the globe.", aliases: ["how to measure distance"] },
    { id: "print", title: "Print map view", lines: "On the Layers tab, press Print map view to print or save the current globe.", aliases: ["how to print the map"] },
    { id: "ships-log", title: "Ship's Log", lines: "Press Ship's Log (or L) to list every voyage and route. Filter, then press a line to open it.", aliases: ["how to use the ship's log", "voyage list"] },
    { id: "tours", title: "Tours", lines: "The Go deeper tab has narrated tours. Press a tour to start, then Next for the next stop. Narration never starts on its own.", aliases: ["how to start a tour", "go deeper tours"] },
    { id: "focus", title: "Focus", lines: "A Focus chip appears when you pick an era, or when you filter or select a voyage. Press × on the chip to clear it. Esc closes the Ship's Log first, then clears Focus.", aliases: ["how to clear focus", "focus chip"] },
    { id: "listen", title: "Listen", lines: "In the encyclopedia, Listen reads the current entry aloud with captions. Press Stop to end it.", aliases: ["how to listen", "read aloud"] }
  ];

  function records() {
    const overview = {
      id: "app:guide", kind: "app", title: "Guide", layer: "app",
      aliases: ["in-app guide", "help guide", "how to use seaglobe", "feature index"],
      summary: "A short index of every SeaGlobe feature, with one or two lines on how to use it. Open it from the Help button, or from the Encyclopedia's Guide tab; the search box filters the list.",
      sections: [{ label: "How to use it", text: "Press Help, or open the Encyclopedia and choose the Guide tab. Type to filter the list, or open any entry for the same short text." }],
      related: ITEMS.map((it) => "app:guide-" + it.id),
      citations: [], evidence: { basis: "our-reconstruction", gaps: [] }
    };
    return [overview].concat(ITEMS.map((it) => ({
      id: "app:guide-" + it.id, kind: "app", title: "Guide: " + it.title, layer: "app",
      aliases: it.aliases || [],
      summary: it.lines,
      sections: [{ label: "How to use it", text: it.lines }],
      related: ["app:guide"],
      citations: [], evidence: { basis: "our-reconstruction", gaps: [] }
    })));
  }

  function items(q) {
    const n = String(q || "").toLowerCase().trim();
    if (!n) return ITEMS.slice();
    return ITEMS.filter((it) => (it.title + " " + it.lines + " " + (it.aliases || []).join(" ")).toLowerCase().indexOf(n) >= 0);
  }

  function render(el, q) {
    if (!el) return;
    const list = items(q);
    el.innerHTML = "<div class='psub'>Guide · how to use each feature</div>" +
      "<ul class='alist'>" + list.map((it) =>
        "<li><a href='#/entry/" + encodeURIComponent("app:guide-" + it.id) + "'><b>" + esc(it.title) + "</b></a>" +
        "<div class='asum'>" + esc(it.lines) + "</div></li>"
      ).join("") + "</ul>" +
      (list.length ? "" : "<p class='small'>Nothing in the Guide matches that.</p>");
    el.scrollTop = 0;
  }

  function open() {
    if (window.SeaEncyclopedia && window.SeaEncyclopedia.openGuide) window.SeaEncyclopedia.openGuide();
    else location.hash = "#/guide";
  }

  function applyTips() {
    Object.keys(TIPS).forEach((id) => {
      const el = $(id);
      if (!el) return;
      const lab = el.closest("label") || el;
      if (lab.getAttribute("title") !== TIPS[id]) lab.setAttribute("title", TIPS[id]);
    });
  }

  function helpButton() {
    if ($("helpBtn")) return;
    const b = document.createElement("button");
    b.className = "btn"; b.id = "helpBtn";
    b.title = "Guide: how to use each feature";
    b.textContent = "Help";
    b.addEventListener("click", open);
    const atlas = $("atlasBtn");
    const logBtn = $("logBtn");
    if (atlas && atlas.parentNode) atlas.parentNode.insertBefore(b, atlas.nextSibling);
    else if (logBtn && logBtn.parentNode) logBtn.parentNode.insertBefore(b, logBtn.nextSibling);
  }

  function init() {
    helpButton();
    applyTips();
    const pane = document.querySelector(".toggles");
    if (pane) new MutationObserver(applyTips).observe(pane, { childList: true, subtree: true });
  }

  window.SeaGuide = { items: ITEMS, tips: TIPS, records, render, open, applyTips, filter: items };
  window.addEventListener("seaglobe:ready", init);
})();
