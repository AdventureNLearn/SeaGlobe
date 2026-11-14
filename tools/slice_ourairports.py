#!/usr/bin/env python3
"""Slice OurAirports airports.csv (public domain) down to what SeaGlobe's air layer uses.

Keeps every `large_airport` row (the major hubs) plus the extra fields named in
air_corridors.FIELDS (historic or smaller airfields the corridors pass through).
Writes data/sources/ourairports/airports-slice.csv. Nothing is fetched at runtime;
this runs once at build time on a downloaded copy of airports.csv.

Usage: python tools/slice_ourairports.py <path to downloaded airports.csv>
Source: https://davidmegginson.github.io/ourairports-data/airports.csv
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "sources" / "ourairports" / "airports-slice.csv"
COLS = ["ident", "type", "name", "latitude_deg", "longitude_deg", "iso_country", "municipality", "iata_code"]


def main(src: str) -> None:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from air_corridors import FIELDS
    rows = list(csv.DictReader(open(src, encoding="utf-8")))
    want = set(FIELDS)
    keep = [r for r in rows if r["type"] == "large_airport" or r["ident"] in want]
    missing = want - {r["ident"] for r in keep}
    if missing:
        raise SystemExit(f"not in airports.csv: {sorted(missing)}")
    keep.sort(key=lambda r: r["ident"])
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(COLS)
        for r in keep:
            w.writerow([r[c] for c in COLS])
    print(f"wrote {OUT.relative_to(ROOT)}: {len(keep)} rows ({sum(r['type'] == 'large_airport' for r in keep)} large_airport)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
