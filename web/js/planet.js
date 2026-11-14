/* Planet dressing: day/night earth shader with ocean shine, starfield, moon,
   and a decorative satellite layer for the space age. All procedural or local files. */
(function (root) {
  const THREE = root.SEAGLOBE_THREE;

  function earthMaterial(tex) {
    const u = {
      dayMap: { value: tex.day }, nightMap: { value: tex.night }, waterMap: { value: tex.water },
      hasNight: { value: tex.night ? 1 : 0 }, hasWater: { value: tex.water ? 1 : 0 },
      sunDir: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
      nightAmount: { value: 0 }, exposure: { value: 1.05 }, time: { value: 0 },
    };
    const m = new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: `
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main() {
          vUv = uv;
          vN = normalize(mat3(modelMatrix) * normal);
          vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: `
        uniform sampler2D dayMap; uniform sampler2D nightMap; uniform sampler2D waterMap;
        uniform float hasNight; uniform float hasWater; uniform vec3 sunDir; uniform float nightAmount; uniform float exposure; uniform float time;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main() {
          vec3 N = normalize(vN); vec3 L = normalize(sunDir); vec3 V = normalize(cameraPosition - vW);
          float ndl = dot(N, L);
          float day = smoothstep(-0.12, 0.28, ndl);
          vec3 col = texture2D(dayMap, vUv).rgb;
          col = pow(col, vec3(0.95));
          float water = hasWater > 0.5 ? texture2D(waterMap, vUv).r : 0.0;
          vec3 lit = col * (0.05 + 1.1 * max(ndl, 0.0) * day + 0.06);
          // ocean shine
          vec3 H = normalize(L + V);
          // small moving swell normals for sparkle (procedural, water only)
          vec3 q = vW * 2.2;
          vec3 wv = vec3(sin(q.x + time * 0.9) + sin(q.z * 1.7 - time * 1.3), sin(q.y * 1.3 + time * 1.1) + sin(q.x * 2.3 + time * 0.6), sin(q.z + time * 0.8) + sin(q.y * 1.9 - time));
          float near = clamp(1.0 - length(cameraPosition - vW) / 40.0, 0.0, 1.0);
          vec3 Nw = normalize(N + water * 0.035 * near * wv);
          float spec = pow(max(dot(Nw, H), 0.0), 90.0) * water * day * 1.4 + pow(max(dot(N, H), 0.0), 60.0) * water * day * 0.5;
          float glint = pow(max(dot(N, H), 0.0), 18.0) * water * day * 0.05;
          lit += vec3(1.0, 0.93, 0.8) * (spec * 0.35 + glint * 0.6);
          // night side
          vec3 nightCol = col * 0.035 + vec3(0.004, 0.008, 0.02);
          if (hasNight > 0.5) {
            vec3 lights = texture2D(nightMap, vUv).rgb;
            lights = pow(lights, vec3(1.6)) * vec3(1.0, 0.78, 0.5) * 2.2;
            nightCol += lights * vec3(1.15, 0.95, 0.7) * nightAmount * 1.8 * (1.0 - water * 0.8);
          }
          vec3 c = mix(nightCol, lit, day);
          // twilight band and limb haze
          float tw = exp(-pow(ndl * 8.0, 2.0)) * 0.07;
          c += vec3(0.9, 0.42, 0.18) * tw * (1.0 - water * 0.3);
          float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          c += vec3(0.22, 0.5, 1.0) * rim * (0.06 + 0.28 * day);
          gl_FragColor = vec4(c * exposure, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    return m;
  }

  function starfield(n, radius) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let seed = 7;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) {
      // bias a share of stars toward a tilted galactic band
      let x, y, z;
      const u = r() * 2 - 1, th = r() * Math.PI * 2;
      const band = r() < 0.45;
      const s = Math.sqrt(1 - u * u);
      x = s * Math.cos(th); y = band ? u * 0.18 : u; z = s * Math.sin(th);
      const l = Math.hypot(x, y, z);
      const v = new THREE.Vector3(x / l, y / l, z / l).applyAxisAngle(new THREE.Vector3(1, 0, 0.3).normalize(), 1.05);
      pos.set([v.x * radius, v.y * radius, v.z * radius], i * 3);
      const b = 0.35 + Math.pow(r(), 3) * 0.9, t = r();
      col.set([b * (t < 0.2 ? 0.8 : 1), b * 0.95, b * (t > 0.8 ? 0.75 : 1.05)], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const m = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false });
    const p = new THREE.Points(g, m);
    p.frustumCulled = false;
    return p;
  }

  function moonTexture(size) {
    const c = document.createElement("canvas");
    c.width = size; c.height = size / 2;
    const x = c.getContext("2d");
    x.fillStyle = "#8d8a86"; x.fillRect(0, 0, c.width, c.height);
    let seed = 11;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // maria
    for (let i = 0; i < 14; i++) {
      const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, "rgba(60,60,64,0.55)"); g.addColorStop(1, "rgba(60,60,64,0)");
      x.save(); x.translate(r() * c.width, c.height * (0.25 + r() * 0.5)); x.scale(c.width * (0.05 + r() * 0.08), c.height * (0.06 + r() * 0.1));
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, Math.PI * 2); x.fill(); x.restore();
    }
    // craters
    for (let i = 0; i < 900; i++) {
      const cx = r() * c.width, cy = r() * c.height, rad = Math.pow(r(), 3) * size * 0.02 + 1;
      x.strokeStyle = "rgba(235,235,230," + (0.12 + r() * 0.2) + ")"; x.lineWidth = Math.max(1, rad * 0.25);
      x.beginPath(); x.arc(cx, cy, rad, Math.PI * 0.9, Math.PI * 1.9); x.stroke();
      x.strokeStyle = "rgba(30,30,32," + (0.15 + r() * 0.2) + ")";
      x.beginPath(); x.arc(cx, cy, rad, Math.PI * 1.9, Math.PI * 2.9); x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function moon(lite) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(27, 48, 32),
      new THREE.MeshStandardMaterial({ map: moonTexture(lite ? 512 : 2048), roughness: 1, metalness: 0, emissive: 0x111114 }));
    return m;
  }

  // Decorative satellites: count ramps from 0 in 1957 to ~max by the present.
  function satellites(max) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(max * 3), col = new Float32Array(max * 3);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const orbits = [];
    let seed = 3;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < max; i++) {
      const kind = r();
      const radius = kind < 0.75 ? 100 * (1.06 + r() * 0.12) : kind < 0.9 ? 100 * (1.45 + r() * 0.5) : 100 * 2.4;
      const inc = kind >= 0.9 ? 0 : (r() < 0.4 ? 1.5 + r() * 0.2 : r() * 1.2);
      orbits.push({ radius, inc, raan: r() * Math.PI * 2, phase: r() * Math.PI * 2, speed: 0.6 * Math.pow(100 / radius, 1.5) * (0.8 + r() * 0.4) });
      const c = kind < 0.75 ? [0.7, 0.9, 1] : kind < 0.9 ? [1, 0.85, 0.5] : [0.6, 1, 0.8];
      col.set(c, i * 3);
    }
    const m = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
    const p = new THREE.Points(g, m);
    p.frustumCulled = false;
    p.userData.update = (time, count) => {
      count = Math.max(0, Math.min(max, Math.floor(count)));
      for (let i = 0; i < count; i++) {
        const o = orbits[i], a = o.phase + time * o.speed;
        let x = Math.cos(a) * o.radius, y = 0, z = Math.sin(a) * o.radius;
        const y2 = y * Math.cos(o.inc) - z * Math.sin(o.inc), z2 = y * Math.sin(o.inc) + z * Math.cos(o.inc);
        const x3 = x * Math.cos(o.raan) + z2 * Math.sin(o.raan), z3 = -x * Math.sin(o.raan) + z2 * Math.cos(o.raan);
        pos[i * 3] = x3; pos[i * 3 + 1] = y2; pos[i * 3 + 2] = z3;
      }
      g.setDrawRange(0, count);
      g.attributes.position.needsUpdate = true;
    };
    return p;
  }

  function satelliteCount(year, max) {
    if (year < 1957.75) return 0;
    const f = Math.min(1, (year - 1957.75) / (2026 - 1957.75));
    return Math.max(1, Math.round(max * Math.pow(f, 1.6)));
  }

  function glowTexture(size, stops) {
    const c = document.createElement("canvas"); c.width = c.height = size;
    const x = c.getContext("2d"); const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  // The sun: a bright disc and glow far away along the light direction, with a lens flare (three.js example add-on).
  function sun() {
    const group = new THREE.Group();
    const disc = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(256, [[0, "rgba(255,255,255,1)"], [0.12, "rgba(255,250,235,1)"], [0.25, "rgba(255,220,160,0.55)"], [0.6, "rgba(255,170,90,0.12)"], [1, "rgba(255,150,60,0)"]]),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    disc.scale.setScalar(480);
    group.add(disc);
    const A = root.SEAGLOBE_THREE_ADDONS;
    if (A && A.Lensflare) {
      const lf = new A.Lensflare();
      const ring = glowTexture(128, [[0, "rgba(255,255,255,0)"], [0.75, "rgba(255,255,255,0)"], [0.85, "rgba(180,220,255,0.5)"], [1, "rgba(180,220,255,0)"]]);
      const dot = glowTexture(128, [[0, "rgba(255,255,255,0.9)"], [0.4, "rgba(255,230,190,0.25)"], [1, "rgba(255,200,150,0)"]]);
      lf.addElement(new A.LensflareElement(dot, 220, 0, new THREE.Color(0xfff0d0)));
      lf.addElement(new A.LensflareElement(dot, 50, 0.6, new THREE.Color(0x2a2214)));
      lf.addElement(new A.LensflareElement(dot, 90, 0.85, new THREE.Color(0x101a2a)));
      group.add(lf);
      group.userData.lf = lf;
    }
    const v = new THREE.Vector3(), f = new THREE.Vector3();
    return { group, place: (dir, cam) => {
      group.position.copy(dir).multiplyScalar(9000);
      const lf = group.userData.lf; if (!lf || !cam) return;
      // hide the flare when the sun is behind the camera or behind the Earth (three's Lensflare does not check this)
      v.copy(group.position).sub(cam.position);
      cam.getWorldDirection(f);
      const ahead = v.dot(f) > 0;
      const len = v.length(); v.divideScalar(len);
      const tc = -cam.position.dot(v);
      const closest = tc > 0 && tc < len ? f.copy(cam.position).addScaledVector(v, tc).length() : Infinity;
      const hidden = !ahead || closest < 101;
      lf.visible = !hidden; disc.visible = closest >= 100.5;
    } };
  }

  root.SeaPlanet = { sun, earthMaterial, starfield, moon, satellites, satelliteCount };
})(typeof window !== "undefined" ? window : globalThis);
