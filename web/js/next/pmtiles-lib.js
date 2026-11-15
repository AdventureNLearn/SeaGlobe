/* SeaPmtiles: a small PMTiles v3 reader for classic scripts. Uses HTTP range
   requests against a URL from SeaAssets (the existing asset host, or a local stand-in). */
(function (root) {
  "use strict";

  function u64(dv, o) {
    return dv.getUint32(o, true) + dv.getUint32(o + 4, true) * 4294967296;
  }
  function i32(dv, o) { return dv.getInt32(o, true); }

  function parseHeader(buf) {
    const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
    if (bytes.length < 127) throw new Error("PMTiles header is too short");
    const mag = String.fromCharCode.apply(null, bytes.subarray(0, 7));
    if (mag !== "PMTiles") throw new Error("not a PMTiles archive");
    if (bytes[7] !== 3) throw new Error("unsupported PMTiles version " + bytes[7]);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return {
      version: 3,
      rootOffset: u64(dv, 8), rootLength: u64(dv, 16),
      metadataOffset: u64(dv, 24), metadataLength: u64(dv, 32),
      leafDirectoryOffset: u64(dv, 40), leafDirectoryLength: u64(dv, 48),
      tileDataOffset: u64(dv, 56), tileDataLength: u64(dv, 64),
      addressedTilesCount: u64(dv, 72), tileEntriesCount: u64(dv, 80), tileContentsCount: u64(dv, 88),
      clustered: bytes[96] === 1,
      internalCompression: bytes[97], tileCompression: bytes[98], tileType: bytes[99],
      minZoom: bytes[100], maxZoom: bytes[101],
      minLon: i32(dv, 102) / 1e7, minLat: i32(dv, 106) / 1e7,
      maxLon: i32(dv, 110) / 1e7, maxLat: i32(dv, 114) / 1e7,
      centerZoom: bytes[118], centerLon: i32(dv, 119) / 1e7, centerLat: i32(dv, 123) / 1e7
    };
  }

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

  function readVarint(bytes, st) {
    let shift = 0, result = 0, i;
    do {
      if (st.i >= bytes.length) throw new Error("truncated varint");
      i = bytes[st.i++];
      result += (i & 0x7f) * Math.pow(2, shift);
      shift += 7;
    } while (i & 0x80);
    return result;
  }

  function parseDirectory(buf) {
    const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
    const st = { i: 0 };
    const n = readVarint(bytes, st);
    const entries = new Array(n);
    let last = 0;
    for (let i = 0; i < n; i++) { last += readVarint(bytes, st); entries[i] = { tileId: last, offset: 0, length: 0, runLength: 0 }; }
    for (let i = 0; i < n; i++) entries[i].runLength = readVarint(bytes, st);
    for (let i = 0; i < n; i++) entries[i].length = readVarint(bytes, st);
    for (let i = 0; i < n; i++) {
      const tmp = readVarint(bytes, st);
      entries[i].offset = (i > 0 && tmp === 0) ? entries[i - 1].offset + entries[i - 1].length : tmp - 1;
    }
    return entries;
  }

  function findTile(entries, tileId) {
    let m = 0, n = entries.length - 1;
    while (m <= n) {
      const k = (n + m) >> 1;
      const c = tileId - entries[k].tileId;
      if (c > 0) m = k + 1;
      else if (c < 0) n = k - 1;
      else return entries[k];
    }
    if (n >= 0) {
      if (entries[n].runLength === 0) return entries[n];
      if (tileId - entries[n].tileId < entries[n].runLength) return entries[n];
    }
    return null;
  }

  function isGzip(buf) {
    const b = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
    return b.length >= 2 && b[0] === 0x1f && b[1] === 0x8b;
  }
  function gunzip(buf) {
    if (typeof DecompressionStream !== "function") return Promise.reject(new Error("gzip is not available"));
    return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
  }
  function maybeGunzip(buf) { return isGzip(buf) ? gunzip(buf) : Promise.resolve(buf); }

  function HttpArchive(url, opts) {
    this.url = url;
    this._opts = opts || {};
    this._header = null;
    this._dir = new Map();
    this._meta = null;
  }
  HttpArchive.prototype._range = async function (offset, length, signal) {
    const sig = signal || this._opts.signal;
    const r = await fetch(this.url, { headers: { Range: "bytes=" + offset + "-" + (offset + length - 1) }, signal: sig, credentials: "omit", cache: "force-cache" });
    if (!r.ok && r.status !== 206 && r.status !== 200) throw new Error("PMTiles range " + r.status);
    return r.arrayBuffer();
  };
  HttpArchive.prototype.header = async function (signal) {
    if (this._header) return this._header;
    this._header = parseHeader(await this._range(0, 127, signal));
    return this._header;
  };
  HttpArchive.prototype._directory = async function (offset, length, signal) {
    const k = offset + ":" + length;
    if (this._dir.has(k)) return this._dir.get(k);
    const h = await this.header(signal);
    let buf = await this._range(offset, length, signal);
    if (h.internalCompression === 2 || isGzip(buf)) buf = await gunzip(buf);
    const entries = parseDirectory(buf);
    this._dir.set(k, entries);
    return entries;
  };
  HttpArchive.prototype.metadata = async function (signal) {
    if (this._meta) return this._meta;
    const h = await this.header(signal);
    let buf = await this._range(h.metadataOffset, h.metadataLength, signal);
    if (h.internalCompression === 2 || isGzip(buf)) buf = await gunzip(buf);
    this._meta = JSON.parse(new TextDecoder().decode(buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf));
    return this._meta;
  };
  HttpArchive.prototype.get = async function (z, x, y, signal) {
    const tileId = zxyToTileId(z, x, y);
    const h = await this.header(signal);
    let off = h.rootOffset, len = h.rootLength;
    for (let depth = 0; depth < 4; depth++) {
      const entries = await this._directory(off, len, signal);
      const hit = findTile(entries, tileId);
      if (!hit) return null;
      if (hit.runLength === 0) { off = h.leafDirectoryOffset + hit.offset; len = hit.length; continue; }
      return this._range(h.tileDataOffset + hit.offset, hit.length, signal);
    }
    return null;
  };
  HttpArchive.prototype.getDecoded = async function (z, x, y, signal) {
    const raw = await this.get(z, x, y, signal);
    if (!raw) return null;
    const h = await this.header(signal);
    if (h.tileCompression === 2 || isGzip(raw)) return gunzip(raw);
    return raw;
  };

  // Probe a URL: true if the first 127 bytes are a v3 PMTiles header.
  async function probe(url, signal) {
    try {
      const r = await fetch(url, { headers: { Range: "bytes=0-126" }, signal: signal, credentials: "omit", cache: "no-cache" });
      if (!r.ok && r.status !== 206) return false;
      parseHeader(await r.arrayBuffer());
      return true;
    } catch (e) { return false; }
  }

  const cache = new Map();
  function open(url) {
    if (!url) return null;
    if (!cache.has(url)) cache.set(url, new HttpArchive(url));
    return cache.get(url);
  }

  root.SeaPmtiles = {
    COMPRESSION: { UNKNOWN: 0, NONE: 1, GZIP: 2, BROTLI: 3, ZSTD: 4 },
    TILE_TYPE: { UNKNOWN: 0, MVT: 1, PNG: 2, JPEG: 3, WEBP: 4 },
    parseHeader: parseHeader, parseDirectory: parseDirectory, findTile: findTile,
    zxyToTileId: zxyToTileId, gunzip: gunzip, isGzip: isGzip, maybeGunzip: maybeGunzip,
    HttpArchive: HttpArchive, open: open, probe: probe, clear: function () { cache.clear(); }
  };
})(window);
