"""Count shipped admin-1 states against the Natural Earth 1:10m source index.

The nine 1:50m packs are skipped. Great Britain is dissolved by geonunit into
four constituent countries; that is not a shortfall. Provinces missing from
the source itself are reported as source gaps, not pack failures.
"""
from __future__ import annotations

import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ADMIN = ROOT / "web" / "data" / "regions" / "admin1"
INDEX = Path(__file__).with_name("admin1_source_index.json")

# Units that belong in an admin-1 set but are absent from Natural Earth 1:10m.
# Vietnam's three provinces appear only as Natural Earth regional rows.
SOURCE_GAPS = {
    "HRV": ["Croatia HR-11 (Požeško-slavonska)"],
    "VNM": ["Bắc Kạn, Hưng Yên and Đồng Nai, which appear only as Natural Earth regional rows"],
}
# Source rows we drop rather than relabel (second HR-12; near-zero SI-054).
DROPPED = {"HRV": 1, "SVN": 1}

def load_js(path: Path):
    t = path.read_text(encoding="utf-8")
    return json.loads(re.search(r"= (\{.*\});\s*$", t, re.S).group(1))

def pack_counts():
    out = {}
    rest = ADMIN / "rest.js"
    if rest.exists():
        for a3, v in load_js(rest)["countries"].items():
            out[a3] = len(v["states"])
    for p in ADMIN.glob("*.js"):
        if p.name == "rest.js":
            continue
        out[p.stem] = len(load_js(p)["states"])
    return out

def main():
    src = json.loads(INDEX.read_text())
    packs = pack_counts()
    short = []
    ok = 0
    for a3, n_src in src["counts"].items():
        if a3 == "GBR":
            n_pack = packs.get("GBR")
            g = src["gbr"]
            if n_pack != g["pack"]:
                short.append(f"GBR: dissolved pack has {n_pack} states, expected {g['pack']} (source {g['source']} rows by {g['dissolved_by']})")
            else:
                ok += 1
            continue
        n_pack = packs.get(a3)
        expect = n_src - DROPPED.get(a3, 0)
        if n_pack is None:
            short.append(f"{a3}: no pack (source {n_src})")
        elif n_pack < expect:
            short.append(f"{a3}: pack {n_pack} < source {expect}")
        else:
            ok += 1
    print(f"admin-1 source counts: {ok} countries match, {len(short)} short")
    for a3, names in SOURCE_GAPS.items():
        print(f"source gap {a3}: " + "; ".join(names))
    if short:
        print("SHORTFALLS:")
        for line in short:
            print(" ", line)
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
