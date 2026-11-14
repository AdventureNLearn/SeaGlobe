# Backlog

Not done in v1.1 / v2. In rough priority order.

1. **Dataset-derived lines** (allowed licenses only, see research/ROUTE-SOURCES.md):
   ORBIS (CC BY 3.0) and Itiner-e (CC BY 4.0) Roman roads and sea lanes; Pleiades (CC BY 3.0) place
   coordinates for ancient ports; World Bank global shipping density (CC BY 4.0) for modern lanes;
   French railways (CC BY 4.0); Scottish Canals (OGL 3.0); CEPII BACI (Etalab 2.0) for modern goods.
   Today all ancient and medieval geometry is hand-drawn from published history (labelled reconstruction).
2. **More families:** Suez and Panama as their own canal sea lanes with traffic; more rail
   (Cape-to-Cairo segments, Indian railways, Orient Express); more air hubs from OurAirports;
   more pipelines; a full Atlantic and Pacific steamship network; Portuguese Carreira da Índia;
   Arab-Swahili coast; Mississippi and Rhine river traffic.
3. **More logbooks:** more CLIWOC cruises (CC BY 3.0) as dated voyages with daily positions.
4. **CC0 vehicle models** (Kenney, Quaternius, Smithsonian CC0) where they fit an era better than the
   procedural ones.
5. **Real star catalogue** (Yale BSC / Hipparcos, public domain) once a reachable source is found;
   **NASA cloud layer** (public domain).
6. **Single-file lite build** (`tools/build_single.py`) for hosts that want one HTML file. What Grok.me
   accepts (file count, size limits, whether WebGL and local files are allowed) is [UNKNOWN].
7. More era cards (Late Antiquity, Medieval, Industrial, Modern), on request.
8. Keyboard shortcuts and screen-reader descriptions of the moving vehicles.

## Next phase — v2.2: transport and technology layers (planned 13 Nov 2026 ET)

Every form of transport and technology as a toggleable layer, especially space, air and undersea. Not started.
Same rules as the rest of the atlas: every item cited, with start/end dates and goods or services carried;
reconstructions labelled (`reconstruction=true`, citations, confidence level); restricted datasets never
copied or traced, only linked from "Go deeper"; gaps marked [UNKNOWN].

- **Space:** launches, crewed missions, space stations, satellite constellations, the Moon missions.
  The current satellite layer is decorative; v2.2 would replace or sit beside it with cited records.
- **Air:** balloons, airships, early aviation, airmail, airline eras, jets. (Models for the piston
  airliner and jet exist; no pre-1958 air routes are in the data yet.)
- **Undersea:** submarines; telegraph and fibre-optic undersea cables.
- **Also consider:** overland telegraph and radio; the Pony Express and postal routes.
- **Layers tab design:** today it is a flat list of 6 checkboxes (web/index.html, Layers tab). It cannot
  hold ~15 more layers as is. Plan: grouped, collapsible sections (Transport: sea / river and canal / land /
  rail / air / pipeline; Space; Undersea; Communications), a per-group "all on/off", a count of visible records
  per layer, and the same toggles reachable from the Ship's Log "Type" filter. Layer state should stay in
  the URL query so screenshots and the video scripts can set it.
- New vehicle models needed then: balloon, airship, biplane, submarine, cable ship, rocket / capsule,
  space station; each added to `schema.vehicles`, the no-placeholder test and the contact sheet.
- Data sources and their licences for each layer: [UNKNOWN] until researched.

### Two builds: "full" local edition and "lite" Grok.me edition (13 Nov 2026 ET)

The full version does not need to fit Grok.me; it can be hosted locally from the GitHub repo.
Plan two builds from the same data and code:

- **Full (local) edition:** photoreal PBR materials; CC0 or permissively licensed glTF models where the
  licences allow (each listed in ASSETS-LICENSES.md, otherwise keep the procedural model); Gerstner-wave
  ocean; buoyancy roll and pitch; wind-driven sails; spreading wakes; smoke drift; banking aircraft; LOD so
  far vessels stay simple and only near ones get the heavy models. Runs offline from the local repo.
- **Lite edition (existing):** the current app, kept within what Grok.me accepts (limits still [UNKNOWN],
  see item 6).
- Open questions: build switch (query flag vs. separate entry page), performance budget on a local PC
  [UNKNOWN], and which glTF sources qualify [UNKNOWN] until researched.
- **Architecture written:** see [DESIGN-V3.md](DESIGN-V3.md) (design dated 13 Nov 2026 ET):
  quality-tier switch; PBR/glTF/LOD pipeline; Gerstner ocean and buoyancy; sails and wind; aircraft banking;
  space, air and undersea layers; per-model licence plan (CC0 or CC BY only, recorded in ASSETS-LICENSES.md);
  phased build order. Design only, build not started.

## Air-traffic layer (planned 2026-11-14)
- Reuse the SeaGlobe route format for real flight data: group by airline and by aircraft (tail number), draw and animate each one's routes.
- Pluggable sources: optional third-party flight-data exports (only with permission and within that source's terms; some commercial flight-data providers restrict redistribution), OpenSky Network (non-commercial), BTS on-time/route data (public).
- Start after the v2.1 release ships.
