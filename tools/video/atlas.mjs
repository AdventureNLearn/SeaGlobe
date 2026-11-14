// Full walkthrough: title from space -> planet -> eras 500 BCE to today -> credits. 1080p30, no music.
import { captions, at, fadeCard, titleHTML, creditsHTML, eraCardHTML } from "./common.mjs";
const F = (id) => `v.route.id==='${id}'`;
const UI = "";            // full UI visible
const CINE = "cinema=1";  // UI hidden
async function followFirst(ctx, pred, dist = 3, pitch = 0.38, swing = 0.06, angle = 0.65, speed = null, maxFrac = null) {
  if (speed != null) await ctx.api("setSpeed", speed);
  const hit = await ctx.find(pred, maxFrac);
  if (!hit) { console.log("no vehicle for", pred); return null; }
  await ctx.api("select", hit.key);
  await ctx.api("follow", true, dist, pitch, swing, angle);
  return hit.key;
}
const seg = [];
// 0 title
seg.push({ name: "title", dur: 9, query: `t=2026-01-01&${CINE}&pov=32,5,2.4`,
  setup: async (c) => { await c.api("gold", true); await c.api("sunAngle", 2.3); await c.api("night", 1); await c.api("sats", 420); await c.api("viewShift", 0.42);
    await c.api("flyTo", { lat: 25, lng: 25, altitude: 1.1 }, 9, 0); await c.api("card", "<div style='transform:translateY(-24vh)'>" + titleHTML + "</div>"); await c.opacity("card", 0); },
  frame: async (c, f, s) => { await fadeCard(c, s, 1.2, 8.2, 0.9); } });
// 1 sampler (idle mode): a rotating mix of vessels from every era, moon, satellites
seg.push({ name: "sampler", dur: 9, query: `idle=1&pov=14,30,2.6`,
  setup: async (c) => { await c.api("sats", 300); await c.api("flyTo", { lat: 20, lng: 55, altitude: 2.2 }, 9, 0); },
  frame: async (c, f, s) => captions(c, s, [[0.6, 5.2, "<b>Sampler</b> · a rotating mix of vessels from every era · one swaps out every few seconds"],
    [5.4, 8.6, "Only their routes are drawn, faintly · Moon and a <b>decorative</b> satellite layer"]]) });
// 2 classical card
seg.push({ name: "card-classical", dur: 4, query: `t=-0479-05-01&${CINE}&pov=38,25,2`,
  setup: async (c) => { await c.api("card", eraCardHTML("assets/eras/era-classical.jpg", "500 BCE – 299 CE", "Classical", "Artistic impression (AI-generated); sail emblem and prow are stylized, not historical."), "rgba(2,5,14,.92)"); },
  frame: async (c, f, s) => fadeCard(c, s, 0, 4, 0.5) });
// 3 classical: Athens grain + trireme chase
seg.push({ name: "classical-athens", dur: 13, query: `t=-0479-06-10&play=1&speed=5&pov=40,27,1.1`,
  setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 0.35); const h = await c.find(F("athens-black-sea-grain")); if (h) await c.api("select", h.key); c.state.key = h && h.key; },
  frame: async (c, f, s) => {
    if (at(s, 4) && c.state.key) { await c.api("follow", true, 2.8, 0.36, 0.08, 0.9); }
    await captions(c, s, [[0.5, 6, "<b>480 BCE</b> · Classical · Black Sea grain to Athens under trireme escort — <i>reconstruction</i>"],
      [6.5, 12.6, "Follow camera · every ancient route is labelled as a reconstruction with citations and a confidence level"]]); } });
// 4 Roman grain fleet
seg.push({ name: "classical-rome", dur: 11, query: `t=0060-05-01&play=1&speed=5&cinema=1&cinema-soft=1&pov=33,20,1.6`,
  setup: async (c) => { await c.api("cinema", true, true); await c.api("play", true); await c.api("setSpeed", 5); await followFirst(c, F("roman-alexandria-ostia-grain"), 3, 0.42, 0.1, -0.7, 0.5); },
  frame: async (c, f, s) => captions(c, s, [[0.5, 10.5, "<b>60 CE</b> · Alexandria → Ostia grain ships (after Casson and Rickman) — <i>reconstruction</i>"]]) });
// 5 late antiquity via era chip click
seg.push({ name: "late-antiquity", dur: 10, query: `t=0200-05-01&pov=30,30,2.4`,
  setup: async (c) => { c.state.chip = await c.center("[data-era='late-antiquity']"); },
  frame: async (c, f, s) => {
    if (s < 1.6) await c.glide(c.state.chip, s / 1.5);
    if (at(s, 1.7)) await c.click(c.state.chip);
    if (at(s, 2.1)) await c.cursor({ x: c.state.chip.x, y: c.state.chip.y }, false);
    if (at(s, 3.2)) await c.api("cursor", null);
    if (at(s, 4.5)) { await c.api("play", true); await c.api("setSpeed", 5); }
    await captions(c, s, [[0.3, 9.6, "Era switcher · <b>Late Antiquity</b> (300–699) · focus mode dims everything outside the era"]]); } });
