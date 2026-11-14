#!/usr/bin/env python3
"""Rasterize Natural Earth 110m land to a local equirectangular PNG.

No remote textures. Ocean is a dark navy to match the cinematic glass theme.
Made with Natural Earth (public domain).
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
GEOJSON = ROOT / "web" / "data" / "ne_110m_land.geojson"
OUT = ROOT / "web" / "textures" / "earth-navy.png"
WIDTH, HEIGHT = 2048, 1024


def xy(lon, lat):
    x = (float(lon) + 180.0) / 360.0 * WIDTH
    y = (90.0 - float(lat)) / 180.0 * HEIGHT
    return x, y


def rings_of(geom):
    t = geom["type"]
    coords = geom["coordinates"]
    if t == "Polygon":
        return [coords]
    if t == "MultiPolygon":
        return coords
    return []


def main():
    data = json.loads(GEOJSON.read_text(encoding="utf-8"))
    ocean = (6, 11, 24, 255)
    land = (18, 32, 70, 255)
    img = Image.new("RGBA", (WIDTH, HEIGHT), ocean)
    draw = ImageDraw.Draw(img)
    for feat in data["features"]:
        for poly in rings_of(feat["geometry"]):
            if not poly:
                continue
            exterior = [xy(lon, lat) for lon, lat in poly[0]]
            if len(exterior) >= 3:
                draw.polygon(exterior, fill=land)
            for hole in poly[1:]:
                pts = [xy(lon, lat) for lon, lat in hole]
                if len(pts) >= 3:
                    draw.polygon(pts, fill=ocean)
    # Soften jagged 110m edges slightly
    img = img.filter(ImageFilter.SMOOTH)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
