# Changelog

## v3.1.6 (2026-11-17) — Topics navigation

- Behind a `topicNav` flag that stays off on a normal visit (`?flag=topicNav`): a Topics button appears in the header, near Help and Encyclopedia, and in the phone quick buttons. The first list has only Historical Bells (order 1). Opening Topics shows a short list; tapping a topic shows a short overview and links to existing encyclopedia entries. The globe, Sampler, layers and the clock stay as they are. Show on the globe is not in this slice. A deep link `#/topic/<id>` opens that overview when the flag is on, and is ignored when the flag is off. Desktop and lite ship the same list.

## v3.1.5 (2026-11-17) — small fixes

- The heavy-layer cap is re-applied when the selection or the window narrows (Focus, a tighter region, leaving a state so county packs unload, or a resize that drops the cap from 5 on a desktop to 3 on a phone). Layers past the cap turn off in turn-on order; the ones that still fit stay on and loaded. A test hook, `window.__sgLayerHook`, reports the active layers and the cap, and is exposed only in test mode (`?capture=1` or `?shot=1`).
- Terrain still uses the current USGS 3DEP archive (zooms 0–6, zoom 6 partial). Zoom 7–8 tiles are not in that archive [UNKNOWN]; at those camera zooms the closest available tile is used, the coverage note says so, and no elevation is invented. Byte size and coverage of a complete zoom 7–8 set remain [UNKNOWN].
- Croatia HR-11 (Požeško-slavonska) is now in the borders layer, taken from Natural Earth 1:10m row HRV-1604. The row copies iso and name from HR-12, but identifying fields on the same row (name_en, wikidataid Q58111, fips HR11, gns_adm1 HR11, gns_name, hasc_maybe HR.PS, and woe_label) prove it is HR-11. Vietnam's Bắc Kạn, Hưng Yên and Đồng Nai remain source gaps: they appear only as Natural Earth regional rows that reuse those ISO codes, and those geometries are the regions, not the provinces.
- The admin-1 rebuild now relabels that Croatia row inside features_for, so a full rebuild keeps HR-11 and no longer raises NameError at the Great Britain merge.


## v3.1.4 (2026-11-15) — Historical bells

- A Historical bells layer (off by default, light, and lazy-loaded) covers 25 sourced bells. Four keep official USGS GNIS coordinates; the rest are pinned at the last known building or site named in the cited source. Approximate coordinates come from OpenStreetMap or Wikidata and are marked approximate. Those coordinate links are kept in the entry’s coordinate source so citations stay primary. Credit: © OpenStreetMap contributors (ODbL). The layer panel shows that basis. The Campana de la Independencia still has no known cast year.
- Each bell is an encyclopedia entry with name, place, cast year, founder, short facts and primary-source links. Bells with a known cast year appear on the time slider. The Campana de la Independencia has no cast year; only the 1891 move to the Palacio Nacional is stated.


## v3.1.3 (2026-11-15) — contributions, ships toggle, and region performance

- CONTRIBUTING.md and tools/check_contribution.py describe how to add points, routes and regions: submissions merge into an existing file, never add a new one, and the checker prints plain errors.
- A Ships and assets layer toggle (on by default, remembered with the window layout) hides every moving ship, aircraft and vehicle and stops their animation while it is off. The Guide has a short entry.
- Country and state names still appear at the same zoom levels. Below state level, county and town shapes draw only for the state or country in view and unload when the selection changes, so the 3,224 US counties and the town packs are never all drawn at once.
- Evicting a county or town pack also drops its in-flight load record, so returning to a state fetches that pack again instead of keeping it in memory.


## v3.1.2 (2026-11-15) — layer load guard and complete admin-1 coverage

- Overlays now declare a weight in a small layer registry. Heavy layers (wind,
  borders and regions, live town boundaries, air hubs, launch sites, Census
  boundaries and terrain) are capped at 5 at once on a desktop and 3 on a phone
  or in the lite edition. Turning on one more shows a short notice and does not
  load it; the others stay as they are. Light layers are not capped, and no
  new layer turns on by default.
