// Frame-stepped video capture for SeaGlobe (headless Chrome + ffmpeg).
// Usage: node tools/capture.mjs tools/video/atlas.mjs walkthrough/atlas-walkthrough.mp4 [--jobs 4] [--only 3,4] [--keep]
// Each segment in the script is self-contained (it loads the app fresh and sets its own state),
// so segments can render in parallel and are joined at the end. The app runs with capture=1,
// which stops its real-time loop; every video frame advances the simulation by exactly 1/fps s.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { startServer, launch, openApp, frame, root } from "./browser.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const scriptPath = path.resolve(args[0]);
const out = path.resolve(root, args[1]);
const jobs = Number(opt("--jobs", 3));
const only = opt("--only", null);
const S = (await import(pathToFileURL(scriptPath).href)).default;
const preview = opt("--preview", null);  // folder: half-size, 10 fps, a still every 2 s, no video
const W = (S.width || 1920) / (preview ? 2 : 1), H = (S.height || 1080) / (preview ? 2 : 1), FPS = preview ? 10 : (S.fps || 30);
globalThis.__FPS = FPS;
const tmp = path.join(root, "tmp", "render-parts", path.basename(out, ".mp4"));
fs.mkdirSync(tmp, { recursive: true });

const ease = (u) => (u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u));
const lerp = (a, b, u) => a + (b - a) * u;

function ffmpeg(file) {
  const p = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", String(FPS), "-an", file], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => p.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c)))));
  return { write: (buf) => new Promise((r) => (p.stdin.write(buf) ? r() : p.stdin.once("drain", r))), end: () => { p.stdin.end(); return done; } };
}

async function renderSegment(browser, port, seg, idx) {
  const file = path.join(tmp, String(idx).padStart(2, "0") + ".mp4");
  const page = await openApp(browser, port, "capture=1&" + (seg.query || ""));
  const sg = (fn, ...a) => page.evaluate(fn, ...a);
  const n = Math.round(seg.dur * FPS);
  // cursor helper: glide the drawn cursor between points; real clicks go through puppeteer
  let cur = seg.cursorStart || { x: W * 0.55, y: H * 0.5 };
  const ctx = {
    page, sg, W, H, FPS, n, ease, lerp,
    api: (name, ...a) => page.evaluate((nm, aa) => window.__sg[nm](...aa), name, a),
    opacity: (id, o) => page.evaluate((i, v) => { const e = document.getElementById(i); if (e) e.style.opacity = String(v); }, id, o),
    center: (sel) => page.evaluate((s) => window.__sg.elementCenter(s), sel),
    find: (src, maxFrac) => page.evaluate((code, mf) => window.__sg.find(new Function("v", "return " + code), mf), src, maxFrac == null ? null : maxFrac),
    cursor: async (p, down) => { cur = p; await page.evaluate((x, y, d) => window.__sg.cursor(x, y, d), p.x, p.y, !!down); },
    glide: async (to, u) => { const k = ease(u); const p = { x: lerp(cur.x, to.x, k), y: lerp(cur.y, to.y, k) }; await page.evaluate((x, y) => window.__sg.cursor(x, y, false), p.x, p.y); if (u >= 1) cur = to; },
    click: async (p) => { await page.evaluate((x, y) => window.__sg.cursor(x, y, true), p.x, p.y); await page.mouse.click(p.x, p.y); },
    state: {},
  };
  if (seg.setup) await seg.setup(ctx);
  const enc = preview ? { write: async () => {}, end: async () => {} } : ffmpeg(file);
  if (preview) fs.mkdirSync(preview, { recursive: true });
  for (let f = 0; f < n; f++) {
    const sec = f / FPS;
    if (seg.frame) await seg.frame(ctx, f, sec);
    await page.evaluate((dt) => window.__sg.advance(dt), 1 / FPS);
    await frame(page);
    if (preview) { if (f % (2 * FPS) === Math.round(FPS)) await page.screenshot({ type: "jpeg", quality: 80, path: path.join(preview, String(idx).padStart(2, "0") + "-" + String(Math.round(sec)).padStart(3, "0") + ".jpg") }); }
    else await enc.write(await page.screenshot({ type: "jpeg", quality: 92 }));
  }
  await enc.end();
  if (page._errors.length) console.log("segment", idx, seg.name, "errors:", page._errors.slice(0, 5));
  await page.close();
  console.log(new Date().toLocaleTimeString(), "segment", idx, seg.name, n, "frames done");
  return file;
}

const port = 8800 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const list = S.segments.map((s, i) => [s, i]).filter(([, i]) => !only || only.split(",").map(Number).includes(i));
const queue = list.slice();
const t0 = Date.now();
try {
  await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
    const browser = await launch(W, H);
    let b = browser;
    try {
      while (queue.length) {
        const [s, i] = queue.shift();
        for (let attempt = 1; ; attempt++) {
          try { await renderSegment(b, port, s, i); break; }
          catch (e) {
            console.log("segment", i, s.name, "failed (attempt " + attempt + "):", String(e).slice(0, 160));
            try { await b.close(); } catch {}
            b = await launch(W, H);
            if (attempt >= 3) throw e;
          }
        }
      }
    } finally { try { await b.close(); } catch {} }
  }));
} finally { server.kill(); }
if (!only && !preview) {
  const listFile = path.join(tmp, "list.txt");
  fs.writeFileSync(listFile, S.segments.map((_, i) => "file '" + String(i).padStart(2, "0") + ".mp4'").join("\n") + "\n");
  await new Promise((res, rej) => spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", "-movflags", "+faststart", out], { stdio: "inherit" })
    .on("exit", (c) => (c === 0 ? res() : rej(new Error("concat " + c)))));
  console.log("wrote", out, "in", Math.round((Date.now() - t0) / 1000), "s");
}
