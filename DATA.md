# SeaGlobe data sources and licenses

First checked 2026-11-13 with live HTTP requests from the build machine; updated for v1.1 / v2 the same day.
Nothing here is invented. Gaps are marked [UNKNOWN].

## Rules for what is bundled

Bundled only if the license allows redistribution without NC/SA terms: ORBIS (CC BY 3.0), Pleiades
(CC BY 3.0), Itiner-e (CC BY 4.0), CLIWOC on PANGAEA (CC BY 3.0), Natural Earth (PD), OurAirports (PD),
CEPII BACI (Etalab 2.0), Wikidata (CC0), World Bank shipping density (CC BY 4.0), Scottish Canals (OGL 3.0),
French railways (CC BY 4.0), NASA imagery (PD). **Not bundled** (linked under "Go deeper" only): DARMC,
AWMC tiles, DAS (Huygens), SlaveVoyages imputed data, OWTRAD, Zenodo shipping lanes, OpenStreetMap,
OpenFlights, UNESCO feeds, UN Comtrade, Sound Toll Registers, Global Energy Monitor. No geometry was
copied, traced or derived from the unbundled sets. Full reasoning: `research/ROUTE-SOURCES.md`.

## What is in this version

- 69 route records in 24 family files under `web/data/routes/` (counts per family in SOURCES.md).
- **Dataset-derived geometry:** 1 record — HMS *Launceston* 1769, daily noon positions from CLIWOC (CC BY 3.0).
- **Hub coordinates from a dataset:** 12 air routes use OurAirports (PD) airport coordinates; the
  routes between them are illustrative great circles (marked reconstruction, start year [UNKNOWN] per route).
- **Hand-written reconstructions:** 56 records, drawn from published history and public-domain primary
  texts in public-domain translations (Herodotus, Strabo, Pliny, Isidore of Charax, the Periplus of the
  Erythraean Sea, Marco Polo (Yule 1903), Ibn Battuta (Defrémery & Sanguinetti), Cieza de León (Markham)),
  plus standard histories. Each carries `reconstruction: true`, a `citations` list and `confidence_level`
  (high / medium / low). Records marked `citation_check: true` still need their page references checked.
- **Timing:** 6 records with **real dates** (`dated`), 6 with **published voyage years** and reconstructed
  months/pace (`years`), 57 with **illustrative traffic** (`traffic`, reconstructed timing, shown in the app
  as "reconstructed timing").

### Real-dated voyages

| Record | Dates | Source |
|---|---|---|
| First Dutch fleet: *Amsterdam*, *Duifje*, *Hollandia*, *Mauritius* (`das-amsterdam-1595`) | Texel 2 Apr 1595 → Enggano 6 Jun 1596 | Bruijn, Gaastra & Schöffer, *Dutch-Asiatic Shipping* (1979–87), voyages 0001.1–0004.1. Dates typed from the published compilation; track reconstructed |
| *Patriot* (`das-patriot-1780`) | Texel 4 Jan 1780, Cape 16 Apr–15 May, Batavia 22 Jul 1780 | same, voyage 4367.3 |
| HMS *Launceston* (`cliwoc-launceston-1769`) | 7 Sep–8 Oct 1769, daily positions | CLIWOC 2.1, doi:10.1594/PANGAEA.750354, CC BY 3.0 |
| SS *Great Western* maiden voyage (`great-western-1838`) | 8–23 Apr 1838 | general history (citation_check) |
| *Ideal X* (`ideal-x-1956`) | departed Newark 26 Apr 1956; arrival [UNKNOWN], pace reconstructed | general history (citation_check) |
| Pan Am Boeing 707 New York–Paris (`pan-am-707-1958`) | 26 Oct 1958 | general history (citation_check) |

### Dutch-Asiatic Shipping

