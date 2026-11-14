// Frames per second of the running app in headless Chrome (software WebGL, so numbers are for comparison, not absolute).
// Usage: node tools/fps.mjs [label]   -> prints desktop and phone FPS at a busy modern date and a sea-heavy date.
import { startServer, launch } from "./browser.mjs";
const port = 8900 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const out = {};
async function measure(w, h, mobile, t) {
  const b = await launch(w, h);
  try {
    const p = await b.newPage();
    if (mobile) await p.emulate({ viewport: { width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, userAgent: "Mozilla/5.0 (Linux; Android 14) Mobile" });
    await p.goto(`http://127.0.0.1:${port}/?update=0&t=${t}`, { waitUntil: "load" });
    await p.waitForFunction(() => document.documentElement.dataset.ready === "1", { timeout: 180000 });
    await new Promise((r) => setTimeout(r, 3000));
    return await p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 6000) requestAnimationFrame(f); else res(Math.round(n / ((performance.now() - t0) / 1000) * 10) / 10); }; requestAnimationFrame(f); }));
  } finally { await b.close(); }
}
try {
  for (const [name, t] of [["modern-1975", "1975-06-01"], ["sail-1700", "1700-06-01"]]) {
    out[name] = { desktop: await measure(1280, 720, false, t), phone: await measure(390, 844, true, t) };
  }
} finally { server.kill(); }
console.log(JSON.stringify({ label: process.argv[2] || "", fps: out }));