- The 1:10m admin-1 build now keeps every Natural Earth row for a country
  (duplicates removed by adm1_code) and repairs polygons after rounding. The
  fifteen smallest countries share one rest pack so the lite build has 10 file
  slots of headroom (590 files). A second HR-12 row and a near-zero-area
  SI-054 copy are dropped, not relabelled. Source gaps: Croatia HR-11
  (Požeško-slavonska); Vietnam's Bắc Kạn, Hưng Yên and Đồng Nai, which appear
  only as Natural Earth regional rows.


## v3.1.1 (2026-11-15) — states and provinces for every country

- The Borders and regions layer now has Natural Earth admin-1 states and provinces for every
  country on the globe, not only the previous nine. The nine existing 1:50m packs are unchanged.
  The others come from the 1:10m admin-1 set, simplified for the globe and the lite size limit,
  and are still credited only to Natural Earth.


## v3.1.0 (2026-11-15) — Census PMTiles borders and USGS 3DEP terrain

- Behind flags that stay off on a normal visit (`?flag=pmtilesBorders`, `?flag=terrain`): US Census
  TIGER/Line 2026 boundaries and USGS 3DEP terrain can be turned on from the Layers panel. Both
  toggles start off and are remembered in this browser (not during tests).
- Tiles load from the existing asset host under `pmtiles/`. A missing file or 404 shows a short
  “layer unavailable” note and does not throw; other layers keep working.
- Terrain draws only where samples exist and leaves the current globe elevation everywhere else.
  Coverage is US-centred, zooms 0–6, zoom 6 partial. Census archives are drawn only at zooms they
  contain (cousub and place stop at zoom 10).
- Credits: U.S. Census Bureau, TIGER/Line 2026; U.S. Geological Survey, 3DEP. Nothing is uploaded
  or default-on until Review and an owner YES.
- Framing is allowed only when the parent is Grok.me (`https://grok.me` or `https://*.grok.me`),
  so the Grok.me lite app can show SeaGlobe in an iframe. For any other parent, the page tries
  to break out of the frame. If that is blocked, it stops loading, replaces the page with
  “SeaGlobe must be opened directly.”, and does not start the app. GitHub Pages cannot send
  framing headers, so this is done in the page.
- A short in-app Guide lists each feature in one or two lines. Open it from the Help
  button or the Encyclopedia's Guide tab; the list is searchable. Layer toggles have a
  one-line tip. The same Guide entries sit in the encyclopedia and the offline chat index.

## v3.0.3 (2026-11-14) — phone radio close, window icon, clock and help wording

- On a phone, the sheet’s × no longer covers the Radio quick button. The close control sits in the
  header flow, and the header test checks the phone quick buttons at 390×844 and 414×844.
- The Window controls button is an inline SVG icon, so it does not depend on a font. Help and the
  encyclopedia call it Window controls.
- The How to go deeper note (and the encyclopedia entry) now says that Esc closes the Ship’s Log
  first, then clears Focus, which is what the key already does.
- The header-overlap test also runs with help=1 so the note’s Got it button is checked.
- A cache-bust query such as `?t=1794704953840` no longer throws “bad date” or breaks the clock.
  Only a parseable year or date sets the clock; use `?cb=` to cache-bust the page.
- The published `version.json` (the Pages site) is stamped at assemble time with the commit and the
  zip sha256. The zip itself still keeps placeholders, so it does not have to contain its own hash.
- The optional chat Worker has a unit test for the network-failure 502 path.

## v3.0.2 (2026-11-14) — window headers, how-to help, tour captions

- Window controls (⧉) now sit in the header flow: at the end of the tab row on the side panel, and between
  the title and the right-hand buttons on the radio, encyclopedia and Ship's Log. They no longer sit on top
  of Export CSV or the Voyage tab. A test checks that header buttons and tabs do not overlap, at phone,
  desktop, 4K and 8K sizes.
- A short, dismissible “How to go deeper” note on the Layers tab (and the same text as an encyclopedia
  entry, so Ask can find it) covers zooming from countries to states, counties and towns, the Region
  breadcrumb, live US town boundaries, air hubs, the space layer, map tools, Focus, the Ship’s Log,
  Encyclopedia Search, Ask and Listen, narrated tours with Next, and the window controls. It does not
  start anything on its own. The phone sheet has it too.
