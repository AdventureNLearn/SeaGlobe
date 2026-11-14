// Regions drill-down: country, state, county, towns.
export default {
  scenes: [
    { name: "world", query: "t=2010-06-01&regions=1&pov=40,-95,2.4", minDur: 6,
      setup: async (c) => { await c.ev(() => window.SeaRegions.enable(true)); },
      lines: [
        { say: "Turn on borders and regions in the Layers list.", cap: "Turn on “Borders and regions” in the Layers list." },
        { say: "From far away you see the countries.", cap: "From far away you see the countries." },
      ] },
    { name: "zoom", query: "t=2010-06-01&regions=1&pov=40,-95,2.4", minDur: 14,
      setup: async (c) => { await c.ev(() => window.SeaRegions.enable(true)); },
      frame: async (c, f, s) => {
        if (c.at(s, c.L[0].start)) await c.api("flyTo", { lat: 43.5, lng: -85.5, altitude: 1.1 }, 2.5);
        if (c.at(s, c.L[1].start)) await c.api("flyTo", { lat: 42.96, lng: -85.67, altitude: 0.42 }, 2.5);
        if (c.at(s, c.L[2].start)) await c.api("flyTo", { lat: 42.96, lng: -85.67, altitude: 0.26 }, 2.5);
        if (f % 10 === 0) await c.ev(() => window.SeaRegions.update());
      },
      lines: [
        { say: "Zoom in, and the states and provinces load.", cap: "Zoom in, and the states and provinces load." },
        { say: "Closer still, the United States counties.", cap: "Closer still, the United States counties." },
        { say: "Then the towns. The chip at the top shows where the centre of the view is, and where the boundaries come from.", cap: "Then the towns. The chip at the top shows where the centre of the view is, and where the boundaries come from." },
      ] },
    { name: "live", query: "t=2010-06-01&regions=1&pov=42.96,-85.67,0.26", minDur: 7,
      setup: async (c) => { await c.ev(() => window.SeaRegions.enable(true)); await c.ev(() => { const s = document.querySelector("[data-tab='layers'], .tab[data-tab='layers']"); if (s) s.click(); }); },
      frame: async (c, f, s) => { if (f % 10 === 0) await c.ev(() => window.SeaRegions.update()); },
      lines: [
        { say: "These boundaries come from Natural Earth, and they are built in.", cap: "These boundaries come from Natural Earth, and they are built in." },
        { say: "Live United States town boundaries, from the U.S. Census TIGERweb service, are off by default. They need the internet. If the service does not answer, the layer is skipped with a message.", cap: "Live US town boundaries, from the US Census TIGERweb service, are off by default. They need the internet. If the service does not answer, the layer is skipped with a message." },
      ] },
  ],
};
