// Ship's Log and focus mode.
const Q = "t=1985-06-01&pov=30,-30,2.5";
export default {
  scenes: [
    { name: "open", query: Q, minDur: 6,
      setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 1); },
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.8)) await c.press("#logBtn"); },
      lines: [
        { say: "The Ship's Log lists every voyage and route. Open it with the Log button, or press L.", cap: "The Ship’s Log lists every voyage and route. Open it with the Log button, or press L." },
        { say: "Each row has the years, the type, the goods, the confidence and the sources.", cap: "Each row has the years, the type, the goods, the confidence and the sources." },
      ] },
    { name: "filter", query: Q, minDur: 8,
      setup: async (c) => { await c.api("log", true); },
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 1)) await c.api("logSet", "type", "air"); },
      lines: [
        { say: "Filter it by era, type, goods, region or evidence. Here, the type is set to air.", cap: "Filter it by era, type, goods, region or evidence. Here, the type is set to air." },
        { say: "Everything that does not match dims on the globe. That is focus mode.", cap: "Everything that does not match dims on the globe. That is focus mode." },
      ] },
    { name: "fly", query: Q, minDur: 8,
      setup: async (c) => { await c.api("log", true); await c.api("logSet", "type", "air"); },
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 1)) { await c.api("log", false); await c.api("openRouteId", "concorde-london-new-york"); } },
      lines: [
        { say: "Click a row, or press Enter, and the globe flies to it and plays it.", cap: "Click a row, or press Enter, and the globe flies to it and plays it." },
        { say: "Export C S V saves the filtered list as a file on your computer.", cap: "“Export CSV” saves the filtered list as a file on your computer." },
      ] },
  ],
};
