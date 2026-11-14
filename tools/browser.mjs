// Shared headless-Chrome helpers for screenshots, tests and video capture.
// Needs Chrome/Chromium and puppeteer-core (set PUPPETEER_CORE to its folder if not resolvable).
import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const pcPath = process.env.PUPPETEER_CORE || "puppeteer-core";
export const puppeteer = require(pcPath);

let actualPort = null; // serve.py may step past a busy port; use the one it reports
export async function startServer(port) {
  const server = spawn(process.env.PYTHON || "python3", ["serve.py", "--port", String(port)], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server start timeout")), 15000);
    const on = (b) => { const m = /SeaGlobe at http:\/\/127\.0\.0\.1:(\d+)/.exec(b.toString()); if (m) { actualPort = Number(m[1]); clearTimeout(timer); resolve(); } };
    server.stdout.on("data", on); server.stderr.on("data", on);
    server.on("exit", (c) => reject(new Error("server exited " + c)));
  });
  return server;
}

export async function launch(w, h) {
  return puppeteer.launch({
    executablePath: process.env.CHROME || "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--ignore-gpu-blocklist", "--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader", `--window-size=${w},${h}`, "--hide-scrollbars", "--force-color-profile=srgb"],
    defaultViewport: { width: w, height: h, deviceScaleFactor: 1 },
    protocolTimeout: 600000,
  });
}

export async function openApp(browser, port, query) {
  const page = await browser.newPage();
  page.setDefaultTimeout(180000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("request", (r) => { const u = r.url(); if (!u.startsWith("http://127.0.0.1") && !u.startsWith("data:") && !u.startsWith("blob:")) errors.push("EXTERNAL REQUEST " + u); });
  await page.goto(`http://127.0.0.1:${actualPort || port}/?${query}`, { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "1" || document.documentElement.dataset.ready === "error", { timeout: 180000 });
  page._errors = errors;
  return page;
}

export const frame = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

// Layout snapshot of the rendered UI (not the WebGL globe or the moving labels): for every element that is
// displayed and visible, a stable path, its box (rounded to 0.5 px) and a few computed styles.
// Used to prove the desktop layout is unchanged by phone-only styles.
export async function layoutSnapshot(page) {
  return page.evaluate(() => {
    const skip = (el) => el.closest("#globe, #labels, #tooltip, #fakecursor, #card");
    const key = (el) => {
      const parts = [];
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        if (e.id) { parts.unshift("#" + e.id); break; }
        const cls = [...e.classList].sort().join(".");
        const sib = e.parentElement ? [...e.parentElement.children].filter((x) => x.tagName === e.tagName && [...x.classList].sort().join(".") === cls) : [e];
        parts.unshift(e.tagName.toLowerCase() + (cls ? "." + cls : "") + ":" + sib.indexOf(e));
      }
      return parts.join(">");
    };
    const r2 = (v) => Math.round(v * 2) / 2;
    const out = {};
    for (const el of document.body.querySelectorAll("*")) {
      if (skip(el) || el.tagName === "SCRIPT") continue;
      if (!el.getClientRects().length) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden") continue;
      const b = el.getBoundingClientRect();
      out[key(el)] = [r2(b.left), r2(b.top), r2(b.width), r2(b.height), cs.fontSize, cs.opacity, cs.color, cs.backgroundColor, cs.transform].join(" ");
    }
    return out;
  });
}
