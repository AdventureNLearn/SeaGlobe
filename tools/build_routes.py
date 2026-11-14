#!/usr/bin/env python3
"""Build the per-type route files the app loads: web/data/routes/<type>.json + .js.

Input: web/data/routes.json (from tools/build_data.py) and hand-typed voyage
facts from published history. No NC/SA/ND/ODbL data is read or bundled.
Output today: one route type, "sea". Every record carries type, era, start_date,
end_date, goods, source and a schedule that says how ships are timed:
  - "dated":     real dates from a source record (DAS voyage dates, CLIWOC daily dates)
  - "years":     sailing years from published history, months/pace reconstructed
  - "traffic":   illustrative traffic, reconstructed timing (no specific voyage)
Also writes web/data/wind.js and web/data/texture.js so the page works as a
static site, from file://, or as one inlined HTML file. Invents no positions.
"""
from __future__ import annotations

import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
DATA = WEB / "data"

GENERAL = "general history of the trade; not from a cargo manifest"

# route id -> (era band, line, vehicle, goods, schedule)
SEA = {
    "venetian-alexandria-muda": ("medieval", "venetian", "galley",
        ["spices", "silk", "cotton", "silver and cloth (outbound)"],
        {"kind": "traffic", "label": "Venetian merchant galley", "speed_km_day": 95, "active": 3, "both_directions": True, "convoy": 2}),
    "venetian-constantinople": ("medieval", "venetian", "galley",
        ["silk", "alum", "grain", "spices"],
        {"kind": "traffic", "label": "Venetian merchant galley", "speed_km_day": 95, "active": 2, "both_directions": True}),
    "venetian-flanders-galleys": ("medieval", "venetian", "galley",
        ["spices", "sweet wine (outbound)", "wool and cloth (return)"],
        {"kind": "traffic", "label": "Venetian Flanders galley", "speed_km_day": 90, "active": 2, "both_directions": True, "convoy": 3}),
    "genoese-black-sea": ("medieval", "genoese", "cog",
        ["grain", "furs", "silk", "alum", "enslaved people"],
        {"kind": "traffic", "label": "Genoese round ship", "speed_km_day": 80, "active": 2, "both_directions": True}),
    "genoese-trebizond": ("medieval", "genoese", "cog",
        ["silk", "spices", "alum"],
        {"kind": "traffic", "label": "Genoese round ship", "speed_km_day": 80, "active": 1, "both_directions": True}),
    "hanseatic-baltic-trunk": ("medieval", "hanseatic", "cog",
        ["grain", "furs", "wax", "timber", "cloth"],
        {"kind": "traffic", "label": "Hanseatic cog", "speed_km_day": 75, "active": 3, "both_directions": True}),
    "hanseatic-bergen": ("medieval", "hanseatic", "cog",
        ["stockfish (dried cod)", "grain (inbound)"],
        {"kind": "traffic", "label": "Hanseatic cog", "speed_km_day": 75, "active": 2, "both_directions": True}),
    "hanseatic-bruges-london": ("medieval", "hanseatic", "cog",
        ["wool", "cloth", "wine"],
        {"kind": "traffic", "label": "Hanseatic cog", "speed_km_day": 75, "active": 2, "both_directions": True}),
    "indian-ocean-aden-calicut-malacca": ("medieval", "indian-ocean", "dhow",
        ["pepper", "spices", "textiles", "horses"],
        {"kind": "traffic", "label": "Monsoon trader (dhow)", "speed_km_day": 120, "active": 3, "both_directions": True}),
    "indian-ocean-east-africa-india": ("medieval", "indian-ocean", "dhow",
        ["gold", "ivory", "textiles", "beads"],
        {"kind": "traffic", "label": "Monsoon trader (dhow)", "speed_km_day": 120, "active": 2, "both_directions": True}),
    "indian-ocean-hormuz-calicut": ("medieval", "indian-ocean", "dhow",
        ["horses", "pearls", "pepper", "textiles"],
        {"kind": "traffic", "label": "Monsoon trader (dhow)", "speed_km_day": 120, "active": 2, "both_directions": True}),
    # Voyage years 1405-07, 1407-09, 1409-11, 1413-15, 1417-19, 1421-22, 1431-33 (Dreyer 2006).
    "zheng-he-trunk": ("medieval", "zheng-he", "treasure-ship",
        ["silk", "porcelain", "tribute gifts"],
        {"kind": "years", "label": "Ming treasure ship", "years": [1405, 1407, 1409, 1413, 1417, 1421, 1431],
         "start_day": 15, "speed_km_day": 60, "convoy": 3,
         "years_source": "Voyage years from Dreyer (2006); months and pace reconstructed"}),
    "zheng-he-west": ("medieval", "zheng-he", "treasure-ship",
        ["silk", "porcelain", "tribute gifts"],
        {"kind": "years", "label": "Ming treasure ship (detached squadron)", "years": [1413, 1417, 1421, 1431],
         "start_day": 200, "speed_km_day": 60, "convoy": 2,
         "years_source": "Voyage years from Dreyer (2006); months and pace reconstructed"}),
    "manila-galleon-outbound": ("age-of-sail", "manila", "galleon",
        ["silver"],
        {"kind": "years", "label": "Manila galleon", "every_year": True, "start_day": 75, "duration_days": 95,
         "years_source": "One sailing a year, the usual pattern in Schurz (1939); dates reconstructed"}),
    "manila-galleon-return": ("age-of-sail", "manila", "galleon",
        ["silk", "porcelain", "spices"],
        {"kind": "years", "label": "Manila galleon", "every_year": True, "start_day": 185, "duration_days": 165,
         "years_source": "One sailing a year, the usual pattern in Schurz (1939); dates reconstructed"}),
}


