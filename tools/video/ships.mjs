// Short demo (about 46 s, 1280x720 @30): play, speed change, era switch, click a ship, follow camera.
import { captions, at } from "./common.mjs";
const seg = [];
seg.push({ name: "sampler", dur: 7, query: "idle=1&pov=18,30,2.4",
  frame: async (c, f, s) => captions(c, s, [[0.3, 6.7, "Idle: a rotating sample of vessels from every era, routes drawn faintly"]]) });
seg.push({ name: "play-speed", dur: 12, query: "t=1320-05-01&play=0&speed=1&pov=26,40,2.3",
  setup: async (c) => { c.state.play = await c.center("#playBtn"); c.state.b20 = await c.center("[data-speed='20']"); },
  frame: async (c, f, s) => {
    if (s < 1.4) await c.glide(c.state.play, s / 1.3);
    if (at(s, 1.5)) await c.click(c.state.play);
    if (s >= 5 && s < 6.4) await c.glide(c.state.b20, (s - 5) / 1.3);
    if (at(s, 6.5)) await c.click(c.state.b20);
    if (at(s, 7)) await c.cursor(c.state.b20, false);
    await captions(c, s, [[0.3, 4.8, "Press play: every voyage has a vessel moving along its route"], [5, 11.7, "Speed 1× → 20×"]]); } });
seg.push({ name: "era-switch", dur: 8, query: "t=1340-01-01&play=1&speed=5&pov=26,40,2.3",
  setup: async (c) => { c.state.chip = await c.center("[data-era='age-of-sail']"); },
  frame: async (c, f, s) => {
    if (s < 1.4) await c.glide(c.state.chip, s / 1.3);
    if (at(s, 1.5)) await c.click(c.state.chip);
    if (at(s, 1.8)) await c.cursor(c.state.chip, false);
    if (at(s, 2.5)) await c.api("cursor", null);
    await captions(c, s, [[0.3, 7.7, "Era switcher → Age of Sail · the camera flies to the era"]]); } });
seg.push({ name: "click-follow", dur: 20, query: "t=1595-09-20&play=1&speed=1&pov=-20,40,1.9",
  setup: async (c) => { c.state.ship = await c.find("v.route.id==='das-amsterdam-1595'"); c.state.fb = null; },
  frame: async (c, f, s) => {
    if (s < 2 && c.state.ship) { const p = await c.api("screenPos", c.state.ship.key); if (p) await c.glide(p, s / 1.9); }
    if (at(s, 2.1) && c.state.ship) { const p = await c.api("screenPos", c.state.ship.key); if (p) await c.click(p); await c.api("select", c.state.ship.key); c.state.fb = await c.center("#followBtn"); }
    if (s >= 5 && s < 6.6 && c.state.fb) await c.glide(c.state.fb, (s - 5) / 1.5);
    if (at(s, 6.7) && c.state.fb) { await c.api("follow", false, 3.2, 0.4, 0.07, 0.7); await c.click(c.state.fb); }
    if (at(s, 7.3)) await c.api("cursor", null);
    await captions(c, s, [[0.3, 4.8, "Click a ship: name, route, real dates, goods and sources"], [5, 12, "Follow camera"],
      [12.3, 19.6, "1595 · <i>Amsterdam</i>, first Dutch fleet to the East Indies · real dates, reconstructed track"]]); } });
seg.push({ name: "log", dur: 12, query: "t=1320-05-01&play=1&speed=5&pov=30,40,2.4",
  setup: async (c) => { c.state.lb = await c.center("#logBtn"); },
  frame: async (c, f, s) => {
    if (s < 1.2) await c.glide(c.state.lb, s / 1.1);
    if (at(s, 1.3)) { await c.click(c.state.lb); await c.api("cursor", null); }
    if (at(s, 2.5)) await c.page.focus("#logQ");
    if (s >= 2.6 && s < 4.2) { const word = "silk"; const k = Math.min(word.length, Math.floor((s - 2.6) / 0.3) + 1); const cur = await c.page.$eval("#logQ", (e) => e.value); if (cur.length < k) await c.page.keyboard.type(word[cur.length]); }
    if (at(s, 5.0)) await c.page.keyboard.press("ArrowDown");
    if (at(s, 5.8)) await c.page.keyboard.press("Enter");
    await captions(c, s, [[0.3, 5.6, "Ship’s Log: search and filter every record"], [6, 11.7, "Enter flies to the route, plays it and opens its info"]]); } });
export default { width: 1280, height: 720, fps: 30, segments: seg };
