// Narrated feature walkthroughs: the voice sets the pace, the picture waits for it.
// Not used for this release: the narrated feature walkthroughs are scripted here for a later pass. Needs Piper (PIPER, PIPER_VOICE env vars) and ffmpeg.
//   1. every line is spoken by a local TTS voice (Piper, natural 1.0 speed, no time-stretch);
//   2. each scene lasts as long as its lines plus real pauses (never shorter than the scene's own minimum);
//   3. the scene is recorded frame by frame from the real app (capture=1, 1/fps per frame);
//   4. captions with the same words are burned in for exactly the time each line is spoken;
//   5. the narration is mixed to about -16 LUFS and muxed as AAC.
// Usage: node tools/video/narrated.mjs tools/video/features/<name>.mjs <out.mp4> [--jobs 3] [--preview]
// Needs: Chrome + puppeteer-core, ffmpeg, Piper (PIPER=<piper binary>, PIPER_VOICE=<voice .onnx>).
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { startServer, launch, openApp, frame, root } from "./../browser.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const S = (await import(pathToFileURL(path.resolve(args[0])).href)).default;
const out = path.resolve(root, args[1]);
const jobs = Number(opt("--jobs", 3));
const PREVIEW = args.includes("--preview");   // one still per line instead of a video (checks the script quickly)
const FPS = Number(process.env.VIDEO_FPS || 24), LEAD = 0.6, GAP = 0.6, TAIL = 0.9;
const PIPER = process.env.PIPER || "piper";
const VOICE = process.env.PIPER_VOICE || "voices/en_US-ljspeech-high.onnx";
const FONT = process.env.FONT || "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const tmp = path.join(root, "tmp", "narrated", path.basename(out, ".mp4"));
fs.mkdirSync(tmp, { recursive: true });
const PHONE = S.phone ? { w: 390, h: 844, dpr: 2 } : null;
const W = PHONE ? 720 : 1280, H = PHONE ? 1558 : 720;

const run = (cmd, a) => { const r = spawnSync(cmd, a, { encoding: "utf8" }); if (r.status !== 0) throw new Error(cmd + " " + a.join(" ").slice(0, 200) + "\n" + r.stderr); return r.stdout; };
const dur = (f) => Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).trim());

// 1. voice every line (cached by text + voice)
const voiceId = path.basename(VOICE);
function speak(text) {
  const h = crypto.createHash("sha1").update(voiceId + "\n" + text).digest("hex").slice(0, 16);
  const wav = path.join(tmp, "line-" + h + ".wav");
  if (!fs.existsSync(wav)) {
    const r = spawnSync(PIPER, ["-m", VOICE, "-f", wav, "--sentence-silence", "0.45"], { input: text, encoding: "utf8" });
    if (r.status !== 0 || !fs.existsSync(wav)) throw new Error("piper failed: " + r.stderr);
  }
  return { wav, d: dur(wav) };
}
if (S.before) await S.before();
// 2. timings: lines start after a lead-in, with a real pause between lines; the scene is extended to fit
let t0 = 0;
const scenes = S.scenes.map((sc, i) => {
  let t = LEAD;
  const lines = sc.lines.map((ln) => { const v = speak(ln.say); const L = { ...ln, ...v, start: t, end: t + v.d }; t = L.end + GAP; return L; });
  const need = (lines.length ? lines[lines.length - 1].end : 0) + TAIL;
  const base = sc.minDur || 0, d = Math.max(base, need);
  const r = { ...sc, i, lines, dur: Math.ceil(d * FPS) / FPS, extendedBy: Math.max(0, need - base), g0: t0 };
  t0 += r.dur; return r;
});
fs.writeFileSync(path.join(tmp, "timings.json"), JSON.stringify(scenes.map((s) => ({ name: s.name, dur: s.dur, minDur: s.minDur || 0, extendedBy: +s.extendedBy.toFixed(2), lines: s.lines.map((l) => ({ start: +l.start.toFixed(2), end: +l.end.toFixed(2), say: l.say, cap: l.cap })) })), null, 1));
console.log("total", t0.toFixed(1), "s in", scenes.length, "scenes");