v1 used a sample extracted from the DataverseNL "DAS – Enriched Dataset" (catalogued CC BY 4.0). Because the
online DAS at the Huygens Institute is on the do-not-bundle list (CC BY-NC-SA), v1.1 no longer reads any DAS
file: the two voyages are typed from the **published book** (dates only), cargo is [UNKNOWN] and not shown,
and `data/sources/das/` is kept on the build machine for provenance but excluded from the repository and zips.

## 1. Natural Earth (coastlines and land)

- Official terms, read at https://www.naturalearthdata.com/about/terms-of-use/ on 2026-11-13: “All versions of Natural Earth raster + vector map data found on this website are in the public domain.” Credit is unnecessary; if cited, use “Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.”
- Downloaded, 2026-11-13:
  - https://naciscdn.org/naturalearth/110m/physical/ne_110m_land.zip (69,700 bytes). The copy in the zip reports version **4.1.0**.
  - https://naciscdn.org/naturalearth/110m/physical/ne_110m_coastline.zip (85,352 bytes), version **4.1.0**.
  - GeoJSON used by the app, from the same project: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson and `ne_110m_coastline.geojson`.
- Stored at `data/sources/naturalearth/`. The app texture `web/textures/earth-navy.png` was rasterized from the land GeoJSON by `tools/make_texture.py`. v1.1 adds NASA imagery for the HD globe (section 8); the water mask uses Natural Earth 1:50m land (public domain), rasterized by `tools/make_hd_textures.py`.

## 2. CLIWOC (ship logbooks, about 1750–1850)

- Project: Climatological Database for the World's Oceans, EU FP5 grant EVK2-CT-2000-00090 (some catalogues print EVK1-CT-2000-00090; the file we downloaded says **EVK2-CT-2000-00090**). Partners included KNMI. The original KNMI project site (`http://projects.knmi.nl/cliwoc/…`) was **not** used. Whether that site is still up is [UNKNOWN].
- Canonical series used here: Jones, P. D.; Wheeler, D. A.; Können, G. P.; Koek, F. B.; Prieto, M. del R.; García-Herrera, R. (2007), *Climatological observations from ship logbooks between 1750 and 1854 (release 2.1)*, PANGAEA, https://doi.org/10.1594/PANGAEA.611088. HTTP `Link` header and JSON-LD both give the license **https://creativecommons.org/licenses/by/3.0/** (CC BY 3.0).
- A DANS / B2FIND catalogue record for “CLIWOC 2.1” lists **CC0-1.0**. That is a different archive copy. This project did not download the DANS file, and it uses the PANGAEA license that arrived with the file we actually have. The disagreement between catalogues is unresolved here ([UNKNOWN] which statement the DANS copy itself carries).
- **Obtained (small, openly licensed):** one cruise from the same series:
  - García-Herrera, R.; Können, G. P.; Wheeler, D. A.; Prieto, M. del R.; Jones, P. D.; Koek, F. B. (2010), *Meteorological observations during LAUNCESTON cruise from Halifax to Plymouth started at 1769-09-07*, National Maritime Museum, Greenwich, PANGAEA, https://doi.org/10.1594/PANGAEA.750354, CC BY 3.0.
  - File: `data/sources/cliwoc/Launceston_17690907_NMM_ADM_L_L53_met_obs.tab` (10,783 bytes, 32 daily positions, 7 Sep–8 Oct 1769, 5th-rate frigate *Launceston*, Royal Navy, ADM/L/L53). Wind direction (true, per the CLIWOC note in the file) and wind speed are in the same table.
  - This is a **sample**. The complete CLIWOC 2.1 database was not downloaded.
- Required attribution for the sample: cite the cruise DOI and the 2007 series DOI, and keep the CC BY 3.0 notice.

## 5. Wind

