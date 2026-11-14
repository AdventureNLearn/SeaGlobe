// Shared helpers for the video scripts.
export const FPS = 30;
// captions: [[fromSec, toSec, html]] with 0.4 s fades
export async function captions(ctx, sec, list) {
  const on = list.find(([a, b]) => sec >= a && sec < b);
  const key = on ? on[2] : null;
  if (ctx.state.cap !== key) { ctx.state.cap = key; await ctx.api("caption", key); }
  if (on) {
    const [a, b] = on; const o = Math.min(1, (sec - a) / 0.4, (b - sec) / 0.4);
    await ctx.opacity("caption", Math.max(0, o).toFixed(3));
  }
}
export function at(sec, t) { const fps = globalThis.__FPS || FPS; return Math.round(sec * fps) === Math.round(t * fps); }
export async function fadeCard(ctx, sec, a, b, f = 0.6) {
  const o = Math.max(0, Math.min(1, (sec - a) / f, (b - sec) / f));
  await ctx.opacity("card", o.toFixed(3));
}
export const titleHTML = "<div class='titlecard'><div class='tc-t'>SEAGLOBE</div><div class='tc-r'></div><div class='tc-s'>WORLD TRADE ROUTE ATLAS · 500 BCE – TODAY</div></div>";
export const creditsHTML = `<div style="max-width:1240px">
<div class="kicker">Credits &amp; sources</div><h2>SeaGlobe — routes of the world</h2>
<div class="credits">
<p><b>Earth imagery</b> NASA Blue Marble Next Generation &amp; Black Marble 2012 (public domain)</p>
<p><b>Coastlines / water mask</b> Natural Earth (public domain)</p>
<p><b>Logbook track</b> CLIWOC 2.1 via PANGAEA, doi:10.1594/PANGAEA.750354 (CC BY 3.0)</p>
<p><b>Airport hubs</b> OurAirports (public domain)</p>
<p><b>Dutch voyages</b> dates typed from Bruijn, Gaastra &amp; Schöffer, <i>Dutch-Asiatic Shipping</i> (published book; online data not bundled)</p>
<p><b>Ancient &amp; medieval routes</b> hand-made reconstructions citing public-domain texts: Herodotus, Strabo, Pliny, Isidore of Charax, the Periplus, Marco Polo (Yule), Ibn Battuta, Cieza de León</p>
<p><b>Engine</b> globe.gl 2.46.2 &amp; three.js r187 incl. UnrealBloom &amp; Lensflare examples (MIT)</p>
<p><b>Font</b> Inter (SIL OFL 1.1)</p>
<p><b>Era cards</b> AI-generated for this project — artistic impressions</p>
<p><b>Vehicles, stars, moon, satellites</b> made procedurally for this project; satellites are decorative</p>
<p><b>Reconstructions</b> are labelled in the app with citations and a confidence level. See DATA.md, SOURCES.md, ASSETS-LICENSES.md</p>
<p><b>Music</b> none</p>
</div></div>`;
export function eraCardHTML(img, kicker, title, note) {
  return `<div class='eracard'><img src='${img}' alt=''><div class='ec-t'><div class='kicker'>${kicker}</div><h2>${title}</h2>${note ? `<div class='ec-n'>${note}</div>` : ""}</div></div>`;
}
