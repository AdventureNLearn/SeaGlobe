// Air layer walkthrough, closing card (joined after the phone part by tools/video/air_join.sh).
import { fadeCard } from "./common.mjs";
const seg = [];
seg.push({ name: "notes", dur: 10, query: "t=2026-01-01&cinema=1&pov=20,0,4",
  setup: async (c) => { await c.api("orbit", true, 2, 20); await c.api("card", `<div style="max-width:1000px"><div class="kicker">About this build</div><h2>Air layer · assumptions</h2><div class="credits">
<p><b>Status</b> v2.3, built and tested locally</p>
<p><b>Height</b> air arcs rise up to 0.062 × Earth radius on long routes and scale down below ~1,900 km (an assumption)</p>
<p><b>Speed</b> aircraft use the same on-screen speed cap as ships, so they stay clickable</p>
<p><b>Models</b> Wright Flyer, DC-3 and 747 are new procedural models; other types use generic stand-ins</p>
<p><b>Sources</b> Wikipedia articles and the sources cited there (read 14 Nov 2026) · OurAirports (public domain)</p>
<p><b>Gaps</b> marked [UNKNOWN] in each card</p></div></div>`, "rgba(2,5,14,.86)"); await c.opacity("card", 0); },
  frame: async (c, f, s) => fadeCard(c, s, 0.3, 9.8, 0.7) });

export default { width: 1280, height: 720, fps: 30, segments: seg };