# Voyage facts from the printed compilation (published history), typed in by hand.
# The online DAS data (Huygens, CC BY-NC-SA 4.0) is NOT bundled or read here.
BGS = ("J. R. Bruijn, F. S. Gaastra and I. Schöffer, Dutch-Asiatic Shipping in the 17th and "
       "18th Centuries, 3 vols. (The Hague: Martinus Nijhoff, 1979-1987)")
DAS_FACTS = {
    "0001.1": {"ship": "Amsterdam", "dep": "1595-04-02", "arr": "1596-06-06"},
    "0002.1": {"ship": "Duifje", "dep": "1595-04-02", "arr": "1596-06-06"},
    "0003.1": {"ship": "Hollandia", "dep": "1595-04-02", "arr": "1596-06-06"},
    "0004.1": {"ship": "Mauritius", "dep": "1595-04-02", "arr": "1596-06-06"},
    "4367.3": {"ship": "Patriot", "dep": "1780-01-04", "cape_arr": "1780-04-16", "cape_dep": "1780-05-15", "arr": "1780-07-22"},
}


def das_rows():
    return {k: {"ship": v["ship"], "voyNumberDAS": k, "url": None,
                "voyDepartureEDTF": v["dep"], "voyArrivalDateEDTF": v["arr"],
                "voyCapeArrivalEDTF": v.get("cape_arr", ""), "voyCapeDepartureEDTF": v.get("cape_dep", "")}
            for k, v in DAS_FACTS.items()}


def nearest_index(path, latlon):
    best, idx = 1e9, None
    for i, p in enumerate(path):
        d = abs(p[0] - latlon[0]) + abs(p[1] - latlon[1])
        if d < best:
            best, idx = d, i
    return idx if best < 0.05 else None


