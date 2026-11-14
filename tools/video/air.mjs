// Air layer (v2.3) walkthrough, desktop part: 1280x720 @30. The phone part is rendered by
// tools/video/air_phone.mjs and joined by tools/video/air_join.sh. No music.
// Usage: node tools/capture.mjs tools/video/air.mjs <out.mp4> [--jobs 3]
import { captions, at, fadeCard } from "./common.mjs";
const F = (id) => `v.route.id==='${id}'`;
const seg = [];
const scrollCard = async (c, u) => c.page.evaluate((k) => { const b = document.querySelector("#side .pbody"); if (b) b.scrollTop = k * (b.scrollHeight - b.clientHeight); }, Math.max(0, Math.min(1, u)));
async function pick(c, pred, follow, speed) {
  if (speed != null) { await c.api("play", true); await c.api("setSpeed", speed); }
  const h = await c.find(pred);
  if (!h) { console.log("no vehicle for", pred); return null; }
  await c.api("select", h.key);
  if (follow) await c.api("follow", true, ...follow);
  c.state.key = h.key;
  return h.key;
}
const title = (k, t, s) => `<div style='text-align:center;transform:translateY(-6vh)'><div class='kicker'>${k}</div><h2 style='font-size:46px;margin:.2em 0'>${t}</h2><div style='color:#b3c6de;font-size:20px'>${s}</div></div>`;

seg.push({ name: "title", dur: 6, query: "t=1985-06-01&cinema=1&pov=30,-30,2.6",
  setup: async (c) => { await c.api("orbit", true, 3, 30); await c.api("card", title("SeaGlobe v2.3", "The air layer, 1903 – today", "Historic air corridors · OurAirports hubs (public domain) · every route a cited reconstruction"), "rgba(2,5,14,.82)"); await c.opacity("card", 0); },
  frame: async (c, f, s) => fadeCard(c, s, 0.3, 5.8, 0.7) });

seg.push({ name: "layer-on", dur: 15, query: "t=1985-06-01&pov=38,-25,2.3",
  setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 1); },
  frame: async (c, f, s) => {
    if (at(s, 1.5)) await c.api("log", true);
    if (at(s, 4.0)) await c.api("logSet", "type", "air");
    if (at(s, 9.0)) await c.api("log", false);
    await captions(c, s, [[0.3, 3.9, "<b>Air layer</b> · new in v2.3 · 26 historic corridors, 1903 – today"],
      [4.0, 8.9, "Ship’s Log → <b>Type: Air</b> turns the air layer into focus · 26 new historic corridors + the 14 earlier air routes"],
      [9.2, 14.7, "Everything else dims · air arcs ride above the sea lanes · era filters work as before"]]); } });

seg.push({ name: "1903", dur: 18, query: "t=1903-12-18&pov=36.1,-75.7,0.6",
  setup: async (c) => { await pick(c, "v.route.vehicle==='wright-flyer'", [3.2, 0.42, 0.05, 0.7], 0.3); },
  frame: async (c, f, s) => {
    if (s > 9 && s < 15) await scrollCard(c, (s - 9) / 5);
    await captions(c, s, [[0.4, 6, "<b>1903</b> · Wright Flyer at Kill Devil Hills (Kitty Hawk), 17 Dec 1903"],
      [6.2, 11.5, "Its card: the aircraft, its history and story, with the real date from the record"],
      [11.7, 17.6, "Drawn as a 260 m sketch · labelled a <i>reconstruction</i> · Wikipedia + OurAirports citations"]]); } });

seg.push({ name: "1930s", dur: 16, query: "t=1935-11-25&pov=20,-170,1.8",
  setup: async (c) => { await pick(c, F("pan-am-china-clipper-1935"), [3, 0.36, 0.06, 0.8], 0.5); },
  frame: async (c, f, s) => captions(c, s, [[0.4, 7.8, "<b>1930s</b> · Pan Am China Clipper, Alameda → Manila, 22–29 Nov 1935"],
    [8, 15.6, "Via Honolulu, Midway, Wake and Guam · the generic piston model stands in for the M-130 flying boat"]]) });

