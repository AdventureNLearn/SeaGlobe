/* SeaMvt: decode Mapbox Vector Tiles (MVT / PBF) into GeoJSON-like features.
   Only polygons are kept (Census boundary tiles). Properties are UTF-8. */
(function (root) {
  "use strict";

  function readVarint(b, st) {
    let shift = 0, result = 0, i, bytes = 0;
    do {
      if (st.i >= b.length) throw new Error("truncated varint");
      i = b[st.i++];
      result += (i & 0x7f) * Math.pow(2, shift);
      shift += 7; bytes++;
    } while (i & 0x80);
    return result;
  }
  function readSint(b, st) {
    const n = readVarint(b, st);
    return (n % 2 === 0) ? n / 2 : -(n + 1) / 2;
  }
  function skip(b, st, wire) {
    if (wire === 0) readVarint(b, st);
    else if (wire === 1) st.i += 8;
    else if (wire === 5) st.i += 4;
    else if (wire === 2) { const n = readVarint(b, st); st.i += n; }
    else throw new Error("unknown wire " + wire);
  }
  function readLen(b, st) {
    const n = readVarint(b, st);
    const s = st.i; st.i += n;
    return b.subarray(s, st.i);
  }
  function decodeString(bytes) { return new TextDecoder("utf-8").decode(bytes); }

  function decodeValue(bytes) {
    const st = { i: 0 };
    let val = null;
    while (st.i < bytes.length) {
      const key = readVarint(bytes, st), field = key >> 3, wire = key & 7;
      if (field === 1 && wire === 2) val = decodeString(readLen(bytes, st));
      else if (field === 2 && wire === 5) { val = new DataView(bytes.buffer, bytes.byteOffset + st.i, 4).getFloat32(0, true); st.i += 4; }
      else if (field === 3 && wire === 1) { val = new DataView(bytes.buffer, bytes.byteOffset + st.i, 8).getFloat64(0, true); st.i += 8; }
      else if (field === 4 && wire === 0) val = readVarint(bytes, st);
      else if (field === 5 && wire === 0) val = readVarint(bytes, st);
      else if (field === 6 && wire === 0) val = readSint(bytes, st);
      else if (field === 7 && wire === 0) val = !!readVarint(bytes, st);
      else skip(bytes, st, wire);
    }
    return val;
  }

  function decodeGeometry(cmds, extent, z, x, y) {
    // MVT commands: MoveTo=1, LineTo=2, ClosePath=7. Coords are zig-zag relative.
    const st = { i: 0 };
    let px = 0, py = 0;
    const rings = [];
    let ring = null;
    while (st.i < cmds.length) {
      const cmd = cmds[st.i++];
      const id = cmd & 7, count = cmd >>> 3;
      if (id === 1) {
        if (ring && ring.length) rings.push(ring);
        ring = [];
        for (let i = 0; i < count; i++) {
          px += readSintFromList(cmds, st); py += readSintFromList(cmds, st);
          ring.push(tileToLonLat(z, x, y, px, py, extent));
        }
      } else if (id === 2) {
        if (!ring) ring = [];
        for (let i = 0; i < count; i++) {
          px += readSintFromList(cmds, st); py += readSintFromList(cmds, st);
          ring.push(tileToLonLat(z, x, y, px, py, extent));
        }
      } else if (id === 7) {
        if (ring && ring.length) {
          const a = ring[0], b = ring[ring.length - 1];
          if (a[0] !== b[0] || a[1] !== b[1]) ring.push([a[0], a[1]]);
          rings.push(ring); ring = null;
        }
      }
    }
    if (ring && ring.length) rings.push(ring);
    return rings;
  }
  function readSintFromList(cmds, st) {
    const n = cmds[st.i++];
    return (n % 2 === 0) ? n / 2 : -(n + 1) / 2;
  }
  function tileToLonLat(z, x, y, px, py, extent) {
    const n = Math.pow(2, z);
    const lon = ((x + px / extent) / n) * 360 - 180;
    const mer = Math.PI * (1 - 2 * (y + py / extent) / n);
    const lat = Math.atan(Math.sinh(mer)) * 180 / Math.PI;
    return [lon, lat];
  }

  // Rings → MultiPolygon coordinates. First ring is the exterior; later rings
  // with opposite winding are holes of that polygon; a same-winding ring starts a new polygon.
  function ringsToMulti(rings) {
    const polys = [];
    let cur = null;
    const area = (r) => {
      let a = 0;
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1];
      return a / 2;
    };
    for (const r of rings) {
      if (!r || r.length < 3) continue;
      const a = area(r);
      if (!cur || a * area(cur[0]) > 0) { cur = [r]; polys.push(cur); }
      else cur.push(r);
    }
    return polys;
  }

  function decodeLayer(bytes, z, x, y) {
    const st = { i: 0 };
    let name = "", extent = 4096, version = 1;
    const keys = [], values = [], features = [];
    const featureBufs = [];
    while (st.i < bytes.length) {
      const key = readVarint(bytes, st), field = key >> 3, wire = key & 7;
      if (field === 15 && wire === 0) version = readVarint(bytes, st);
      else if (field === 1 && wire === 2) name = decodeString(readLen(bytes, st));
      else if (field === 5 && wire === 0) extent = readVarint(bytes, st);
      else if (field === 3 && wire === 2) keys.push(decodeString(readLen(bytes, st)));
      else if (field === 4 && wire === 2) values.push(decodeValue(readLen(bytes, st)));
      else if (field === 2 && wire === 2) featureBufs.push(readLen(bytes, st));
      else skip(bytes, st, wire);
    }
    for (const fb of featureBufs) {
      const fs = { i: 0 };
      let id = null, type = 0, tags = [], geom = [];
      while (fs.i < fb.length) {
        const key = readVarint(fb, fs), field = key >> 3, wire = key & 7;
        if (field === 1 && wire === 0) id = readVarint(fb, fs);
        else if (field === 2 && wire === 0) {
          // packed repeated uint32 tags
          // actually tags can be packed (wire 2) or repeated varint (wire 0)
          tags.push(readVarint(fb, fs));
        } else if (field === 2 && wire === 2) {
          const packed = readLen(fb, fs), ps = { i: 0 };
          while (ps.i < packed.length) tags.push(readVarint(packed, ps));
        } else if (field === 3 && wire === 0) type = readVarint(fb, fs);
        else if (field === 4 && wire === 2) {
          const packed = readLen(fb, fs), ps = { i: 0 };
          while (ps.i < packed.length) geom.push(readVarint(packed, ps));
        } else if (field === 4 && wire === 0) geom.push(readVarint(fb, fs));
        else skip(fb, fs, wire);
      }
      if (type !== 3) continue; // Polygon only
      const props = {};
      for (let i = 0; i + 1 < tags.length; i += 2) {
        const k = keys[tags[i]], v = values[tags[i + 1]];
        if (k != null) props[k] = v;
      }
      const rings = decodeGeometry(geom, extent, z, x, y);
      const coords = ringsToMulti(rings);
      if (!coords.length) continue;
      features.push({ type: "Feature", id: id, properties: props, geometry: { type: "MultiPolygon", coordinates: coords } });
    }
    return { name: name, extent: extent, version: version, features: features };
  }

  function decode(buf, z, x, y) {
    const b = buf instanceof ArrayBuffer ? new Uint8Array(buf) : (buf instanceof Uint8Array ? buf : new Uint8Array(buf));
    const st = { i: 0 };
    const layers = {};
    while (st.i < b.length) {
      const key = readVarint(b, st), field = key >> 3, wire = key & 7;
      if (field === 3 && wire === 2) {
        const layer = decodeLayer(readLen(b, st), z, x, y);
        layers[layer.name || "default"] = layer;
      } else skip(b, st, wire);
    }
    return layers;
  }

  function features(buf, z, x, y) {
    const layers = decode(buf, z, x, y);
    const out = [];
    Object.keys(layers).forEach((n) => layers[n].features.forEach((f) => out.push(f)));
    return out;
  }

  root.SeaMvt = { decode: decode, features: features, tileToLonLat: tileToLonLat };
})(window);
