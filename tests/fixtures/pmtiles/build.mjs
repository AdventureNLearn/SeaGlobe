// Build tiny PMTiles v3 fixtures for CI. No network. Not the production archives.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const dir = path.dirname(fileURLToPath(import.meta.url));

function rotate(n, x, y, rx, ry) {
  if (ry === 0) {
    if (rx !== 0) { x = n - 1 - x; y = n - 1 - y; }
    const t = x; x = y; y = t;
  }
  return [x, y];
}
function zxyToTileId(z, x, y) {
  let acc = ((1 << (z * 2)) - 1) / 3;
  let a = z - 1;
  while (a >= 0) {
    const s = 1 << a;
    const rx = s & x, ry = s & y;
    acc += ((3 * rx) ^ ry) << a;
    const r = rotate(s, x, y, rx, ry); x = r[0]; y = r[1];
    a -= 1;
  }
  return acc;
}
function writeVarint(n) {
  const out = [];
  let v = n;
  while (v >= 0x80) { out.push((v & 0x7f) | 0x80); v = Math.floor(v / 128); }
  out.push(v);
  return Buffer.from(out);
}
function lonLatToTile(z, lon, lat) {
  const n = 1 << z;
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return [Math.max(0, Math.min(n - 1, x)), Math.max(0, Math.min(n - 1, y))];
}

function encodeMvt(layerName, props, z, x, y) {
  // One polygon covering most of the tile so the tile centre (and our test point) is inside.
  const extent = 4096;
  const ring = [[256, 256], [3840, 256], [3840, 3840], [256, 3840], [256, 256]];
  // MVT geometry: MoveTo 1, LineTo 3 more, ClosePath. Coords are zig-zag relative in tile units.
  function sint(n) { return n >= 0 ? n * 2 : -n * 2 - 1; }
  const cmds = [];
  let px = 0, py = 0;
  cmds.push((1 << 3) | 1); // MoveTo 1
  cmds.push(sint(ring[0][0] - px), sint(ring[0][1] - py));
  px = ring[0][0]; py = ring[0][1];
  cmds.push((3 << 3) | 2); // LineTo 3
  for (let i = 1; i <= 3; i++) {
    cmds.push(sint(ring[i][0] - px), sint(ring[i][1] - py));
    px = ring[i][0]; py = ring[i][1];
  }
  cmds.push((1 << 3) | 7); // ClosePath
  const geom = Buffer.concat(cmds.map(writeVarint));

  function keyMsg(s) { const b = Buffer.from(s, "utf8"); return Buffer.concat([writeVarint((3 << 3) | 2), writeVarint(b.length), b]); }
  function strVal(s) {
    const b = Buffer.from(s, "utf8");
    const inner = Buffer.concat([writeVarint((1 << 3) | 2), writeVarint(b.length), b]);
    return Buffer.concat([writeVarint((4 << 3) | 2), writeVarint(inner.length), inner]);
  }
  const keys = Object.keys(props);
  const keyBufs = keys.map(keyMsg);
  const valBufs = keys.map((k) => strVal(String(props[k])));
  const tags = [];
  keys.forEach((_, i) => { tags.push(i, i); });
  const tagPacked = Buffer.concat(tags.map(writeVarint));
  const featParts = [
    writeVarint((1 << 3) | 0), writeVarint(1), // id
    writeVarint((2 << 3) | 2), writeVarint(tagPacked.length), tagPacked,
    writeVarint((3 << 3) | 0), writeVarint(3), // Polygon
    writeVarint((4 << 3) | 2), writeVarint(geom.length), geom
  ];
  const feature = Buffer.concat(featParts);
  const nameB = Buffer.from(layerName, "utf8");
  const layer = Buffer.concat([
    writeVarint((15 << 3) | 0), writeVarint(2), // version
    writeVarint((1 << 3) | 2), writeVarint(nameB.length), nameB,
    writeVarint((5 << 3) | 0), writeVarint(extent),
    ...keyBufs,
    ...valBufs,
    writeVarint((2 << 3) | 2), writeVarint(feature.length), feature
  ]);
  return Buffer.concat([writeVarint((3 << 3) | 2), writeVarint(layer.length), layer]);
}

function writeDirectory(entries) {
  // entries: {tileId, offset, length, runLength} sorted by tileId, clustered
  const n = entries.length;
  const parts = [writeVarint(n)];
  let last = 0;
  for (const e of entries) { parts.push(writeVarint(e.tileId - last)); last = e.tileId; }
  for (const e of entries) parts.push(writeVarint(e.runLength));
  for (const e of entries) parts.push(writeVarint(e.length));
  for (let i = 0; i < n; i++) {
    const e = entries[i];
    if (i > 0 && e.offset === entries[i - 1].offset + entries[i - 1].length) parts.push(writeVarint(0));
    else parts.push(writeVarint(e.offset + 1));
  }
  return Buffer.concat(parts);
}