- Tour and Listen captions are built with the DOM (textContent): a styled title and a separate “Stop 1 of 8”
  counter. HTML tags no longer show up as text in the caption.

## v3.0.1 (2026-11-14) — narrated tours, radio window, shared windows

- Narration in Go deeper starts only when you press a tour or Listen button. Opening the tab does not start it, and a
  tour no longer advances to the next stop on its own (not when a clip ends, and not when the speech voice errors).
- A speech error no longer skips through the rest of the tour. Press Next for the next stop, or Stop to end it.
- Creedence Radio has a minimize control that collapses it to a visible on-screen mini player: the real YouTube
  iframe stays at least 200×200 CSS pixels, uncovered, with its controls usable, docked in a corner, plus the title
  and Expand next to it. The player stays mounted and keeps playing while you open other panels, tabs and layers.
  If a 200×200 tile cannot fit above the globe controls, playback is paused instead. If a media key or the player
  itself tries to start while that hidden paused state is on, it is paused again; a media-key Play expands the panel
  instead of starting audio out of sight. Only Close (×) stops and destroys the player. There is still no autoplay.
- Shared window system for the radio, encyclopedia, Ship's Log and the side panel: drag, resize from edges and
  corners, lock / unlock, content zoom that does not change the globe zoom, a dock for minimized windows, and a
  Reset layout button. The layout is remembered in this browser (not during tests). A stored zoom outside the
  normal range is clamped when the layout loads. On a phone the panels stay as snap-to-edge sheets; the dock and
  the radio mini player sit above the globe controls and do not cover them.


## v3.0.0 (2026-11-14) — atlas framework

- **Encyclopedia ("Go deeper")**: every vehicle, route, place, region and space entry in one searchable panel, with
  Browse, Ask and About tabs, a Listen button on entries and "show on globe".
- **Regions drill-down**: countries, US states, counties and towns from Natural Earth packs that load as you zoom, a
  breadcrumb chip for the view centre, and an opt-in live layer of US places from the Census TIGERweb service (health
  check first; skipped with a message when it is down).
- **Map tools**: airport hubs layer (1,197 airports from OurAirports), distance measuring in km / mi / nmi,
  a coordinates readout and a print view of any entry.
- **Space layer**: 75 launch sites and yearly payload counts from GCAT (CC BY), satellite counts scaled to the
  catalogue, and illustrative orbit rings (inclination and mean altitude; not live positions).
- **Guided tours with narration**: eras, air and space tours read from the entries' own text by the browser's speech
  voice, with captions; `?mute=1` gives captions only.
- **Grounded chat (Ask)**: answers only from the atlas entries it retrieves and cites them; anything it cannot ground
  is [UNKNOWN]. Written answers need the visitor's own xAI API key (chat settings; kept in this tab by default, or
  on this device if they tick "Remember"; "Forget key" clears it). The browser calls the xAI API directly; the
  visitor pays xAI for their own use. Without a key the chat is offline and shows the matching entries.
- **Creedence Clearwater Revival Radio**: the official "Chronicle: The 20 Greatest Hits" YouTube playlist in a
  standard embed that loads only when you click, plus two outside-site links. SeaGlobe hosts no audio.
- **Editions**: full (`index.html`), lite (`lite.html`, the Grok.me build) and BYO (`byo.html`, PC only, your own TLE
  and receiver feeds). A Content-Security-Policy is generated for each page from `data/csp.json`.
- **Version check and update path**: `version.json`, a read-only check against the public site (short timeout, silent
  offline) and an update notice; large assets can come from an R2 base URL with Pages fallbacks.
- **Vehicle models**: the jet's tail was backwards (the fins swept forward) and the wing-tip navigation lights were on
  the wrong sides; both fixed. New parametric aircraft: generic jet, de Havilland Comet, Concorde (droop nose),
  Boeing 747 (hump forward, four podded engines), DC-3, piston airliner and Wright Flyer (canard forward, pushers aft),
  with landing gear near airports, spinning propellers and banking in turns. Steamship lifeboats and portholes. Close-up
  detail is a separate level of detail; the lite build leaves it out. Routes round their corners over 20 km so the nose
  follows the course (tests/test_models.mjs checks every moving model within 5 degrees).
