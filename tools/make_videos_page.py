#!/usr/bin/env python3
"""Write pages/videos.html from data/videos.json and web/assets.json (run tools/build_assets.py first).
Each video gets a static <source> for the repo copy (so the page works with no script and no R2), and
js/assets.js adds the R2 copy first when an R2 base URL is set; the browser falls back on error."""
import html, json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STAGING = os.path.join(os.path.dirname(ROOT), "seaglobe-build", "r2-staging")

def probe(p):
    try:
        o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", p], capture_output=True, text=True, check=True).stdout
        j = json.loads(o); s = j["streams"][0]; d = float(j["format"]["duration"])
        d = int(round(d))
        return "%d:%02d" % (d // 60, d % 60), "%d×%d" % (s["width"], s["height"])
    except Exception:
        return "[UNKNOWN]", "[UNKNOWN]"

def local(rel):
    for b in (os.path.join(ROOT, "web"), ROOT):
        p = os.path.join(b, rel)
        if os.path.exists(p): return p
    return None

def mib(n): return "%.0f MiB" % (n / 1048576) if n else "[UNKNOWN] size"

def main():
    vids = json.load(open(os.path.join(ROOT, "data", "videos.json")))["videos"]
    assets = {a["id"]: a for a in json.load(open(os.path.join(ROOT, "web", "assets.json")))["assets"]}
    figs = []
    for v in vids:
        a = assets[v["asset"]]
        repo = a.get("path") or a.get("fallback")
        rp = local(repo)
        dur, res = probe(rp) if rp else ("[UNKNOWN]", "[UNKNOWN]")
        meta = "%s, %s" % (dur, res)
        if a.get("r2") and a.get("fallback"):
            sp = os.path.join(STAGING, a["r2"])
            fdur, fres = probe(sp) if os.path.exists(sp) else ("[UNKNOWN]", "[UNKNOWN]")
            meta = "%s · full quality %s (%s, from the asset store when available); this site's copy %s (%s)" % (fdur, fres, mib(a.get("bytes")), res, mib(a.get("fallback_bytes")))
        t = html.escape(v["title"])
        figs.append(
            '  <figure class="clip" id="%s">\n    <video controls preload="metadata" data-asset="%s" title="%s">\n      <source src="%s" type="video/mp4">\n'
            '      Sorry, your browser cannot play this video. <a href="%s">Download: %s</a>.\n    </video>\n    <figcaption><b>%s</b> — %s.%s</figcaption>\n  </figure>'
            % (html.escape(v["asset"]), html.escape(v["asset"]), t, html.escape(repo), html.escape(repo), t, t, html.escape(meta), (" " + html.escape(v["desc"])) if v.get("desc") else ""))
    page = open(os.path.join(ROOT, "pages", "videos.template.html")).read().replace("<!--VIDEOS-->", "\n".join(figs))
    open(os.path.join(ROOT, "pages", "videos.html"), "w").write(page)
    print("videos page:", len(figs), "videos")

if __name__ == "__main__":
    main()
