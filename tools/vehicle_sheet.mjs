// Close-up contact sheet of every vehicle model, on its own water / ground / sky plane.
// Usage: node tools/vehicle_sheet.mjs [screens/v2.1-all-vehicles.png]
// Fails (exit 1) if any type is missing a model, falls back to a placeholder, or rendered blank.
import fs from "node:fs";
import path from "node:path";
import { startServer, launch, root } from "./browser.mjs";

const out = path.resolve(root, process.argv[2] || "screens/v2.1-all-vehicles.png");
const port = 8700 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const COLS = 6, CW = 420, CH = 300;
let failed = false;
try {
  const browser = await launch(COLS * CW, 1600);
  const page = await browser.newPage();
  page.on("pageerror", (e) => { console.log("pageerror", String(e)); failed = true; });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "domcontentloaded" });  // same origin for the scripts
  const html = `<!doctype html><html><head><style>
    body{margin:0;background:#050a16;font:600 15px Inter,system-ui,sans-serif;color:#dfe9ff}
    #wrap{position:relative} canvas{display:block}
    .lb{position:absolute;padding:6px 10px;background:rgba(5,10,22,.72);border-radius:8px;border:1px solid rgba(120,170,255,.25)}
    .lb small{display:block;font-weight:500;color:#8fb0e0;font-size:12px}
    h1{margin:0;padding:14px 18px;font-size:20px;letter-spacing:.08em}</style></head>
    <body><h1>SEAGLOBE · every vehicle model, close-up on its waterline / ground / air plane</h1><div id="wrap"></div>
    <script src="/vendor/three.global.js"></script><script src="/data/schema.js"></script><script src="/js/vehicles.js"></script></body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  const res = await page.evaluate(async (COLS, CW, CH) => {
    const THREE = window.SEAGLOBE_THREE, SV = window.SeaVehicles, S = window.SEAGLOBE_DATA.schema;
    const list = S.vehicles;
    const rows = Math.ceil(list.length / COLS);
    const W = COLS * CW, H = rows * CH;
    const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    r.setSize(W, H); r.setScissorTest(true); r.outputColorSpace = THREE.SRGBColorSpace;
    const wrap = document.getElementById("wrap"); wrap.appendChild(r.domElement);
    const report = [];
    list.forEach((v, i) => {
      const cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH;
      const scene = new THREE.Scene();
      const water = ["sea", "river", "canal"].includes(v.type), ground = ["land", "rail", "pipeline"].includes(v.type);
      scene.background = new THREE.Color(v.type === "space" ? 0x02040a : v.type === "air" ? 0x5d8fc8 : 0x0b1830);
      scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x1a2030, 1.1));
      const sun = new THREE.DirectionalLight(0xfff2dd, 2.2); sun.position.set(2, 3, 1.5); scene.add(sun);
      const o = SV.build(v.id); scene.add(o);
      if (water) {
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshStandardMaterial({ color: 0x1c4f86, transparent: true, opacity: 0.78, roughness: 0.25, metalness: 0.1 }));
        pl.rotation.x = -Math.PI / 2; scene.add(pl);
      } else if (ground) {
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshStandardMaterial({ color: v.type === "rail" ? 0x5a5348 : 0x9a7f55, roughness: 0.95 }));
        pl.rotation.x = -Math.PI / 2; scene.add(pl);
        if (v.type === "rail") for (const sd of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 4), new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.8, roughness: 0.3 })); rail.position.set(sd * 0.046, 0.003, 0); scene.add(rail); }
      }
      const bb = new THREE.Box3().setFromObject(o), sz = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
      const d = Math.max(sz.x, sz.y, sz.z) * 1.35 + 0.2;
      const cam = new THREE.PerspectiveCamera(30, CW / CH, 0.01, 50);
      cam.position.set(c.x + d * 0.95, c.y + d * (v.type === "air" || v.type === "space" ? 0.55 : 0.32), c.z + d * 0.9); cam.lookAt(c.x, Math.max(0, c.y * 0.8), c.z);
      r.setViewport(cx, H - cy - CH, CW, CH); r.setScissor(cx, H - cy - CH, CW, CH);
      r.render(scene, cam);
      let meshes = 0; o.traverse((m) => { if (m.isMesh) meshes++; });
      report.push({ id: v.id, name: v.name, type: v.type, fallback: !!o.userData.fallback, meshes, minY: +bb.min.y.toFixed(4) });
      const lb = document.createElement("div"); lb.className = "lb"; lb.style.left = cx + 10 + "px"; lb.style.top = cy + 10 + "px";
      lb.innerHTML = v.name + "<small>" + v.id + " · " + v.type + (water ? " · waterline" : ground ? " · on the ground" : v.type === "air" ? " · in flight" : " · orbit") + "</small>";
      wrap.appendChild(lb);
    });
    // blank-cell check: every cell must differ from its background somewhere near the middle
    const gl = r.getContext(); const px = new Uint8Array(4 * 60 * 40);
    list.forEach((v, i) => {
      const cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH;
      gl.readPixels(cx + CW / 2 - 30, H - cy - CH / 2 - 20, 60, 40, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let mn = 255, mx = 0; for (let k = 0; k < px.length; k += 4) { const l = px[k] + px[k + 1] + px[k + 2]; mn = Math.min(mn, l); mx = Math.max(mx, l); }
      report[i].contrast = mx - mn;
    });
    return { report, W, H };
  }, COLS, CW, CH);
  const bodyH = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewport({ width: COLS * CW, height: bodyH, deviceScaleFactor: 1 });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: true });
  for (const x of res.report) {
    const bad = x.fallback || x.meshes < 4 || x.contrast < 40;
    if (bad) failed = true;
    console.log((bad ? "FAIL " : "ok   ") + x.id.padEnd(16) + x.type.padEnd(9) + " meshes " + String(x.meshes).padStart(3) + " minY " + x.minY + " contrast " + x.contrast + (x.fallback ? " PLACEHOLDER" : ""));
  }
  console.log("wrote", path.relative(root, out), res.report.length, "types");
  await browser.close();
} finally { server.kill(); }
process.exit(failed ? 1 : 0);
