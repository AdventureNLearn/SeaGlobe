# SeaGlobe v3 design — two editions from one codebase

Status: **design only, not started** (design dated 13 Nov 2026 ET). Build order is in §9.
Rules that carry over unchanged: every record cited with dates; reconstructions labelled
(`reconstruction=true`, citations, confidence); restricted datasets never copied or traced, only linked
from "Go deeper"; gaps marked [UNKNOWN]; everything hosted locally and working offline.

## 1. Two editions

| | **Full** (local PC edition) | **Lite** (Grok.me edition) |
|---|---|---|
| Where it runs | Served locally from a clone of the GitHub repo (`serve.py` / Start-SeaGlobe*.cmd) | Uploaded to Grok.me |
| Size budget | No hard cap; large assets go in Git LFS or a GitHub Release, not plain git (100 MB file limit) | Must fit Grok.me limits — [UNKNOWN] until checked (see BACKLOG item 6) |
| Vehicles | glTF models (where licence allows) + procedural fallbacks, PBR, LOD | Procedural models only (today's `vehicles.js`) |
| Ocean | Gerstner-wave ocean near the camera, shader shine far | Today's shader shine |
| Motion | Buoyancy roll/pitch, wind-driven sails, spreading wakes, smoke drift, banking aircraft | Simple heading + bob |
| Data | Same `web/data/routes/*` files, same schema | Same |

One codebase, one data set. The edition is a **quality tier**, not a fork.

## 2. Quality-tier switch

- `SeaGlobe.tier` = `"lite" | "standard" | "full"`, chosen in this order: URL `?tier=`, saved setting,
  then auto-detect (WebGL2, `MAX_TEXTURE_SIZE`, device memory, a 2-second frame-time probe).
  `?lite=1` keeps working and maps to `tier=lite`. `file://` mode forces lite (as today).
- A single `tiers.js` table holds every knob: vehicle cap, LOD distances, texture sizes, ocean on/off and
  grid size, shadow on/off, bloom, wake particle budget, star count, glTF on/off.
- The Grok.me package is built by `tools/build_edition.py --edition lite`: copies only lite assets, sets the
  default tier, and fails if the output exceeds the Grok.me budget. `--edition full` builds the local one.
- Runtime fallback: if average frame time stays above 33 ms for 5 s, drop one tier and show a small notice.
- Tests: every tier boots in the headless smoke test; lite package size check; no glTF referenced by lite.

## 3. PBR, glTF and LOD pipeline

- Source models go in `assets/models/src/` (outside `web/`), each with a `model.json` sidecar: name,
  author, source URL, licence (CC0 or CC BY only), attribution text, date fetched, changes made.
- `tools/models/build.mjs` (gltf-transform, MIT): dedupe, weld, simplify into LOD0/LOD1/LOD2, KTX2/Basis
  textures, Draco or meshopt compression, normalised scale (metres) and orientation (bow +X, waterline y=0).
  Output to `web/models/<type>/lod{0,1,2}.glb`. Build fails if a sidecar is missing or the licence is not
  CC0 / CC BY.
- Materials: `MeshStandardMaterial` / `MeshPhysicalMaterial` (base colour, normal, ORM maps); an
  environment map from a CC0 HDRI (e.g. Poly Haven) for reflections; procedural models get the same PBR
  parameters so mixed scenes match.
- LOD per vehicle: LOD0 glTF close up (follow camera), LOD1 simplified glTF or procedural, LOD2 the
  procedural silhouette, LOD3 a billboard/point when tiny. Distances in `tiers.js`. Far vessels stay simple
  (a design requirement). Instancing for repeated far models.
- The existing contract stays: `SeaVehicles.build(type)` returns an object sitting on the facet surface;
  the no-placeholder, waterline/ground-contact and contact-sheet tests run on every LOD.

## 4. Ocean and buoyancy

- Globe stays a sphere: the Gerstner ocean is a **local patch** (a curved grid in the camera's tangent
  frame, ~5–50 km) shown only when the camera is close (follow mode); far away the current shader shine
  is kept. The patch fades in by distance so there is no visible seam.
- 4–6 Gerstner waves; amplitude/direction from a per-era, per-region "sea state" table (calm Mediterranean
  summer vs. Cape of Good Hope); values are illustrative and labelled so, unless a cited source exists.
- Buoyancy: sample wave height at 4–6 hull points per vessel on the CPU (same Gerstner function as the
  shader) → heave, roll, pitch, smoothed by a per-type damping value (trireme vs. container ship).
- Wakes: Kelvin-angle (≈19.5°) spreading foam ribbons + particle spray at the bow, scaled by speed;
  budget per tier. Must keep the hull-on-water test passing (waterline within tolerance of the patch).

## 5. Sails and wind

- Wind field: a coarse lat/lon/month table of prevailing winds (trade winds, westerlies, monsoon reversal
  in the Indian Ocean). Source: public climatology — specific dataset and licence [UNKNOWN] until
  researched; until then labelled "illustrative winds".
- Sails: vertex-shader billow (cloth-like bulge) driven by apparent wind = true wind − ship velocity;
  luff flutter when the sail is near the wind; yards/booms rotate toward the best trim. Lateen, square,
  junk-batten and fore-and-aft rigs each get their own profile.
- Flags and pennants show wind direction; smoke from steamships and trains drifts downwind and thins
  with height (particle budget per tier).

## 6. Aircraft

- Great-circle paths with a climb/cruise/descent altitude profile; bank angle from turn rate
  (bank ≈ atan(v·ω/g), capped per type), pitch on climb/descent, contrails above a set altitude for jets.
- Types: balloon, airship, biplane, piston airliner (exists), jet (exists), later supersonic. Each in the
  schema, the no-placeholder test and the contact sheet.

## 7. Space, air and undersea layers (from BACKLOG v2.2)

- **Space:** launch sites and dated launches, crewed missions, space stations, satellite constellations,
  Moon missions. Real orbits from public element sets where the licence allows ([UNKNOWN] per source);
  otherwise schematic, labelled. Rocket/capsule and station models.
- **Air:** balloons, airships, early aviation, airmail, airline eras, jets; hub data from OurAirports
  (public domain, already used); historical routes cited per record.
- **Undersea:** submarines (schematic, cited), telegraph cables from 1858/1866, fibre-optic cables.
  Cable route geometry: only from openly licensed sources; restricted maps are linked, never traced.
- Layers tab redesign: grouped, collapsible sections, per-group on/off, record counts, URL state
  (details in BACKLOG.md).

## 8. Per-model licence plan

- Allowed: **CC0** and **CC BY** (any version) only. Not allowed: NC, ND, SA, "editorial", "free for
  personal use", unclear or missing licences, or models ripped from games/films.
- Candidate sources (each model still checked one by one): Poly Haven (CC0), Kenney (CC0), Quaternius
  (CC0), Smithsonian Open Access 3D (CC0 items only), Sketchfab models explicitly marked CC BY or CC0,
  NASA 3D Resources (NASA media guidelines, not a CC licence — usable only if confirmed acceptable;
  [UNKNOWN]).
- Every model gets one row in **ASSETS-LICENSES.md**: type, file, author, source URL, licence, attribution
  text, changes made, date checked. CC BY attribution also shown in the app's credits panel.
- Historical accuracy note per model (e.g. "generic 17th-century fluyt, not a specific ship").
- A test reads all `model.json` sidecars and fails on any licence outside the allow-list or any model
  file without a row in ASSETS-LICENSES.md. When no acceptable model exists, the procedural model stays.

## 9. Phased build order

1. **Tier switch** (`tiers.js`, auto-detect, fallback, edition builder, size check, tests). No visual change.
2. **PBR pass on procedural models** + CC0 HDRI environment; contact sheet re-shot.
3. **glTF/LOD pipeline** with 2–3 pilot models (e.g. galleon, container ship, jet) and the licence test.
4. **Ocean patch + buoyancy + spreading wakes** (follow camera only), hull tests extended.
5. **Wind table + sails + smoke drift.**
6. **Aircraft banking/climb profiles**, new air vehicle models.
7. **Layers tab redesign**, then **Air**, **Undersea**, **Space** data layers (each fully cited).
8. Remaining glTF models type by type; performance pass per tier on typical desktop hardware ([UNKNOWN] until measured).
9. Re-render walkthrough videos (full edition), lite package for Grok.me, release.

Each phase ends with tests green, a screenshot set, a CHANGELOG.md line and a local commit.
