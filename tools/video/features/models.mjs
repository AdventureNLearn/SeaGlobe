// Vehicle models (v3.0): the corrected aircraft, moving parts and ship detail, filmed close up with the follow camera.
const V = (id) => `v.route.vehicle==='${id}'`;
export default {
  scenes: [
    { name: "jet", query: "t=2005-06-01&pov=10,90,1.6", minDur: 9,
      setup: async (c) => { await c.pick(V("jet"), [2.6, 0.32, 0.25, 1.1], 0.05); },
      lines: [
        { say: "The aircraft models were rebuilt.", cap: "The aircraft models were rebuilt." },
        { say: "Their tails now sweep back, the right way. The red light is on the left wing tip, and the green light is on the right.", cap: "Their tails now sweep back, the right way. The red light is on the left wing tip, and the green light is on the right." },
        { say: "Each model's nose points along its course. A test checks this for every moving vehicle.", cap: "Each model’s nose points along its course. A test checks this for every moving vehicle." },
      ] },
    { name: "concorde", query: "t=1985-06-01&pov=51.5,-1,0.6", minDur: 9,
      setup: async (c) => { await c.pick(V("concorde"), [2.4, 0.22, 0.4, 1.4], 0.05); },
      // second line: the next London departure, just after take-off, gear down and nose drooped
      frame: async (c, f, s) => { if (c.at(s, c.L[1].start)) await c.pick(V("concorde"), [2.2, 0.2, 0.45, 1.4], 0.05, 0.03); },
      lines: [
        { say: "Concorde now has its own model. It has a delta wing, no tailplane, and four engines in pairs under the wing.", cap: "Concorde now has its own model. It has a delta wing, no tailplane, and four engines in pairs under the wing." },
        { say: "Near an airport, its landing gear comes down and its nose droops.", cap: "Near an airport, its landing gear comes down and its nose droops." },
      ] },
    { name: "747", query: "t=1970-01-22&pov=48,-38,1.6", minDur: 7,
      setup: async (c) => { await c.pick(V("boeing-747"), [2.8, 0.3, 0.2, 0.9], 0.05); },
      lines: [
        { say: "The Boeing 747 has its upper-deck hump at the front, and four engines hung under the wing.", cap: "The Boeing 747 has its upper-deck hump at the front, and four engines hung under the wing." },
      ] },
    { name: "comet", query: "t=1952-05-02&pov=40,10,1.6", minDur: 7,
      setup: async (c) => { await c.pick(V("comet"), [2.6, 0.3, 0.25, 1.0], 0.05); },
      lines: [
        { say: "The de Havilland Comet also has its own model, with its engines buried in the wing roots. Aircraft bank into their turns.", cap: "The de Havilland Comet also has its own model, with its engines buried in the wing roots. Aircraft bank into their turns." },
      ] },
    { name: "props", query: "t=1948-09-01&pov=52,11,1.0", minDur: 8,
      setup: async (c) => { await c.pick(V("dc-3"), [2.2, 0.25, 0.3, 1.2], 0.05); },
      lines: [
        { say: "Propellers spin. This is the DC-3, with its two radial engines.", cap: "Propellers spin. This is the DC-3, with its two radial engines." },
      ] },
    { name: "wright", query: "t=1903-12-20&pov=36,-75.7,0.6", minDur: 7,
      setup: async (c) => { await c.pick(V("wright-flyer"), [3.2, 0.42, 0.05, 0.7], 0.05); },
      lines: [
        { say: "The Wright Flyer has its small elevator in front, and two pusher propellers behind the wings.", cap: "The Wright Flyer has its small elevator in front, and two pusher propellers behind the wings." },
      ] },
    { name: "ships", query: "t=1880-03-01&pov=20,40,1.2", minDur: 9,
      setup: async (c) => { await c.pick(V("steamship"), [2.4, 0.3, 0.3, 1.0], 0.05); },
      frame: async (c, f, s) => { if (c.at(s, c.L[1].start)) await c.api("follow", true, 14, 0.5, 0.3, 1.0); },
      lines: [
        { say: "Close up, the steamship shows its lifeboats and portholes. Sails fill and breathe, and smoke drifts back from the funnel.", cap: "Close up, the steamship shows its lifeboats and portholes. Sails fill and breathe, and smoke drifts back from the funnel." },
        { say: "Far away, these details are left out, so the globe stays smooth. The lite version leaves them out too.", cap: "Far away, these details are left out, so the globe stays smooth. The lite version leaves them out too." },
        { say: "Every model is an artistic impression, made in code.", cap: "Every model is an artistic impression, made in code." },
      ] },
  ],
};
