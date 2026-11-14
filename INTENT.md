# SeaGlobe: what this is meant to do

## Purpose

SeaGlobe is a visual journey through the world's trade routes from 500 BCE to today. Each voyage has a
vehicle — ship, caravan, train, plane — that travels its route on a 3D globe, so history can be watched
rather than read off a map. It is a showcase and a learning tool, not a research GIS.

## Principles

- **Honest about evidence.** Every record says whether it is a reconstruction, what it cites, and how
  confident it is. Real dates are used only where a voyage record gives them; everything else is shown as
  "reconstructed timing". All pre-1500 routes are reconstructions.
- **Sensitive and factual** about the Atlantic slave trade: muted colour, factual notes, sources.
- **Openly licensed only.** Only CC0 / public domain / MIT / OFL / CC BY material is bundled. Restricted
  projects are credited and linked under "Go deeper", never embedded, fetched or traced.
- **Self-contained.** Static files, relative paths, no CDN, no tiles. Works with no network from a local server,
  from a file (lite), or on a static host. Since v3.0 a few runtime requests are allowed, each optional and each
  failing quietly: the read-only version check, the opt-in live TIGERweb layer, the radio's YouTube player (on
  click), the chat Worker (only when configured), an R2 asset base (with bundled fallbacks), and the PC-only BYO
  feeds. The Content-Security-Policy allows only those hosts.
- **Extensible.** One data file per route family with a shared schema (sea, land, river, canal, rail, air,
  pipeline), validated by tests.

## Scope of this version

Six eras (Classical, Late Antiquity, Medieval, Age of Sail, Industrial, Modern), 69 route records in 24
families, 26 procedural vehicle types, an HD NASA earth with day/night, moon, stars and a decorative
satellite layer, a follow camera, and two rendered videos. What is missing is in BACKLOG.md.

## Scope of v3.0

An atlas framework on top of the routes: encyclopedia, regions drill-down, map tools, space layer, narrated tours,
grounded chat, Creedence Clearwater Revival Radio (official YouTube embed and link-outs), rebuilt vehicle models with
levels of detail, full / lite / BYO editions, a version check and an update path. SeaGlobe stands on its own.

## Not in scope

- No accounts, analytics, tracking or personal data.
- No live data feeds in the published build (live feeds are BYO, PC only, typed in by the owner).
- Nothing here publishes, uploads or pushes by itself.
