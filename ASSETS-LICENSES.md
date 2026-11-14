# Assets and licenses

Everything the app loads is in this repository. Only CC0, public domain, MIT, SIL OFL and CC BY material
is bundled; nothing NC or SA. Data sources are in [DATA.md](DATA.md).

| Asset | Where | Source | License |
|---|---|---|---|
| globe.gl 2.46.2 (bundles three-globe, three-render-objects, kapsule, tween.js) | `web/vendor/globe.gl.min.js` | npm `globe.gl@2.46.2` | MIT — `licenses/globe.gl-LICENSE` |
| three.js r187 core, as a classic script exposing `window.SEAGLOBE_THREE` | `web/vendor/three.global.js` | npm `three@0.187.0`, converted by `tools/vendor_three.py` | MIT — `licenses/three-LICENSE` |
| three.js examples: EffectComposer passes (Pass, FullScreenQuad), CopyShader, LuminosityHighPassShader, OutputShader, UnrealBloomPass, OutputPass, Lensflare | `web/vendor/three-addons.global.js` | `three@0.187.0/examples/jsm`, converted by `tools/vendor_three_addons.py` | MIT (same as three.js) |
| Day earth, 8k and 2k (lite; also embedded in `web/data/texture.js`) | `web/textures/hd/earth-day-*.jpg` | NASA Visible Earth, Blue Marble Next Generation, April 2004, topography + bathymetry (`world.topo.bathy.200404.3x21600x10800.jpg`), resized by `tools/make_hd_textures.py` | Public domain (NASA imagery; credit "NASA Earth Observatory") |
| Night lights, 4k | `web/textures/hd/earth-night-4k.jpg` | NASA Earth Observatory, Black Marble 2012 (`BlackMarble_2012_3km.jpg`) | Public domain (NASA) |
| Water mask (ocean shine), 4k | `web/textures/hd/earth-water-4k.png` | Rasterized from Natural Earth 1:50m land | Public domain (Natural Earth) |
| v1 navy globe texture | `web/textures/earth-navy.png` | Natural Earth 110m land, `tools/make_texture.py` | Public domain |
| Inter variable font | `web/fonts/InterVariable.woff2` | rsms/inter release | SIL Open Font License 1.1 — `web/fonts/Inter-OFL.txt` |
| Vehicle models (26 types, see `screens/v2.1-all-vehicles.png`) and their plank / sailcloth / steel textures | `web/js/vehicles.js` | Built procedurally in code for this project (textures drawn on a canvas at run time) | MIT (this repo) |
| Starfield, moon texture, satellites, sun glow, wakes | `web/js/planet.js`, `web/js/app.js` | Procedural, made for this project. Stars are seeded random points, **not** a star catalogue. Satellites are decorative, not real orbits. | MIT (this repo) |
| Concept art: `title-concept.jpg`, `era-classical.jpg`, `era-age-of-sail.jpg` | `assets/concept/`, copies in `web/assets/eras/` | **AI-generated for this project** (style references and era cards). `era-classical.jpg` is an **artistic impression**: its sail emblem and prow are stylized, not historically accurate. `era-age-of-sail.jpg` is also an artistic impression. | Made for this project; no third-party artwork. Whether AI-generated images carry copyright in a given country is [UNKNOWN]. |
| Videos in `walkthrough/` | `walkthrough/*.mp4` | Rendered from this app by `tools/capture.mjs` | Same as the assets they show. No music. |

## Considered and not used (yet)

- three.js `Water`, `Ocean` and `Sky` examples: they are built for a flat plane, not a sphere, so the
  ocean shine and sky are done in the custom earth shader instead.
- CC0 models (Kenney, Quaternius, Poly Haven, Smithsonian 3D CC0): not integrated in this pass; the
  procedural models were improved instead. See BACKLOG.md.
- A real star catalogue (Yale Bright Star Catalogue or Hipparcos, public domain): the downloads tried
  from the build machine failed (TLS and HTTP 500 errors), so the starfield stays procedural. [UNKNOWN] whether a
  reachable mirror exists. See BACKLOG.md.
- NASA cloud layer (public domain): the download failed from the build machine; no clouds in this pass.
