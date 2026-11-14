// Close-up waterline check: follow-camera stills of sea, canal, land, rail and air vehicles at follow and
// orbit distances, tiled into one image. Usage: node tools/closeup_check.mjs [screens/v2.1-closeups.png]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { startServer, launch, openApp, frame, root } from "./browser.mjs";

const out = path.resolve(root, process.argv[2] || "screens/v2.1-closeups.png");
const shots = [
  ["Amsterdam 1595 · follow", "t=1595-09-20&play=1&speed=1&cinema=1", "v.route.id==='das-amsterdam-1595'", 3.0, 0.3],
  ["Amsterdam 1595 · low orbit", "t=1595-09-20&play=1&speed=1&cinema=1", "v.route.id==='das-amsterdam-1595'", 1.8, 0.12],
  ["Trireme 480 BCE", "t=-0479-06-10&play=1&speed=1&cinema=1", "v.route.id==='athens-black-sea-grain'", 2.6, 0.25],
  ["Ming treasure ship 1405", "t=1405-04-20&play=1&speed=1&cinema=1", "v.route.vehicle==='treasure-ship'", 3.2, 0.3],
  ["Container ship 1985", "t=1985-06-01&play=1&speed=1&cinema=1", "v.route.vehicle==='container-ship'", 3.0, 0.25],
  ["Erie canal boat", "t=1870-03-01&play=1&speed=1&cinema=1", "v.route.vehicle==='canal-boat'", 2.4, 0.25],
  ["Steam train 1870", "t=1870-03-01&play=1&speed=1&cinema=1", "v.route.type==='rail'", 2.6, 0.25],
  ["Camel caravan 1320", "t=1320-05-01&play=1&speed=1&cinema=1", "v.route.vehicle==='camel-caravan'", 2.4, 0.25],
  ["Jet 1999", "t=1999-06-01&play=1&speed=1&cinema=1", "v.route.type==='air'", 3.0, 0.2],
];
const port = 8600 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const tmp = fs.mkdtempSync(path.join(path.dirname(root), "seaglobe-closeups-"));
const missing = [];
try {
  const b = await launch(960, 540);
  for (let i = 0; i < shots.length; i++) {
    const [label, q, pred, dist, pitch] = shots[i];
    const p = await openApp(b, port, "capture=1&" + q);
    const hit = await p.evaluate((code) => window.__sg.find(new Function("v", "return " + code)), pred);
    if (!hit) { missing.push(label); await p.close(); continue; }
    await p.evaluate((k, d, pt) => { window.__sg.select(k); window.__sg.follow(true, d, pt, 0.0, 0.8); }, hit.key, dist, pitch);
    for (let f = 0; f < 90; f++) { await p.evaluate(() => window.__sg.advance(1 / 30)); }
    await frame(p);
    await p.evaluate((l) => window.__sg.caption(l), label);
    await frame(p);
    await p.screenshot({ path: path.join(tmp, String(i).padStart(2, "0") + ".png") });
    await p.close();
  }
  await b.close();
} finally { server.kill(); }
const files = fs.readdirSync(tmp).filter((f) => f.endsWith(".png")).sort().map((f) => path.join(tmp, f));
const n = files.length, cols = 3;
const args = ["-v", "error", "-y"]; files.forEach((f) => args.push("-i", f));
const layout = files.map((_, i) => `${(i % cols) * 960}_${Math.floor(i / cols) * 540}`).join("|");
args.push("-filter_complex", `xstack=inputs=${n}:layout=${layout}:fill=black`, out);
const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
console.log("wrote", path.relative(root, out), n, "shots", missing.length ? "missing: " + missing.join(", ") : "");
process.exit(r.status || (missing.length ? 1 : 0));
