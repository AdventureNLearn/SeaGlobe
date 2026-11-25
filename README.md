# SeaGlobe — routes of the world, 500 BCE to today

Built by AdventureNLearn — [@AdventureNLearn](https://x.com/AdventureNLearn)

## Read first / Risks

- SeaGlobe is a **static**, **offline-capable** web app. Libraries, textures, fonts and data are in this
  repository. It works with no network. The only requests it can make to other hosts are:
  - a read-only **version check** of `version.json` on the public site (short timeout, silent when offline;
    `?update=0` turns it off);
  - the **live US town boundaries** layer (US Census TIGERweb), only when you switch it on;
  - **Creedence Clearwater Revival Radio**: the YouTube player loads only after you click "Load the player";
  - the **Ask** chat, only after you paste **your own** xAI API key in chat settings: questions then go straight
    from your browser to the xAI API (api.x.ai), and you pay xAI for your own use. Without a key it stays offline;
  - the **R2 asset host** `https://seaglobe-assets.idontwanttodothisshit.com/` for large files (8k/4k textures, the GCAT
    tables, the full-quality atlas video), each with the bundled copy as the fallback (the lite edition uses none);
  - in the PC-only BYO edition, the TLE and receiver feeds you type in yourself.
  The page's Content-Security-Policy (from `data/csp.json`) allows only these hosts.
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
- Air layer (v2.3): 26 historic air corridors from the Wright Flyer (1903) to today's nonstop long-haul routes,
  with Wright Flyer, DC-3 and Boeing 747 models; every corridor a cited reconstruction. Ship's Log Type = air focuses it.
- Click any vehicle: ship, route, years, goods, source, citations and a confidence level, plus a cited
  history, story and key facts for the route, the named ship (where there is one) and the vehicle type.
- Vehicles are capped at an on-screen speed you can follow, and time eases to a stop as the pointer
  nears a vehicle, so even jets can be selected. Dates stay true; only the clock slows.
- **On a phone** the globe fills the screen with one bottom bar (play, speed, year, menu). The menu opens a
  slide-up sheet with eras, layers, routes and the Ship's Log; a tapped vehicle's card opens as a bottom sheet.
- Follow camera (chase view), eased fly-ins, slow orbit.
- **Go deeper (v3.0)**: an encyclopedia of every vehicle, route, place, region and spacecraft, with search, Browse,
  Ask (grounded chat that cites the entries it used, [UNKNOWN] otherwise) and About tabs, and Listen (browser speech
  with captions) on every entry.
- **Regions drill-down**: countries, US states, counties and towns (Natural Earth) load as you zoom in; a breadcrumb
  shows where the view centre is. Live US town boundaries (TIGERweb) are opt-in.
- **Map tools**: air hubs layer (OurAirports), distance measuring (km / mi / nmi), coordinates and a print view.
- **Space layer**: launch sites and yearly payload counts from GCAT (CC BY 4.0) and illustrative orbit rings.
- **Guided tours** (eras, air, space) narrated from the entries' own text.
- **Creedence Clearwater Revival Radio**: the official "Chronicle: The 20 Greatest Hits" YouTube playlist in the
  standard embedded player (starts only when you press play), plus links to two outside radio sites. SeaGlobe hosts no
  audio. Offline it says "Radio needs internet".
- **Vehicle models (v3.0)**: aircraft rebuilt with correct tails and lights, plus de Havilland Comet and Concorde;
  landing gear near airports, spinning propellers, banking in turns, filling sails and drifting smoke; a lighter level
  of detail for the lite build. All models are artistic impressions made in code.
- **Editions**: `index.html` (full), `lite.html` (smaller, for hosted builders) and `byo.html` (PC only: your own
  satellite TLEs and aircraft receiver feed). An update notice appears when the public site has a newer version.
- Earth from NASA Blue Marble / Black Marble (public domain) with ocean shine, atmosphere, a day/night
  terminator, city lights from the industrial era on, starfield, a moon and a decorative satellite layer
  for the space age.

## Chat with your own xAI key

SeaGlobe has no chat server, no key and no account. The Ask tab works in two ways:

- **No key (default):** offline. It answers from the encyclopedia entries it finds and links them.
- **Your own key:** paste your xAI API key in *Chat settings* (get one in the xAI console, https://console.x.ai/).
  The question and the matching entries go straight from your browser to `https://api.x.ai/v1/chat/completions`,
  and the reply must cite those entries. **You pay xAI for your own use**, at xAI's prices.
  - The key is kept in `sessionStorage` (this tab only) unless you tick *Remember on this device*
    (`localStorage`). *Forget key* removes it from both.
  - It is never put in a link, a file or a log, never shown again after saving, and never sent anywhere except the
    xAI API. `tests/test_framework.mjs` checks this.

**Browser calls (CORS).** Checked 14 November 2026 with a preflight and a keyless request (no key sent):
`api.x.ai` answered `OPTIONS /v1/chat/completions` with `access-control-allow-origin: *` and allowed the
`authorization` and `content-type` headers, and a keyless POST came back 400 with `access-control-allow-origin: *`.
So the app calls the API directly. Whether xAI documents browser calls as supported, and whether this stays so, is
[UNKNOWN]; an authenticated reply was not tested from here (no key was used).

**If browser calls ever stop working,** the only fallback is to run the included pass-through
(`worker/chat/`) on **your own** Cloudflare account. It holds no key, stores nothing and forwards your own
`Authorization` header to the xAI API for the origins you list. The app as shipped does not use it; pointing the app
at it would need a code change.

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

- Full site (GitHub Pages): https://adventurenlearn.github.io/SeaGlobe/
- Lite edition (Grok.me): https://seaglobe.grok.me/

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
node tests/test_mobile.mjs            # phone layout (390x844, 360x800, touch) + desktop layout unchanged
node tests/test_air.mjs               # air layer: corridors, Wright Flyer / DC-3 / 747 cards, Type = air
node tests/test_framework.mjs         # v3: encyclopedia, drill-down, tools, space, listen, chat, radio, R2, BYO, phone
node tests/test_models.mjs            # every model's nose follows its travel; fins, lights, engines, LOD
node tests/test_large.mjs             # 4K and 8K wall displays at DPR 1 and 2: UI scale, no overflow, canvas not stretched, 8K texture
node tests/test_coverage.mjs          # every data entity has an encyclopedia entry; the chat index holds every entry
node tests/test_update.mjs            # version compare and the cross-origin version check
cd worker/chat && npm test            # optional pass-through Worker you can run on your own account (mocked upstream)
node tools/check_grokme_lite.mjs      # lite build: manifest, size budget, credit, offline chat
node tools/vehicle_sheet.mjs         # contact sheet of every vehicle model; fails on a placeholder
node tools/closeup_check.mjs         # in-app close-ups: hulls at the waterline, wheels on the ground
```

## Contributing

SeaGlobe accepts additions to existing layer files (airports, launch sites, bells, routes, and regions). A submission must merge into a file that is already in the project; it must not add a new file. See [CONTRIBUTING.md](CONTRIBUTING.md) for the templates, and run `python3 tools/check_contribution.py your-submission.json` to check a submission.

## Credits

Made with Natural Earth. Earth imagery: NASA Earth Observatory (Blue Marble Next Generation, Black Marble
2012), public domain. CLIWOC 2.1 logbook sample: Jones et al. (2007) and García-Herrera et al. (2010),
CC BY 3.0. Airport coordinates: OurAirports, public domain. Space data: GCAT, J. McDowell,
planet4589.org, CC BY 4.0. Boundaries: Natural Earth (public domain); live layer: U.S. Census Bureau TIGERweb.
satellite.js: MIT (BYO edition only). Radio: the official Creedence Clearwater Revival YouTube channel, played in
YouTube's own embedded player under YouTube's terms. Font: Inter, SIL OFL 1.1. three.js and globe.gl: MIT. Full notices: [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

Built by AdventureNLearn — [@AdventureNLearn](https://x.com/AdventureNLearn).

## License

Code: MIT. Original documentation, hand-written route reconstructions, screenshots and walkthrough
videos: CC BY 4.0. Third-party libraries, imagery, fonts and datasets keep their own licenses. See
[LICENSE](LICENSE), [DATA.md](DATA.md) and [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
