// Space layer: launch sites, yearly counts, orbit rings.
export default {
  scenes: [
    { name: "sites", query: "t=1990-06-01&pov=25,-40,2.6", minDur: 7,
      setup: async (c) => { await c.api("orbit", true, 3, 20); },
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.6)) await c.ev(() => window.SeaSky.sites(true)); },
      lines: [
        { say: "The space layer adds 75 launch sites, from GCAT, the catalogue kept by Jonathan McDowell.", cap: "The space layer adds 75 launch sites, from GCAT, the catalogue kept by Jonathan McDowell." },
        { say: "Hover a site to see how many launch attempts it has had, and in which years.", cap: "Hover a site to see how many launch attempts it has had, and in which years." },
      ] },
    { name: "readout", query: "t=1990-06-01&pov=25,-40,2.6", minDur: 7,
      setup: async (c) => { await c.ev(() => window.SeaSky.sites(true)); await c.ev(() => window.SeaSky.readout()); await c.ev(() => document.getElementById("skyReadout").scrollIntoView({ block: "center" })); },
      lines: [
        { say: "The space readout follows the clock. In 1990 there were 121 orbital launch attempts, and 218 payloads were launched.", cap: "The space readout follows the clock. In 1990 there were 121 orbital launch attempts, and 218 payloads were launched." },
        { say: "The satellite dots are decorative. Their number is scaled to these counts.", cap: "The satellite dots are decorative. Their number is scaled to these counts." },
      ] },
    { name: "ring", query: "t=1999-06-01&pov=20,0,3.2", minDur: 8,
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.6)) await c.ev(() => window.SeaEncyclopedia.showOnGlobe(window.SeaAtlas.get("spacecraft:s25544"))); },
      lines: [
        { say: "Show a spacecraft on the globe, and an orbit ring appears. Here, Zarya, the first module of the International Space Station.", cap: "Show a spacecraft on the globe, and an orbit ring appears. Here, Zarya, the first module of the International Space Station." },
        { say: "The ring is drawn from the orbit's inclination and mean height. It is an illustration, not a live position.", cap: "The ring is drawn from the orbit’s inclination and mean height. It is an illustration, not a live position." },
      ] },
  ],
};
