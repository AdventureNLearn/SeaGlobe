# SeaGlobe — Deepening Session Prep (17 Nov 2026)

Everything needed to start seeding the "everything humans have moved" encyclopedia tomorrow.
Read INTENT.md scope reframing first — it is the boundary.

---

## 0. The consistency rule (read before anything else)

Every new type gets **exactly one cited record** in this session. Not a domain pass, not a
representative sample — one record that proves the type works end to end: schema validates,
encyclopedia page exists, chat index picks it up, coverage test passes, and it renders on the
globe with its path and endpoints.

The bar is identical across all four types:
- Real citations (a published source, even if the geometry is reconstructed)
- `reconstruction=true` where the path or dates are inferred, with a confidence level
- Dual-requirement satisfied: path coordinates AND endpoints, both present
- Gaps marked [UNKNOWN], never invented
- Restricted sources linked under Go deeper only

If a type's one record cannot be finished in under an hour of research, stop, mark it
[UNKNOWN] in BACKLOG.md with what was tried, and move to the next type. A documented unknown
is a finished item. A wild goose chase is not.

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
  v2.2 becomes load-bearing sooner than planned — 6 checkboxes cannot hold ~15 layers;
  see section 2b)
- A vehicle model stub in `schema.vehicles` so the no-placeholder test and contact sheet
  don't fail (models can be minimal procedural placeholders marked as such)

**Dual-requirement rule (from INTENT.md, 16 Nov):** any type where the carried thing is not
physical cargo (cable, telegraph, radio, pipeline, orbital) must carry BOTH:
- `path` — the physical infrastructure (wire, poles, pipe, trajectory) with coordinates
- `endpoints` — the stations/terminals/sites at each end
A record missing either fails schema validation. Add this as a conditional check in schema.js:
if type in (cable, telegraph, radio, pipeline, orbital): require path and endpoints.

### 2b. Layers tab — accelerated from v2.2, but only if time allows

The grouped/collapsible Layers redesign (Transport / Space / Undersea / Communications sections,
per-group all-on/off, visible-record counts, URL query state) is in BACKLOG as v2.2 work.
Adding four types makes six checkboxes untenable, so this moves up. **But it is not on the
critical path.** If the session runs long, ship schema + one record per type first and do the
Layers layout as a fast follow — the flat checkbox list still functions, just poorly.

---

## 3. Seeding order for tomorrow

Priority from BACKLOG, filtered through the place-and-movement anchor.
Remember section 0: one cited record per type, same bar, stop at an hour.

**Wave 1 — highest evidence density, existing allowed licenses (the afternoon's work):**
1. ORBIS Roman roads (CC BY 3.0) — dataset-derived geometry, upgrades hand-drawn
   reconstructions to citable data. Start with the major trunk routes.
2. Itiner-e (CC BY 4.0) — Roman sea lanes, same logic.
3. Pleiades (CC BY 3.0) — ancient port coordinates; feeds the regions drill-down and gives
   ancient entries real anchor points instead of reconstructed ones.
4. One more CLIWOC cruise (CC BY 3.0) — proves the dated-voyage pattern scales beyond the
   Launceston sample.

**Wave 2 — new domains, one record each:**
5. **Cable** — the INTENT.md test case. First task: check which openly licensed cable
   datasets exist ([UNKNOWN] until checked). If nothing suitable surfaces in the first hour,
   use one Wikipedia-cited public cable map as the source, mark reconstruction=true with a
   low-to-mid confidence level, and move on. Do not solve the cable-data problem in this
   session.
6. **Telegraph** — one overland line (e.g., a well-documented 19th-century trunk) with poles
   as path and offices as endpoints. Same dual-requirement, same one-hour cap.
7. **Radio** — one transmitter-to-receiver route (e.g., an early ship-to-shore or
   transatlantic wireless link) with both stations as endpoints.
8. **Airmail** — pre-1958, which BACKLOG notes is missing. Piston-airliner model exists;
   one cited route is enough to prove the type.

**Wave 3 — space, one record:**
9. **Orbital** — Apollo 11: Cape Canaveral (path start / launch site) to Tranquility Base
   (endpoint). GCAT is already CC BY 4.0 and partially bundled, so citations are cheap.
   The decorative satellite layer's encyclopedia entries get replaced by this cited record,
   not expanded into a constellation catalogue.

Defer entirely: star catalogue, cloud layer (visual only, not encyclopedia), single-file lite
build, keyboard shortcuts, screen-reader descriptions, full domain passes for any Wave 2/3 type.

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
- Cable dataset landscape [UNKNOWN] — first research task of Wave 2, capped at one hour

---

## 6. Definition of done for the session

- build_indexes.py runs, is hooked, and CI enforces it
- schema.js has the four new types and the dual-requirement check
- INTENT.md extensible principle lists all eleven types (updated in this pass)
- Exactly one cited record exists per new type — cable, telegraph, radio, orbital — each
  passing schema validation, coverage, and rendering
- test_coverage.mjs passes
- BACKLOG.md updated: what's done, what's [UNKNOWN] with what was tried
- Layers tab redesign either shipped or explicitly deferred to v2.2 fast-follow
- INTENT.md unchanged unless a new boundary decision is made — if so, commit it separately
  with the decision date