function writePmtiles(outPath, tiles, meta) {
  // tiles: [{z,x,y,bytes}]
  tiles = tiles.slice().sort((a, b) => zxyToTileId(a.z, a.x, a.y) - zxyToTileId(b.z, b.x, b.y));
  const entries = [];
  const dataParts = [];
  let off = 0;
  for (const t of tiles) {
    entries.push({ tileId: zxyToTileId(t.z, t.x, t.y), offset: off, length: t.bytes.length, runLength: 1 });
    dataParts.push(t.bytes);
    off += t.bytes.length;
  }
  const tileData = Buffer.concat(dataParts);
  const dir = writeDirectory(entries);
  const metadata = Buffer.from(JSON.stringify(meta || {}), "utf8");
  const header = Buffer.alloc(127);
  header.write("PMTiles", 0, "ascii");
  header[7] = 3;
  function u64(pos, v) {
    header.writeUInt32LE(v >>> 0, pos);
    header.writeUInt32LE(Math.floor(v / 4294967296), pos + 4);
  }
  function i32(pos, v) { header.writeInt32LE(v, pos); }
  const rootOffset = 127, rootLength = dir.length;
  const metaOffset = rootOffset + rootLength, metaLength = metadata.length;
  const dataOffset = metaOffset + metaLength, dataLength = tileData.length;
  u64(8, rootOffset); u64(16, rootLength);
  u64(24, metaOffset); u64(32, metaLength);
  u64(40, 0); u64(48, 0); // no leaf directory
  u64(56, dataOffset); u64(64, dataLength);
  u64(72, tiles.length); u64(80, tiles.length); u64(88, tiles.length);
  header[96] = 1; // clustered
  header[97] = 1; // internal compression none
  header[98] = 1; // tile compression none
  header[99] = meta.tileType || 1;
  const zs = tiles.map((t) => t.z);
  header[100] = Math.min(...zs);
  header[101] = Math.max(...zs);
  i32(102, -1800000000); i32(106, 150000000); i32(110, 1800000000); i32(114, 720000000);
  header[118] = header[100];
  i32(119, -850000000); i32(123, 400000000);
  fs.writeFileSync(outPath, Buffer.concat([header, dir, metadata, tileData]));
}

const MI = { lon: -85.67, lat: 42.96 };
const CO = { lon: -106.3, lat: 39.1 }; // Rockies-ish

function tilesFor(layer, props, minZ, maxZ, pt) {
  const out = [];
  for (let z = minZ; z <= maxZ; z++) {
    const [x, y] = lonLatToTile(z, pt.lon, pt.lat);
    out.push({ z, x, y, bytes: encodeMvt(layer, props, z, x, y) });
  }
  return out;
}

writePmtiles(path.join(dir, "census-state-2026.pmtiles"),
  tilesFor("state", { GEOID: "26", NAME: "Michigan", layer: "state" }, 0, 10, MI),
  { tileType: 1, attribution: "U.S. Census Bureau, TIGER/Line 2026" });
writePmtiles(path.join(dir, "census-county-2026.pmtiles"),
  tilesFor("county", { GEOID: "26081", NAME: "Kent", layer: "county" }, 3, 10, MI),
  { tileType: 1, attribution: "U.S. Census Bureau, TIGER/Line 2026" });
writePmtiles(path.join(dir, "census-cousub-2026.pmtiles"),
  tilesFor("cousub", { GEOID: "2608164978", NAME: "Grand Rapids", layer: "cousub" }, 6, 10, MI),
  { tileType: 1, attribution: "U.S. Census Bureau, TIGER/Line 2026" });
writePmtiles(path.join(dir, "census-place-2026.pmtiles"),
  tilesFor("place", { GEOID: "2634000", NAME: "Grand Rapids", layer: "place" }, 6, 10, MI),
  { tileType: 1, attribution: "U.S. Census Bureau, TIGER/Line 2026" });

// Terrain: a small Terrarium PNG at zooms 0-6 over the Rockies, plus one empty (no-sample) tile.
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return (~c) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const typ = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typ, data])));
  return Buffer.concat([len, typ, data, crc]);
}
function terrariumPng(size, elev) {
  // filter 0 + RGB(A omitted) 8-bit. Use RGB.
  const raw = Buffer.alloc((size * 3 + 1) * size);
  let R = 0, G = 0, B = 0;
  if (elev != null) {
    const v = elev + 32768;
    R = Math.floor(v / 256);
    G = Math.floor(v % 256);
    B = 0;
  } // else black = no sample (-32768)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = R; raw[o + 1] = G; raw[o + 2] = B;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, pngChunk("IHDR", ihdr), pngChunk("IDAT", zlib.deflateSync(raw)), pngChunk("IEND", Buffer.alloc(0))]);
}

const hill = terrariumPng(32, 2000);
const empty = terrariumPng(32, null);
const terrTiles = [];
for (let z = 0; z <= 6; z++) {
  const [x, y] = lonLatToTile(z, CO.lon, CO.lat);
  terrTiles.push({ z, x, y, bytes: hill });
}
// A neighbouring empty tile at z6 so partial coverage is testable
{
  const [x, y] = lonLatToTile(6, CO.lon, CO.lat);
  terrTiles.push({ z: 6, x: x + 1, y, bytes: empty });
}
writePmtiles(path.join(dir, "usgs-3dep-terrain.pmtiles"), terrTiles, { tileType: 2, attribution: "U.S. Geological Survey, 3DEP" });

for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".pmtiles"))) {
  console.log(f, fs.statSync(path.join(dir, f)).size);
}
