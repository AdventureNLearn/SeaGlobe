#!/usr/bin/env python3
"""Write grokme/lite-manifest.json: every file of the Grok.me lite build (paths relative to web/), with size and sha256,
the version, and the commit (a placeholder until tools/make_release.sh fills it in).
--check: fail if the manifest is out of date with the files (used by the gate)."""
import argparse, fnmatch, hashlib, json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, "web")
ENTRY = "lite.html"
# Left out of the lite build: other entry pages, PC-only bring-your-own pieces, full-size textures (lite uses the
# embedded 2k texture in data/texture.js) and an unused concept image.
EXCLUDE = ["index.html", "byo.html", "js/byo.js", "data/edition-byo.js", "vendor/satellite.min.js", "vendor/LICENSE-satellite.js.md",
           "textures/hd/*", "assets/title-concept.jpg", "assets/eras/title-concept.jpg", "*.map", ".DS_Store"]
# Self-imposed limits (Grok.me publishes no limits we could find: [UNKNOWN]). Conservative on purpose.
LIMITS = {"total_bytes": 20 * 1024 * 1024, "file_bytes": 5 * 1024 * 1024, "files": 600}

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()

def files():
    out = []
    for d, _, fs in os.walk(WEB):
        for f in fs:
            rel = os.path.relpath(os.path.join(d, f), WEB).replace(os.sep, "/")
            if any(fnmatch.fnmatch(rel, pat) for pat in EXCLUDE): continue
            out.append(rel)
    return sorted(out)

def build(commit):
    version = open(os.path.join(ROOT, "VERSION")).read().strip()
    fl = [{"path": r, "bytes": os.path.getsize(os.path.join(WEB, r)), "sha256": sha(os.path.join(WEB, r))} for r in files()]
    return {"name": "SeaGlobe Lite", "version": version, "commit": commit, "entry": ENTRY, "root": "web/",
            "limits": LIMITS, "limits_note": "Self-imposed; Grok.me size limits are [UNKNOWN].",
            "excluded": EXCLUDE, "total_bytes": sum(f["bytes"] for f in fl), "file_count": len(fl), "files": fl}

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--commit", default=None); ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    p = os.path.join(ROOT, "grokme", "lite-manifest.json")
    old = json.load(open(p)) if os.path.exists(p) else {}
    m = build(a.commit or old.get("commit") or "[set at release]")
    if a.check:
        strip = lambda d: {k: v for k, v in d.items() if k != "commit"}
        if strip(old) != strip(m): print("grokme/lite-manifest.json is out of date; run tools/make_grokme_manifest.py", file=sys.stderr); sys.exit(1)
        print("lite manifest up to date"); return
    json.dump(m, open(p, "w"), indent=1); open(p, "a").write("\n")
    print("lite manifest:", m["file_count"], "files,", round(m["total_bytes"] / 1048576, 2), "MiB")

if __name__ == "__main__":
    main()
