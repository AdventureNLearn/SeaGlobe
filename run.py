"""SeaGlobe launcher. Tries a pywebview window; falls back to the system browser.

It never reads cookies or credentials and binds only to 127.0.0.1.
"""
from __future__ import annotations

import argparse
import sys
import threading
import time
import webbrowser
from pathlib import Path

import serve as seaglobe_serve

ROOT = Path(__file__).resolve().parent


def main(argv=None):
    p = argparse.ArgumentParser(description="Open SeaGlobe in a native window, or the browser if pywebview is missing.")
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("--browser", action="store_true", help="Skip pywebview and open the system browser.")
    p.add_argument("--year", type=int, default=None, help="Starting decade (e.g. 1300).")
    args = p.parse_args(argv)

    httpd = seaglobe_serve.make_server(args.port)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{args.port}/"
    if args.year is not None:
        url += f"?year={int(args.year)}"
    print(f"SeaGlobe at {url}", flush=True)

    if not args.browser:
        try:
            import webview  # type: ignore
        except ImportError:
            print("pywebview is not installed; opening the system browser instead.", flush=True)
            args.browser = True
        else:
            webview.create_window(
                "SeaGlobe",
                url,
                width=1536,
                height=900,
                background_color="#040713",
            )
            try:
                webview.start()
            finally:
                httpd.shutdown()
            return

    webbrowser.open(url)
    print("Browser fallback is running. Press Ctrl+C to stop the local server.", flush=True)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        httpd.shutdown()


if __name__ == "__main__":
    main()
