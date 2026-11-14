"""Local stand-in for the R2 large-file host (tests and previews only). Serves a folder on 127.0.0.1 with the headers
R2 public buckets are planned to send for this site (CORS GET/HEAD, byte ranges). Nothing is uploaded anywhere.
Usage: python3 tools/mock_r2.py <folder> [--port 8899]"""
import argparse, functools, http.server, os, socketserver


class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):  # minimal single-range support so <video> can seek
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        a, _, b = rng.replace("bytes=", "").partition("-")
        start = int(a or 0); end = min(int(b) if b else size - 1, size - 1)
        f = open(path, "rb"); f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        self._left = end - start + 1
        return f

    def copyfile(self, src, dst):
        left = getattr(self, "_left", None)
        if left is None:
            return super().copyfile(src, dst)
        while left > 0:
            chunk = src.read(min(65536, left))
            if not chunk:
                break
            dst.write(chunk); left -= len(chunk)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("folder"); ap.add_argument("--port", type=int, default=8899)
    a = ap.parse_args()
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", a.port), functools.partial(H, directory=a.folder)) as s:
        print(f"mock R2 at http://127.0.0.1:{a.port}/", flush=True)
        s.serve_forever()


if __name__ == "__main__":
    main()
