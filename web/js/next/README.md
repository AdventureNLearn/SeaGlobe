# Next-layer modules

These modules are loaded only when the matching SeaFlags flag is on. Flags default
off, so a normal visit never fetches them.

v3.1 wiring (behind `?flag=pmtilesBorders` and `?flag=terrain`):

- `pmtiles-lib.js` — PMTiles v3 reader (range requests).
- `mvt.js` — Mapbox Vector Tile decoder (polygons).
- `pmtiles.js` — US Census TIGER/Line 2026 borders. A Layers toggle (`#tPmtiles`)
  stays off until the user turns it on, and the choice is remembered in this
  browser (not during tests). Tiles load from the existing asset host under
  `pmtiles/`. A missing file or 404 shows a “layer unavailable” note and does
  not throw. Credits: U.S. Census Bureau, TIGER/Line 2026. Archives are drawn
  only at zooms they actually contain (state 0–10, county 3–12, cousub and
  place 6–10). Zooms 11–13 are not invented.
- `terrain.js` — USGS 3DEP relief (`#tTerrain`), same toggle and fallback
  rules. Draws only where samples exist and leaves the current globe elevation
  everywhere else. Credit: U.S. Geological Survey, 3DEP. Coverage is US-centred,
  zooms 0–6, zoom 6 partial.

Other stubs still only register a `seaglobe:next-layer` event and a
`window.SeaNext[flag]` hook. Example records in `web/data/next/` load only with
`?exampleData=1` in a later wiring pass.

`bells.js` and `uap.js` also ship in the page scripts so their Layers toggles exist on a normal visit. Both stay off by default, and their data is fetched only when the layer is turned on or when the encyclopedia needs every entry. `uap.js` is a heavy layer (`?flag=officialUap` also maps to it).
