// Creedence Clearwater Revival Radio. Recorded with no connection to YouTube (the player script address points at a
// closed local port), so the panel shows its offline message; no music is played or recorded.
const Q = "t=1969-07-01&pov=30,-40,2.4&radioapi=" + encodeURIComponent("http://127.0.0.1:1/iframe_api.js");
export default {
  allowErrors: [/ERR_CONNECTION_REFUSED|ERR_UNSAFE_PORT|Failed to load resource/],
  scenes: [
    { name: "open", query: Q, minDur: 5,
      setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 1); await c.api("orbit", true, 2, 25); },
      frame: async (c, f, s) => { if (c.at(s, c.L[1].start)) await c.press("#radioBtn"); },
      lines: [
        { say: "SeaGlobe has a radio. It plays Creedence Clearwater Revival.", cap: "SeaGlobe has a radio. It plays Creedence Clearwater Revival." },
        { say: "Press Radio in the top bar to open the panel.", cap: "Press Radio in the top bar to open the panel." },
      ] },
    { name: "panel", query: Q, minDur: 6,
      setup: async (c) => { await c.api("orbit", true, 2, 25); await c.ev(() => window.SeaRadio.open(true)); },
      lines: [
        { say: "The player is YouTube's own embedded player. It plays the official playlist, Chronicle, The 20 Greatest Hits.", cap: "The player is YouTube’s own embedded player. It plays the official playlist, Chronicle: The 20 Greatest Hits." },
        { say: "Nothing loads until you press Load the player. Nothing plays until you press play.", cap: "Nothing loads until you press “Load the player”. Nothing plays until you press play." },
        { say: "SeaGlobe hosts no audio.", cap: "SeaGlobe hosts no audio." },
      ] },
    { name: "links", query: Q, minDur: 6,
      setup: async (c) => { await c.ev(() => window.SeaRadio.open(true)); },
      frame: async (c, f, s) => { if (c.at(s, 0.3)) await c.ev(() => document.querySelector(".radiolinks").scrollIntoView({ block: "center" })); },
      lines: [
        { say: "Below the player are two outside radio sites. Each link opens in a new tab.", cap: "Below the player are two outside radio sites. Each link opens in a new tab." },
        { say: "One is Exclusively Creedence Clearwater Revival, on radio dot net. The other is Creedence Clearwater Revival Experience, on iHeartRadio.", cap: "One is Exclusively Creedence Clearwater Revival, on radio.net. The other is Creedence Clearwater Revival Experience, on iHeartRadio." },
        { say: "Each one is marked as an outside site, with a short note about it.", cap: "Each one is marked as an outside site, with a short note about it." },
      ] },
    { name: "offline", query: Q, minDur: 6,
      setup: async (c) => { await c.ev(() => window.SeaRadio.open(true)); },
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.5)) await c.press("#radioLoad"); },
      lines: [
        { say: "This recording has no connection to YouTube. So when we press Load the player, the panel says that radio needs internet.", cap: "This recording has no connection to YouTube. So when we press “Load the player”, the panel says that radio needs internet." },
        { say: "The rest of SeaGlobe keeps working. Close the panel, and the player is removed.", cap: "The rest of SeaGlobe keeps working. Close the panel, and the player is removed." },
      ] },
  ],
};
