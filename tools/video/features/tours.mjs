// Narrated tours and Listen (recorded with the app's own speech muted; this video's narrator describes it).
export default {
  scenes: [
    { name: "list", query: "t=1500-06-01&mute=1&pov=20,10,2.6", minDur: 6,
      setup: async (c) => { await c.ev(() => { const t = document.querySelector("[data-tab='deeper']"); if (t) t.click(); }); },
      lines: [
        { say: "Under Go deeper there are three narrated tours. Six eras of routes. Early flight to the jet age. And the space age.", cap: "Under Go deeper there are three narrated tours: Six eras of routes · Early flight to the jet age · The space age." },
      ] },
    { name: "tour", query: "t=1500-06-01&mute=1&pov=20,10,2.6", minDur: 14,
      setup: async (c) => { await c.ev(() => { const t = document.querySelector("[data-tab='deeper']"); if (t) t.click(); }); },
      frame: async (c, f, s) => { if (c.at(s, c.L[0].start + 0.6)) await c.press("#tourList [data-listen='tour:space']"); },
      lines: [
        { say: "A tour moves the globe from stop to stop. At each stop it reads the entry's own text, so nothing is added.", cap: "A tour moves the globe from stop to stop. At each stop it reads the entry’s own text, so nothing is added." },
        { say: "The browser's speech voice reads it aloud, with a caption. In this recording the app's voice is muted, so you see the caption only.", cap: "The browser’s speech voice reads it aloud, with a caption. In this recording the app’s voice is muted, so you see the caption only." },
        { say: "Press Stop at any time.", cap: "Press Stop at any time." },
      ] },
  ],
};