def build():
    legacy = json.loads((DATA / "routes.json").read_text(encoding="utf-8"))
    das = das_rows()
    out = []
    for r in legacy["routes"]:
        rec = {
            "id": r["id"], "type": "sea", "name": r["name"], "line": r["era"], "color": r["color"],
            "start_date": str(r["year_start"]), "end_date": str(r["year_end"]),
            "years_approximate": r["years_approximate"],
            "confidence": r["confidence"], "source": r["source"], "citation": r["citation"],
            "notes": r["notes"], "sample": r["sample"], "partial": r["partial"], "path": r["path"],
            "demo_seed": False, "citation_check": False,
        }
        if r["id"] in SEA:
            era, line, vehicle, goods, sched = SEA[r["id"]]
            rec.update(era=era, line=line, vehicle=vehicle, goods=goods, goods_source=GENERAL, schedule=sched)
        elif r["id"] == "das-amsterdam-1595":
            fleet = [das[k] for k in ("0001.1", "0002.1", "0003.1", "0004.1")]
            rec.update(era="age-of-sail", vehicle="east-indiaman", goods=[],
                       goods_source="[UNKNOWN]: cargo not bundled (the online DAS cargo fields are CC BY-NC-SA)",
                       start_date=fleet[0]["voyDepartureEDTF"], end_date=fleet[0]["voyArrivalDateEDTF"])
            rec["schedule"] = {"kind": "dated", "voyages": [
                {"id": "das-" + v["voyNumberDAS"], "ship": v["ship"], "record": "Voyage " + v["voyNumberDAS"] + " in Bruijn, Gaastra and Schöffer (published)",
                 "url": v["url"], "start": v["voyDepartureEDTF"], "end": v["voyArrivalDateEDTF"],
                 "anchors": [], "lateral_km": (i - 1.5) * 60}
                for i, v in enumerate(fleet)]}
            rec.update(source="published history", citation=BGS + ", voyages 0001.1-0004.1. Dates typed from the published compilation; the online DAS database is not bundled.",
                       notes="Real voyage dates: the first Dutch fleet to the East Indies (Houtman), Texel 1595-04-02 to Enggano 1596-06-06. Track reconstructed along the pre-Brouwer route; not daily positions.")
            rec["notes"] += " The four ships of this first fleet (DAS 0001.1-0004.1) sail together on their recorded dates; the spacing between them is only for visibility."
        elif r["id"] == "das-patriot-1780":
            v = das["4367.3"]
            cape = nearest_index(r["path"], (-34.36, 18.50))
            anchors = []
            if cape is not None and v["voyCapeArrivalEDTF"] and v["voyCapeDepartureEDTF"]:
                anchors = [{"date": v["voyCapeArrivalEDTF"], "index": cape}, {"date": v["voyCapeDepartureEDTF"], "index": cape}]
            rec.update(era="age-of-sail", vehicle="east-indiaman", goods=[],
                       goods_source="[UNKNOWN]: cargo not bundled (the online DAS cargo fields are CC BY-NC-SA)",
                       start_date=v["voyDepartureEDTF"], end_date=v["voyArrivalDateEDTF"])
            rec.update(source="published history", citation=BGS + ", voyage 4367.3. Dates typed from the published compilation; the online DAS database is not bundled.",
                       notes="Real voyage dates: Patriot, Texel 1780-01-04, at the Cape 1780-04-16 to 1780-05-15, Batavia 1780-07-22. Track reconstructed along the Cape / Brouwer route, not daily positions.")
            rec["schedule"] = {"kind": "dated", "voyages": [
                {"id": "das-4367.3", "ship": v["ship"], "record": "Voyage 4367.3 in Bruijn, Gaastra and Schöffer (published)", "url": v["url"],
                 "start": v["voyDepartureEDTF"], "end": v["voyArrivalDateEDTF"], "anchors": anchors, "lateral_km": 0}]}
        elif r["id"] == "cliwoc-launceston-1769":
            dates = r["point_dates"]
            rec.update(era="age-of-sail", vehicle="frigate", goods=[],
                       goods_source="Naval frigate on passage; no trade cargo in the logbook sample",
                       start_date=dates[0][:10], end_date=dates[-1][:10], point_dates=dates)
            rec["schedule"] = {"kind": "dated", "voyages": [
                {"id": "cliwoc-launceston-1769", "ship": "HMS Launceston", "record": "CLIWOC 2.1 cruise file, daily noon positions",
                 "url": "https://doi.org/10.1594/PANGAEA.750354", "start": dates[0], "end": dates[-1],
                 "anchors": [{"date": d, "index": i} for i, d in enumerate(dates)], "lateral_km": 0}]}
        else:
            raise SystemExit("no schedule for " + r["id"])
        out.append(rec)
    doc = {
        "type": "sea",
        "title": "Sea routes (sample)",
        "schema_version": 1,
        "partial_sample": True,
        "notes": legacy["notes"],
        "ports_note": legacy["ports_note"],
        "routes": out,
    }
    return doc


def write_js(name, key, obj, path):
    body = json.dumps(obj, ensure_ascii=False, indent=1)
    path.write_text(
        f"/* Generated by tools/build_routes.py from {name}. Do not edit by hand. */\n"
        f"(window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {{}})[{json.dumps(key)}] = {body};\n",
        encoding="utf-8")


FAMILY_OF_LINE = {
    "venetian": "venice-genoa", "genoese": "venice-genoa", "hanseatic": "hanseatic", "indian-ocean": "indian-ocean",
    "zheng-he": "ming-treasure-fleets", "voc": "voc-eic", "eic": "voc-eic", "manila": "manila-galleon",
    "logbook": "cliwoc-logbooks", "greek": "greek-roman-sea", "roman": "greek-roman-sea", "silk-road": "silk-roads",
    "sahara": "trans-saharan", "steam": "steamships", "rail": "railways", "container": "container-lanes",
    "air": "air", "pipeline": "pipelines",
}
FAMILY_TITLES = {
    "venice-genoa": "Venetian and Genoese lines", "hanseatic": "Hanseatic League", "indian-ocean": "Indian Ocean monsoon routes",
    "ming-treasure-fleets": "Ming treasure fleets", "voc-eic": "VOC and EIC", "manila-galleon": "Manila galleon",
    "cliwoc-logbooks": "CLIWOC logbook tracks", "greek-roman-sea": "Greek and Roman sea lanes", "silk-roads": "Silk Roads",
    "trans-saharan": "Trans-Saharan caravans", "steamships": "Steamship lines", "railways": "Railways",
    "container-lanes": "Container lanes", "air": "Air routes", "pipelines": "Pipelines",
    "royal-road": "Persian Royal Road", "incense-route": "Incense Route", "amber-road": "Amber Road", "roman-roads": "Roman roads",
    "viking": "Viking routes", "grand-canal": "Grand Canal", "inca-roads": "Inca roads (Qhapaq Ñan)", "atlantic": "Atlantic triangle", "canals": "Canals",
}


