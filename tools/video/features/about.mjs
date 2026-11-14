// Credit, About, the version check and the editions. The update notice is shown with a test version number.
export default {
  get scenes() { return module.scenes; },
};
var module = {
  scenes: [
    { name: "credit", query: "t=1800-06-01&pov=20,-30,2.4", minDur: 6,
      setup: async (c) => { await c.ev(() => document.getElementById("pfoot").scrollIntoView({ block: "end" })); },
      lines: [
        { say: "At the foot of the side panel is the credit. Built by AdventureNLearn, with a link to at AdventureNLearn on X.", cap: "At the foot of the side panel is the credit: Built by AdventureNLearn, with a link to @AdventureNLearn on X." },
        { say: "Next to it is the version of this copy.", cap: "Next to it is the version of this copy." },
      ] },
    { name: "about", query: "t=1800-06-01&pov=20,-30,2.4", minDur: 7,
      setup: async (c) => { await c.ev(() => { location.hash = "#/about"; }); },
      lines: [
        { say: "The About tab shows the same credit, the version and edition, the keys, and the changelog.", cap: "The About tab shows the same credit, the version and edition, the keys, and the changelog." },
      ] },
    { name: "update", query: "t=1800-06-01&pov=20,-30,2.4", minDur: 8,
      // show the notice through the app's own render code, with a test version standing in for a newer release
      frame: async (c, f, s) => { if (c.at(s, c.L[1].start + 0.4)) await c.ev(() => { const st = window.SeaUpdate.state(); st.latest = { name: "SeaGlobe", version: "3.1.0-test", changelog_url: "https://adventurenlearn.github.io/SeaGlobe/CHANGELOG.md" }; st.status = "update"; window.SeaUpdate.render(); }); },
      lines: [
        { say: "Each copy checks the public version file once, read only, with a short timeout. Offline, it stays silent.", cap: "Each copy checks the public version file once, read only, with a short timeout. Offline, it stays silent." },
        { say: "When a newer version exists, a notice appears, with a link to what changed. Here, a test version number stands in for a newer version.", cap: "When a newer version exists, a notice appears, with a link to what changed. Here, a test version number stands in for a newer version." },
      ] },
    { name: "lite", file: "lite.html", query: "t=1800-06-01&pov=20,-30,2.4", minDur: 7,
      lines: [
        { say: "There are three editions. The full one. A lite one, which is smaller and lighter, for small hosts and slow devices.", cap: "There are three editions. The full one. A lite one, which is smaller and lighter, for small hosts and slow devices." },
      ] },
    { name: "byo", file: "byo.html", query: "t=2026-06-01&pov=20,-30,2.4", minDur: 8,
      setup: async (c) => { await c.ev(() => { const t = document.querySelector(".tab[data-tab='layers']"); if (t) t.click(); const b = document.getElementById("byoBox"); if (b) b.scrollIntoView({ block: "center" }); }); },
      lines: [
        { say: "And a bring-your-own edition, for your own computer only. You paste satellite element sets, or point it at your own aircraft receiver.", cap: "And a bring-your-own edition, for your own computer only. You paste satellite element sets, or point it at your own aircraft receiver." },
        { say: "Nothing is fetched until you press Start. SeaGlobe ships no live data.", cap: "Nothing is fetched until you press Start. SeaGlobe ships no live data." },
      ] },
  ],
};