- **Credit**: "Built by AdventureNLearn" in the footer, the About tab and the README.

### Encyclopedia coverage

- Every entity in the app now has an entry, and the chat indexes all of them: routes, ships and aircraft, vehicle
  types, eras, route families, air hubs, launch sites, spacecraft, yearly launch counts, regions at every drill-down
  level, every town label (7,342), the drill-down levels, tours, outside projects, the radio, the three editions,
  the chat, the version check, the background starfield, the credit, and every cited source (12,857 entries in all).
  Entries are built only from the bundled data and its cited sources; where no history has been written, the entry
  says [UNKNOWN]. `tests/test_coverage.mjs` fails if any data entity has no entry or the chat index misses one.
- `tools/build_town_index.py` writes one small town list (`web/data/regions/towns-index.js`) so search does not
  need the 225 town packs.

### Wall displays, security and the PC update script

- **4K and 8K screens:** every UI size scales with one CSS factor (`--ui`: 2 at 3840×2160, 4 at 7680×4320), so text
  and panels keep the share of the screen they have at 1920×1080. The globe's drawing buffer is capped at about
  7680×4320, and the 8K day texture (from the R2 asset host) is used on desktop editions. `tests/test_large.mjs`
  checks both sizes at devicePixelRatio 1 and 2.
- **Content-Security-Policy:** published pages allow no localhost and no inline styles (the three fixed style blocks
  of the bundled globe.gl library are allowed by hash). The PC-only BYO page allows this computer plus the exact
  origins of the feeds you save, instead of any host. Test servers add their local hosts only to what they serve.
- **Radio:** a track that cannot be embedded is skipped only after you have started playback yourself.
- **PC update script:** installs to `%LOCALAPPDATA%\SeaGlobe` by default and checks the `-Rollback` value.

### Known gaps in v3.0.0

- The videos page still shows the earlier walkthroughs (atlas, ships, air). They were recorded before v3.0, so they show
  the older aircraft models and do not cover the v3.0 features. New narrated walkthroughs are scripted in
  `tools/video/features/` and will be recorded in a later release.
- Large files (HD textures, GCAT tables, the full-quality atlas walkthrough) come from the R2 asset host, with the repo
  copies as fallbacks.

## v2.3 (2026-11-14) — air layer, 1903 to today

