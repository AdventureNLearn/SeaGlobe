// The encyclopedia.
const Q = "t=1952-05-02&pov=20,20,2.4";
export default {
  scenes: [
    { name: "open", query: Q, minDur: 6,
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.8)) await c.press("#atlasBtn"); },
      lines: [
        { say: "The Encyclopedia button, or the E key, opens the encyclopedia. It has an entry for every vehicle, route, place, region and spacecraft in the atlas.", cap: "The Encyclopedia button, or the E key, opens the encyclopedia. It has an entry for every vehicle, route, place, region and spacecraft in the atlas." },
        { say: "Browse by kind. Or use the A to Z, the timeline, compare, the bibliography, and sources and licences.", cap: "Browse by kind. Or use the A–Z, the timeline, compare, the bibliography, and sources & licences." },
      ] },
    { name: "search", query: Q, minDur: 7,
      setup: async (c) => { await c.ev(() => window.SeaEncyclopedia.open(true)); },
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.6)) await c.type("#atlasQ", "comet"); },
      lines: [
        { say: "Search finds entries as you type. Here, the Comet.", cap: "Search finds entries as you type. Here, the Comet." },
      ] },
    { name: "entry", query: Q, minDur: 8,
      setup: async (c) => { await c.ev(() => window.SeaEncyclopedia.show("route:boac-comet-1952")); },
      frame: async (c, f, s) => { if (s > c.L[1].start && s < c.L[1].end) await c.ev((u) => { const b = document.getElementById("atlasBody"); b.scrollTop = u * (b.scrollHeight - b.clientHeight); }, Math.min(1, (s - c.L[1].start) / (c.L[1].end - c.L[1].start))); },
      lines: [
        { say: "An entry starts with a short summary. On the second of May, 1952, Comet G. A. L. Y. P. flew the world's first jetliner flight with fare-paying passengers.", cap: "An entry starts with a short summary. On 2 May 1952, Comet G-ALYP flew the world’s first jetliner flight with fare-paying passengers." },
        { say: "Then come the key facts, a timeline, related entries, the gaps marked unknown, and the references.", cap: "Then come the key facts, a timeline, related entries, the gaps marked [UNKNOWN], and the references." },
      ] },
    { name: "actions", query: Q, minDur: 8,
      setup: async (c) => { await c.ev(() => window.SeaEncyclopedia.show("route:boac-comet-1952")); },
      frame: async (c, f, s) => {
        if (c.at(s, c.L[0].start + 0.5)) await c.press("#atlasBody [data-act='cite']");
        if (c.at(s, c.L[1].start + 0.8)) await c.press("#atlasBody [data-act='show']");
      },
      lines: [
        { say: "Cite this gives a ready-made citation.", cap: "“Cite this” gives a ready-made citation." },
        { say: "Show on globe flies to the route. Listen reads the entry aloud, with captions.", cap: "“Show on globe” flies to the route. “Listen” reads the entry aloud, with captions." },
      ] },
  ],
};
