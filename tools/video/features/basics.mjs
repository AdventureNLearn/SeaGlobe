// Getting around: sampler, eras, the clock, vehicle cards and the follow camera.
const T = "t=1700-06-01&pov=15,-35,2.3";
export default {
  scenes: [
    { name: "sampler", query: "pov=20,-20,2.6", minDur: 6,
      lines: [
        { say: "This is SeaGlobe. It shows the world's trade routes, from 500 B.C.E. to today.", cap: "This is SeaGlobe. It shows the world’s trade routes, from 500 BCE to today." },
        { say: "When it opens, a sampler of vessels from every era moves across the globe.", cap: "When it opens, a sampler of vessels from every era moves across the globe." },
      ] },
    { name: "eras", query: T, minDur: 6,
      setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 5); },
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 1.2)) await c.press("#eraChips button:nth-child(4)"); },
      lines: [
        { say: "Pick an era along the bottom. There are six, from Classical to Modern.", cap: "Pick an era along the bottom. There are six, from Classical to Modern." },
        { say: "The date and the era name show at the top.", cap: "The date and the era name show at the top." },
      ] },
    { name: "clock", query: T, minDur: 6,
      setup: async (c) => { await c.api("play", false); },
      frame: async (c, f, s) => {
        if (c.at(s, c.L[0].start + 0.8)) await c.press("#playBtn");
        if (c.at(s, c.L[1].start + 0.8)) await c.press("[data-speed='20']");
        if (c.at(s, c.L[1].end - 0.5)) await c.press("[data-speed='1']");
      },
      lines: [
        { say: "Play and pause the clock here.", cap: "Play and pause the clock here." },
        { say: "Choose one, five or twenty times speed. Or drag the date slider.", cap: "Choose 1×, 5× or 20× speed. Or drag the date slider." },
      ] },
    { name: "card", query: T, minDur: 8,
      setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 1); },
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.6)) { const k = await c.api("selectFirst"); c.state.k = k; } },
      lines: [
        { say: "Click any vehicle to open its card.", cap: "Click any vehicle to open its card." },
        { say: "The card shows the route, the years and the goods. It lists the sources, and how confident the record is.", cap: "The card shows the route, the years and the goods. It lists the sources, and how confident the record is." },
        { say: "Every reconstruction is labelled as one.", cap: "Every reconstruction is labelled as one." },
      ] },
    { name: "follow", query: T, minDur: 8,
      setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 1); const k = await c.api("selectFirst"); c.state.k = k; },
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.6)) await c.api("follow", true, 3, 0.4, 0.05, 0.7); },
      lines: [
        { say: "Follow puts the camera with the vehicle as it travels.", cap: "Follow puts the camera with the vehicle as it travels." },
        { say: "Time eases to a stop as your pointer nears a vehicle, so even fast ones can be clicked. The dates stay true.", cap: "Time eases to a stop as your pointer nears a vehicle, so even fast ones can be clicked. The dates stay true." },
      ] },
  ],
};
