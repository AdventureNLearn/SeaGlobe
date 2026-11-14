# SeaGlobe — routes of the world, 500 BCE to today

## Read first / Risks

- SeaGlobe is a **static**, **offline-capable** web app. Libraries, textures, fonts and data are in this
  repository. It makes no runtime network calls.
- The Windows launchers and `serve.py` start a local HTTP server bound to **`127.0.0.1`** only (this
  computer). Close the console window to stop it. Nothing here publishes, uploads or pushes by itself.
- Many routes are **reconstructions**. The app labels every reconstruction, and every pre-1500 route is
  one. Real dates are used only where a voyage record gives them; otherwise timing is shown as
  "reconstructed timing".
- Data is cited on each record and in [DATA.md](DATA.md) and [SOURCES.md](SOURCES.md). Gaps are marked
  **[UNKNOWN]**. This is a sample atlas, not a complete catalogue.
- Vehicle models are artistic procedural impressions, not reconstructions of specific ships.

## What it is

A visual journey through 2,500 years of trade routes on a 3D globe. Every voyage has a vehicle that
travels its path — triremes, Roman grain ships, camel caravans, longships, cogs, dhows, junks, galleons,
East Indiamen, steamships, steam trains, container ships and jets — pointing the way it is going and
leaving a fading wake.

- **Sampler** (the idle globe): a rotating mix of about 16 vessels from every era and region — one swaps out every
  few seconds — with only their routes drawn faintly and a slow auto-rotation.
- **Focus mode:** pick an era, route type, goods, region, evidence or a single route and everything else dims to about
  10%. Routes are coloured by family (legend top left); labels thin out as you zoom out.
- **Ship's Log** (button or `L`): a searchable, filterable, sortable list of every voyage and route with years, type,
  goods, confidence, reconstruction flag and sources. Enter or click flies to it and plays it. Keyboard friendly.
  "Export CSV" saves the filtered list as a local file.
- Timeline from 500 BCE to the present (BCE years labelled), play/pause, 1× / 5× / 20×, date scrubber.
- Era switcher: Classical, Late Antiquity, Medieval, Age of Sail, Industrial, Modern.
- Click any vehicle: ship, route, years, goods, source, citations and a confidence level, plus a cited
  history, story and key facts for the route, the named ship (where there is one) and the vehicle type.
- Vehicles are capped at an on-screen speed you can follow, and time eases to a stop as the pointer
  nears a vehicle, so even jets can be selected. Dates stay true; only the clock slows.
- Follow camera (chase view), eased fly-ins, slow orbit.
- Earth from NASA Blue Marble / Black Marble (public domain) with ocean shine, atmosphere, a day/night
  terminator, city lights from the industrial era on, starfield, a moon and a decorative satellite layer
  for the space age.

## Run it locally

**Windows:** double-click `Start-SeaGlobe.cmd`. It starts a small local server on `127.0.0.1`
(this PC only) with Python and opens your browser. Close the console window to stop it.
If Python is not installed it opens `web\index.html` directly, in lite mode.

**Any OS:** `python serve.py --open` (Python 3.8+, standard library only), then use the URL it prints.

**Lite mode:** add `?lite=1` (automatic when opened from a file). Uses a 2k earth embedded in
`web/data/texture.js`, no bloom, fewer stars and satellites. Use it for small hosts and slow devices.

Keys: Space play/pause · L Ship's Log · / search · F follow camera · C cinema (hide panels) · Esc clear focus.

Useful URL options: `?t=1595-09-20` (start date; `-0479-05-01` is 480 BCE), `?era=medieval`,
`?speed=20`, `?play=0`, `?lite=1`, `?bloom=0`.

## Live site

This repository is the hosted site (GitHub Pages, no build of the app itself; a workflow publishes the
`web/` folder plus videos and screenshots):

https://adventurenlearn.github.io/SeaGlobe/

## Videos

Rendered frame by frame from the app with `tools/capture.mjs`. Captions: `walkthrough/CAPTIONS.md`.

- [Full atlas walkthrough](walkthrough/atlas-walkthrough.mp4) (2:59, 1920×1080)
- [Ships and Ship's Log](walkthrough/seaglobe-ships.mp4) (0:59, 1280×720)

On the hosted site they also play at https://adventurenlearn.github.io/SeaGlobe/videos.html.
The vehicle contact sheet is [screens/v2.1-all-vehicles.png](screens/v2.1-all-vehicles.png).

## Data

Route data lives in `web/data/routes/`, one file per route family (`*.json`, plus a `*.js` copy so
the app works from a file and on any static host). Each record has `type` (sea, land, river, canal,
rail, air, pipeline), `era`, start/end dates, `goods`, `source`, `citations`, `reconstruction`,
`confidence_level` and a `schedule` (dated / years / traffic). The schema is `web/data/schema.js`.
Rebuild with `python tools/build_routes.py`, then `python tools/make_sources_md.py`.

- [DATA.md](DATA.md) — every source, its license and attribution.
- [SOURCES.md](SOURCES.md) — every record and its citations.
- [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) — bundled third-party works and licenses.
- [ASSETS-LICENSES.md](ASSETS-LICENSES.md) — libraries, imagery, fonts, concept art.
- [research/ROUTE-SOURCES.md](research/ROUTE-SOURCES.md) — which datasets may be bundled, and why.
- [research/EMBED-CHECK.md](research/EMBED-CHECK.md) — embedding check for the "Go deeper" links.
- [BACKLOG.md](BACKLOG.md) — what is not done yet.
- [BUILD-SPEC.md](BUILD-SPEC.md) — how the app is built: modes, Ship's Log, data, tests.

## Go deeper

The app's **Go deeper** tab (and the links under a selected route) points to scholarly projects whose
data is *not* bundled here because their licenses are restricted or unclear: DARMC, the Ancient World
Mapping Center, OWTRAD, Dutch-Asiatic Shipping (Huygens), SlaveVoyages, Sound Toll Registers,
OpenStreetMap, OpenFlights, Global Shipping Lanes, UN Comtrade, Global Energy Monitor, UNESCO World
Heritage Centre (incl. Qhapaq Ñan), the Han Silk Road traffic dataset and the Periplus network dataset.
They are plain links that open in a new tab. Nothing is embedded or fetched. Listing them does not
mean they endorse this project.

## Tests

```
node --test tests/test_engine.mjs     # engine, schema validation of every record, vehicles
python -m unittest discover tests     # data files, docs hygiene, no runtime network URLs
node tests/test_app.mjs               # headless browser smoke test (needs Chrome + puppeteer-core)
node tools/vehicle_sheet.mjs         # contact sheet of every vehicle model; fails on a placeholder
node tools/closeup_check.mjs         # in-app close-ups: hulls at the waterline, wheels on the ground
```

## Credits

Made with Natural Earth. Earth imagery: NASA Earth Observatory (Blue Marble Next Generation, Black Marble
2012), public domain. CLIWOC 2.1 logbook sample: Jones et al. (2007) and García-Herrera et al. (2010),
CC BY 3.0. Airport coordinates: OurAirports, public domain. Font: Inter, SIL OFL 1.1. three.js and
globe.gl: MIT. Full notices: [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

## License

Code: MIT. Original documentation, hand-written route reconstructions, screenshots and walkthrough
videos: CC BY 4.0. Third-party libraries, imagery, fonts and datasets keep their own licenses. See
[LICENSE](LICENSE), [DATA.md](DATA.md) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
