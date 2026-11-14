// v1.1 screenshots: three moments in different eras with vehicles mid-voyage (1600x900).
// node tools/shots.mjs   (needs Chrome + puppeteer-core)
import path from "node:path";
import { startServer, launch, openApp, frame, root } from "./browser.mjs";
const shots = [
  { file: "v1.1-0060-classical.png", q: "t=0060-05-10&pov=34,22,1.25", sel: "v.route.id==='roman-alexandria-ostia-grain'" },
  { file: "v1.1-1405-medieval.png", q: "t=1405-04-20&pov=12,95,1.9", sel: "v.route.family==='ming-treasure-fleets'" },
  { file: "v1.1-1595-age-of-sail-follow.png", q: "t=1595-09-20&pov=-20,40,1.9", sel: "v.route.id==='das-amsterdam-1595'", follow: [3.2, 0.4, 0, 0.7] },
  { file: "v1.1-1870-industrial.png", q: "t=1870-03-01&pov=25,40,1.6", sel: "v.route.id==='suez-steam-bombay'" },
  { file: "v2-sampler-idle.png", q: "idle=1&pov=18,30,2.3", n: 75 },
  { file: "v2-focus-era-medieval.png", q: "t=1320-05-01&pov=28,50,2.3", pre: ["window.__sg.focus({ era: 'medieval' })"] },
  { file: "v2-focus-rail-1916.png", q: "t=1916-06-01&pov=48,60,2.6", pre: ["window.__sg.focus({ type: 'rail' })"] },
  { file: "v2-ships-log.png", q: "t=1320-05-01&pov=30,40,2.3", pre: ["window.__sg.log(true)", "window.__sg.logSet('q', 'grain')"], post: ["window.__sg.logOpen(1)"], n2: 75 },
  { file: "v2.1-detail-galleon-1700.png", q: "t=1700-05-01&pov=15,-150,1.6", sel: "v.route.id==='manila-galleon-outbound'", follow: [1.4, 0.35, 0, 0.65] },
  { file: "v2.1-detail-containers-1985.png", q: "t=1985-06-01&pov=30,90,1.6", sel: "v.route.id==='shanghai-rotterdam-containers'", follow: [1.5, 0.33, 0, 0.6] },
  { file: "v1.1-1985-modern-follow.png", q: "t=1985-06-01&pov=30,-170,1.6", sel: "v.route.id==='transpacific-containers'", follow: [2.6, 0.34, 0, 0.6] },
];
const port = 8600 + Math.floor(Math.random() * 90);
const server = await startServer(port);
const browser = await launch(1600, 900);
try {
  for (const s of shots) {
    const p = await openApp(browser, port, "capture=1&play=1&speed=1&" + s.q);
    for (const c of s.pre || []) await p.evaluate(c);
    const h = s.sel ? await p.evaluate((code) => window.__sg.find(new Function("v", "return " + code)), s.sel) : null;
    if (h) await p.evaluate((k) => window.__sg.select(k), h.key);
    if (s.follow) await p.evaluate((f) => window.__sg.follow(true, ...f), s.follow);
    for (let i = 0; i < (s.n || (s.follow ? 90 : 20)); i++) await p.evaluate(() => window.__sg.advance(1 / 30));
    for (const c of s.post || []) await p.evaluate(c);
    for (let i = 0; i < (s.n2 || 0); i++) await p.evaluate(() => window.__sg.advance(1 / 30));
    await frame(p);
    await p.screenshot({ path: path.join(root, "screens", s.file) });
    console.log(s.file, h && h.key, JSON.stringify(await p.evaluate(() => window.__sg.state())), p._errors);
    await p.close();
  }
} finally { await browser.close(); server.kill(); }