- **26 historic air corridors** in three new family files: `air-pioneers` (Wright Flyer at Kitty Hawk 1903, first US Air
  Mail 1918, transcontinental air mail 1920–1927, Aéropostale Toulouse–Dakar and Mermoz's 1930 South Atlantic flight),
  `air-interwar` (Imperial Airways to Karachi, Cape Town and Brisbane, KLM to Batavia, Pan Am China Clipper 1935 and
  Yankee Clipper 1939, American Airlines' first DC-3 service, both Berlin Airlift corridors) and `air-jet-age` (BOAC Comet
  1952, SAS polar routes 1954 and 1957, Pan Am's first 747 service, Qantas 747 Kangaroo Route, Concorde, Singapore
  Airlines SQ21 and SQ23, Qantas Perth–London). Same record schema as the ship routes; every record
  `reconstruction: true` with cited history, story and facts; dates only where a cited source gives them, gaps [UNKNOWN].
- **OurAirports slice** (public domain): `data/sources/ourairports/airports-slice.csv`, every large airport plus the
  historic fields the corridors use, made by `tools/slice_ourairports.py`. No OpenFlights, no ADS-B.
- **Three new aircraft models and cards:** Wright Flyer (1903), Douglas DC-3 / C-47 and Boeing 747, plus cited cards for
  11 named aircraft on dated flights. Other corridors use the existing piston-airliner and jet models as stand-ins and say so.
- **Air arc height:** air routes still rise to 0.062 × Earth radius at mid-route on long routes; routes shorter than
  about 1,900 km now scale their arc down (assumption, see the record notes) so short hops do not tower over the map.
- The air-* families have their own legend colours, so every earlier family keeps its colour. Aircraft use the same
  on-screen speed cap as ships. No other interface changes; the phone layout is unchanged.
- Tests: `tests/test_air.mjs` (browser: corridors load; Wright Flyer, DC-3 and 747 selectable with cited cards; a 747
  clickable at 20×; Ship's Log Type = air), three engine tests for the air records. The desktop-layout check now
  counts the 26 new Ship's Log rows instead of comparing them; every other box still matches the v2.2.1 baseline.
- Video: `walkthrough/air-layer-walkthrough.mp4`, listed on the videos page.
- Pages workflow: actions updated to current majors that run on Node 24 (checkout v7, configure-pages v6,
  upload-pages-artifact v5, deploy-pages v5), which removes the Node 20 deprecation warning.

## v2.2.1 (2026-11-14) — phone layout

- Phones only (`@media (max-width: 820px)` plus `web/js/mobile.js`, gated on the same query); the desktop
  layout is unchanged.
- The globe fills the screen; a slim top strip shows the name, era and date; one bottom bar holds play,
  1×/5×/20×, the moving count, a menu button and the year scrubber.
- The menu button opens one slide-up sheet: Sampler, Ship's Log, era chips and the Voyage / Routes / Layers /
  Go deeper tabs (the legend is in Layers). The Ship's Log is its own full-height sheet.
- Tapping a vehicle opens the voyage card as a bottom sheet (14 px text; the globe shifts up so the vehicle
  stays in view). Close it with ×, a swipe down on the sheet header, Esc or a tap on empty globe.
- No floating legend, hover tooltip or crowd of labels on a phone; every control is at least 44 px.
- Touch: a tap uses a 44 px pick radius (mouse stays 36 px) and the clock brakes under the finger.
- New `tests/test_mobile.mjs`: desktop layout at 1536×864 and 1920×1080 matches a saved v2.2 snapshot;
  at 390×844 and 360×800 with touch, no overlapping or off-screen panels, 44 px targets, menu and Ship's Log
  sheets, tap-to-select with the card opening and closing, and the fastest vehicle at 20× can be tapped.

## v2.2 (2026-11-14) — selectability fix and cited content pass

- **Ships and jets are easy to select:** no visible vehicle moves faster than about 140 px/s on screen
  (the clock eases instead, so dates stay true); time eases to a stop as the pointer comes near a
  vehicle and holds while it is under the pointer; larger hover/click targets and a short sticky click.
  Trade-off: in jet-heavy modern years the 20× button runs at roughly 1–2× pace, because the cap wins.
- **Content pass:** all 69 routes, 9 named ships and aircraft and all 26 vehicle types have a history,
  a story, key facts and citations (241 citation references), shown in the existing voyage card. Nothing
  is invented: 30 facts no source gives are marked **[UNKNOWN]**.
- Data fixes: two air routes no longer start before their airports opened (PVG–LAX from 1999,
  GRU–JNB from 1985); London–New York jet citation filled.
- Ship's Log search covers history, story and ship names; the CSV export gains history, story and
  content citation columns. No layout or style change.
- New: `web/data/content.js`, `tools/content_routes.py`, `tools/content_assets.py`, `tools/enrich.py`;
  data tests require history, story and a citation for every entry; a browser test hovers and clicks the
  fastest on-screen vehicle. Screenshots `screens/v2.2-card-*.png`.

## v2.1 (2026-11-14) — detailed vessel models

- Every vehicle type has a detailed procedural model (26 types): smooth lofted hulls with waterline
  paint and wales, code-generated plank / sailcloth / steel textures, billowed sails, automatic
  standing rigging, deck fittings, and smoke on steamships and trains.
- New models: Ming treasure-ship, mule-towed canal-boat, ox-wagon, diesel and electric trains,
  propeller airliner, detailed decorative satellites, and a pipeline section with a pulse.
- **Floating-hull fix:** vehicles and wakes sit on the drawn (faceted) globe surface, so hulls meet
  the water at the waterline and wheels and feet meet the ground at any zoom. Route lines ride a
  constant offset above that surface.
- Contact sheet of every model: `screens/v2.1-all-vehicles.png`. Close-ups: `screens/v2.1-closeups.png`.
- Walkthrough videos are in the repository: `walkthrough/seaglobe-ships.mp4` (0:59, 1280×720) and
  `walkthrough/atlas-walkthrough.mp4` (2:59, 1920×1080), plus stills `screens/v2.1-walk-*.png`.
- Two-edition design notes for a later photoreal / lite split: [DESIGN-V3.md](DESIGN-V3.md).
- Tests: 13 engine tests, 7 data/hygiene tests, 8 headless browser tests, plus the contact-sheet and
  close-up tools.

## v2 (2026-11-13) — organised globe, Ship's Log, PC package

- **Sampler (idle mode):** the default globe shows a curated, rotating sample of 16 vessels (10 in lite) from mixed eras,
  types and regions, each on its own voyage; one swaps out every 3.5 s with a fade; only their routes, faintly; slow rotation.
- **Focus mode:** era, route type, goods, region, evidence, search or a single route; matching routes and vessels stay
  clear, the rest dims to ~10%. Focus chip in the top bar (× / Esc to clear).
- Routes coloured by **family** with a legend; **level-of-detail** vessel labels (fewer when zoomed out).
- **Ship's Log** panel: search, filters (era, type, goods, region, evidence), sort by date or name, keyboard navigation,
  click/Enter flies there, plays the voyage and opens its info, **Export CSV** (local download).
- Records gain a coarse `region` field (computed from geometry, for filtering).
- Fixed: the sun flare could show through the Earth or from behind the camera.
- `Start-SeaGlobe.cmd` starts `serve.py --open` with the `py` launcher (or `python`), on 127.0.0.1,
  and opens the browser; without Python it opens `web\index.html` in lite mode.
  `Start-SeaGlobe-Window.cmd` keeps the optional pywebview window; `Start-SeaGlobe-Browser.cmd` is unchanged.
- `serve.py`: `--open`, steps past a busy port, fixed MIME types (Windows can serve `.js` as text/plain).
- License files: MIT for code; data and asset licenses listed separately.
- Fixed: an invisible full-screen card overlay could block clicks after an era card (`[hidden]` is now
  always respected).

## v1.1 (2026-11-13) — visual sea journey

- Every voyage now has a moving vehicle that follows its great-circle route, faces its heading and leaves a
  fading wake; routes are drawn faintly, the selected one brighter.
- 19 procedural vehicle models across eras (trireme, Roman merchantman, galley, longship, cog, dhow, junk,
  galleon, East Indiaman, frigate, steamship, container ship, barge, camel / llama caravans, horse rider,
  steam train, jet, pipeline flow).
- Timeline 500 BCE – today with BCE labels, play/pause, 1×/5×/20×, scrubber, era bands and era switcher.
- Real dates where a voyage record gives them (dated waypoints such as the *Patriot* at the Cape and
  *Launceston*'s daily positions), otherwise "reconstructed timing".
- Click a vehicle for ship, route, years, goods, source, citations, confidence; pre-1500 marked as
  reconstructions; "Go deeper" links (new tab only; see research/EMBED-CHECK.md).
- Follow (chase) camera, eased fly-ins, slow orbit; active vehicles capped (56, lite 28).
- HD earth from NASA Blue Marble / Black Marble with ocean shine, atmosphere, terminator, city lights from
  about 1880, starfield, moon, decorative satellites from 1957; bloom and a sun flare; lite mode.
- Data split into `web/data/routes/<family>.json|.js` with a shared schema; 69 records in 24 families;
  SOURCES.md generated from the data.
- Dutch-Asiatic Shipping: no DAS file is read any more; dates typed from the published book, cargo [UNKNOWN].
- Tests: engine/schema (node), data/hygiene (python), headless browser smoke test.
- Videos: `walkthrough/seaglobe-ships.mp4`, `walkthrough/atlas-walkthrough.mp4`; captions in
  `walkthrough/CAPTIONS.md`. Screenshots `screens/v1.1-*.png`.

## v1 (2026-11-13)

- First globe of sea routes 1200–1899 with a decade slider, CLIWOC *Launceston* track and DAS sample.
