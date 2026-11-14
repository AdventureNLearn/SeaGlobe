"""Plain local HTTP server for SeaGlobe (browser fallback). Binds 127.0.0.1 only."""
from __future__ import annotations

import argparse
import functools
import http.server
import socketserver
import sys
from pathlib import Path

WEB = Path(__file__).resolve().parent / "web"


class Handler(http.server.SimpleHTTPRequestHandler):
    # Fixed types: Windows can map .js to text/plain through the registry.
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
                      ".woff2": "font/woff2", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg"}

    def log_message(self, fmt, *args):
        sys.stderr.write("[seaglobe] " + (fmt % args) + "\n")

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def make_server(port: int):
    handler = functools.partial(Handler, directory=str(WEB))
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler, bind_and_activate=False)
    httpd.allow_reuse_address = True
    httpd.daemon_threads = True
    httpd.server_bind()
    httpd.server_activate()
    return httpd


def main(argv=None):
    p = argparse.ArgumentParser(description="Serve SeaGlobe on 127.0.0.1 (plain browser fallback).")
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("--open", action="store_true", help="Open the default browser once the server is up.")
    args = p.parse_args(argv)
    httpd = None
    for port in range(args.port, args.port + 20):  # step past a busy port
        try:
            httpd = make_server(port)
            break
        except OSError:
            continue
    if httpd is None:
        sys.exit(f"No free port between {args.port} and {args.port + 19}.")
    url = f"http://127.0.0.1:{port}/"
    print(f"SeaGlobe at {url}  (Ctrl+C to stop)", flush=True)
    if args.open:
        import webbrowser
        webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
