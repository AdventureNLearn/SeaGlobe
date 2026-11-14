# Third-party notices

This file lists every third-party work bundled in this repository, with its
license and the attribution we are required or asked to give. Nothing with an
NC, ND, SA, "personal use only", or unclear license is bundled. Restricted
datasets are credited as links under "Go deeper" in the app and are not copied,
fetched or traced.

SeaGlobe's own source code is MIT. SeaGlobe's original documentation,
hand-written route reconstructions, screenshots and walkthrough videos are
CC BY 4.0. See [LICENSE](LICENSE).

## Bundled

| Work | Where | License | Attribution / notes |
|---|---|---|---|
| globe.gl 2.46.2 (includes three-globe, three-render-objects, kapsule, @tweenjs/tween.js) | `web/vendor/globe.gl.min.js` | MIT | Copyright (c) 2019 Vasco Asturiano. Text: `licenses/globe.gl-LICENSE`. |
| three.js 0.187.0 (r187) core, as `window.SEAGLOBE_THREE` | `web/vendor/three.global.js` | MIT | Copyright © 2010-2026 three.js authors. Text: `licenses/three-LICENSE`. |
| three.js r187 examples (EffectComposer passes, CopyShader, LuminosityHighPassShader, OutputShader, UnrealBloomPass, OutputPass, Lensflare) | `web/vendor/three-addons.global.js` | MIT | Same as three.js. |
| NASA Visible Earth, Blue Marble Next Generation, April 2004, topography + bathymetry (resized 8k and 2k) | `web/textures/hd/earth-day-*.jpg` (2k also embedded in `web/data/texture.js`) | Public domain (NASA imagery) | Credit: NASA Earth Observatory. Original filename `world.topo.bathy.200404.3x21600x10800.jpg`. |
| NASA Earth Observatory, Black Marble 2012 (resized 4k) | `web/textures/hd/earth-night-4k.jpg` | Public domain (NASA imagery) | Credit: NASA Earth Observatory. Original filename `BlackMarble_2012_3km.jpg`. |
| Natural Earth 110m land and coastline (v4.1.0), and a water mask rasterized from Natural Earth 1:50m land | `data/sources/naturalearth/`, `web/data/ne_110m_*.geojson`, `web/textures/earth-navy.png`, `web/textures/hd/earth-water-4k.png` | Public domain | “Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.” |
| Inter variable font | `web/fonts/InterVariable.woff2` | SIL Open Font License 1.1 | `web/fonts/Inter-OFL.txt`. |
| CLIWOC *Launceston* cruise sample (32 daily positions, 7 Sep–8 Oct 1769) and a redacted metadata copy (dataset-author emails removed) | `data/sources/cliwoc/` | CC BY 3.0 | García-Herrera et al. (2010), https://doi.org/10.1594/PANGAEA.750354, and the CLIWOC 2.1 series, Jones et al. (2007), https://doi.org/10.1594/PANGAEA.611088. |
| OurAirports hub coordinates (17 rows used for air-route endpoints) | `data/sources/ourairports/hubs.csv` | Public domain | From `airports.csv` at https://davidmegginson.github.io/ourairports-data/airports.csv. Routes between hubs are illustrative great circles, labelled as reconstructions. |
| satellite.js 7.2.0 (subset), BYO edition only | `web/vendor/satellite.min.js` | MIT | Copyright (C) 2013 Shashwat Kandadai, UCSC Jack Baskin School of Engineering. Text: `web/vendor/LICENSE-satellite.js.md`. |
| GCAT (General Catalog of Artificial Space Objects) slice | `data/sources/gcat/`, `web/data/space/gcat.js` | CC BY 4.0 | “Data from GCAT (J. McDowell, planet4589.org/space/gcat)”, release 1.8.9, data update 13 Nov 2026. |
| Natural Earth admin-0, admin-1, US admin-2 and populated places | `web/data/regions/` | Public domain | “Made with Natural Earth.” |
| OurAirports airports slice (1,197 airports) | `data/sources/ourairports/airports-slice.csv`, `web/data/places/airports.js` | Public domain | https://ourairports.com/data/ |
| TIGERweb test fixtures | `tests/fixtures/live/` | U.S. Government work | U.S. Census Bureau, TIGERweb. The live layer itself is fetched only when switched on and is not bundled. |

Walkthrough videos and screenshots are recordings of this app. They portray the
NASA and Natural Earth imagery above and should be reused with the same credits.

## Considered and not bundled

These projects are listed in the app under "Go deeper" as plain links that open
in a new tab. Their data is not included, fetched, embedded or traced, because
the license is restricted, NC/SA, or [UNKNOWN]. Listing them does not mean they
endorse this project.

- DARMC; Ancient World Mapping Center tiles; OWTRAD
- Dutch-Asiatic Shipping online at the Huygens Institute (CC BY-NC-SA). Two voyage *dates* in this app were typed from the published book (Bruijn, Gaastra & Schöffer); no DAS file is in this repository.
- SlaveVoyages imputed data; Sound Toll Registers
- OpenStreetMap; OpenFlights; Global Shipping Lanes (Zenodo); UN Comtrade
- Global Energy Monitor pipeline trackers (hosted CC BY 4.0 legal text was found, but whether it applies to those datasets is [UNKNOWN]; not bundled)
- UNESCO World Heritage Centre feeds (including Qhapaq Ñan)
- Han Silk Road traffic dataset; Periplus network dataset

Datasets that *are* openly licensed and allowed, but not yet used in this
version, are listed in [BACKLOG.md](BACKLOG.md) and [DATA.md](DATA.md): ORBIS
(CC BY 3.0), Itiner-e (CC BY 4.0), Pleiades (CC BY 3.0), World Bank shipping
density (CC BY 4.0), Scottish Canals (OGL 3.0), French railways (CC BY 4.0),
CEPII BACI (Etalab 2.0), Wikidata (CC0).

## Embedded, not bundled

- **Creedence Clearwater Revival Radio**: the playlist “Creedence Clearwater Revival’s Chronicle: The 20 Greatest Hits
  (Official Audio)” from the official channel https://www.youtube.com/@theofficialccr plays in YouTube's standard
  embedded player (youtube-nocookie.com), loaded only when the user clicks. YouTube's terms apply. Some videos may not
  allow embedding; the app skips them with a message. Outside links (new tab): “Exclusively Creedence Clearwater
  Revival” on radio.net (operator and licensing [UNKNOWN]) and “Creedence Clearwater Revival Experience” on
  iHeartRadio (its terms state personal, non-commercial use for U.S. residents). SeaGlobe hosts no audio.

## License flags

No bundled work was found whose license forbids redistribution. If a later
addition cannot be redistributed, it must stay off this list and out of the
tree (link-only, as above).
