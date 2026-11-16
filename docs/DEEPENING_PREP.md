# SeaGlobe — Deepening Session Prep (17 Nov 2026)

Everything needed to start seeding the "everything humans have moved" encyclopedia tomorrow.
Read INTENT.md scope reframing first — it is the boundary.

---

## 1. Automate the index rebuilds (do this FIRST, ~20 min)

**Problem:** encyclopedia index and chat index are rebuilt manually. A forgotten rebuild makes Ask
return [UNKNOWN] for entries that exist — a silent lie worse than a missing entry.

**Fix:** one script, `tools/build_indexes.py`, that:
- Walks `web/data/routes/*.json` and rebuilds the encyclopedia index
  (`web/data/content.js` or wherever SEAGLOBE_DATA.encyclopedia is assembled)
- Rebuilds the chat index the same pass
- Runs `node --test tests/test_coverage.mjs` as its final step and exits non-zero if any
  data entity lacks an encyclopedia entry or the chat index misses one
- Prints a one-line summary: "N entries, M chat-indexed, coverage OK/FAIL"

Wire it three ways:
1. `python tools/build_indexes.py` from the command line (same pattern as build_routes.py)
2. A git pre-commit hook (`.git/hooks/pre-commit`) that runs it and blocks the commit on failure
3. The existing GitHub Pages workflow (`.github/workflows/pages.yml`) — add it as a step before
   deploy so the hosted lite build never ships stale indexes

The hook should be a one-file shell or Python script, no dependencies beyond what's already
in requirements.txt. If a contributor's machine can't run it, the CI step is the backstop.

---

## 2. Schema pass before seeding (~30 min)

Current types: sea, land, river, canal, rail, air, pipeline.
New types needed for the reframed scope:
- `telegraph` — overland telegraph lines
- `radio` — radio/wireless routes (transmitter to receiver)
- `cable` — undersea telegraph and fibre-optic cables
- `orbital` — crewed and uncrewed spaceflight trajectories (launch site to destination)

Each new type gets:
- An entry in `web/data/schema.js` with the same required fields as existing types
- A matching family file template under `web/data/routes/`
- A row in the Layers tab (which means the grouped/collapsible Layers redesign from BACKLOG
  v2.2 becomes load-bearing sooner than planned — 6 checkboxes cannot hold ~15 layers)
- A vehicle model stub in `schema.vehicles` so the no-placeholder test and contact sheet
  don't fail (models can be minimal procedural placeholders marked as such)

**Dual-requirement rule (from INTENT.md, 16 Nov):** any type where the carried thing is not
physical cargo (cable, telegraph, radio, pipeline, orbital) must carry BOTH:
- `path` — the physical infrastructure (wire, poles, pipe, trajectory) with coordinates
- `endpoints` — the stations/terminals/sites at each end
A record missing either fails schema validation. Add this as a conditional check in schema.js:
if type in (cable, telegraph, radio, pipeline, orbital): require path and endpoints.

---

## 3. Seeding order for tomorrow

Priority from BACKLOG, filtered through the place-and-movement anchor:

**Wave 1 — highest evidence density, existing allowed licenses:**
1. ORBIS Roman roads (CC BY 3.0) — dataset-derived geometry, upgrades hand-drawn
   reconstructions to citable data. Start with the major trunk routes.
2. Itiner-e (CC BY 4.0) — Roman sea lanes, same logic.
3. Pleiades (CC BY 3.0) — ancient port coordinates; feeds the regions drill-down and gives
   ancient entries real anchor points instead of reconstructed ones.
4. One more CLIWOC cruise (CC BY 3.0) — proves the dated-voyage pattern scales beyond the
   Launceston sample.

**Wave 2 — new domains, research licenses first:**
5. Undersea cables — the INTENT.md test case. Research: which openly licensed cable datasets
   exist? [UNKNOWN] until checked. Likely starting point: public cable maps and Wikipedia-
   cited primary sources, all marked reconstruction with confidence levels.
6. Telegraph — overland lines. Same dual-requirement pattern.
7. Airmail routes — pre-1958, which BACKLOG notes are missing. Piston-airliner model exists;
   no cited records yet.

**Wave 3 — space (v2.2):**
8. Crewed missions and space stations from GCAT (already CC BY 4.0, partially bundled).
   Replace the decorative satellite layer's encyclopedia entries with cited records.
9. Launch trajectories as orbital-type records: launch site (path start) to destination
   (endpoint). Apollo 11: Cape Canaveral to Tranquility Base.

Defer: star catalogue, cloud layer (visual only, not encyclopedia), single-file lite build,
keyboard shortcuts, screen-reader descriptions.

---

## 4. Contribution and quality gates (already exist, just use them)

- `python3 tools/check_contribution.py your-submission.json` before every merge
- CONTRIBUTING.md templates for route additions
- Every record: type, era, start/end dates, goods-or-service-carried, source, citations,
  reconstruction flag, confidence_level
- Gaps marked [UNKNOWN], never invented
- Restricted sources: link under Go deeper only, never bundled

---

## 5. Open questions to resolve during seeding (do not block on them)

- Grok.me file-count and size limits for the lite build [UNKNOWN]
- Whether browser CORS to api.x.ai stays supported [UNKNOWN] — fallback worker/chat/ exists
- Performance budget on the owner's PC for the full edition [UNKNOWN]
- Which glTF sources qualify for CC0/CC BY [UNKNOWN] until researched
- Cable dataset landscape [UNKNOWN] — first research task of Wave 2

---

## 6. Definition of done for the session

- build_indexes.py runs, is hooked, and CI enforces it
- schema.js has the four new types and the dual-requirement check
- At least one record per new type exists with real citations (a stub doesn't count)
- test_coverage.mjs passes
- BACKLOG.md updated with what's now done vs. still open
- INTENT.md unchanged unless a new boundary decision is made — if so, commit it separately
  with the decision date
