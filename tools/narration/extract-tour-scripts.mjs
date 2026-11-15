// Build a script list from existing tour titles and nearby name/notes/summary fields.
// Does not call Piper or write audio. Run: node tools/narration/extract-tour-scripts.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const toursSrc = fs.readFileSync(path.join(root, "web/data/tours.js"), "utf8");
const toursMatch = toursSrc.match(/\.tours\s*=\s*(\[[\s\S]*?\]);/);
if (!toursMatch) throw new Error("could not find tours array");
const tours = (new Function("return " + toursMatch[1]))();

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(js|json)$/.test(name)) files.push(p);
  }
  return files;
}
const blob = walk(path.join(root, "web/data")).map((p) => fs.readFileSync(p, "utf8")).join("\n");

function pick(chunk, keys) {
  for (const k of keys) {
    const mm = chunk.match(new RegExp("['\"]?" + k + "['\"]?\\s*:\\s*['\"]([^'\"]{1,800})['\"]"));
    if (mm) return mm[1];
  }
  return "";
}

function excerpt(id) {
  const bare = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
  const esc = bare.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const upper = bare.toUpperCase();
  const patterns = [
    new RegExp("['\"]?id['\"]?\\s*:\\s*['\"]" + esc + "['\"]([\\s\\S]{0,2000})"),
    new RegExp("['\"]jcat['\"]\\s*:\\s*['\"]" + upper + "['\"]([\\s\\S]{0,2000})"),
    new RegExp("['\"]" + upper + "['\"]\\s*:\\s*\\{([\\s\\S]{0,2000})"),
    new RegExp("['\"]" + esc + "['\"]\\s*:\\s*\\{([\\s\\S]{0,2000})")
  ];
  let chunk = "";
  for (const re of patterns) {
    const m = blob.match(re);
    if (m) { chunk = m[1]; break; }
  }
  let title = pick(chunk, ["name", "title", "short", "plname"]);
  let summary = pick(chunk, ["summary", "notes", "desc", "note"]);
  if (/^Artistic impression/i.test(summary)) summary = "";

  if (id === "topic:space") {
    title = title || "Space age: satellites, stations and launch sites (1957–today)";
    summary = summary || "Spacecraft and launch sites from GCAT. Yearly counts of payloads launched and of orbital launch attempts drive the space layer.";
  }
  const parts = [title && (/\.$/.test(title) ? title : title + "."), summary].filter(Boolean);
  const text = parts.join(" ").replace(/\[UNKNOWN\]/g, "unknown").replace(/\s+/g, " ").trim();
  return text || ("[UNKNOWN — use encyclopedia text of " + id + " at record time]");
}

const scripts = tours.map((t) => ({
  id: t.id,
  title: t.title,
  voice: null,
  rate: 1.0,
  stops: (t.stops || []).map((entry, i) => ({
    stop: i + 1,
    of: t.stops.length,
    entry,
    script: excerpt(entry),
    src: null
  }))
}));

const manifest = {
  comment: "Scripts extracted from existing tour stop ids and nearby title, name, notes or summary fields. No audio generated. voice is null until the owner picks one.",
  version: "scaffold",
  voice: null,
  voiceLicence: "[UNKNOWN — no voice picked]",
  rate: 1.0,
  timeStretch: false,
  tours: scripts,
  clips: scripts.flatMap((t) => t.stops.map((s) => ({
    id: t.id + ":" + s.stop,
    tour: t.id,
    stop: s.stop,
    entry: s.entry,
    script: s.script,
    src: null,
    bytes: null,
    sha256: null,
    durationSec: null
  })))
};
const out = path.join(root, "tools/narration/tours.scripts.json");
fs.writeFileSync(out, JSON.stringify(manifest, null, 1) + "\n");
console.log("wrote", path.relative(root, out), manifest.clips.length, "stops");
for (const c of manifest.clips) console.log(" -", c.id, c.script.slice(0, 110));
const unknown = manifest.clips.filter((c) => c.script.startsWith("[UNKNOWN"));
if (unknown.length) console.log("unknown", unknown.length, unknown.map((c) => c.entry).join(", "));