// 6 medieval: speed change, click a ship, follow button
seg.push({ name: "medieval-ui", dur: 19, query: `t=1320-05-01&play=1&speed=1&pov=24,58,2.1`,
  setup: async (c) => { c.state.b20 = await c.center("[data-speed='20']"); c.state.b1 = await c.center("[data-speed='1']"); },
  frame: async (c, f, s) => {
    if (s < 1.5) await c.glide(c.state.b20, s / 1.4);
    if (at(s, 1.6)) await c.click(c.state.b20);
    if (at(s, 1.9)) await c.cursor(c.state.b20, false);
    if (s >= 3.0 && s < 4.3) await c.glide(c.state.b1, (s - 3) / 1.2);
    if (at(s, 4.4)) await c.click(c.state.b1);
    if (at(s, 5.0)) { const h = await c.find("v.route.vehicle==='dhow'", 0.2); c.state.ship = h; }
    if (s >= 5.0 && s < 7.0 && c.state.ship) { const p = await c.api("screenPos", c.state.ship.key); if (p) await c.glide(p, (s - 5) / 1.8); }
    if (at(s, 7.1) && c.state.ship) { const p = await c.api("screenPos", c.state.ship.key); if (p) { await c.click(p); await c.api("select", c.state.ship.key); } c.state.fb = await c.center("#followBtn"); }
    if (s >= 9 && s < 10.6 && c.state.fb) await c.glide(c.state.fb, (s - 9) / 1.5);
    if (at(s, 10.7) && c.state.fb) { await c.api("follow", false, 2.8, 0.36, 0.08, 0.8); await c.click(c.state.fb); await c.api("setSpeed", 0.5); }
    if (at(s, 11.2)) await c.api("cursor", null);
    await captions(c, s, [[0.3, 4.6, "<b>1320</b> · Medieval · speed control 1× / 5× / 20×"],
      [5, 10.5, "Click any vessel for ship, route, years, goods and sources"],
      [11, 18.6, "Indian Ocean monsoon trade · dhows between Hormuz and Calicut — <i>reconstruction</i>"]]); } });
// 7 Ming treasure fleet
seg.push({ name: "ming", dur: 8, query: `t=1405-04-20&play=1&speed=5&cinema=1&pov=8,100,1.5`,
  setup: async (c) => { await c.api("cinema", true, true); await c.api("play", true); await c.api("setSpeed", 5); await followFirst(c, "v.route.family==='ming-treasure-fleets'", 2.6, 0.34, -0.08, 0.5, 1); },
  frame: async (c, f, s) => captions(c, s, [[0.4, 7.6, "<b>1405</b> · Ming treasure fleets under Zheng He · voyage years from Dreyer; pace reconstructed"]]) });
// 8 age of sail card
seg.push({ name: "card-sail", dur: 4, query: `t=1595-09-20&${CINE}&pov=-20,20,2.4`,
  setup: async (c) => { await c.api("card", eraCardHTML("assets/eras/era-age-of-sail.jpg", "1500 – 1829", "Age of Sail", "Artistic impression (AI-generated)."), "rgba(2,5,14,.92)"); },
  frame: async (c, f, s) => fadeCard(c, s, 0, 4, 0.5) });
// 9 first Dutch fleet, real dates
seg.push({ name: "dutch-1595", dur: 12, query: `t=1595-09-20&play=1&speed=5&pov=-30,15,1.8`,
  setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 5); await followFirst(c, F("das-amsterdam-1595"), 3.4, 0.4, 0.07, 0.7); },
  frame: async (c, f, s) => captions(c, s, [[0.4, 11.6, "<b>1595</b> · First Dutch fleet to the East Indies · <b>real dates</b> from the published record; track reconstructed"]]) });
// 10 CLIWOC logbook
seg.push({ name: "launceston", dur: 8, query: `t=1769-09-20&play=1&speed=5&cinema=1&pov=40,-15,1.5`,
  setup: async (c) => { await c.api("cinema", true, true); await c.api("play", true); await c.api("setSpeed", 5); await followFirst(c, F("cliwoc-launceston-1769"), 3.2, 0.4, 0.06, -0.8, 0.5); },
  frame: async (c, f, s) => captions(c, s, [[0.4, 7.6, "<b>1769</b> · HMS Launceston · daily noon positions from the CLIWOC logbook database (CC BY 3.0)"]]) });
// 11 Atlantic, factual and muted
seg.push({ name: "atlantic", dur: 7, query: `t=1760-05-01&play=1&speed=5&pov=8,-25,2.4`,
  setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 5); const h = await c.find(F("atlantic-middle-passage")); if (h) await c.api("select", h.key); },
  frame: async (c, f, s) => captions(c, s, [[0.4, 6.6, "The Atlantic slave trade · the Middle Passage is shown in a muted colour with factual notes and sources"]]) });
