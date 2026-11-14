// Air layer walkthrough, phone part: the v2.2.1 phone layout (390x844, touch) with the air layer.
// Frame-stepped like tools/capture.mjs; writes a raw phone-sized mp4 that tools/video/air_join.sh
// places on a 1280x720 frame with captions. Usage: node tools/video/air_phone.mjs <out.mp4>
import { spawn } from "node:child_process";
import path from "node:path";
import { startServer, launch, openApp, frame, root } from "../browser.mjs";

const out = path.resolve(root, process.argv[2]);
const FPS = 30, DUR = 22, W = 390, H = 844;
const UA = "Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36";
const port = 8900 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(W, H);
const enc = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
  "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", String(FPS), "-an", out], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => enc.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c)))));
const write = (b) => new Promise((r) => (enc.stdin.write(b) ? r() : enc.stdin.once("drain", r)));
try {
  const p = await openApp(browser, port, "capture=1&t=1970-01-23&pov=48,-38,1.9");
  await p.emulate({ viewport: { width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, userAgent: UA });
  await p.reload({ waitUntil: "load" });
  await p.waitForFunction(() => document.documentElement.dataset.ready === "1", { timeout: 180000 });
  await p.evaluate(() => { window.__sg.play(true); window.__sg.setSpeed(0.3); });
  const at = (s, t) => Math.round(s * FPS) === Math.round(t * FPS);
  let key = null;
  for (let f = 0; f < DUR * FPS; f++) {
    const s = f / FPS;
    if (at(s, 3)) await p.tap("#menuBtn");
    if (at(s, 5)) await p.tap(".tab[data-tab='layers']");
    if (at(s, 7.5)) await p.tap("#mClose");
    if (at(s, 9)) {
      const h = await p.evaluate(() => window.__sg.find((v) => v.route.vehicle === "boeing-747"));
      if (h) { key = h.key; const sc = await p.evaluate((k) => window.__sg.screenOf(k), key); if (sc) await p.touchscreen.tap(sc.x, sc.y); else await p.evaluate((k) => window.__sg.select(k), key); }
    }
    if (s > 13 && s < 18.5) await p.evaluate((u) => { const b = document.querySelector("#side .pbody"); if (b) b.scrollTop = u * (b.scrollHeight - b.clientHeight); }, (s - 13) / 5.5);
    if (at(s, 20)) await p.tap("#mClose");
    await p.evaluate((dt) => window.__sg.advance(dt), 1 / FPS);
    await frame(p);
    await write(await p.screenshot({ type: "jpeg", quality: 92 }));
  }
  console.log("phone: selected", key, "errors", p._errors.slice(0, 3));
  await p.close();
} finally {
  enc.stdin.end(); await done; await browser.close(); server.kill();
}
console.log("wrote", out);