// 3. record each scene from the app
const atT = (s, t) => Math.round(s * FPS) === Math.round(t * FPS);
async function record(browser, port, sc) {
  const file = path.join(tmp, "scene-" + String(sc.i).padStart(2, "0") + ".mp4");
  const page = await openApp(browser, port, "capture=1&" + (sc.query || ""), sc.file || S.file);
  if (PHONE) {
    await page.emulate({ viewport: { width: PHONE.w, height: PHONE.h, deviceScaleFactor: PHONE.dpr, isMobile: true, hasTouch: true },
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36" });
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(() => document.documentElement.dataset.ready === "1", { timeout: 180000 });
  }
  const c = {
    page, FPS, L: sc.lines, at: atT, state: {}, phone: !!PHONE,
    api: (name, ...a) => page.evaluate((nm, aa) => window.__sg[nm](...aa), name, a),
    ev: (fn, ...a) => page.evaluate(fn, ...a),
    find: (code, maxFrac) => page.evaluate((src, mf) => window.__sg.find(new Function("v", "return " + src), mf), code, maxFrac == null ? null : maxFrac),
    pick: async (code, follow, speed, maxFrac) => {
      if (speed != null) { await page.evaluate((sp) => { window.__sg.play(true); window.__sg.setSpeed(sp); }, speed); }
      const h = await page.evaluate((src, mf) => window.__sg.find(new Function("v", "return " + src), mf), code, maxFrac == null ? null : maxFrac);
      if (!h) { console.log("no vehicle for", code); return null; }
      await page.evaluate((k) => window.__sg.select(k), h.key);
      if (follow) await page.evaluate((fl) => window.__sg.follow(true, ...fl), follow);
      return h.key;
    },
    // show the drawn cursor on an element and click it (tap on the phone)
    press: async (sel) => {
      if (PHONE) { await page.tap(sel); return; }
      const p = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: "nearest" }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
      if (!p) { console.log("no element", sel); return; }
      await page.evaluate((x, y) => window.__sg.cursor(x, y, true), p.x, p.y); await page.mouse.click(p.x, p.y);
      setTimeout(() => page.evaluate(() => window.__sg.cursor(null)).catch(() => {}), 0);
    },
    type: async (sel, text) => { await page.focus(sel); await page.keyboard.type(text); },
  };
  if (sc.setup) await sc.setup(c);
  const enc = PREVIEW ? { stdin: { write: () => true, end: () => {} }, on: () => {} } : spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-vf", `scale=${W}:${H}:flags=lanczos,setsar=1`, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", String(FPS), "-an", file], { stdio: ["pipe", "inherit", "inherit"] });
  const done = PREVIEW ? Promise.resolve() : new Promise((res, rej) => enc.on("exit", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));
  const n = Math.round(sc.dur * FPS);
  const stills = new Set(sc.lines.map((l) => Math.round(((l.start + l.end) / 2) * FPS)));
  for (let f = 0; f < n; f++) {
    const s = f / FPS;
    if (sc.frame) await sc.frame(c, f, s);
    await page.evaluate((dt) => window.__sg.advance(dt), 1 / FPS);
    if (PREVIEW) { if (stills.has(f)) { await frame(page); await page.screenshot({ type: "jpeg", quality: 70, path: path.join(tmp, `preview-${String(sc.i).padStart(2, "0")}-${f}.jpg`) }); } continue; }
    await frame(page);
    const buf = await page.screenshot({ type: "jpeg", quality: 90 });
    await new Promise((r) => (enc.stdin.write(buf) ? r() : enc.stdin.once("drain", r)));
  }
  enc.stdin.end(); await done;
  const errs = page._errors.filter((e) => !(sc.allowErrors || S.allowErrors || []).some((re) => re.test(e)));
  if (errs.length) console.log("scene", sc.i, sc.name, "console:", errs.slice(0, 4));
  await page.close();
  console.log(new Date().toLocaleTimeString(), "scene", sc.i, sc.name, n, "frames");
  return file;
}
const port = 8600 + Math.floor(Math.random() * 300);
const server = await startServer(port);
const queue = scenes.slice();
try {
  await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
    let b = await launch(PHONE ? PHONE.w : 1280, PHONE ? PHONE.h : 720);
    try {
      while (queue.length) {
        const sc = queue.shift();
        for (let k = 1; ; k++) {
          try { await record(b, port, sc); break; }
          catch (e) { console.log("scene", sc.i, "failed", k, String(e).slice(0, 200)); try { await b.close(); } catch {} b = await launch(PHONE ? PHONE.w : 1280, PHONE ? PHONE.h : 720); if (k >= 3) throw e; }
        }
      }
    } finally { try { await b.close(); } catch {} }
  }));
} finally { server.kill(); if (S.after) await S.after(); }