// 12 industrial: Suez steamer then train
seg.push({ name: "industrial", dur: 13, query: `t=1870-03-01&play=1&speed=5&pov=25,40,1.8`,
  setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 5); await followFirst(c, F("suez-steam-bombay"), 3, 0.38, 0.08, 0.8, 0.5); },
  frame: async (c, f, s) => {
    if (at(s, 7)) { await c.api("follow", false); const h = await c.find(F("first-transcontinental")); if (h) { await c.api("select", h.key); await c.api("follow", true, 3.2, 0.32, 0.05, 0.9); } }
    await captions(c, s, [[0.4, 6.8, "<b>1870</b> · Industrial · mail steamers through the new Suez Canal (opened 17 Nov 1869)"],
      [7.2, 12.6, "Steam trains on the first US transcontinental railroad (completed 10 May 1869)"]]); } });
// 13 modern: containers
seg.push({ name: "containers", dur: 10, query: `t=1985-06-01&play=1&speed=5&cinema=1&pov=30,-170,1.6`,
  setup: async (c) => { await c.api("cinema", true, true); await c.api("play", true); await c.api("setSpeed", 5); await followFirst(c, F("transpacific-containers"), 2.6, 0.34, 0.07, 0.6, 1); },
  frame: async (c, f, s) => captions(c, s, [[0.4, 9.6, "<b>Modern</b> · container ships across the Pacific (illustrative traffic)"]]) });
// 14 modern: jets
seg.push({ name: "jets", dur: 8, query: `t=1999-06-01&play=1&speed=1&cinema=1&pov=50,-30,1.4`,
  setup: async (c) => { await c.api("cinema", true, true); await c.api("play", true); await c.api("setSpeed", 1); await followFirst(c, "v.route.vehicle==='jet'", 3.2, 0.25, 0.1, 0.9, 0.3); },
  frame: async (c, f, s) => captions(c, s, [[0.4, 7.6, "Air routes between hub airports from OurAirports (public domain) · illustrative timing"]]) });
// 15 today: night lights, satellites, go-deeper tab
seg.push({ name: "today", dur: 9, query: `t=2025-11-13&play=1&speed=5&pov=35,30,2.8`,
  setup: async (c) => { await c.api("play", true); await c.api("setSpeed", 5); await c.api("sunAngle", 2.2); await c.api("orbit", true, 3, 30); },
  frame: async (c, f, s) => {
    if (at(s, 4.8)) await c.api("tab", "deeper");
    await captions(c, s, [[0.4, 4.7, "<b>Today</b> · container lanes, air links, pipelines and city lights"],
      [5.0, 8.7, "Go deeper · links to restricted datasets open in a new tab — nothing is embedded or fetched"]]); } });
// 16 Ship's Log: filter, search, keyboard, fly + play
seg.push({ name: "ships-log", dur: 16, query: `t=1320-05-01&play=1&speed=5&pov=30,40,2.4`,
  setup: async (c) => { await c.api("log", true); },
  frame: async (c, f, s) => {
    if (at(s, 2.0)) await c.api("logSet", "type", "sea");
    if (at(s, 4.0)) await c.api("logSet", "era", "classical");
    if (at(s, 6.0)) { await c.api("logSet", "type", ""); await c.api("logSet", "era", ""); await c.page.focus("#logQ"); }
    if (s >= 6.2 && s < 7.6) { const word = "grain"; const k = Math.min(word.length, Math.floor((s - 6.2) / 0.25) + 1); const cur = await c.page.$eval("#logQ", (e) => e.value); if (cur.length < k) await c.page.keyboard.type(word[cur.length]); }
    if (at(s, 8.6)) await c.page.keyboard.press("ArrowDown");
    if (at(s, 9.1)) await c.page.keyboard.press("ArrowDown");
    if (at(s, 9.8)) await c.page.keyboard.press("Enter");
    await captions(c, s, [[0.3, 5.8, "<b>Ship’s Log</b> · every voyage and route · filter by era, type, goods, region and evidence"],
      [6, 9.6, "Search, then ↑ ↓ and Enter · Export CSV saves the list locally"],
      [10, 15.6, "The camera flies to the route, plays the voyage and opens its sources"]]); } });
// 17 credits
seg.push({ name: "credits", dur: 9, query: `t=2026-01-01&${CINE}&pov=20,0,4.5`,
  setup: async (c) => { await c.api("orbit", true, 2, 20); await c.api("sunAngle", 2.7); await c.api("card", creditsHTML, "rgba(2,5,14,.86)"); await c.opacity("card", 0); },
  frame: async (c, f, s) => fadeCard(c, s, 0.6, 9.5, 0.8) });
export default { width: 1920, height: 1080, fps: 30, segments: seg };