seg.push({ name: "corridor-card-1", dur: 14, query: "t=1936-06-09&pov=15,95,2.3",
  setup: async (c) => { await pick(c, F("imperial-qantas-london-brisbane"), null, 0.3); },
  frame: async (c, f, s) => {
    if (s > 3 && s < 12) await scrollCard(c, (s - 3) / 8);
    await captions(c, s, [[0.4, 6.8, "Corridor card · Imperial Airways and Qantas, London → Brisbane (1935–1939)"],
      [7, 13.6, "<b>Reconstruction</b> label, confidence level, stand-in and [UNKNOWN] notes, every citation"]]); } });

seg.push({ name: "dc3-berlin", dur: 16, query: "t=1948-09-02&pov=52,11,0.9",
  setup: async (c) => { await pick(c, F("berlin-airlift-frankfurt-tempelhof"), [3, 0.4, 0.06, -0.8], 0.5); },
  frame: async (c, f, s) => {
    if (s > 8 && s < 14) await scrollCard(c, (s - 8) / 5);
    await captions(c, s, [[0.4, 7.8, "<b>1948</b> · Berlin Airlift · Douglas DC-3 / C-47 into Tempelhof"],
      [8, 15.6, "26 June 1948 – 30 September 1949 · the corridor is a straight sketch, not a flight track"]]); } });

seg.push({ name: "jet-age", dur: 14, query: "t=1952-05-03&pov=30,10,2.0",
  setup: async (c) => { await pick(c, F("boac-comet-1952"), [3.2, 0.34, 0.06, 0.8], 0.5); },
  frame: async (c, f, s) => captions(c, s, [[0.4, 7, "<b>1950s jet age</b> · BOAC Comet G-ALYP, London → Johannesburg, 2 May 1952"],
    [7.2, 13.6, "The first jetliner flight with fare-paying passengers · stops the sources don’t give are marked [UNKNOWN]"]]) });

seg.push({ name: "747", dur: 16, query: "t=1970-01-23&pov=48,-38,1.6",
  setup: async (c) => { await pick(c, F("pan-am-747-1970"), [3.4, 0.32, 0.06, 0.7], 0.5); },
  frame: async (c, f, s) => {
    if (s > 8 && s < 14) await scrollCard(c, (s - 8) / 5);
    await captions(c, s, [[0.4, 7.8, "<b>747 era</b> · Pan Am Clipper Victor, New York → London, 22 Jan 1970"],
      [8, 15.6, "Boeing 747 card: first flight 9 Feb 1969 · 1,574 built · cited"]]); } });

seg.push({ name: "corridor-card-2", dur: 12, query: "t=1985-06-02&pov=45,-35,2.2",
  setup: async (c) => { await pick(c, F("concorde-london-new-york"), null, 0.3); },
  frame: async (c, f, s) => {
    if (s > 3 && s < 10) await scrollCard(c, (s - 3) / 6);
    await captions(c, s, [[0.4, 5.8, "Corridor card · Concorde, London → New York JFK (1977–2003)"],
      [6, 11.6, "Gaps the record doesn’t cover are said so · the jet model is a stand-in, not a Concorde"]]); } });

seg.push({ name: "today", dur: 14, query: "t=2025-06-15&pov=40,60,2.6",
  setup: async (c) => { await pick(c, F("singapore-sq23-new-york-2020"), [3.4, 0.3, 0.08, 0.8], 0.3); },
  frame: async (c, f, s) => captions(c, s, [[0.4, 6.8, "<b>Today</b> · Singapore–New York JFK nonstop (since 9 Nov 2020) · Perth–London (since 25 Mar 2018)"],
    [7, 13.6, "Endpoints from the OurAirports slice (public domain) · no OpenFlights, no ADS-B"]]) });

export default { width: 1280, height: 720, fps: 30, segments: seg };
