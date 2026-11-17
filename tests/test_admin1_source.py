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

# Units that belong in an admin-1 set but are absent as province geometries
# from Natural Earth 1:10m. Vietnam's three provinces appear only as regional
# rows that reuse those ISO codes; those rows are the regions, not the provinces.
SOURCE_GAPS = {
    "VNM": ["Bắc Kạn, Hưng Yên and Đồng Nai, which appear only as Natural Earth regional rows"],
}
# Source rows we drop rather than relabel (near-zero SI-054).
# Croatia's second HR-12 row is kept as HR-11 when the same row proves that identity.
DROPPED = {"SVN": 1}

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

def _box_shape(x, y, s=0.2):
    ring = [[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]]
    class Shape:
        __geo_interface__ = {"type": "Polygon", "coordinates": [ring]}
    return Shape()


def load_build():
    import importlib.util
    spec = importlib.util.spec_from_file_location("build_admin1", ROOT / "tools" / "build_admin1.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_features_for_relabels_hr11():
    """A rebuild must relabel the proven HRV-1604 row and must not crash at GBR merge."""
    b = load_build()
    if b.union_of([]) is not None:
        return "union_of([]) should return None (GBR merge must not raise)"
    real_hr12 = {
        "name": "Brodsko-Posavska", "iso_3166_2": "HR-12", "adm1_code": "HRV-1602",
        "type_en": "County", "postal": "SP", "fips": "HR02",
        "name_en": "Brod-Posavina", "wikidataid": "Q58129",
        "_shape": _box_shape(17.2, 45.1),
    }
    # Same identifying fields as Natural Earth 1:10m row HRV-1604, including
    # the mojibake woe_label stored in the source dbf.
    proven = {
        "name": "Brodsko-Posavska", "iso_3166_2": "HR-12", "adm1_code": "HRV-1604",
        "type_en": "County", "postal": "SP", "fips": "HR11", "gns_adm1": "HR11",
        "name_en": "Požega-Slavonia", "wikidataid": "Q58111", "hasc_maybe": "HR.PS",
        "woe_label": "PoÅ¾eÅ¡ko-slavonska, HR, Croatia",
        "_shape": _box_shape(17.3, 45.3),
    }
    recs = b.features_for("HRV", [real_hr12, proven])
    by_iso = {r.get("iso"): r for r in recs}
    if "HR-11" not in by_iso or "HR-12" not in by_iso:
        return "features_for did not keep both HR-11 and HR-12: " + ",".join(sorted(by_iso))
    if by_iso["HR-11"].get("name") != "Požeško-slavonska":
        return "HR-11 name " + repr(by_iso["HR-11"].get("name"))
    if by_iso["HR-11"].get("id") != "state-hr-11":
        return "HR-11 id " + repr(by_iso["HR-11"].get("id"))
    if by_iso["HR-11"].get("_meta", {}).get("postal") != "PS":
        return "HR-11 postal " + repr(by_iso["HR-11"].get("_meta"))
    if by_iso["HR-12"].get("name") != "Brodsko-Posavska":
        return "HR-12 name " + repr(by_iso["HR-12"].get("name"))
    return None


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
    hrv = next((s for s in load_js(ADMIN / "HRV.js")["states"] if s.get("iso") == "HR-11"), None)
    if not hrv or hrv.get("name") != "Požeško-slavonska":
        short.append("HRV: missing proven HR-11 (Požeško-slavonska)")
    rebuild = test_features_for_relabels_hr11()
    if rebuild:
        short.append("rebuild: " + rebuild)
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
