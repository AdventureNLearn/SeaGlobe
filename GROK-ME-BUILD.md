# Rebuilding SeaGlobe Lite on Grok.me

Built by AdventureNLearn — [@AdventureNLearn](https://x.com/AdventureNLearn)

This kit lets a hosted app builder (Grok.me) rebuild the lite edition of SeaGlobe from this repository without
changing it. The owner points the builder at the repository and pastes `grokme/BUILDER-PROMPT.txt`. Nothing in this
repository uploads, publishes or signs in anywhere by itself.

## What the lite build is

- Entry page `web/lite.html`, edition file `web/data/edition-lite.js`.
- Exactly the files listed in `grokme/lite-manifest.json` (path, size, SHA-256), copied unchanged from `web/`.
- Left out: the full and BYO entry pages, the PC-only BYO pieces (`js/byo.js`, `data/edition-byo.js`,
  `vendor/satellite.min.js`), the full-size textures (`textures/hd/*`; lite uses the embedded 2k texture), one unused
  concept image, and the per-country region packs under `data/regions/towns/`, `admin1/` and `counties/`. Lite loads the
  same data from a handful of bundled files in `data/regions/lite-bundles/`, grouped by world region. Desktop and phone
  still use the per-country files.
- Same features as the full edition apart from those: routes and vehicles (lite level of detail), encyclopedia,
  regions, tools, space, tours, radio, version check. Chat is offline until a visitor pastes their own xAI key in chat settings.
- Credit "Built by AdventureNLearn" with a link to https://x.com/AdventureNLearn in the footer and the About tab.

## Size budget

Grok.me's own size limits are [UNKNOWN] (none were found published). The manifest uses self-imposed limits:
20 MiB in total, 5 MiB per file, 600 files. `tools/check_grokme_lite.mjs` fails the gate if the build goes over.

## Check it yourself

```sh
python3 tools/make_grokme_manifest.py --check   # manifest matches the files
node tools/check_grokme_lite.mjs                # serves only the listed files; 3 version-check scenarios
node tools/check_grokme_lite.mjs --clean        # same, from a clean git archive of HEAD
```

The check serves the listed files alone and puts `version.json` on a different origin, then runs three cases (same
version, newer version, version host down). Each must boot the lite edition with 0 console errors, 0 failed requests
(apart from the deliberately-down host), no request to any other host, the credit in the footer and About, no BYO
pieces and chat offline (no visitor key set).

## Requests the lite build may make

- `https://adventurenlearn.github.io/SeaGlobe/version.json` (read-only, short timeout, silent on failure).
- US Census TIGERweb, only when the live town layer is switched on.
- YouTube (youtube-nocookie.com, youtube.com iframe API), only after "Load the player" in the radio panel.
- The xAI API (`https://api.x.ai`), only after a visitor pastes their own xAI key in chat settings.
- Nothing else. `lite.html`'s Content-Security-Policy allows exactly these hosts (connect-src: the version host,
  TIGERweb and api.x.ai; script-src: youtube.com; frame-src: youtube-nocookie.com and youtube.com), no localhost
  and no inline styles. `tools/check_grokme_lite.mjs` adds a localhost host only to the copy it serves for its own test.

## GROK-ME-UPDATE

How a Grok.me copy learns about and takes a new version:

1. Each copy shows its version in the footer and the About tab ("Up to date · v3.0.0" or "Update available: vX").
   It compares its own `js/version.js` with the published `version.json` on the Pages site.
2. When the owner has published a new release (an approved push), the Grok.me copy shows "Update available".
3. The owner pastes `grokme/UPDATE-PROMPT.txt` into the builder. The builder rebuilds from the new tag or commit,
   using that release's `grokme/lite-manifest.json`, and changes nothing else.
4. After the rebuild the copy should say "Up to date · v<new version>". If it does not, the builder used the wrong
   files; roll back to the previous Grok.me version (the builder's own history; how Grok.me keeps history is [UNKNOWN]).

The PC copy updates with `tools/update-pc.ps1` (dry run by default, `-Apply` to install into a new versioned folder,
SHA-256 checked, `-Rollback <version>` to switch back; nothing installed is deleted).