if (PREVIEW) { console.log("preview stills in", tmp); process.exit(0); }
// 4. join scenes
const list = path.join(tmp, "list.txt");
fs.writeFileSync(list, scenes.map((s) => "file 'scene-" + String(s.i).padStart(2, "0") + ".mp4'").join("\n") + "\n");
run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", path.join(tmp, "picture.mp4")]);
// 5. narration track: every line placed at its start time, then loudness-normalised
const all = scenes.flatMap((s) => s.lines.map((l) => ({ ...l, g: s.g0 + l.start, ge: s.g0 + l.end })));
const inputs = all.flatMap((l) => ["-i", l.wav]);
const fc = all.map((l, k) => `[${k}:a]aresample=48000,adelay=${Math.round(l.g * 1000)}:all=1[a${k}]`).join(";") +
  ";" + all.map((_, k) => `[a${k}]`).join("") + `amix=inputs=${all.length}:normalize=0,apad=whole_dur=${t0.toFixed(3)},atrim=0:${t0.toFixed(3)}[mix]`;
run("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", fc, "-map", "[mix]", "-ac", "1", "-ar", "48000", path.join(tmp, "voice-raw.wav")]);
run("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(tmp, "voice-raw.wav"), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", path.join(tmp, "voice.wav")]);
// 6. captions: same words as spoken (caption form may keep the source spelling), shown while the line is spoken
function wrap(t, n) { const w = t.split(/\s+/), lines = []; let cur = ""; for (const x of w) { if ((cur + " " + x).trim().length > n && cur) { lines.push(cur); cur = x; } else cur = (cur + " " + x).trim(); } if (cur) lines.push(cur); return lines.join("\n"); }
const fs_ = PHONE ? 30 : 26, maxc = PHONE ? 34 : 64, y = PHONE ? "h-th-150" : "h-th-46";
const vtt = ["WEBVTT", ""];
const filters = all.map((l, k) => {
  const f = path.join(tmp, `cap-${k}.txt`); fs.writeFileSync(f, wrap(l.cap || l.say, maxc));
  const a = Math.max(0, l.g - 0.1), b = l.ge + 0.25;
  const ts = (x) => new Date(x * 1000).toISOString().slice(11, 23);
  vtt.push(ts(a) + " --> " + ts(b), l.cap || l.say, "");
  return `drawtext=fontfile=${FONT}:textfile=${f}:fontsize=${fs_}:fontcolor=0xf2f7ff:line_spacing=8:box=1:boxcolor=0x02050e@0.72:boxborderw=14:x=(w-tw)/2:y=${y}:enable='between(t,${a.toFixed(3)},${b.toFixed(3)})'`;
});
const vf = "[0:v]" + (filters.join(",") || "null") + "[v]";
fs.writeFileSync(path.join(tmp, "vf.txt"), vf);
run("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(tmp, "picture.mp4"), "-i", path.join(tmp, "voice.wav"), "-filter_complex_script", path.join(tmp, "vf.txt"),
  "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out]);
fs.writeFileSync(out.replace(/\.mp4$/, ".vtt"), vtt.join("\n"));
const ext = scenes.filter((s) => s.extendedBy > 0.05).map((s) => `${s.name} +${s.extendedBy.toFixed(1)} s`);
console.log("wrote", out, t0.toFixed(1) + " s", "| scenes extended for the voice:", ext.join(", ") || "none");
