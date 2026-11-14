/* Procedural vehicle models, one builder per asset id in data/schema.js.
   Built from three.js primitives in code: no model files, no licenses beyond three.js (MIT).
   Local frame: +Z is forward (bow / nose), +Y is up (away from the globe), length about 1. */
(function (root) {
  const THREE = root.SEAGLOBE_THREE;
  const cache = new Map();
  const M = {};
  // ---- procedural textures (made in code, no image files) ----
  const TX = {};
  function canvasTex(key, w, h, draw, repeat) {
    if (TX[key]) return TX[key];
    if (typeof document === "undefined") return null; // node tests: geometry only
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); draw(x, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
    return (TX[key] = t);
  }
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const planks = () => canvasTex("planks", 512, 256, (x, w, h) => {
    x.fillStyle = "#c8c8c8"; x.fillRect(0, 0, w, h);
    const rows = 16, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let px = -rnd() * 200;
      while (px < w) {
        const len = 120 + rnd() * 160, v = 175 + rnd() * 70;
        x.fillStyle = "rgb(" + v + "," + (v * 0.97) + "," + (v * 0.93) + ")"; x.fillRect(px, r * rh, len, rh);
        for (let k = 0; k < 6; k++) { x.strokeStyle = "rgba(60,40,20," + (0.05 + rnd() * 0.08) + ")"; x.beginPath(); const yy = r * rh + rnd() * rh; x.moveTo(px, yy); x.bezierCurveTo(px + len * 0.3, yy + rnd() * 3 - 1.5, px + len * 0.7, yy + rnd() * 3 - 1.5, px + len, yy); x.stroke(); }
        x.fillStyle = "rgba(30,18,8,0.55)"; x.fillRect(px, r * rh, 1.5, rh);
        if (rnd() < 0.5) { x.fillStyle = "rgba(20,12,6,0.6)"; x.beginPath(); x.arc(px + 4, r * rh + rh / 2, 1.2, 0, 7); x.fill(); }
        px += len;
      }
      x.fillStyle = "rgba(25,15,6,0.7)"; x.fillRect(0, r * rh + rh - 1.6, w, 1.6);
    }
  });
  const canvasCloth = () => canvasTex("cloth", 256, 256, (x, w, h) => {
    x.fillStyle = "#f2ede2"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { x.fillStyle = "rgba(120,100,70," + rnd() * 0.05 + ")"; x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1); }
    for (let i = 1; i < 8; i++) { x.fillStyle = "rgba(110,90,60,0.22)"; x.fillRect(i * w / 8 - 1, 0, 2, h); } // seams
    x.fillStyle = "rgba(90,70,45,0.35)"; x.fillRect(0, 0, w, 4); x.fillRect(0, h - 4, w, 4); x.fillRect(0, 0, 4, h); x.fillRect(w - 4, 0, 4, h); // tabling
    for (const yy of [0.22, 0.36]) for (let i = 0; i < 16; i++) { x.fillStyle = "rgba(70,55,35,0.5)"; x.fillRect(i * w / 16 + 6, yy * h, 2, 5); } // reef points
    const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, "rgba(90,70,40,0.18)"); g.addColorStop(0.5, "rgba(90,70,40,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  const steelPlates = () => canvasTex("steel", 512, 128, (x, w, h) => {
    x.fillStyle = "#d0d0d0"; x.fillRect(0, 0, w, h);
    for (let c = 0; c < 16; c++) for (let r = 0; r < 4; r++) { const v = 196 + rnd() * 30; x.fillStyle = "rgb(" + v + "," + v + "," + v + ")"; x.fillRect(c * w / 16 + 1, r * h / 4 + 1, w / 16 - 2, h / 4 - 2); }
    for (let i = 0; i < 40; i++) { const xx = rnd() * w, g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(120,60,30,0)"); g.addColorStop(0.5 + rnd() * 0.4, "rgba(120,60,30," + rnd() * 0.25 + ")"); g.addColorStop(1, "rgba(120,60,30,0)"); x.fillStyle = g; x.fillRect(xx, 0, 1 + rnd() * 3, h); }
  });
  function mat(key, color, opts) {
    if (!M[key]) M[key] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.05, flatShading: false }, opts || {}));
    return M[key];
  }
  const woodMap = () => planks(), clothMap = () => canvasCloth(), steelMap = () => steelPlates();
  const C = {
    wood: () => mat("wood", 0x8a5a32, { emissive: 0x140a04, map: woodMap(), roughness: 0.8 }),
    darkwood: () => mat("darkwood", 0x5a3820, { emissive: 0x0d0703, map: woodMap(), roughness: 0.8 }),
    paint: (c, k) => mat("paint" + k, c, { emissive: 0x050505, map: woodMap(), roughness: 0.7 }),
    sail: () => mat("sail", 0xece2c8, { side: THREE.DoubleSide, roughness: 0.95, emissive: 0x0c0a07, map: clothMap() }),
    redsail: () => mat("redsail", 0xb8432f, { side: THREE.DoubleSide, roughness: 0.9, emissive: 0x200805, map: clothMap() }),
    ochresail: () => mat("ochresail", 0xc98b3a, { side: THREE.DoubleSide, roughness: 0.9, emissive: 0x201205, map: clothMap() }),
    rope: () => mat("rope", 0x2b2118),
    gold: () => mat("gold", 0xd9b45a, { metalness: 0.6, roughness: 0.4, emissive: 0x201505 }),
    iron: () => mat("iron", 0x2a2d33, { metalness: 0.5, roughness: 0.5 }),
    steel: (c, k) => mat("steel" + k, c, { metalness: 0.35, roughness: 0.45, emissive: 0x060606, map: steelMap() }),
    white: () => mat("white", 0xc9d0d8, { metalness: 0.0, roughness: 0.65, emissive: 0x06080a }),
    glass: () => mat("glass", 0x1d3550, { metalness: 0.6, roughness: 0.2, emissive: 0x0a1a30 }),
    camel: () => mat("camel", 0xc49a62, { emissive: 0x1a1208 }),
    cloth: (c, k) => mat("cloth" + k, c, { emissive: 0x0a0505 }),
    glow: () => mat("glow", 0xffc070, { emissive: 0xffb060, emissiveIntensity: 1.2 }),
  };

  function mesh(geo, m, x, y, z, rx, ry, rz) {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x || 0, y || 0, z || 0);
    o.rotation.set(rx || 0, ry || 0, rz || 0);
    return o;
  }
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cyl = (r1, r2, h, n) => new THREE.CylinderGeometry(r1, r2, h, n || 10);

  // Lofted hull: stations along Z, U-shaped sections, sheer rising to bow and stern.
  function hull(o) {
    const L = o.len, B = o.beam, D = o.depth, NS = 44, NR = 16;
    const pos = [], idx = [], uv = [];
    const width = (u) => { // u in [0,1] stern->bow
      const bow = Math.pow(Math.max(0, 1 - Math.pow((u - 0.5) / 0.5, 2)), o.bowFull || 0.5);
      const stern = u < 0.5 ? Math.max(o.transom || 0, Math.pow(Math.sin(Math.PI * u), o.sternFull || 0.5)) : bow;
      return B / 2 * (u < 0.5 ? stern : bow);
    };
    const sheer = (u) => D * 0.15 + (o.sheerStern || 0) * Math.pow(1 - u, 3) + (o.sheerBow || 0) * Math.pow(u, 3);
    for (let i = 0; i <= NS; i++) {
      const u = i / NS, z = -L / 2 + u * L, w = width(u), top = sheer(u);
      for (let j = 0; j <= NR; j++) {
        const a = Math.PI * j / NR; // 0 port deck -> pi starboard deck
        const x = -Math.cos(a) * w;
        const y = top - Math.sin(a) * (D * (0.35 + 0.65 * Math.min(1, w / (B / 2) * 1.3)) + top - D * 0.15);
        pos.push(x, y, z);
        uv.push(u * L * 3, j / NR);
      }
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) {
      const a = i * (NR + 1) + j, b = a + NR + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    // deck cap
    const base = pos.length / 3;
    for (let i = 0; i <= NS; i++) {
      const p0 = i * (NR + 1), p1 = p0 + NR;
      pos.push(pos[p0 * 3], pos[p0 * 3 + 1] - 0.004, pos[p0 * 3 + 2], pos[p1 * 3], pos[p1 * 3 + 1] - 0.004, pos[p1 * 3 + 2]);
    }
    for (let i = 0; i < NS; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    for (let i = 0; i <= NS; i++) uv.push(i / NS * L * 3, 0.5, i / NS * L * 3, 0.7);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    // colours: dark bottom below the waterline, a darker wale band under the sheer, deck lighter
    const col = [], nV = pos.length / 3, wl = -D * 0.45;
    const below = new THREE.Color(o.bottom != null ? o.bottom : 0x2a1a10), deck = new THREE.Color(0xd8c09a);
    for (let k = 0; k < nV; k++) {
      const y = pos[k * 3 + 1];
      let c = new THREE.Color(1, 1, 1);
      if (k >= base) c = deck;
      else {
        const j = k % (NR + 1), edge = Math.min(j, NR - j);
        if (y < wl) c = below.clone().lerp(new THREE.Color(1, 1, 1), 0.08);
        else if (edge === 1 || edge === 2) c = new THREE.Color(o.band != null ? o.band : 0x3a2414).lerp(new THREE.Color(1, 1, 1), 0.15);
      }
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const hm = (o.mat || C.wood()).clone(); hm.vertexColors = true; hm.side = THREE.DoubleSide;
    const grp = new THREE.Group();
    const hullMesh = new THREE.Mesh(g, hm); hullMesh.userData.hull = { L, B, D };
    grp.add(hullMesh);
    return grp;
  }

  function sail(w, h, billow, m, lateen) {
    const g = lateen ? new THREE.BufferGeometry() : new THREE.PlaneGeometry(w, h, 14, 12);
    if (lateen) {
      const v = [], ix = [], N = 12;
      for (let i = 0; i <= N; i++) for (let j = 0; j <= N - i; j++) {
        const s = i / N, t = j / N;
        v.push((t - 0.5 * (1 - s)) * w * 0, 0, 0); // placeholder
      }
      // triangle: yard from (0,h) to (0,0)-ish, clew aft
      const P = [], UV = [];
      for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
        UV.push(j / N, i / N);
        const s = i / N, t = j / N; // s along yard (0 low fwd, 1 high aft), t towards clew
        const ya = [0, -0.05 * h, w * 0.55], yb = [0, h, -w * 0.45], cl = [0, 0.02 * h, -w * 0.35];
        const yx = ya.map((q, k) => q + (yb[k] - q) * s);
        const p = yx.map((q, k) => q + (cl[k] - q) * t * (1 - s));
        p[0] = billow * Math.sin(Math.PI * t) * Math.sin(Math.PI * Math.min(1, s + 0.1));
        P.push(p[0], p[1], p[2]);
      }
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const a = i * (N + 1) + j, b = a + N + 1;
        ix.push(a, b, a + 1, b, b + 1, a + 1);
      }
      g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
      g.setIndex(ix);
      g.computeVertexNormals();
      return new THREE.Mesh(g, m);
    }
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / w + 0.5, y = p.getY(i) / h + 0.5;
      p.setZ(i, billow * Math.sin(Math.PI * x) * (0.6 + 0.4 * Math.sin(Math.PI * y)));
    }
    g.computeVertexNormals();
    const s = new THREE.Mesh(g, m);
    s.rotation.y = Math.PI / 2; // face forward: plane in X-Y -> Y-Z? keep across beam
    s.rotation.y = 0;
    return s;
  }

  // Square-rigged mast with n sails, stacked.
  function squareMast(grp, z, h, w, n, m, flag) {
    grp.add(mesh(cyl(0.008, 0.011, h, 6), C.darkwood(), 0, h / 2, z));
    let y = 0.12;
    for (let i = 0; i < n; i++) {
      const sh = (h - 0.14) / n * 0.92, sw = w * (1 - i * 0.18);
      grp.add(mesh(cyl(0.004, 0.004, sw * 1.1, 5), C.darkwood(), 0, y + sh, z, 0, 0, Math.PI / 2));
      const s = sail(sw, sh, 0.035, m || C.sail());
      s.position.set(0, y + sh / 2, z + 0.012);
      grp.add(s);
      y += sh;
    }
    if (flag) grp.add(mesh(box(0.002, 0.03, 0.06), C.paint(flag, "flag" + flag), 0, h + 0.015, z - 0.03));
  }

  function oars(grp, n, z0, z1, y, reach, banks) {
    const g = box(0.004, 0.004, 1);
    for (let b = 0; b < (banks || 1); b++) for (let i = 0; i < n; i++) {
      const z = z0 + (z1 - z0) * i / (n - 1);
      for (const side of [-1, 1]) {
        const o = mesh(g, C.darkwood(), side * (reach / 2 + 0.03), y - b * 0.018, z);
        o.scale.z = reach;
        o.rotation.set(0.25, side * Math.PI / 2, side * -0.35);
        grp.add(o);
      }
    }
  }

  const B = {};
  B["trireme"] = () => {
    const g = hull({ len: 1, beam: 0.14, depth: 0.07, sheerBow: 0.02, sheerStern: 0.09, bowFull: 0.7, sternFull: 0.6, mat: C.darkwood() });
    g.add(mesh(new THREE.ConeGeometry(0.015, 0.09, 6), C.gold(), 0, -0.02, 0.53, Math.PI / 2, 0, 0)); // bronze ram
    g.add(mesh(box(0.15, 0.012, 0.7), C.paint(0x9a3b2a, "tri"), 0, 0.005, 0)); // outrigger
    oars(g, 13, -0.3, 0.32, 0.0, 0.18, 3);
    g.add(mesh(cyl(0.006, 0.008, 0.32, 6), C.darkwood(), 0, 0.16, 0.08));
    const s = sail(0.24, 0.16, 0.02, C.sail()); s.position.set(0, 0.2, 0.09); g.add(s);
    g.add(mesh(new THREE.TorusGeometry(0.03, 0.006, 5, 10, Math.PI), C.darkwood(), 0, 0.1, -0.5, 0, Math.PI / 2, 0)); // aphlaston
    g.add(mesh(new THREE.SphereGeometry(0.012, 8, 6), C.paint(0xf0f0f0, "eye"), 0.055, 0.01, 0.42));
    g.add(mesh(new THREE.SphereGeometry(0.012, 8, 6), C.paint(0xf0f0f0, "eye"), -0.055, 0.01, 0.42));
    return g;
  };
  B["roman-merchant"] = () => {
    const g = hull({ len: 0.9, beam: 0.3, depth: 0.13, sheerBow: 0.03, sheerStern: 0.08, bowFull: 0.35, sternFull: 0.35 });
    g.add(mesh(new THREE.TorusGeometry(0.035, 0.009, 5, 10, Math.PI * 1.3), C.darkwood(), 0, 0.12, -0.43, 0, Math.PI / 2, 0)); // swan-neck sternpost
    g.add(mesh(cyl(0.01, 0.013, 0.55, 6), C.darkwood(), 0, 0.28, 0.02));
    g.add(mesh(cyl(0.005, 0.005, 0.44, 5), C.darkwood(), 0, 0.5, 0.03, 0, 0, Math.PI / 2));
    const s = sail(0.42, 0.34, 0.05, C.sail()); s.position.set(0, 0.33, 0.045); g.add(s);
    const top = sail(0.14, 0.08, 0.01, C.sail(), false); top.position.set(0, 0.55, 0.04); g.add(top);
    g.add(mesh(cyl(0.006, 0.006, 0.22, 5), C.darkwood(), 0, 0.12, 0.47, 1.0, 0, 0)); // artemon
    const a = sail(0.1, 0.08, 0.01, C.sail()); a.position.set(0, 0.2, 0.55); g.add(a);
    g.add(mesh(box(0.012, 0.09, 0.04), C.darkwood(), 0.15, 0.0, -0.36)); g.add(mesh(box(0.012, 0.09, 0.04), C.darkwood(), -0.15, 0.0, -0.36));
    return g;
  };
  B["galley"] = () => {
    const g = hull({ len: 1, beam: 0.16, depth: 0.08, sheerBow: 0.02, sheerStern: 0.06, bowFull: 0.6, sternFull: 0.5, mat: C.paint(0x5b3a22, "gal") });
    oars(g, 16, -0.32, 0.3, 0.02, 0.2, 1);
    g.add(mesh(box(0.14, 0.05, 0.12), C.paint(0x8a2b22, "galcabin"), 0, 0.07, -0.38));
    g.add(mesh(cyl(0.006, 0.009, 0.4, 6), C.darkwood(), 0, 0.2, 0.15));
    const s = sail(0.5, 0.34, 0.05, C.sail(), true); s.position.set(0, 0.06, 0.15); g.add(s);
    g.add(mesh(cyl(0.005, 0.007, 0.26, 6), C.darkwood(), 0, 0.13, -0.15));
    const s2 = sail(0.3, 0.22, 0.03, C.sail(), true); s2.position.set(0, 0.05, -0.15); g.add(s2);
    g.add(mesh(new THREE.ConeGeometry(0.01, 0.12, 5), C.darkwood(), 0, 0.03, 0.55, Math.PI / 2, 0, 0)); // beak
    return g;
  };
  B["cog"] = () => {
    const g = hull({ len: 0.8, beam: 0.34, depth: 0.16, sheerBow: 0.05, sheerStern: 0.05, bowFull: 0.25, sternFull: 0.25, transom: 0.5 });
    g.add(mesh(box(0.3, 0.07, 0.16), C.darkwood(), 0, 0.13, -0.3)); // aftcastle
    g.add(mesh(box(0.31, 0.012, 0.17), C.paint(0xb03a2e, "cogc"), 0, 0.17, -0.3));
    g.add(mesh(box(0.22, 0.05, 0.1), C.darkwood(), 0, 0.12, 0.33)); // forecastle
    g.add(mesh(cyl(0.012, 0.016, 0.6, 6), C.darkwood(), 0, 0.3, 0.0));
    g.add(mesh(cyl(0.006, 0.006, 0.46, 5), C.darkwood(), 0, 0.53, 0.0, 0, 0, Math.PI / 2));
    const s = sail(0.44, 0.42, 0.06, C.sail()); s.position.set(0, 0.32, 0.025); g.add(s);
    for (let i = 0; i < 3; i++) g.add(mesh(box(0.44, 0.012, 0.004), C.paint(0xb03a2e, "cogs"), 0, 0.18 + i * 0.13, 0.04 + Math.sin((i + 1) / 4 * Math.PI) * 0.05));
    g.add(mesh(new THREE.ConeGeometry(0.01, 0.06, 4), C.paint(0xd93a2b, "pennant"), 0, 0.63, -0.02, 0, 0, Math.PI / 2));
    return g;
  };
  B["dhow"] = () => {
    const g = hull({ len: 0.9, beam: 0.24, depth: 0.11, sheerBow: 0.07, sheerStern: 0.04, bowFull: 0.9, sternFull: 0.45, transom: 0.4 });
    g.add(mesh(cyl(0.008, 0.012, 0.5, 6), C.darkwood(), 0, 0.25, 0.12, -0.18, 0, 0));
    const s = sail(0.7, 0.62, 0.07, C.sail(), true); s.position.set(0, 0.05, 0.1); g.add(s);
    g.add(mesh(box(0.2, 0.05, 0.14), C.darkwood(), 0, 0.09, -0.34));
    g.add(mesh(box(0.004, 0.08, 0.02), C.paint(0x2e8b57, "dhowf"), 0, 0.42, 0.05));
    return g;
  };
  B["junk"] = () => {
    const g = hull({ len: 1, beam: 0.3, depth: 0.15, sheerBow: 0.05, sheerStern: 0.12, bowFull: 0.25, sternFull: 0.2, transom: 0.75, mat: C.paint(0x5a3018, "junkh") });
    g.add(mesh(box(0.28, 0.09, 0.2), C.paint(0x8c2a1c, "junkc"), 0, 0.17, -0.36));
    g.add(mesh(box(0.3, 0.015, 0.22), C.gold(), 0, 0.225, -0.36));
    const masts = [[0.28, 0.42, 0.26], [0.05, 0.62, 0.36], [-0.17, 0.5, 0.3], [0.42, 0.26, 0.16]];
    for (const [z, h, w] of masts) {
      g.add(mesh(cyl(0.008, 0.012, h, 6), C.darkwood(), 0, h / 2 + 0.05, z));
      const s = sail(w, h * 0.78, 0.02, C.redsail()); s.position.set(0, h * 0.55, z + 0.015); s.rotation.y = 0.25; g.add(s);
      for (let i = 0; i < 5; i++) g.add(mesh(box(w * 1.04, 0.006, 0.006), C.darkwood(), 0, h * 0.18 + i * h * 0.16, z + 0.02));
    }
    g.add(mesh(new THREE.SphereGeometry(0.014, 8, 6), C.paint(0xffffff, "junke"), 0.13, 0.08, 0.44));
    g.add(mesh(new THREE.SphereGeometry(0.014, 8, 6), C.paint(0xffffff, "junke"), -0.13, 0.08, 0.44));
    return g;
  };
  function threeMaster(o) {
    const g = hull({ len: 1, beam: 0.27, depth: 0.14, sheerBow: o.bow, sheerStern: o.stern, bowFull: 0.4, sternFull: 0.3, transom: 0.7, mat: C.paint(o.hull, "h" + o.hull), band: o.band, bottom: 0x6a4a2a });
    g.add(mesh(box(0.25, o.castle, 0.26), C.paint(o.hull, "h" + o.hull), 0, 0.06 + o.castle / 2, -0.36));
    g.add(mesh(box(0.255, 0.008, 0.265), C.wood(), 0, 0.06 + o.castle, -0.36)); // poop deck
    for (const sd of [-1, 1]) g.add(mesh(box(0.006, 0.018, 0.27), C.gold(), sd * 0.127, 0.069 + o.castle, -0.36)); // gilded rail
    g.add(mesh(box(0.25, 0.018, 0.006), C.gold(), 0, 0.069 + o.castle, -0.228));
    for (let i = 0; i < 5; i++) g.add(mesh(box(0.03, 0.022, 0.004), C.glow(), -0.08 + i * 0.04, 0.03 + o.castle * 0.6, -0.492)); // stern gallery windows
    g.add(mesh(box(0.24, 0.006, 0.006), C.gold(), 0, 0.045 + o.castle * 0.6, -0.492));
    g.add(mesh(box(0.272, 0.014, 0.7), C.paint(o.band, "b" + o.band), 0, 0.03, 0)); // wale / gunport band
    if (o.ports) for (let i = 0; i < 9; i++) for (const s of [-1, 1]) g.add(mesh(box(0.004, 0.014, 0.022), C.iron(), s * 0.137, 0.03, -0.3 + i * 0.075));
    g.add(mesh(cyl(0.006, 0.008, 0.36, 5), C.darkwood(), 0, 0.12, 0.6, 1.15, 0, 0)); // bowsprit
    const jib = sail(0.001, 0.001, 0, C.sail()); jib.visible = false; g.add(jib);
    squareMast(g, 0.24, o.h * 0.88, 0.36, o.sails, C.sail());
    squareMast(g, 0.0, o.h, 0.42, o.sails, C.sail(), o.flag);
    g.add(mesh(cyl(0.006, 0.009, o.h * 0.7, 6), C.darkwood(), 0, o.h * 0.35, -0.26));
    const lat = sail(0.26, 0.26, 0.03, C.sail(), true); lat.position.set(0, 0.12, -0.26); g.add(lat);
    g.add(mesh(new THREE.SphereGeometry(0.012, 6, 5), C.glow(), 0, 0.12 + o.castle, -0.5)); // stern lantern
    return g;
  }
  B["galleon"] = () => threeMaster({ hull: 0x6b3a1e, band: 0xc9a227, bow: 0.06, stern: 0.12, castle: 0.12, h: 0.72, sails: 2, flag: 0xc8102e, ports: true });
  B["east-indiaman"] = () => threeMaster({ hull: 0x3b2a1a, band: 0xd9b45a, bow: 0.04, stern: 0.09, castle: 0.09, h: 0.8, sails: 3, flag: 0xff7a1a, ports: true });
  B["frigate"] = () => threeMaster({ hull: 0x2a2a2a, band: 0xe8d38a, bow: 0.03, stern: 0.06, castle: 0.05, h: 0.86, sails: 3, flag: 0xc8102e, ports: true });
  B["steamship"] = () => {
    const g = hull({ len: 1, beam: 0.17, depth: 0.1, sheerBow: 0.02, sheerStern: 0.02, bowFull: 0.8, sternFull: 0.4, transom: 0.4, mat: C.paint(0x1c1c1c, "ssh"), bottom: 0x7a2a1e });
    g.add(mesh(box(0.172, 0.02, 0.86), C.paint(0xd8d2c4, "ssb"), 0, 0.03, 0));
    for (const s of [-1, 1]) g.add(mesh(cyl(0.09, 0.09, 0.05, 16), C.paint(0x1c1c1c, "ssh"), s * 0.11, 0.04, 0.02, 0, 0, Math.PI / 2));
    g.add(mesh(cyl(0.028, 0.03, 0.22, 12), C.paint(0x111111, "funb"), 0, 0.17, 0.05));
    g.add(mesh(cyl(0.031, 0.031, 0.05, 12), C.paint(0xc8341e, "funr"), 0, 0.24, 0.05));
    smoke(g, 0, 0.3, 0.03, 5, 0.05);
    g.add(mesh(box(0.12, 0.05, 0.3), C.white(), 0, 0.07, -0.18));
    squareMast(g, 0.3, 0.42, 0.22, 1, C.sail());
    squareMast(g, -0.3, 0.38, 0.18, 1, C.sail());
    return g;
  };
  B["container-ship"] = () => {
    const g = hull({ len: 1, beam: 0.15, depth: 0.08, sheerBow: 0.02, sheerStern: 0.0, bowFull: 0.9, sternFull: 0.2, transom: 0.8, mat: C.steel(0x23324a, "cs"), bottom: 0x8a2a22, band: 0x1a2436 });
    const cols = [0xd94a3a, 0x2f7dd1, 0xe8b13a, 0x3aa26b, 0xe6e6e6, 0x8a4fc9, 0x1f9aa0];
    const geo = box(0.023, 0.02, 0.055);
    const inst = new THREE.InstancedMesh(geo, mat("cont", 0xffffff, { roughness: 0.6, metalness: 0.2, emissive: 0x050505 }), 6 * 13 * 4);
    let n = 0; const m4 = new THREE.Matrix4(); const col = new THREE.Color();
    for (let bay = 0; bay < 13; bay++) for (let row = 0; row < 6; row++) {
      const tiers = 2 + ((bay * 7 + row * 3) % 3);
      for (let t = 0; t < tiers; t++) {
        m4.makeTranslation((row - 2.5) * 0.024, 0.06 + t * 0.021, -0.3 + bay * 0.058);
        inst.setMatrixAt(n, m4); inst.setColorAt(n, col.setHex(cols[(bay * 5 + row * 3 + t) % cols.length])); n++;
      }
    }
    inst.count = n; g.add(inst);
    g.add(mesh(box(0.14, 0.16, 0.07), C.white(), 0, 0.12, -0.41));
    g.add(mesh(box(0.15, 0.025, 0.075), C.glass(), 0, 0.19, -0.41));
    g.add(mesh(cyl(0.015, 0.017, 0.06, 16), C.steel(0x23324a, "cs"), 0, 0.22, -0.46));
    g.add(mesh(cyl(0.0172, 0.0172, 0.012, 16), C.paint(0xe8b13a, "fband"), 0, 0.24, -0.46));
    const bulb = mesh(new THREE.SphereGeometry(0.03, 16, 12), C.steel(0xa8332a, "csr"), 0, -0.05, 0.47); bulb.scale.set(0.8, 0.7, 1.6); g.add(bulb);
    for (let r = 0; r < 4; r++) for (const sd of [-1, 1]) g.add(mesh(box(0.002, 0.008, 0.06), C.glass(), sd * 0.071, 0.07 + r * 0.03, -0.41));
    for (const sd of [-1, 1]) g.add(mesh(cyl(0.008, 0.008, 0.03, 10), C.paint(0xff6a1a, "lifeb"), sd * 0.078, 0.08, -0.37, Math.PI / 2, 0, 0));
    g.add(mesh(box(0.012, 0.11, 0.012), C.white(), 0, 0.27, -0.4)); // radar mast
    g.add(mesh(box(0.06, 0.004, 0.01), C.white(), 0, 0.33, -0.4));
    return g;
  };
  B["camel-caravan"] = () => {
    const g = new THREE.Group();
    const body = new THREE.SphereGeometry(0.06, 10, 8), hump = new THREE.SphereGeometry(0.035, 8, 6), leg = cyl(0.008, 0.007, 0.1, 5), neck = cyl(0.014, 0.018, 0.09, 6), head = box(0.03, 0.028, 0.06);
    const packCols = [0x8a2b22, 0x2a5a8a, 0x6b4a1e, 0x3a6b3a];
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Group();
      const b = mesh(body, C.camel(), 0, 0.13, 0); b.scale.set(0.85, 0.75, 1.5); c.add(b);
      c.add(mesh(hump, C.camel(), 0, 0.185, -0.02));
      if (i % 2) c.add(mesh(hump, C.camel(), 0, 0.18, 0.04));
      for (const [x, z] of [[-0.03, 0.06], [0.03, 0.06], [-0.03, -0.06], [0.03, -0.06]]) c.add(mesh(leg, C.camel(), x, 0.05, z));
      c.add(mesh(neck, C.camel(), 0, 0.17, 0.1, 0.8, 0, 0));
      c.add(mesh(head, C.camel(), 0, 0.21, 0.14));
      c.add(mesh(box(0.1, 0.05, 0.06), C.cloth(packCols[i], "pk" + i), 0, 0.17, 0.0));
      c.position.z = 0.36 - i * 0.24;
      c.position.x = Math.sin(i * 1.7) * 0.02;
      g.add(c);
    }
    const rider = new THREE.Group();
    rider.add(mesh(cyl(0.015, 0.022, 0.07, 6), C.cloth(0xf2f2f2, "robe"), 0, 0.24, 0.36));
    rider.add(mesh(new THREE.SphereGeometry(0.013, 6, 5), C.cloth(0x3a2a1a, "skin"), 0, 0.285, 0.36));
    g.add(rider);
    return g;
  };
  B["steam-train"] = () => {
    const g = new THREE.Group();
    const wheel = cyl(0.03, 0.03, 0.012, 12);
    // locomotive
    g.add(mesh(cyl(0.04, 0.04, 0.22, 14), C.paint(0x1f4f2e, "loco"), 0, 0.09, 0.33, Math.PI / 2, 0, 0));
    g.add(mesh(cyl(0.012, 0.018, 0.07, 8), C.iron(), 0, 0.15, 0.42));
    g.add(mesh(box(0.1, 0.09, 0.08), C.paint(0x1f4f2e, "loco"), 0, 0.11, 0.18));
    g.add(mesh(box(0.11, 0.01, 0.09), C.iron(), 0, 0.16, 0.18));
    g.add(mesh(box(0.1, 0.02, 0.32), C.iron(), 0, 0.04, 0.3));
    g.add(mesh(new THREE.ConeGeometry(0.03, 0.04, 8), C.iron(), 0, 0.04, 0.47, Math.PI / 2, 0, 0));
    g.add(mesh(new THREE.SphereGeometry(0.01, 6, 5), C.glow(), 0, 0.1, 0.45));
    smoke(g, 0, 0.2, 0.42, 6, 0.045);
    for (const sd of [-1, 1]) g.add(mesh(box(0.004, 0.006, 0.18), C.iron(), sd * 0.058, 0.03, 0.32)); // coupling rods
    for (const z of [0.4, 0.32, 0.24]) for (const s of [-1, 1]) g.add(mesh(wheel, C.paint(0xa8201a, "wh"), s * 0.05, 0.03, z, 0, 0, Math.PI / 2));
    // tender and cars
    g.add(mesh(box(0.1, 0.06, 0.12), C.paint(0x1f4f2e, "loco"), 0, 0.07, 0.06));
    const cars = [0x7a1f1a, 0x7a1f1a, 0x5a4a2a];
    cars.forEach((c, i) => {
      const z = -0.12 - i * 0.2;
      g.add(mesh(box(0.1, 0.08, 0.17), C.paint(c, "car" + i), 0, 0.08, z));
      g.add(mesh(box(0.11, 0.012, 0.18), C.iron(), 0, 0.125, z));
      for (const dz of [-0.05, 0.05]) for (const s of [-1, 1]) g.add(mesh(wheel, C.iron(), s * 0.05, 0.03, z + dz, 0, 0, Math.PI / 2));
      for (let w = 0; w < 3; w++) for (const s of [-1, 1]) g.add(mesh(box(0.002, 0.025, 0.03), C.glow(), s * 0.051, 0.09, z - 0.05 + w * 0.05));
    });
    return g;
  };
  const JW = () => mat("jetwhite", 0x9aa4b0, { metalness: 0.1, roughness: 0.55, emissive: 0x000000 });
  B["jet"] = () => {
    const g = new THREE.Group();
    const prof = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, z = -0.55 + u * 1.0; // tail -> nose
      const r = 0.046 * (u < 0.22 ? Math.pow(u / 0.22, 0.7) * 0.8 + 0.2 * (u / 0.22) : u > 0.86 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.86) / 0.14, 2))) : 1);
      prof.push(new THREE.Vector2(Math.max(0.002, r), z));
    }
    const fus = mesh(new THREE.LatheGeometry(prof, 28), JW(), 0, 0, 0.0); fus.rotation.x = Math.PI / 2; fus.rotation.z = 0; fus.scale.set(1, 1, 1);
    fus.rotation.set(Math.PI / 2, 0, 0); g.add(fus);
    const chl = mesh(new THREE.CylinderGeometry(0.0468, 0.0468, 0.6, 28, 1, true, Math.PI * 0.35, Math.PI * 0.3), C.paint(0x1d5fb4, "jets"), 0, 0, 0.03, Math.PI / 2, 0, 0); g.add(chl);
    const chr = chl.clone(); chr.rotation.y = Math.PI; g.add(chr);
    g.add(mesh(box(0.094, 0.006, 0.62), C.glass(), 0, 0.02, 0.03));
    g.add(mesh(new THREE.SphereGeometry(0.03, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3), C.glass(), 0, 0.012, 0.415, Math.PI / 2.4, 0, 0));
    const wing = new THREE.Shape();
    wing.moveTo(0, 0.12); wing.lineTo(0.5, -0.12); wing.lineTo(0.5, -0.2); wing.lineTo(0, -0.08); wing.closePath();
    const wg = new THREE.ExtrudeGeometry(wing, { depth: 0.012, bevelEnabled: false });
    for (const s of [-1, 1]) {
      const w = mesh(wg, JW(), 0, -0.015, 0.02, Math.PI / 2, 0, 0); w.scale.x = s; g.add(w);
      for (const x of [0.17, 0.32]) {
        g.add(mesh(cyl(0.021, 0.017, 0.12, 20), mat("nacelle", 0xdfe5ec, { metalness: 0.5, roughness: 0.3 }), s * x, -0.05, 0.07 - x * 0.45, Math.PI / 2, 0, 0));
        g.add(mesh(cyl(0.017, 0.017, 0.004, 20), mat("intake", 0x202428, { metalness: 0.6, roughness: 0.4 }), s * x, -0.05, 0.132 - x * 0.45, Math.PI / 2, 0, 0));
        g.add(mesh(box(0.006, 0.03, 0.05), JW(), s * x, -0.025, 0.06 - x * 0.45));
      }
      const t = mesh(wg, JW(), 0, 0, -0.36, Math.PI / 2, 0, 0); t.scale.set(s * 0.38, 0.38, 1); g.add(t);
    }
    const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(0.16, 0); fin.lineTo(0.2, 0.17); fin.lineTo(0.13, 0.17); fin.closePath();
    const f = mesh(new THREE.ExtrudeGeometry(fin, { depth: 0.01, bevelEnabled: false }), C.paint(0x1d5fb4, "jets"), -0.005, 0.03, -0.3, 0, -Math.PI / 2, 0); g.add(f);
    g.add(mesh(new THREE.SphereGeometry(0.008, 6, 5), mat("navR", 0xff3030, { emissive: 0xff2020, emissiveIntensity: 2 }), -0.5, -0.01, -0.12));
    g.add(mesh(new THREE.SphereGeometry(0.008, 6, 5), mat("navG", 0x30ff60, { emissive: 0x20ff50, emissiveIntensity: 2 }), 0.5, -0.01, -0.12));
    return g;
  };
  B["longship"] = () => {
    const g = hull({ len: 1, beam: 0.2, depth: 0.08, sheerBow: 0.12, sheerStern: 0.12, bowFull: 0.8, sternFull: 0.8, mat: C.darkwood() });
    for (let i = 0; i < 9; i++) for (const s of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 10), C.paint(i % 2 ? 0xd9b45a : 0x9a2b22, "shield" + (i % 2)), s * 0.1, 0.05, -0.3 + i * 0.075, 0, 0, Math.PI / 2));
    g.add(mesh(new THREE.TorusGeometry(0.05, 0.01, 6, 10, Math.PI), C.darkwood(), 0, 0.16, 0.5, 0, Math.PI / 2, 0)); // prow
    g.add(mesh(new THREE.TorusGeometry(0.045, 0.01, 6, 10, Math.PI), C.darkwood(), 0, 0.15, -0.5, 0, Math.PI / 2, 0));
    g.add(mesh(cyl(0.008, 0.011, 0.42, 6), C.darkwood(), 0, 0.21, 0.0));
    g.add(mesh(cyl(0.005, 0.005, 0.36, 5), C.darkwood(), 0, 0.38, 0.0, 0, 0, Math.PI / 2));
    const s = sail(0.34, 0.28, 0.05, mat("vsail", 0xe8dcc2, { side: THREE.DoubleSide, roughness: 0.9, emissive: 0x201a10 })); s.position.set(0, 0.24, 0.02); g.add(s);
    for (let i = 0; i < 5; i++) g.add(mesh(box(0.34, 0.03, 0.004), C.paint(0xb03a2e, "vstripe"), 0, 0.12 + i * 0.056, 0.03 + Math.sin((i + 0.5) / 5 * Math.PI) * 0.045));
    oars(g, 8, -0.3, 0.28, 0.03, 0.16, 1);
    return g;
  };
  B["barge"] = () => {
    const g = hull({ len: 1, beam: 0.22, depth: 0.06, sheerBow: 0.02, sheerStern: 0.02, bowFull: 0.25, sternFull: 0.25, transom: 0.85, mat: C.paint(0x5a3a1e, "barge") });
    g.add(mesh(box(0.18, 0.06, 0.25), C.paint(0x8a6a3a, "bcab"), 0, 0.06, -0.32));
    g.add(mesh(box(0.2, 0.012, 0.27), C.paint(0x3a5a3a, "broof"), 0, 0.095, -0.32));
    for (let i = 0; i < 4; i++) g.add(mesh(box(0.15, 0.05, 0.1), C.cloth(0xc9a66b, "sack"), 0, 0.05, -0.08 + i * 0.12));
    g.add(mesh(cyl(0.006, 0.008, 0.3, 6), C.darkwood(), 0, 0.15, 0.3));
    const s = sail(0.2, 0.2, 0.02, C.ochresail()); s.position.set(0, 0.2, 0.31); g.add(s);
    return g;
  };
  function smoke(grp, x, y, z, n, drift) {
    const sm = mat("smoke", 0x8a8a8a, { transparent: true, opacity: 0.38, roughness: 1, depthWrite: false });
    for (let i = 0; i < n; i++) {
      const r = 0.018 + i * 0.012;
      grp.add(mesh(new THREE.SphereGeometry(r, 10, 8), sm, x + Math.sin(i * 1.7) * 0.01, y + i * 0.03, z - i * drift));
    }
  }
  function quad(bodyColor, key, neckLen, scaleBody) {
    const c = new THREE.Group();
    const mb = mat(key, bodyColor, { emissive: 0x100a05 });
    const b = mesh(new THREE.SphereGeometry(0.06, 10, 8), mb, 0, 0.12, 0); b.scale.set(0.75, 0.7, 1.45 * scaleBody); c.add(b);
    for (const [x, z] of [[-0.03, 0.06], [0.03, 0.06], [-0.03, -0.06], [0.03, -0.06]]) c.add(mesh(cyl(0.008, 0.007, 0.1, 5), mb, x, 0.05, z));
    c.add(mesh(cyl(0.012, 0.016, neckLen, 6), mb, 0, 0.12 + neckLen * 0.45, 0.08, 0.35, 0, 0));
    c.add(mesh(box(0.028, 0.026, 0.055), mb, 0, 0.12 + neckLen * 0.9, 0.1));
    c.add(mesh(new THREE.ConeGeometry(0.008, 0.03, 4), mb, 0.012, 0.12 + neckLen * 0.9 + 0.025, 0.09));
    c.add(mesh(new THREE.ConeGeometry(0.008, 0.03, 4), mb, -0.012, 0.12 + neckLen * 0.9 + 0.025, 0.09));
    return c;
  }
  B["llama-caravan"] = () => {
    const g = new THREE.Group();
    const cols = [0xcfc4ae, 0x6b4a2e, 0xb8a582, 0x3a2a1e, 0xc4b89e];
    for (let i = 0; i < 5; i++) {
      const c = quad(cols[i], "llama" + i, 0.13, 0.9);
      c.add(mesh(box(0.08, 0.035, 0.05), C.cloth([0xc8341e, 0x2a6a9a, 0xe8b13a][i % 3], "lpack" + (i % 3)), 0, 0.16, 0));
      c.position.set(Math.sin(i * 1.3) * 0.02, 0, 0.4 - i * 0.2);
      g.add(c);
    }
    g.add(mesh(cyl(0.014, 0.02, 0.09, 6), C.cloth(0xc8341e, "poncho"), 0.06, 0.05 + 0.04, 0.5));
    g.add(mesh(new THREE.SphereGeometry(0.014, 6, 5), C.cloth(0x5a3a22, "skin2"), 0.06, 0.15, 0.5));
    return g;
  };
  B["horse-rider"] = () => {
    const g = new THREE.Group();
    const cols = [0x6b3e1e, 0x3a2418, 0x9a7a5a];
    for (let i = 0; i < 3; i++) {
      const h = quad(cols[i], "horse" + i, 0.1, 1.1);
      if (i === 0) {
        h.add(mesh(cyl(0.016, 0.02, 0.08, 6), C.cloth(0x8a1f3a, "riderc"), 0, 0.22, 0.0));
        h.add(mesh(new THREE.SphereGeometry(0.014, 6, 5), C.cloth(0xd9a87a, "skin3"), 0, 0.275, 0.0));
        h.add(mesh(box(0.004, 0.06, 0.04), C.paint(0xd9b45a, "pennon"), 0.03, 0.32, -0.02));
      } else h.add(mesh(box(0.1, 0.05, 0.08), C.cloth([0x2a5a8a, 0x6b4a1e][i - 1], "hpack" + i), 0, 0.17, 0));
      h.position.set(i ? (i % 2 ? 0.03 : -0.03) : 0, 0, 0.3 - i * 0.26);
      g.add(h);
    }
    return g;
  };
  // Ming treasure ship (baochuan): big flat-transom junk hull, nine masts of battened red sails, stern castle.
  // Proportions are artistic: the size of Zheng He's largest ships is debated (see DATA.md).
  B["treasure-ship"] = () => {
    const g = hull({ len: 1, beam: 0.34, depth: 0.16, sheerBow: 0.07, sheerStern: 0.15, bowFull: 0.2, sternFull: 0.15, transom: 0.85, mat: C.paint(0x4a2412, "tsh"), band: 0x8c2a1c, bottom: 0x2a1a10 });
    g.add(mesh(box(0.31, 0.12, 0.22), C.paint(0x8c2a1c, "tsc"), 0, 0.2, -0.36));
    g.add(mesh(box(0.33, 0.015, 0.24), C.gold(), 0, 0.265, -0.36));
    g.add(mesh(box(0.25, 0.07, 0.12), C.paint(0x6a1c12, "tsc2"), 0, 0.3, -0.38));
    for (let i = 0; i < 4; i++) g.add(mesh(box(0.03, 0.025, 0.004), C.glow(), -0.06 + i * 0.04, 0.2, -0.47));
    const masts = [[0.44, 0.3, 0.18], [0.33, 0.48, 0.26], [0.2, 0.62, 0.32], [0.06, 0.72, 0.38], [-0.07, 0.64, 0.34], [-0.19, 0.54, 0.3], [-0.29, 0.42, 0.24], [0.13, 0.38, 0.2], [-0.13, 0.36, 0.2]];
    masts.forEach(([z, h, w], k) => {
      const x = k >= 7 ? (k === 7 ? 0.1 : -0.1) : 0;
      g.add(mesh(cyl(0.008, 0.013, h, 6), C.darkwood(), x, h / 2 + 0.06, z));
      const sl = sail(w, h * 0.78, 0.02, C.redsail()); sl.position.set(x, h * 0.56, z + 0.015); sl.rotation.y = 0.22; g.add(sl);
      for (let i = 0; i < 6; i++) g.add(mesh(box(w * 1.04, 0.005, 0.005), C.darkwood(), x, h * 0.18 + i * h * 0.13, z + 0.02));
    });
    for (const sd of [-1, 1]) g.add(mesh(new THREE.SphereGeometry(0.016, 8, 6), C.paint(0xffffff, "junke"), sd * 0.15, 0.09, 0.44));
    g.add(mesh(box(0.004, 0.05, 0.08), C.paint(0xd9b45a, "tsflag"), 0, 0.82, 0.06));
    return g;
  };
  // Mule-towed canal boat (Erie Canal style): narrow hull, cabin, cargo, towline to a mule on the towpath.
  B["canal-boat"] = () => {
    const g = new THREE.Group();
    const h = hull({ len: 0.62, beam: 0.12, depth: 0.05, sheerBow: 0.01, sheerStern: 0.01, bowFull: 0.3, sternFull: 0.3, transom: 0.8, mat: C.paint(0x2a4a6a, "cbh"), band: 0xd9b45a, bottom: 0x3a2414 });
    h.position.z = -0.19; g.add(h);
    g.add(mesh(box(0.1, 0.05, 0.16), C.paint(0xd8c09a, "cbc"), 0, 0.05, -0.38));
    g.add(mesh(box(0.11, 0.01, 0.17), C.paint(0x8a2b22, "cbr"), 0, 0.078, -0.38));
    for (let i = 0; i < 3; i++) g.add(mesh(box(0.004, 0.014, 0.02), C.glow(), 0.051, 0.055, -0.43 + i * 0.05));
    for (let i = 0; i < 3; i++) g.add(mesh(box(0.09, 0.035, 0.08), C.cloth(0xc9a66b, "sack"), 0, 0.035, -0.22 + i * 0.09));
    g.add(mesh(cyl(0.004, 0.005, 0.12, 5), C.darkwood(), 0, 0.06, 0.0));
    // towpath mule, on the bank to starboard, at ground level (y = 0 is the water / ground line)
    const mule = quad(0x5a4a3a, "mule", 0.08, 1.0); mule.scale.setScalar(0.8); mule.position.set(0.2, 0.0, 0.42); g.add(mule);
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute([0, 0.11, 0.0, 0.2, 0.09, 0.4], 3));
    g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2b2118 })));
    return g;
  };
  // Ox wagon / covered cart train: two-wheeled oxcart lead and covered wagons (Roman plaustrum to 19th c.).
  B["ox-wagon"] = () => {
    const g = new THREE.Group();
    const wheel = new THREE.TorusGeometry(0.04, 0.007, 6, 16), hub = cyl(0.008, 0.008, 0.03, 8);
    for (let k = 0; k < 2; k++) {
      const z = 0.05 - k * 0.42;
      for (const sd of [-1, 1]) { const ox = quad(k ? 0x8a6a4a : 0x6b4a2a, "ox" + k, 0.06, 1.1); ox.position.set(sd * 0.04, 0, z + 0.25); g.add(ox); }
      g.add(mesh(box(0.11, 0.008, 0.012), C.darkwood(), 0, 0.12, z + 0.31)); // yoke
      g.add(mesh(box(0.008, 0.008, 0.2), C.darkwood(), 0, 0.07, z + 0.2)); // pole
      g.add(mesh(box(0.11, 0.05, 0.18), C.wood(), 0, 0.085, z));
      const cover = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 14, 1, true, -Math.PI / 2, Math.PI), C.cloth(0xe8dcc2, "canvas"), 0, 0.11, z, Math.PI / 2, 0, 0);
      cover.material = mat("canvasD", 0xe8dcc2, { side: THREE.DoubleSide, roughness: 0.95, map: clothMap() }); g.add(cover);
      for (const dz of [-0.06, 0.06]) for (const sd of [-1, 1]) { g.add(mesh(wheel, C.darkwood(), sd * 0.062, 0.04, z + dz, 0, Math.PI / 2, 0)); g.add(mesh(hub, C.iron(), sd * 0.062, 0.04, z + dz, 0, 0, Math.PI / 2)); }
    }
    g.add(mesh(cyl(0.012, 0.016, 0.07, 6), C.cloth(0x6a4a2a, "drover"), 0.09, 0.035, 0.36));
    g.add(mesh(new THREE.SphereGeometry(0.012, 6, 5), C.cloth(0xd9a87a, "skin3"), 0.09, 0.085, 0.36));
    return g;
  };
  function railCar(g, z, color, key, len, roofCol) {
    const wheel = cyl(0.022, 0.022, 0.01, 12);
    g.add(mesh(box(0.1, 0.075, len), C.steel(color, key), 0, 0.075, z));
    g.add(mesh(box(0.095, 0.012, len * 0.98), C.steel(roofCol || 0x555a60, key + "r"), 0, 0.118, z));
    for (let w = 0; w < Math.floor(len / 0.04); w++) for (const s of [-1, 1]) g.add(mesh(box(0.002, 0.02, 0.025), C.glow(), s * 0.051, 0.085, z - len / 2 + 0.03 + w * 0.04));
    for (const dz of [-len * 0.35, len * 0.35]) { g.add(mesh(box(0.09, 0.02, 0.07), C.iron(), 0, 0.03, z + dz)); for (const s of [-1, 1]) for (const d2 of [-0.022, 0.022]) g.add(mesh(wheel, C.iron(), s * 0.046, 0.022, z + dz + d2, 0, 0, Math.PI / 2)); }
  }
  // Diesel-electric locomotive with freight/passenger cars (1930s on).
  B["diesel-train"] = () => {
    const g = new THREE.Group();
    g.add(mesh(box(0.105, 0.09, 0.3), C.steel(0xc8a020, "dsl"), 0, 0.085, 0.3));
    g.add(mesh(box(0.1, 0.03, 0.06), C.glass(), 0, 0.11, 0.42));
    g.add(mesh(box(0.11, 0.012, 0.31), C.steel(0x2a2d33, "dslr"), 0, 0.135, 0.3));
    for (const z of [0.25, 0.32]) g.add(mesh(cyl(0.015, 0.015, 0.01, 10), C.iron(), 0, 0.145, z));
    g.add(mesh(new THREE.SphereGeometry(0.01, 6, 5), C.glow(), 0, 0.09, 0.455));
    for (let i = 0; i < 3; i++) g.add(mesh(box(0.11, 0.008, 0.008), C.paint(0x1a1a1a, "dstripe"), 0, 0.05 + i * 0.012, 0.3));
    for (const dz of [-0.1, 0.1]) { g.add(mesh(box(0.09, 0.02, 0.08), C.iron(), 0, 0.03, 0.3 + dz)); for (const s of [-1, 1]) for (const d2 of [-0.025, 0, 0.025]) g.add(mesh(cyl(0.02, 0.02, 0.01, 12), C.iron(), s * 0.048, 0.02, 0.3 + dz + d2, 0, 0, Math.PI / 2)); }
    railCar(g, 0.0, 0x6a2a1a, "box1", 0.26); railCar(g, -0.28, 0x2a4a6a, "box2", 0.26); railCar(g, -0.48, 0x4a4a4a, "tank", 0.12);
    return g;
  };
  // Electric high-speed train (1964 on): streamlined power car, pantograph, articulated coaches.
  B["electric-train"] = () => {
    const g = new THREE.Group();
    const prof = [];
    for (let i = 0; i <= 24; i++) { const u = i / 24; prof.push(new THREE.Vector2(0.05 * Math.sqrt(Math.max(0.02, 1 - Math.pow(Math.max(0, u - 0.4) / 0.6, 2))), u * 0.2)); }
    const nose = mesh(new THREE.LatheGeometry(prof, 20), C.white(), 0, 0.08, 0.28, Math.PI / 2, 0, 0); nose.scale.set(1, 1, 0.8); g.add(nose);
    g.add(mesh(box(0.1, 0.08, 0.2), C.white(), 0, 0.08, 0.18));
    g.add(mesh(box(0.102, 0.012, 0.6), C.paint(0x1d5fb4, "hsr"), 0, 0.065, -0.05));
    g.add(mesh(box(0.06, 0.02, 0.05), C.glass(), 0, 0.105, 0.37, -0.5, 0, 0));
    for (let k = 0; k < 2; k++) railCar(g, -0.06 - k * 0.22, 0xe8eef4, "hsc" + k, 0.2, 0xcfd6de);
    g.add(mesh(box(0.004, 0.06, 0.004), C.iron(), 0, 0.15, 0.12, 0.5, 0, 0)); // pantograph
    g.add(mesh(box(0.05, 0.004, 0.006), C.iron(), 0, 0.18, 0.1));
    g.add(mesh(new THREE.SphereGeometry(0.008, 6, 5), C.glow(), 0, 0.06, 0.44));
    return g;
  };
  // Piston-engined airliner (1930s-1950s): straight wing, four propellers, twin tail.
  B["prop-airliner"] = () => {
    const g = new THREE.Group();
    const prof = [];
    for (let i = 0; i <= 32; i++) { const u = i / 32; const r = 0.04 * (u < 0.3 ? 0.25 + 0.75 * Math.pow(u / 0.3, 0.6) : u > 0.88 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.88) / 0.12, 2))) : 1); prof.push(new THREE.Vector2(Math.max(0.002, r), -0.5 + u * 0.95)); }
    g.add(mesh(new THREE.LatheGeometry(prof, 24), mat("propsilver", 0xc8ccd2, { metalness: 0.6, roughness: 0.35 }), 0, 0, 0, Math.PI / 2, 0, 0));
    g.add(mesh(box(0.082, 0.005, 0.55), C.glass(), 0, 0.018, 0.0));
    g.add(mesh(box(0.084, 0.008, 0.75), C.paint(0xc8102e, "propc"), 0, 0.0, 0.02));
    g.add(mesh(box(1.0, 0.012, 0.13), mat("propsilver", 0xc8ccd2, { metalness: 0.6, roughness: 0.35 }), 0, -0.012, 0.05));
    for (const x of [-0.32, -0.16, 0.16, 0.32]) {
      g.add(mesh(cyl(0.018, 0.015, 0.1, 12), mat("propeng", 0x8a9098, { metalness: 0.6, roughness: 0.35 }), x, -0.01, 0.13, Math.PI / 2, 0, 0));
      g.add(mesh(new THREE.ConeGeometry(0.01, 0.02, 8), C.iron(), x, -0.01, 0.19, Math.PI / 2, 0, 0));
      for (let b = 0; b < 3; b++) g.add(mesh(box(0.006, 0.07, 0.003), mat("propblade", 0x1a1a1a, { roughness: 0.6 }), x, -0.01, 0.185, 0, 0, b * Math.PI * 2 / 3));
    }
    g.add(mesh(box(0.34, 0.008, 0.08), mat("propsilver", 0xc8ccd2, { metalness: 0.6, roughness: 0.35 }), 0, 0.01, -0.44));
    for (const sd of [-1, 1]) g.add(mesh(box(0.006, 0.09, 0.07), C.paint(0xc8102e, "propc"), sd * 0.17, 0.05, -0.45));
    return g;
  };
  // v2.3 air layer. Wright Flyer (1903): canard biplane, muslin wings, twin pusher propellers, twin rudders, launch skids.
  B["wright-flyer"] = () => {
    const g = new THREE.Group();
    const muslin = mat("muslin", 0xe9dfc4, { side: THREE.DoubleSide, roughness: 0.95, emissive: 0x14110a });
    const spruce = mat("spruce", 0xb08850, { roughness: 0.8, emissive: 0x100a04 });
    for (const y of [0.05, 0.21]) g.add(mesh(box(1.0, 0.006, 0.15), muslin, 0, y, 0));
    for (const x of [-0.46, -0.31, -0.16, 0.16, 0.31, 0.46]) for (const z of [-0.065, 0.065]) g.add(mesh(cyl(0.003, 0.003, 0.16, 5), spruce, x, 0.13, z));
    for (const sd of [-1, 1]) { // outriggers to the front elevator and the rear rudders
      g.add(mesh(box(0.006, 0.006, 0.34), spruce, sd * 0.05, 0.06, 0.24));
      g.add(mesh(box(0.006, 0.006, 0.26), spruce, sd * 0.05, 0.14, -0.2));
      g.add(mesh(box(0.008, 0.008, 0.62), spruce, sd * 0.1, 0.004, 0.08)); // launch skids
    }
    for (const y of [0.08, 0.13]) g.add(mesh(box(0.3, 0.005, 0.06), muslin, 0, y, 0.4)); // canard elevator
    for (const sd of [-1, 1]) g.add(mesh(box(0.005, 0.13, 0.06), muslin, sd * 0.035, 0.13, -0.33)); // twin rudders
    g.add(mesh(box(0.07, 0.05, 0.06), C.iron(), 0.07, 0.08, -0.01)); // engine
    g.add(mesh(box(0.11, 0.02, 0.05), mat("wpilot", 0x3a3026, { roughness: 0.9 }), -0.06, 0.065, 0.0)); // pilot lying prone
    for (const sd of [-1, 1]) { // pusher propellers behind the wings, chain-driven
      g.add(mesh(cyl(0.008, 0.008, 0.02, 8), spruce, sd * 0.2, 0.13, -0.085, Math.PI / 2, 0, 0));
      for (let b = 0; b < 2; b++) g.add(mesh(box(0.012, 0.2, 0.004), spruce, sd * 0.2, 0.13, -0.095, 0, 0, b * Math.PI / 2 + 0.4 * sd));
    }
    return g;
  };
  // Douglas DC-3 / C-47: polished twin-engined airliner, tapered wing, single fin, tail-dragger.
  B["dc-3"] = () => {
    const g = new THREE.Group();
    const al = mat("dc3al", 0xd2d6dc, { metalness: 0.65, roughness: 0.3 });
    const prof = [];
    for (let i = 0; i <= 32; i++) { const u = i / 32; const r = 0.048 * (u < 0.35 ? 0.18 + 0.82 * Math.pow(u / 0.35, 0.55) : u > 0.86 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.86) / 0.14, 2))) * 0.95 + 0.05 : 1); prof.push(new THREE.Vector2(Math.max(0.002, r), -0.5 + u * 0.98)); }
    g.add(mesh(new THREE.LatheGeometry(prof, 24), al, 0, 0.06, 0, Math.PI / 2, 0, 0));
    g.add(mesh(box(0.097, 0.012, 0.62), C.paint(0x1c4f9c, "dc3"), 0, 0.064, 0.0)); // cheat line
    g.add(mesh(box(0.092, 0.006, 0.5), C.glass(), 0, 0.078, 0.02)); // window band
    const wing = new THREE.Shape();
    wing.moveTo(0, 0.13); wing.lineTo(0.52, 0.06); wing.lineTo(0.52, -0.01); wing.lineTo(0, -0.07); wing.closePath();
    const wg = new THREE.ExtrudeGeometry(wing, { depth: 0.014, bevelEnabled: false });
    for (const s of [-1, 1]) {
      const w = mesh(wg, al, 0, 0.03, 0.08, Math.PI / 2, 0, 0); w.scale.x = s; g.add(w);
      g.add(mesh(cyl(0.03, 0.026, 0.16, 16), al, s * 0.17, 0.03, 0.15, Math.PI / 2, 0, 0)); // nacelle
      g.add(mesh(cyl(0.031, 0.031, 0.02, 16), mat("cowl", 0x2b2f36, { metalness: 0.5, roughness: 0.4 }), s * 0.17, 0.03, 0.235, Math.PI / 2, 0, 0));
      g.add(mesh(new THREE.ConeGeometry(0.012, 0.03, 10), al, s * 0.17, 0.03, 0.255, Math.PI / 2, 0, 0)); // spinner
      for (let b = 0; b < 3; b++) g.add(mesh(box(0.008, 0.11, 0.004), mat("propblade", 0x1a1a1a, { roughness: 0.6 }), s * 0.17, 0.03, 0.25, 0, 0, b * Math.PI * 2 / 3));
      g.add(mesh(cyl(0.012, 0.012, 0.01, 10), C.iron(), s * 0.17, 0.006, 0.12, 0, 0, Math.PI / 2)); // main wheel
      const t = mesh(wg, al, 0, 0.07, -0.42, Math.PI / 2, 0, 0); t.scale.set(s * 0.36, 0.36, 1); g.add(t);
    }
    const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(0.16, 0); fin.lineTo(0.12, 0.15); fin.lineTo(0.05, 0.15); fin.closePath();
    g.add(mesh(new THREE.ExtrudeGeometry(fin, { depth: 0.008, bevelEnabled: false }), C.paint(0x1c4f9c, "dc3"), -0.004, 0.09, -0.32, 0, -Math.PI / 2, 0));
    g.add(mesh(cyl(0.006, 0.006, 0.006, 8), C.iron(), 0, 0.012, -0.44, 0, 0, Math.PI / 2)); // tail wheel
    return g;
  };
  // Boeing 747: four-engined wide-body with the upper-deck hump, swept wing and tall fin.
  B["boeing-747"] = () => {
    const g = new THREE.Group();
    const wh = mat("b747", 0xe6e9ee, { metalness: 0.15, roughness: 0.5 });
    const prof = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40; const r = 0.055 * (u < 0.24 ? Math.pow(u / 0.24, 0.7) * 0.82 + 0.18 * (u / 0.24) : u > 0.88 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.88) / 0.12, 2))) : 1); prof.push(new THREE.Vector2(Math.max(0.002, r), -0.5 + u * 1.0)); }
    g.add(mesh(new THREE.LatheGeometry(prof, 28), wh, 0, 0.07, 0, Math.PI / 2, 0, 0));
    const hump = mesh(new THREE.SphereGeometry(0.05, 20, 12), wh, 0, 0.115, 0.3); hump.scale.set(0.82, 0.7, 3.0); g.add(hump); // upper deck
    g.add(mesh(box(0.112, 0.01, 0.74), C.paint(0x1d5fb4, "b747s"), 0, 0.068, 0.0)); // cheat line
    g.add(mesh(box(0.11, 0.005, 0.66), C.glass(), 0, 0.086, 0.0));
    g.add(mesh(box(0.06, 0.005, 0.2), C.glass(), 0, 0.142, 0.3)); // upper-deck windows
    const wing = new THREE.Shape();
    wing.moveTo(0, 0.16); wing.lineTo(0.5, -0.14); wing.lineTo(0.5, -0.2); wing.lineTo(0, -0.1); wing.closePath();
    const wg = new THREE.ExtrudeGeometry(wing, { depth: 0.014, bevelEnabled: false });
    for (const s of [-1, 1]) {
      const w = mesh(wg, wh, 0, 0.03, 0.03, Math.PI / 2, 0, 0); w.scale.x = s; g.add(w);
      for (const x of [0.17, 0.3]) {
        g.add(mesh(cyl(0.026, 0.021, 0.13, 20), mat("nacelle", 0xdfe5ec, { metalness: 0.5, roughness: 0.3 }), s * x, 0.0, 0.1 - x * 0.55, Math.PI / 2, 0, 0));
        g.add(mesh(cyl(0.021, 0.021, 0.004, 20), mat("intake", 0x202428, { metalness: 0.6, roughness: 0.4 }), s * x, 0.0, 0.167 - x * 0.55, Math.PI / 2, 0, 0));
        g.add(mesh(box(0.006, 0.03, 0.06), wh, s * x, 0.02, 0.08 - x * 0.55));
      }
      const t = mesh(wg, wh, 0, 0.08, -0.38, Math.PI / 2, 0, 0); t.scale.set(s * 0.4, 0.4, 1); g.add(t);
    }
    const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(0.18, 0); fin.lineTo(0.23, 0.22); fin.lineTo(0.15, 0.22); fin.closePath();
    g.add(mesh(new THREE.ExtrudeGeometry(fin, { depth: 0.01, bevelEnabled: false }), C.paint(0x1d5fb4, "b747s"), -0.005, 0.1, -0.3, 0, -Math.PI / 2, 0));
    g.add(mesh(new THREE.SphereGeometry(0.008, 6, 5), mat("navR", 0xff3030, { emissive: 0xff2020, emissiveIntensity: 2 }), -0.5, 0.03, -0.17));
    g.add(mesh(new THREE.SphereGeometry(0.008, 6, 5), mat("navG", 0x30ff60, { emissive: 0x20ff50, emissiveIntensity: 2 }), 0.5, 0.03, -0.17));
    return g;
  };
  // Satellite: bus with gold foil, two solar wings, dish antenna (decorative space layer).
  B["satellite"] = () => {
    const g = new THREE.Group();
    g.add(mesh(box(0.16, 0.16, 0.22), mat("foil", 0xd9a03a, { metalness: 0.9, roughness: 0.3, emissive: 0x201000 }), 0, 0.08, 0));
    const panel = mat("solar", 0x1a2a5a, { metalness: 0.4, roughness: 0.3, emissive: 0x050a20 });
    for (const sd of [-1, 1]) {
      g.add(mesh(cyl(0.006, 0.006, 0.1, 6), C.iron(), sd * 0.13, 0.08, 0, 0, 0, Math.PI / 2));
      g.add(mesh(box(0.34, 0.006, 0.16), panel, sd * 0.35, 0.08, 0));
      for (let i = 1; i < 4; i++) g.add(mesh(box(0.004, 0.008, 0.16), C.iron(), sd * (0.18 + i * 0.085), 0.08, 0));
    }
    g.add(mesh(new THREE.SphereGeometry(0.06, 14, 8, 0, Math.PI * 2, 0, Math.PI / 3), C.white(), 0, 0.17, 0.12, -Math.PI / 2, 0, 0));
    g.add(mesh(cyl(0.004, 0.004, 0.06, 5), C.iron(), 0, 0.17, 0.14, Math.PI / 2, 0, 0));
    return g;
  };
  // Pipeline: a section of insulated pipe on supports, with welded joints and the flow pulse riding inside.
  B["pipeline-flow"] = () => {
    const g = new THREE.Group();
    const pm = mat("pipe", 0xb8bcc2, { metalness: 0.55, roughness: 0.4 });
    g.add(mesh(cyl(0.05, 0.05, 1.0, 20), pm, 0, 0.12, 0, Math.PI / 2, 0, 0));
    for (let i = 0; i < 6; i++) g.add(mesh(cyl(0.056, 0.056, 0.02, 20), C.iron(), 0, 0.12, -0.42 + i * 0.17, Math.PI / 2, 0, 0));
    for (let i = 0; i < 5; i++) { const z = -0.34 + i * 0.17; for (const sd of [-1, 1]) g.add(mesh(box(0.012, 0.08, 0.012), C.iron(), sd * 0.05, 0.04, z)); g.add(mesh(box(0.13, 0.012, 0.02), C.iron(), 0, 0.075, z)); }
    g.add(mesh(new THREE.SphereGeometry(0.07, 14, 10), mat("pulse", 0xff7ab8, { emissive: 0xff4fa0, emissiveIntensity: 1.6, roughness: 0.3 }), 0, 0.12, 0.1));
    const halo = mesh(new THREE.SphereGeometry(0.14, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff7ab8, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }), 0, 0.12, 0.1);
    g.add(halo);
    return g;
  };

  const SINK = { longship: 0.04, barge: 0.035, trireme: 0.045, 'roman-merchant': 0.06, galley: 0.045, cog: 0.075, dhow: 0.055, junk: 0.07, galleon: 0.07, 'east-indiaman': 0.07, frigate: 0.07, steamship: 0.05, 'container-ship': 0.045, 'treasure-ship': 0.075, 'canal-boat': 0.02 };
  // Standing rigging: shrouds to the rails, forestay to the bow, backstay to the stern (thin lines).
  const RIGGED = new Set(["treasure-ship", "trireme", "roman-merchant", "galley", "cog", "dhow", "junk", "galleon", "east-indiaman", "frigate", "steamship", "longship", "barge"]);
  function rig(tpl) {
    let h = null;
    tpl.traverse((m) => { if (m.userData && m.userData.hull && !h) h = m.userData.hull; });
    if (!h) return;
    const masts = [];
    tpl.children.forEach((m) => {
      const p = m.geometry && m.geometry.parameters;
      if (!m.isMesh || !(m.geometry instanceof THREE.CylinderGeometry) || !p || p.height < 0.2) return;
      if (Math.abs(m.rotation.z) > 0.01 || Math.abs(m.rotation.x) > 0.3) return;
      masts.push({ x: m.position.x, z: m.position.z, top: m.position.y + p.height / 2 * Math.cos(m.rotation.x), lean: Math.sin(m.rotation.x) * p.height / 2 });
    });
    if (!masts.length) return;
    const v = [], deckY = h.D * 0.15, half = h.B / 2 * 0.92;
    masts.forEach((m, i) => {
      const tz = m.z - m.lean;
      for (const sd of [-1, 1]) for (const dz of [-0.06, -0.02, 0.02]) v.push(m.x, m.top * 0.93, tz, sd * half, deckY, m.z + dz);
      if (i === 0 || masts.length === 1) v.push(m.x, m.top * 0.97, tz, 0, deckY + 0.02, h.L / 2 * 0.98);
      v.push(m.x, m.top * 0.97, tz, 0, deckY + 0.03, -h.L / 2 * 0.92);
      if (i > 0) v.push(m.x, m.top * 0.9, tz, masts[i - 1].x, masts[i - 1].top * 0.6, masts[i - 1].z);
    });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    tpl.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x1b140d, transparent: true, opacity: 0.85 })));
  }
  function build(id) {
    const fallback = !B[id];
    if (fallback) { console.warn("SeaVehicles: no model for", id, "- using placeholder"); id = "cog"; }
    if (!cache.has(id)) {
      const tpl = B[id]();
      if (RIGGED.has(id)) rig(tpl);
      // center on length, keel at y=0
      const bb = new THREE.Box3().setFromObject(tpl);
      const len = Math.max(bb.max.z - bb.min.z, 0.01);
      const wrap = new THREE.Group();
      // Sea vehicles sit in the water: about a third of the hull depth below the surface.
      const sink = SINK[id] != null ? SINK[id] : 0;
      tpl.position.set(0, -bb.min.y - sink, -(bb.max.z + bb.min.z) / 2);
      wrap.add(tpl);
      wrap.scale.setScalar(1 / len);
      const outer = new THREE.Group();
      outer.add(wrap);
      cache.set(id, outer);
    }
    const o = cache.get(id).clone();
    o.userData.vehicle = id; o.userData.fallback = fallback;
    return o;
  }

  // Radius (as a fraction of the sphere radius) of the faceted THREE.SphereGeometry(r, W, H) surface along unit
  // direction (x, y, z) in the globe mesh's local frame. globe.gl draws the Earth as such a sphere (4° cells by
  // default), whose flat triangles sit up to ~0.12 % of the radius inside the true sphere: enough to leave a ship
  // hanging above the water at close range. Vehicles and wakes are placed on this surface, not on the ideal sphere.
  function facetScale(x, y, z, W, H) {
    const th = Math.acos(Math.max(-1, Math.min(1, y)));
    let ph = Math.atan2(z, -x); if (ph < 0) ph += 2 * Math.PI;
    const iy0 = Math.min(H - 1, Math.max(0, Math.floor(th / Math.PI * H)));
    const ix0 = Math.floor(ph / (2 * Math.PI) * W);
    const vtx = (i, j) => { const p = i / W * 2 * Math.PI, t = j / H * Math.PI; return [-Math.cos(p) * Math.sin(t), Math.cos(t), Math.sin(p) * Math.sin(t)]; };
    const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    const dir = [x, y, z];
    let best = null, bestErr = Infinity;
    // the computed cell first, then its neighbours (the flat facets bend the cell borders slightly)
    for (const [dy, dx] of [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      const iy = iy0 + dy; if (iy < 0 || iy > H - 1) continue;
      const ix = ((ix0 + dx) % W + W) % W;
      const a = vtx(ix + 1, iy), b = vtx(ix, iy), c = vtx(ix, iy + 1), d = vtx(ix + 1, iy + 1);
      const tris = []; if (iy !== 0) tris.push([a, b, d]); if (iy !== H - 1) tris.push([b, c, d]);
      for (const [p0, p1, p2] of tris) {
        const n = cross(sub(p1, p0), sub(p2, p0)), dn = dot(n, dir);
        if (Math.abs(dn) < 1e-12) continue;
        const t = dot(n, p0) / dn; if (!(t > 0)) continue;
        const q = [dir[0] * t, dir[1] * t, dir[2] * t];
        // how far q lies outside the triangle (0 = inside): worst signed edge distance
        let err = 0;
        for (const [u, v] of [[p0, p1], [p1, p2], [p2, p0]]) err = Math.max(err, -dot(cross(sub(v, u), sub(q, u)), n));
        if (err <= 1e-14) return t;
        if (err < bestErr) { bestErr = err; best = t; }
      }
    }
    return best == null ? 1 : best;
  }

  root.SeaVehicles = { build, facetScale, SINK, ids: Object.keys(B) };
})(typeof window !== "undefined" ? window : globalThis);
