// Map tools: air hubs, measuring, coordinates, print view.
const Q = "t=1985-06-01&noprint=1&pov=48,-35,2.0";
export default {
  scenes: [
    { name: "hubs", query: Q, minDur: 6,
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.6)) await c.ev(() => window.SeaTools.layer("hubs", true)); },
      lines: [
        { say: "The air hubs layer marks 1,197 airports from Our Airports.", cap: "The air hubs layer marks 1,197 airports from OurAirports." },
      ] },
    { name: "measure", query: Q, minDur: 8,
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.6)) { await c.ev(() => window.SeaTools.measure(true)); await c.ev(() => window.SeaTools.measurePoints({ lat: 51.47, lon: -0.4543 }, { lat: 40.6413, lon: -73.7781 })); } },
      lines: [
        { say: "Measure draws a line between two points on the globe.", cap: "Measure draws a line between two points on the globe." },
        { say: "It shows the distance in kilometers, miles and nautical miles. Here, London Heathrow to New York J F K.", cap: "It shows the distance in km, mi and nmi. Here, London Heathrow to New York JFK." },
      ] },
    { name: "coords", query: Q, minDur: 6,
      setup: async (c) => { await c.ev(() => window.SeaTools.coords(true)); },
      frame: async (c, f, s) => { const x = 500 + 200 * Math.sin(s * 0.6), y = 360 + 80 * Math.cos(s * 0.5); await c.page.mouse.move(x, y); await c.ev((a, b) => window.__sg.cursor(a, b, false), x, y); },
      lines: [
        { say: "Coordinates shows the latitude and longitude under your pointer.", cap: "Coordinates shows the latitude and longitude under your pointer." },
      ] },
    { name: "print", query: Q, minDur: 7,
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.6)) await c.ev(() => window.SeaTools.print(window.SeaAtlas.get("route:concorde-london-new-york"))); },
      lines: [
        { say: "Print makes a clean page for an entry, with a picture of the globe. Then your browser's print dialog opens.", cap: "Print makes a clean page for an entry, with a picture of the globe. Then your browser’s print dialog opens." },
      ] },
  ],
};
