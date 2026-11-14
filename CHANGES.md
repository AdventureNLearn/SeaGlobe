# Changes

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
