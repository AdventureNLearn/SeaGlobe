# SeaGlobe on a Windows PC

1. Clone or unzip SeaGlobe into a folder of your choice, for example `Documents\SeaGlobe`
   (any folder works; nothing is installed).
2. Double-click **`Start-SeaGlobe.cmd`**.
   - With Python 3 installed (the `py` launcher, e.g. Python 3.14, or `python.exe`), a console window
     opens, prints `SeaGlobe at http://127.0.0.1:8765/` and your default browser opens that page.
     The server listens on 127.0.0.1 only, so nothing outside this PC can reach it.
   - Without Python, `web\index.html` opens directly in lite mode (smaller earth image, no bloom).
3. Close the console window to stop SeaGlobe.

Optional:
- `Start-SeaGlobe-Window.cmd` opens a native window if you have run `py -m pip install pywebview`;
  otherwise it falls back to the browser.
- From a terminal in the folder: `py -3 serve.py --open --port 8765`.
- If Windows SmartScreen asks about the `.cmd` file, choose "More info" only if you trust the copy you
  unzipped; you can also run the command above by hand instead.

Controls: ▶ play/pause, 1× / 5× / 20×, drag the date bar, era buttons, click any vehicle, "Follow camera",
tabs Voyage / Routes / Layers / Go deeper. Drag to rotate, scroll to zoom.
