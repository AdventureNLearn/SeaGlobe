// On a phone (390 x 844, touch): what differs from the desktop layout.
const Q = "t=1970-01-23&pov=48,-38,1.9";
export default {
  phone: true,
  allowErrors: [/ERR_CONNECTION_REFUSED|ERR_UNSAFE_PORT|Failed to load resource/],
  scenes: [
    { name: "home", query: Q, minDur: 6,
      setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 1); },
      lines: [
        { say: "On a phone, the globe fills the screen.", cap: "On a phone, the globe fills the screen." },
        { say: "One bar at the bottom has play, speed, the year and the menu.", cap: "One bar at the bottom has play, speed, the year and the menu." },
      ] },
    { name: "menu", query: Q, minDur: 8,
      frame: async (c, f, s) => {
        if (c.at(s, c.L[0].start + 0.5)) await c.press("#menuBtn");
        if (c.at(s, c.L[1].start + 0.3)) await c.press(".tab[data-tab='layers']");
      },
      lines: [
        { say: "The menu opens a sheet from the bottom, with the eras, layers, routes and the Ship's Log.", cap: "The menu opens a sheet from the bottom, with the eras, layers, routes and the Ship’s Log." },
        { say: "The Encyclopedia and Radio buttons are in this sheet too.", cap: "The Encyclopedia and Radio buttons are in this sheet too." },
      ] },
    { name: "card", query: Q, minDur: 7,
      setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 0.3); },
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.5)) { const h = await c.find("v.route.vehicle==='boeing-747'"); if (h) await c.api("select", h.key); } },
      lines: [
        { say: "Tap a vehicle, and its card opens as a bottom sheet.", cap: "Tap a vehicle, and its card opens as a bottom sheet." },
      ] },
    { name: "encyclopedia", query: Q, minDur: 7,
      setup: async (c) => { await c.ev(() => window.SeaEncyclopedia.show("vehicle:boeing-747")); },
      lines: [
        { say: "The encyclopedia fills the screen, with the same tabs and entries as on a computer.", cap: "The encyclopedia fills the screen, with the same tabs and entries as on a computer." },
      ] },
    { name: "radio", query: Q + "&radioapi=" + encodeURIComponent("http://127.0.0.1:1/iframe_api.js"), minDur: 7,
      setup: async (c) => { await c.ev(() => window.SeaRadio.open(true)); },
      lines: [
        { say: "The radio panel fits the phone. The player stays at least two hundred pixels each way. Buttons are big enough to tap.", cap: "The radio panel fits the phone. The player stays at least 200 pixels each way. Buttons are big enough to tap." },
      ] },
  ],
};
