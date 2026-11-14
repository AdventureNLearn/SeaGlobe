// Headless Chromium screenshots of SeaGlobe at selected decades.
// Uses the machine's google-chrome and a local 127.0.0.1 server.
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.SEAGLOBE_PORT || 8765);
const years = (process.env.SEAGLOBE_YEARS || "1300,1600,1780").split(",").map((s) => Number(s.trim()));
const outDir = path.join(root, "screens");
const chrome = process.env.CHROME || "/usr/bin/google-chrome";
const py = process.env.PYTHON || "python3";

const server = spawn(py, ["serve.py", "--port", String(port)], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
let started = false;
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("server start timeout")), 15000);
  const onData = (buf) => {
    const s = buf.toString();
    process.stdout.write(s);
    if (s.includes("SeaGlobe at") && !started) {
      started = true;
      clearTimeout(timer);
      resolve();
    }
  };
  server.stdout.on("data", onData);
  server.stderr.on("data", onData);
  server.on("error", reject);
  server.on("exit", (code) => {
    if (!started) reject(new Error("server exited " + code));
  });
});

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--window-size=1536,900",
    "--hide-scrollbars",
  ],
  defaultViewport: { width: 1536, height: 900, deviceScaleFactor: 1 },
});

try {
  for (const year of years) {
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    const url = `http://127.0.0.1:${port}/?year=${year}&shot=1`;
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => document.documentElement.dataset.ready === "1", { timeout: 45000 });
    // Give SwiftShader one extra beat to paint paths.
    await new Promise((r) => setTimeout(r, 700));
    const dest = path.join(outDir, `seaglobe-${year}.png`);
    await page.screenshot({ path: dest, type: "png" });
    console.log("wrote", dest);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