- **Logbook sample:** wind “from” direction (degrees, CLIWOC-corrected where the file says so) and speed (m/s) from the *Launceston* cruise, shown when the slider is in a decade that includes 1769. License: CC BY 3.0 with that cruise.
- **Schematic belts:** northeast and southeast trades, mid-latitude westerlies, and the Indian Ocean southwest / northeast monsoons. These are labeled in the UI and in `web/data/wind.json` as a schematic climatology, **not** CLIWOC and **not** a published grid. A small, openly licensed historical wind atlas was not downloaded; a preferred source is [UNKNOWN].
- On the globe, arrowheads point **downwind** (the direction the wind is blowing toward). Tooltips also give the meteorological “from” degree.

## 6. Libraries in `web/vendor/`

- `globe.gl` 2.46.2 (MIT), which bundles `three` 0.187.0 (MIT) and related MIT packages (`three-globe`, `three-render-objects`, `kapsule`, `@tweenjs/tween.js`). License texts are in `licenses/`. Installed with npm on the build machine and copied into `web/vendor/`; the app does not use a CDN.

## 7. Libraries, imagery and fonts

See [ASSETS-LICENSES.md](ASSETS-LICENSES.md): globe.gl 2.46.2 and three.js r187 incl. example add-ons (MIT),
NASA Blue Marble Next Generation and Black Marble 2012 (public domain), Natural Earth (public domain),
Inter (SIL OFL 1.1), procedural vehicles/stars/moon/satellites (this repo, MIT), AI-generated concept art.

## 8. NASA imagery

- Day: Blue Marble Next Generation, April 2004, topography + bathymetry, 21600 × 10800
  (`world.topo.bathy.200404.3x21600x10800.jpg`), NASA Visible Earth. Public domain. Credit: NASA Earth Observatory.
- Night: Black Marble 2012, 3 km (`BlackMarble_2012_3km.jpg`), NASA Earth Observatory. Public domain.
  The app fades city lights in only from about 1880, so 2012 lights are not shown on ancient eras.
- Originals are kept outside the repository; `tools/make_hd_textures.py` makes the 8k / 4k / 2k files.

## 9. OurAirports

`data/sources/ourairports/hubs.csv`: 17 hub rows from `airports.csv`, downloaded 2026-11-13 from
https://davidmegginson.github.io/ourairports-data/airports.csv. Public domain.

## 10. Attribution text (also on the credits card)

Made with Natural Earth. Earth imagery: NASA Earth Observatory (Blue Marble Next Generation, Black Marble 2012), public domain.
CLIWOC 2.1 logbook data: Jones et al. (2007), doi:10.1594/PANGAEA.611088, and García-Herrera et al. (2010), doi:10.1594/PANGAEA.750354, CC BY 3.0.
Airport coordinates: OurAirports, public domain. Font: Inter, SIL OFL 1.1. three.js and globe.gl: MIT.

## 11. Grok.me hosting

The `web/` folder is static and self-contained with relative paths, so it should work on a static host.
Grok.me's exact limits — maximum upload size and file count, whether multi-file apps or only a single HTML
file are accepted, whether WebGL is allowed, and its content-security policy — are [UNKNOWN]. Use `?lite=1`
(about 4 MB less to load) if size matters.

## 12. What was not obtained

- ORBIS, Itiner-e, Pleiades, World Bank AIS density, French railways and BACI data are allowed but not yet
  used (BACKLOG.md).
- The complete CLIWOC 2.1 database; a real star catalogue; a NASA cloud layer (downloads failed).
- Page-level quotations from the histories cited.

## Vehicle models (v2.1)

Vehicle models are artistic, procedural impressions, not reconstructions of specific ships. The Ming treasure ship
(`treasure-ship`, used by the two Zheng He routes) is drawn with nine masts; the true size of the largest treasure
ships is debated among historians, so its proportions are illustrative. The Erie Canal uses `canal-boat` (mule-towed),
matching that record's schedule label. `ox-wagon`, `diesel-train`, `electric-train` and `prop-airliner` exist as models
but no bundled route uses them yet (no cited records for those services are in the data): [UNKNOWN] until such records
are added (see BACKLOG.md, v2.2).
