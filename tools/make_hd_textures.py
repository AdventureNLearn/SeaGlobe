#!/usr/bin/env python3
"""Make the HD globe textures from NASA public-domain imagery.

Inputs (download once, keep outside the repo; see DATA.md section 8):
  world.topo.bathy.200404.3x21600x10800.jpg  (Blue Marble Next Generation, April, topo + bathy)
  BlackMarble_2012_3km.jpg                    (Black Marble 2012 night lights)
  ne_50m_land/ne_50m_land.shp                 (Natural Earth 1:50m land, public domain; water mask)
Outputs (web/textures/hd/):
  earth-day-8k.jpg, earth-day-2k.jpg, earth-night-4k.jpg, earth-water-4k.png
Usage: python3 tools/make_hd_textures.py <folder-with-inputs>
"""
import sys
from pathlib import Path

import struct

from PIL import Image, ImageDraw, ImageFilter

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web" / "textures" / "hd"


def read_rings(path):
    """Minimal ESRI shapefile polygon reader (shape type 5), standard library only."""
    data = Path(path).read_bytes()
    pos = 100
    while pos < len(data):
        _, length = struct.unpack(">ii", data[pos:pos + 8])
        rec = data[pos + 8: pos + 8 + length * 2]
        pos += 8 + length * 2
        if struct.unpack("<i", rec[:4])[0] != 5:
            continue
        nparts, npts = struct.unpack("<ii", rec[36:44])
        parts = list(struct.unpack("<%di" % nparts, rec[44:44 + 4 * nparts])) + [npts]
        off = 44 + 4 * nparts
        pts = struct.unpack("<%dd" % (2 * npts), rec[off:off + 16 * npts])
        for a, b in zip(parts[:-1], parts[1:]):
            yield [(pts[2 * i], pts[2 * i + 1]) for i in range(a, b)]


def main():
    src = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    day = Image.open(src / "world.topo.bathy.200404.3x21600x10800.jpg").convert("RGB")
    d8 = day.resize((8192, 4096), Image.LANCZOS)
    d8.save(OUT / "earth-day-8k.jpg", quality=86, optimize=True, progressive=True)
    d8.resize((2048, 1024), Image.LANCZOS).save(OUT / "earth-day-2k.jpg", quality=82, optimize=True)
    d4 = d8.resize((4096, 2048), Image.LANCZOS)
    water = Image.new("L", (4096, 2048), 255)
    draw = ImageDraw.Draw(water)
    for ring in read_rings(src / "ne_50m_land" / "ne_50m_land.shp"):
        draw.polygon([((x + 180) / 360 * 4096, (90 - y) / 180 * 2048) for x, y in ring], fill=0)
    water.filter(ImageFilter.GaussianBlur(1.0)).save(OUT / "earth-water-4k.png", optimize=True)
    night = Image.open(src / "BlackMarble_2012_3km.jpg").convert("RGB").resize((4096, 2048), Image.LANCZOS)
    night.save(OUT / "earth-night-4k.jpg", quality=84, optimize=True)
    for f in sorted(OUT.iterdir()):
        print(f.name, f.stat().st_size)


if __name__ == "__main__":
    main()
