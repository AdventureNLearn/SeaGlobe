# Pre-recorded narration scaffold

Tour scripts are extracted from the existing encyclopedia texts (title + summary)
into `tours.scripts.json`. The clip manifest format is `manifest.schema.json`.

No voice has been picked and **no audio is generated** in this scaffold. A Piper
pipeline already exists at `tools/video/narrated.mjs` (natural 1.0 speed, no
time-stretch). Set `PIPER` and `PIPER_VOICE` only after the owner chooses a
voice. The browser speech voice remains the default until clips exist.

Regenerate scripts (does not speak):

    node tools/narration/extract-tour-scripts.mjs

`?mute=1` must still show captions only. Tours must still start only on an
explicit press.
