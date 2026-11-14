// Contact sheet of every vehicle model: side, top and three-quarter views, labelled, on one PNG.
// Usage: node tools/model_sheet.mjs <out.png> [ids comma-separated] [--lod=detail|lite]
import fs from "node:fs";
import { startServer, launch } from "./browser.mjs";
const out = process.argv[2] || "contact-sheet.png";
const only = (process.argv[3] && !process.argv[3].startsWith("--")) ? process.argv[3].split(",") : null;
const lod = (process.argv.find((a) => a.startsWith("--lod=")) || "--lod=detail").slice(6);
const port = 8950 + Math.floor(Math.random() * 40);
const server = await startServer(port);
const b = await launch(1600, 1000);
try {
  const p = await b.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await p.setContent(`<html><body style="margin:0;background:#0b1020"><script>${lod === "lite" ? "window.SEAGLOBE_EDITION={lite:true};" : ""}</script><script src="http://127.0.0.1:${port}/vendor/three.global.js"></script><script src="http://127.0.0.1:${port}/js/vehicles.js"></script></body></html>`, { waitUntil: "load" });
  const png = await p.evaluate(async (only, lod) => {
    const THREE = window.SEAGLOBE_THREE, V = window.SeaVehicles;
    const ids = (only || V.ids).filter((id) => V.ids.includes(id));
    const cell = 300, labelH = 26, cols = 3, W = cell * cols, H = cell + labelH;
    const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(cell, cell); r.setPixelRatio(1);
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
    const sheet = document.createElement("canvas"); sheet.width = W * 2; sheet.height = H * Math.ceil(ids.length / 2) + 40;
    const ctx = sheet.getContext("2d"); ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, sheet.width, sheet.height);
    ctx.fillStyle = "#e7c766"; ctx.font = "bold 18px sans-serif"; ctx.fillText("SeaGlobe vehicle models — side · top · three-quarter (+Z = forward, arrow shows travel direction)", 12, 26);
    const views = [[new THREE.Vector3(1.6, 0.25, 0), "side"], [new THREE.Vector3(0.001, 1.8, 0), "top"], [new THREE.Vector3(1.1, 0.75, 1.1), "3/4"]];
    ids.forEach((id, k) => {
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a2338);
      scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x403020, 1.4)); const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(2, 3, 2); scene.add(d);
      const o = V.build(id, { lod }); scene.add(o); if (o.userData.setDetail) o.userData.setDetail(lod !== "lite");
      const bb = new THREE.Box3().setFromObject(o), c = bb.getCenter(new THREE.Vector3());
      const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, bb.min.y - 0.02, 0.55), 0.25, 0xff5050, 0.08, 0.05); scene.add(arrow);
      const grid = new THREE.GridHelper(1.4, 14, 0x334466, 0x223050); grid.position.y = bb.min.y - 0.025; scene.add(grid);
      const x0 = (k % 2) * W, y0 = 40 + Math.floor(k / 2) * H;
      views.forEach(([pos, name], i) => {
        const cam = new THREE.PerspectiveCamera(28, 1, 0.01, 50); cam.position.copy(pos).multiplyScalar(1.45).add(c); cam.up.set(name === "top" ? 0 : 0, 1, name === "top" ? 1 : 0); cam.lookAt(c);
        r.render(scene, cam); ctx.drawImage(r.domElement, x0 + i * cell, y0 + labelH);
      });
      ctx.fillStyle = "#eaf6ff"; ctx.font = "15px sans-serif"; ctx.fillText(id + (o.userData.fallback ? " (FALLBACK)" : ""), x0 + 8, y0 + 18);
    });
    return sheet.toDataURL("image/png");
  }, only, lod);
  fs.writeFileSync(out, Buffer.from(png.split(",")[1], "base64"));
  console.log("wrote", out, errs.length ? "errors: " + errs.join(" | ") : "");
} finally { await b.close(); server.kill(); }
