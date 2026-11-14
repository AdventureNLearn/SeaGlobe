#!/usr/bin/env python3
"""Build web/data/routes.json and web/data/wind.json from local source files.

Port coordinates are modern approximations of historic places, rounded to
two decimal degrees. Tracks between ports are historical reconstructions
unless the source is a CLIWOC logbook. This script invents no logbook
positions: the only point-by-point track comes from the downloaded
LAUNCESTON file.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "sources"
WEB = ROOT / "web" / "data"


# Modern approximate coordinates of historic ports / landmarks (lat, lon).
# These are geographic facts, not taken from CLIWOC or DAS.
PORTS = {
    "texel": (53.05, 4.77),
    "goeree": (51.83, 3.92),
    "plymouth": (50.37, -4.14),
    "halifax": (44.65, -63.57),
    "cape_sambro": (44.48, -63.55),
    "lizard": (49.96, -5.20),
    "cape_good_hope": (-34.36, 18.50),
    "enggano": (-5.39, 102.27),
    "jakarta": (-6.13, 106.81),
    "sri_lanka_galle": (6.03, 80.22),
    "venice": (45.44, 12.34),
    "modon": (36.82, 21.70),
    "candia": (35.34, 25.13),
    "alexandria": (31.20, 29.89),
    "constantinople": (41.02, 28.98),
    "messina": (38.19, 15.55),
    "balearics": (39.57, 2.65),
    "gibraltar": (36.14, -5.35),
    "cadiz": (36.53, -6.29),
    "lisbon": (38.72, -9.14),
    "southampton": (50.90, -1.40),
    "sluis": (51.31, 3.39),
    "genoa": (44.41, 8.93),
    "caffa": (45.03, 35.38),
    "trebizond": (41.01, 39.72),
    "lubeck": (53.87, 10.68),
    "visby": (57.64, 18.30),
    "tallinn": (59.44, 24.75),
    "bergen": (60.39, 5.32),
    "london": (51.51, -0.08),
    "gdansk": (54.35, 18.65),
    "skagen": (57.72, 10.58),
    "aden": (12.79, 45.02),
    "calicut": (11.25, 75.77),
    "malacca": (2.19, 102.25),
    "hormuz": (27.10, 56.45),
    "kilwa": (-8.96, 39.51),
    "sofala": (-20.15, 34.73),
    "mogadishu": (2.05, 45.35),
    "malindi": (-3.22, 40.12),
    "liujiagang": (31.63, 121.42),
    "champa": (13.77, 109.23),
    "gresik": (-7.16, 112.65),
    "palembang": (-2.99, 104.76),
    "aceh": (5.55, 95.32),
    "acapulco": (16.85, -99.90),
    "guam": (13.44, 144.79),
    "san_bernardino": (12.58, 124.22),
    "manila": (14.58, 120.98),
}


def path_of(*names_or_coords):
    pts = []
    for item in names_or_coords:
        if isinstance(item, (tuple, list)):
            pts.append([round(float(item[0]), 2), round(float(item[1]), 2)])
        else:
            lat, lon = PORTS[item]
            pts.append([lat, lon])
    return pts


def route(**kw):
    required = ("id", "name", "era", "color", "year_start", "year_end",
                "confidence", "source", "citation", "path", "notes")
    missing = [k for k in required if k not in kw]
    if missing:
        raise SystemExit(f"route missing {missing}")
    kw.setdefault("sample", False)
    kw.setdefault("years_approximate", False)
    kw.setdefault("partial", False)
    return kw


def parse_launceston():
    tab = SRC / "cliwoc" / "Launceston_17690907_NMM_ADM_L_L53_met_obs.tab"
    points = []
    winds = []
    with tab.open(encoding="utf-8") as f:
        in_table = False
        for line in f:
            if line.startswith("Date/Time"):
                in_table = True
                continue
            if not in_table or not line.strip() or line.startswith("/*"):
                continue
            cols = line.rstrip("\n").split("\t")
            # Date, Lat, Lon, dd, ff, ...
            if len(cols) < 5:
                continue
            date, lat_s, lon_s, dd_s, ff_s = cols[0], cols[1], cols[2], cols[3], cols[4]
            try:
                lat = float(lat_s)
                lon = float(lon_s)
            except ValueError:
                continue
            points.append({"date": date, "lat": lat, "lon": lon})
            wind = {"lat": lat, "lon": lon, "date": date, "kind": "logbook"}
            try:
                wind["from_deg"] = int(float(dd_s)) if dd_s else None
            except ValueError:
                wind["from_deg"] = None
            try:
                wind["speed_ms"] = float(ff_s) if ff_s else None
            except ValueError:
                wind["speed_ms"] = None
            # 361 = calm, 362 = variable in CLIWOC
            if wind["from_deg"] in (361, 362):
                wind["from_deg_special"] = "calm" if wind["from_deg"] == 361 else "variable"
            winds.append(wind)
    return points, winds


def build_routes(laun_pts):
    laun_path = [[p["lat"], p["lon"]] for p in laun_pts]
    routes = [
        route(
            id="venetian-alexandria-muda",
            name="Venetian Alexandria muda",
            era="medieval",
            color="#e7c766",
            year_start=1250,
            year_end=1510,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="Frederic C. Lane, Venice: A Maritime Republic (Baltimore: Johns Hopkins University Press, 1973). See also Lane, “Venetian Merchant Galleys, 1300–1334,” Speculum 38, no. 2 (1963): 179–205.",
            path=path_of("venice", "modon", "candia", "alexandria"),
            notes="State-organized muda convoy to Alexandria. Port-to-port geometry is a reconstruction from the well-known call sequence, not a logbook track. Active years are approximate.",
        ),
        route(
            id="venetian-constantinople",
            name="Venetian galleys to Constantinople",
            era="medieval",
            color="#e7c766",
            year_start=1250,
            year_end=1453,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="Frederic C. Lane, Venice: A Maritime Republic (Baltimore: Johns Hopkins University Press, 1973).",
            path=path_of("venice", "modon", "constantinople"),
            notes="Regular Venetian line into the Bosporus, ending with the Ottoman capture of Constantinople in 1453. Geometry reconstructed from ports. Years approximate.",
        ),
        route(
            id="venetian-flanders-galleys",
            name="Venetian Flanders galleys",
            era="medieval",
            color="#e7c766",
            year_start=1315,
            year_end=1530,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="Frederic C. Lane, Venice: A Maritime Republic (Baltimore: Johns Hopkins University Press, 1973); Lane, “Venetian Merchant Galleys, 1300–1334,” Speculum 38, no. 2 (1963): 179–205.",
            path=path_of("venice", "messina", "balearics", "gibraltar", "cadiz", "lisbon", "southampton", "sluis"),
            notes="State galleys west through the Strait of Messina and Gibraltar, then up the Atlantic coast to Southampton and the Zwyn (Sluis/Bruges). Geometry reconstructed. Years approximate.",
        ),
        route(
            id="genoese-black-sea",
            name="Genoese line to Pera and Caffa",
            era="medieval",
            color="#c9a24a",
            year_start=1266,
            year_end=1475,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="Steven A. Epstein, Genoa and the Genoese, 958–1528 (Chapel Hill: University of North Carolina Press, 1996). Colony dates: Caffa from the late thirteenth century until the Ottoman capture in 1475; Pera (Galata) as the Genoese suburb of Constantinople until 1453.",
            path=path_of("genoa", "constantinople", "caffa"),
            notes="Trunk line from Genoa through Pera to the Crimean colony of Caffa. A short spur to Trebizond is listed separately. Geometry reconstructed from colony ports, not a plotted itinerary taken from a specific page of Epstein. Years approximate.",
        ),
        route(
            id="genoese-trebizond",
            name="Genoese Black Sea spur to Trebizond",
            era="medieval",
            color="#c9a24a",
            year_start=1266,
            year_end=1461,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="Steven A. Epstein, Genoa and the Genoese, 958–1528 (Chapel Hill: University of North Carolina Press, 1996).",
            path=path_of("caffa", "trebizond"),
            notes="Black Sea connection between Caffa and Trebizond. Geometry reconstructed. End year follows the fall of Trebizond (1461) and is approximate for this spur.",
        ),
        route(
            id="hanseatic-baltic-trunk",
            name="Hanseatic Baltic trunk (Lübeck–Visby–Reval)",
            era="medieval",
            color="#9ad0a8",
            year_start=1250,
            year_end=1550,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="Philippe Dollinger, The German Hansa, trans. D. S. Ault and S. H. Steinberg (Stanford: Stanford University Press, 1970).",
            path=path_of("lubeck", "visby", "tallinn"),
            notes="Core Baltic sea route of the German Hansa. The Novgorod trade continued overland and by river from the Gulf of Finland; that inland leg is not drawn. Geometry reconstructed. Years approximate.",
        ),
        route(
            id="hanseatic-bergen",
            name="Hanseatic route to the Bergen Kontor",
            era="medieval",
            color="#9ad0a8",
            year_start=1250,
            year_end=1550,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="Philippe Dollinger, The German Hansa, trans. D. S. Ault and S. H. Steinberg (Stanford: Stanford University Press, 1970).",
            path=path_of("lubeck", "skagen", "bergen"),
            notes="Sea route to the Bergen Kontor (stockfish). Geometry reconstructed. Years approximate.",
        ),
        route(
            id="hanseatic-bruges-london",
            name="Hanseatic routes to the Bruges and London Kontors",
            era="medieval",
            color="#9ad0a8",
            year_start=1250,
            year_end=1550,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="Philippe Dollinger, The German Hansa, trans. D. S. Ault and S. H. Steinberg (Stanford: Stanford University Press, 1970).",
            path=path_of("lubeck", "skagen", "sluis", "london"),
            notes="Westward sea route to the Bruges Kontor (drawn at Sluis, the Zwyn outport) and on to the London Steelyard. Geometry reconstructed. Years approximate.",
        ),
        route(
            id="indian-ocean-aden-calicut-malacca",
            name="Indian Ocean monsoon trunk (Aden–Calicut–Malacca)",
            era="indian-ocean",
            color="#ffbf5e",
            year_start=1200,
            year_end=1700,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="K. N. Chaudhuri, Trade and Civilisation in the Indian Ocean: An Economic History from the Rise of Islam to 1750 (Cambridge: Cambridge University Press, 1985).",
            path=path_of("aden", "calicut", "malacca"),
            notes="Long-lived monsoon emporia route. Ships used the seasonal reversal of the monsoon; the line is a schematic trunk, not a single year's itinerary. Years approximate and extend beyond 1500 because the system continued.",
        ),
        route(
            id="indian-ocean-east-africa-india",
            name="Indian Ocean monsoon (Kilwa and Sofala to Calicut)",
            era="indian-ocean",
            color="#ffbf5e",
            year_start=1200,
            year_end=1500,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="K. N. Chaudhuri, Trade and Civilisation in the Indian Ocean: An Economic History from the Rise of Islam to 1750 (Cambridge: Cambridge University Press, 1985).",
            path=path_of("sofala", "kilwa", "calicut"),
            notes="East African coast to the Malabar emporia under the monsoon. Geometry reconstructed. Years approximate.",
        ),
        route(
            id="indian-ocean-hormuz-calicut",
            name="Indian Ocean monsoon (Hormuz–Calicut)",
            era="indian-ocean",
            color="#ffbf5e",
            year_start=1200,
            year_end=1600,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="K. N. Chaudhuri, Trade and Civilisation in the Indian Ocean: An Economic History from the Rise of Islam to 1750 (Cambridge: Cambridge University Press, 1985).",
            path=path_of("hormuz", "calicut"),
            notes="Persian Gulf–Malabar monsoon link. Geometry reconstructed. Years approximate.",
        ),
        route(
            id="zheng-he-trunk",
            name="Zheng He treasure-fleet trunk (Liujiagang to Calicut)",
            era="zheng-he",
            color="#ff8a5e",
            year_start=1405,
            year_end=1433,
            years_approximate=False,
            confidence="historical reconstruction",
            source="published history",
            citation="Edward L. Dreyer, Zheng He: China and the Oceans in the Early Ming Dynasty, 1405–1433 (New York: Pearson Longman, 2006).",
            path=path_of("liujiagang", (20.0, 114.0), "champa", "gresik", "palembang", "malacca", "aceh", "sri_lanka_galle", "calicut"),
            notes="Composite trunk of the seven Ming voyages, 1405–1433. Not every voyage called at every port. Geometry reconstructed from the commonly listed itinerary in Dreyer and related accounts, not from a surviving point-by-point log.",
        ),
        route(
            id="zheng-he-west",
            name="Zheng He later voyages, Calicut to East Africa",
            era="zheng-he",
            color="#ff8a5e",
            year_start=1413,
            year_end=1433,
            years_approximate=True,
            confidence="historical reconstruction",
            source="published history",
            citation="Edward L. Dreyer, Zheng He: China and the Oceans in the Early Ming Dynasty, 1405–1433 (New York: Pearson Longman, 2006).",
            path=path_of("calicut", "hormuz", "aden", "mogadishu", "malindi"),
            notes="Extension of later treasure-fleet voyages to Hormuz, Aden, and the East African coast. Not every later voyage reached every port. Start year is approximate (western legs become prominent from the fourth voyage). Geometry reconstructed.",
        ),
        route(
            id="das-amsterdam-1595",
            name="DAS 0001.1 Amsterdam (Texel to Enggano, 1595–1596)",
            era="voc",
            color="#6fa8ff",
            year_start=1595,
            year_end=1596,
            years_approximate=False,
            confidence="historical reconstruction",
            source="published history",
            citation="J. R. Bruijn, F. S. Gaastra and I. Schöffer, Dutch-Asiatic Shipping in the 17th and 18th Centuries (The Hague, 1979–1987), voyage 0001.1. The online DAS data is not bundled.",
            path=path_of(
                "texel",
                (50.0, -2.0),
                (43.0, -10.0),
                (16.0, -25.0),
                (0.0, -20.0),
                (-20.0, -10.0),
                "cape_good_hope",
                (-34.0, 30.0),
                (-28.0, 43.0),
                (-10.0, 52.0),
                "enggano",
            ),
            notes="Real DAS voyage: ship Amsterdam, departed Texel 1595-04-02, arrived Pulau Enggano 1596-06-06 (no Cape dates in this record). The track itself is a reconstruction of the pre-Brouwer Indian Ocean approach to Sumatra, not daily positions. Dates from the published compilation; the online DAS database is not bundled.",
            sample=True,
            partial=True,
        ),
        route(
            id="das-patriot-1780",
            name="DAS 4367.3 Patriot (Texel to Batavia via the Cape, 1780)",
            era="voc",
            color="#6fa8ff",
            year_start=1780,
            year_end=1780,
            years_approximate=False,
            confidence="historical reconstruction",
            source="published history",
            citation="J. R. Bruijn, F. S. Gaastra and I. Schöffer, Dutch-Asiatic Shipping in the 17th and 18th Centuries (The Hague, 1979–1987), voyage 4367.3. The online DAS data is not bundled.",
            path=path_of(
                "texel",
                (50.0, -2.0),
                (43.0, -10.0),
                (16.0, -25.0),
                (0.0, -15.0),
                (-20.0, -5.0),
                "cape_good_hope",
                (-36.0, 40.0),
                (-38.0, 70.0),
                (-35.0, 100.0),
                (-8.0, 104.0),
                "jakarta",
            ),
            notes="Real DAS voyage: ship Patriot, Texel 1780-01-04, Cape 1780-04-16 to 1780-05-15, Jakarta 1780-07-22. Track reconstructed along the later Cape / southern-ocean / Sunda Strait pattern (Brouwer route), not daily positions. Sample only.",
            sample=True,
            partial=True,
        ),
        route(
            id="manila-galleon-outbound",
            name="Manila galleon outbound (Acapulco to Manila)",
            era="manila",
            color="#5ee7ff",
            year_start=1565,
            year_end=1815,
            years_approximate=False,
            confidence="historical reconstruction",
            source="published history",
            citation="William Lytle Schurz, The Manila Galleon (New York: E. P. Dutton, 1939).",
            path=path_of(
                "acapulco",
                (14.0, -110.0),
                (13.0, -130.0),
                (13.0, -150.0),
                (13.0, 170.0),
                "guam",
                "san_bernardino",
                "manila",
            ),
            notes="Westbound crossing on the northeast trades at about 13°N, via the Marianas and the San Bernardino Strait. Geometry reconstructed from the standard itinerary in Schurz, not a single ship's log. The 1565–1815 span is the conventional life of the line.",
        ),
        route(
            id="manila-galleon-return",
            name="Manila galleon return (Manila to Acapulco)",
            era="manila",
            color="#5ee7ff",
            year_start=1565,
            year_end=1815,
            years_approximate=False,
            confidence="historical reconstruction",
            source="published history",
            citation="William Lytle Schurz, The Manila Galleon (New York: E. P. Dutton, 1939).",
            path=path_of(
                "manila",
                (18.0, 125.0),
                (25.0, 135.0),
                (34.0, 145.0),
                (38.0, 170.0),
                (38.0, -150.0),
                (36.0, -130.0),
                (32.0, -117.0),
                "acapulco",
            ),
            notes="Eastbound return via the Kuroshio and the North Pacific westerlies, then down the California coast to Acapulco. Geometry reconstructed from the standard itinerary in Schurz, not a single ship's log.",
        ),
        route(
            id="cliwoc-launceston-1769",
            name="HMS Launceston, Halifax to Plymouth, 1769",
            era="logbook",
            color="#4ff0a8",
            year_start=1769,
            year_end=1769,
            years_approximate=False,
            confidence="logbook record",
            source="CLIWOC 2.1 (PANGAEA)",
            citation="Ricardo García-Herrera, Gunther P. Können, Dennis A. Wheeler, Maria del Rosario Prieto, Philip D. Jones and Frits B. Koek, “Meteorological observations during LAUNCESTON cruise from Halifax to Plymouth started at 1769-09-07,” PANGAEA (2010), https://doi.org/10.1594/PANGAEA.750354, CC BY 3.0. In: Jones et al., “Climatological observations from ship logbooks between 1750 and 1854 (release 2.1),” PANGAEA (2007), https://doi.org/10.1594/PANGAEA.611088. Logbook source: National Maritime Museum, Greenwich, ADM/L/L53.",
            path=laun_path,
            notes="Daily positions taken unchanged from the downloaded CLIWOC cruise file (32 position days, 7 Sep–8 Oct 1769, 5th-rate frigate Launceston, Royal Navy, Halifax to Plymouth). This is a sample of CLIWOC 2.1 (287,114 records). The full database was not downloaded.",
            sample=True,
            partial=True,
            point_dates=[p["date"] for p in laun_pts],
        ),
    ]
    return routes


def build_wind(laun_winds):
    # Schematic trade-wind / monsoon arrows. These are NOT a published grid
    # and are NOT CLIWOC observations. Directions are the conventional
    # meteorologist's "from" direction.
    schematic = [
        {"id": "ne-trades-atl", "lat": 15, "lon": -30, "from_deg": 45, "label": "NE trades (Atlantic)", "belt": "ne-trades"},
        {"id": "ne-trades-atl-w", "lat": 15, "lon": -50, "from_deg": 50, "label": "NE trades (Atlantic)", "belt": "ne-trades"},
        {"id": "se-trades-atl", "lat": -15, "lon": -20, "from_deg": 135, "label": "SE trades (Atlantic)", "belt": "se-trades"},
        {"id": "se-trades-atl-e", "lat": -15, "lon": 0, "from_deg": 130, "label": "SE trades (Atlantic)", "belt": "se-trades"},
        {"id": "ne-trades-pac", "lat": 15, "lon": -140, "from_deg": 45, "label": "NE trades (Pacific)", "belt": "ne-trades"},
        {"id": "ne-trades-pac-w", "lat": 15, "lon": 160, "from_deg": 50, "label": "NE trades (Pacific)", "belt": "ne-trades"},
        {"id": "se-trades-pac", "lat": -15, "lon": -120, "from_deg": 135, "label": "SE trades (Pacific)", "belt": "se-trades"},
        {"id": "westerlies-natl", "lat": 45, "lon": -40, "from_deg": 270, "label": "Mid-latitude westerlies (N Atlantic)", "belt": "westerlies"},
        {"id": "westerlies-npac", "lat": 40, "lon": -160, "from_deg": 270, "label": "Mid-latitude westerlies (N Pacific)", "belt": "westerlies"},
        {"id": "westerlies-so", "lat": -42, "lon": 60, "from_deg": 270, "label": "Southern Ocean westerlies", "belt": "westerlies"},
        {"id": "westerlies-so-e", "lat": -42, "lon": 110, "from_deg": 270, "label": "Southern Ocean westerlies", "belt": "westerlies"},
        {"id": "sw-monsoon", "lat": 10, "lon": 70, "from_deg": 225, "label": "SW monsoon (boreal summer, schematic)", "belt": "sw-monsoon", "season": "boreal-summer"},
        {"id": "sw-monsoon-e", "lat": 5, "lon": 90, "from_deg": 225, "label": "SW monsoon (boreal summer, schematic)", "belt": "sw-monsoon", "season": "boreal-summer"},
        {"id": "ne-monsoon", "lat": 12, "lon": 80, "from_deg": 45, "label": "NE monsoon (boreal winter, schematic)", "belt": "ne-monsoon", "season": "boreal-winter"},
    ]
    for s in schematic:
        s["kind"] = "schematic-climatology"
        s["source"] = (
            "Schematic wind belts drawn from well-known general circulation "
            "(trade winds, westerlies, and the Indian Ocean monsoon). Not a "
            "published climatology grid and not CLIWOC observations."
        )
    # Subsample logbook winds (every point is already few: include all with a direction)
    logbook = []
    for w in laun_winds:
        if w.get("from_deg") is None:
            continue
        if w.get("from_deg_special"):
            continue
        logbook.append({
            "kind": "logbook",
            "lat": w["lat"],
            "lon": w["lon"],
            "from_deg": w["from_deg"],
            "speed_ms": w["speed_ms"],
            "date": w["date"],
            "label": f"Launceston wind, {w['date'][:10]}",
            "source": "CLIWOC 2.1, HMS Launceston, https://doi.org/10.1594/PANGAEA.750354 (CC BY 3.0).",
            "year": 1769,
        })
    return {"schematic": schematic, "logbook_sample": logbook}


def main():
    WEB.mkdir(parents=True, exist_ok=True)
    pts, winds = parse_launceston()
    if len(pts) < 10:
        raise SystemExit(f"expected many LAUNCESTON points, got {len(pts)}")
    routes = build_routes(pts)
    payload = {
        "title": "SeaGlobe route sample",
        "slider": {"min": 1200, "max": 1899, "step": 10},
        "partial_sample": True,
        "notes": (
            "This is a small seed, not a complete atlas. Pre-1500 and most "
            "early-modern tracks are historical reconstructions with a citation "
            "each. The only logbook track is the CLIWOC LAUNCESTON cruise of 1769. "
            "DAS contributes two real voyage records; their paths are reconstructed. "
            "The full CLIWOC and DAS corpora were not drawn."
        ),
        "ports_note": (
            "Port coordinates are modern approximations of historic places, "
            "rounded to two decimal degrees. They do not come from CLIWOC or DAS."
        ),
        "routes": routes,
    }
    (WEB / "routes.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    wind = build_wind(winds)
    (WEB / "wind.json").write_text(json.dumps(wind, indent=2) + "\n", encoding="utf-8")
    print(f"routes: {len(routes)}  launceston points: {len(pts)}  logbook winds: {len(wind['logbook_sample'])}")


if __name__ == "__main__":
    main()