REGIONS = [  # (name, lat_min, lat_max, lng_min, lng_max); first match on the route's midpoint wins
    ("Indian Ocean & South Asia", -40, 25, 40, 100),
    ("Mediterranean & Black Sea", 29, 48, -7, 36),
    ("Northern Europe & North Atlantic", 48, 82, -60, 60),
    ("Middle East & Central Asia", 12, 56, 34, 80),
    ("East & Southeast Asia", -12, 60, 95, 150),
    ("Africa", -36, 37, -20, 52),
    ("Americas", -56, 72, -170, -30),
    ("Pacific", -50, 60, 150, 180),
    ("Pacific", -50, 60, -180, -110),
    ("Atlantic", -60, 60, -60, -5),
]


def region_of(path):
    """Coarse region label from the path (for filtering only; not a historical claim)."""
    lats = [p[0] for p in path]
    lngs = [p[1] for p in path]
    if max(lngs) - min(lngs) > 50 or max(lats) - min(lats) > 55:
        return "Intercontinental"
    lat, lng = sum(lats) / len(lats), sum(lngs) / len(lngs)
    for name, a, b, c, d in REGIONS:
        if a <= lat <= b and c <= lng <= d:
            return name
    return "Intercontinental"


def finish(rec):
    """Fill the common schema fields every record carries."""
    rec.setdefault("region", region_of([(p[0], p[1]) if isinstance(p, (list, tuple)) else (p["lat"], p["lng"]) for p in rec["path"]]))
    if "family" not in rec:
        rec["family"] = FAMILY_OF_LINE[rec["line"]]
    rec["reconstruction"] = rec.get("confidence") != "logbook record"
    rec.setdefault("citations", [rec["citation"]])
    if "confidence_level" not in rec:
        if rec.get("confidence") == "logbook record":
            rec["confidence_level"] = "high"
        elif rec.get("demo_seed"):
            rec["confidence_level"] = "low"
        else:
            rec["confidence_level"] = "medium"
    rec.setdefault("derived_from", "logbook dataset (CLIWOC, CC BY 3.0)" if not rec["reconstruction"] else "hand-written reconstruction from published history")
    return rec


def main():
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from seed_routes import SEED
    try:
        from families import FAMILY_RECORDS
    except ImportError:
        FAMILY_RECORDS = []
    doc = build()
    recs = [finish(r) for r in doc["routes"]] + [finish(dict(r)) for r in SEED] + [finish(dict(r)) for r in FAMILY_RECORDS]
    ids = [r["id"] for r in recs]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        raise SystemExit("duplicate ids: %s" % sorted(dup))
    by_fam = {}
    for rec in recs:
        by_fam.setdefault(rec["family"], []).append(rec)
    outdir = DATA / "routes"
    files = []
    for fam in sorted(by_fam):
        d = {"family": fam, "title": FAMILY_TITLES.get(fam, fam), "schema_version": 1, "partial_sample": True,
             "notes": doc["notes"] if fam in ("venice-genoa", "voc-eic", "cliwoc-logbooks") else "See SOURCES.md for every record's citations.",
             "routes": by_fam[fam]}
        (outdir / f"{fam}.json").write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        write_js(f"web/data/routes/{fam}.json", f"routes:{fam}", d, outdir / f"{fam}.js")
        files.append(f"data/routes/{fam}.js")
        print(f"{fam:24s} {len(by_fam[fam])}")
    (outdir / "index.js").write_text(
        "/* Generated by tools/build_routes.py: one file per route family. */\n"
        "(window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {}).route_files = " + json.dumps(files, indent=1) + ";\n", encoding="utf-8")
    print("total", len(recs))
    wind = json.loads((DATA / "wind.json").read_text(encoding="utf-8"))
    write_js("web/data/wind.json", "wind", wind, DATA / "wind.js")
    lite = WEB / "textures" / "hd" / "earth-day-2k.jpg"
    if lite.exists():
        mime, png = "image/jpeg", lite.read_bytes()
    else:
        mime, png = "image/png", (WEB / "textures" / "earth-navy.png").read_bytes()
    (DATA / "texture.js").write_text(
        "/* Generated by tools/build_routes.py: the 2k day texture (NASA Blue Marble, public domain) as a data URI,\n"
        "   so the page also works from file:// and as a single HTML file. */\n"
        "(window.SEAGLOBE_DATA = window.SEAGLOBE_DATA || {}).texture = \"data:" + mime + ";base64,"
        + base64.b64encode(png).decode() + "\";\n", encoding="utf-8")


if __name__ == "__main__":
    main()
