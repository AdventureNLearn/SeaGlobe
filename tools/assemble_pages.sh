#!/usr/bin/env bash
# Assemble the exact folder GitHub Pages will serve: the web/ app at the site
# root, plus walkthrough videos, screenshots, licenses and a videos page.
# Usage: tools/assemble_pages.sh [dest-dir]
set -euo pipefail
cd "$(dirname "$0")/.."
dest="${1:-_site}"
rm -rf "$dest"
mkdir -p "$dest/walkthrough" "$dest/screens"
cp -a web/. "$dest/"
cp -a walkthrough/. "$dest/walkthrough/"
# GitHub Pages refuses files over 100 MB and warns above 50 MiB: anything that large is an R2 asset (see data/assets.json)
big=$(find "$dest" -type f -size +50M)
if [ -n "$big" ]; then echo "files over 50 MiB must be R2 assets: $big" >&2; exit 1; fi
cp -a screens/. "$dest/screens/"
cp -f pages/videos.html "$dest/videos.html"
# The BYO edition (your own feeds, owner's own key) is PC only: it is never published.
rm -f "$dest/byo.html" "$dest/js/byo.js" "$dest/data/edition-byo.js" "$dest"/vendor/satellite* "$dest"/vendor/LICENSE-satellite*
# version.json is the file every copy compares itself with; it must be at the site root.
test -f "$dest/version.json" || { echo "missing version.json" >&2; exit 1; }
# Stamp the published copy with this commit (the Pages SHA) and the v3.1.11 release asset URL and hash.
commit="$(git rev-parse HEAD)" || { echo "assemble needs a git commit to stamp version.json" >&2; exit 1; }
python3 tools/stamp_version.py --commit "$commit" --zip-sha256 "3f8ee25b90a613cf61670f106d5a28891e1015a5a7fe2d64410976a7defb5866" --download-url "https://github.com/AdventureNLearn/SeaGlobe/releases/download/v3.1.11/seaglobe-3.1.11.zip" --out-dir "$dest"
for f in LICENSE README.md CHANGELOG.md DATA.md SOURCES.md ASSETS-LICENSES.md THIRD-PARTY-NOTICES.md INTENT.md; do
  if [ -f "$f" ]; then
    cp -f "$f" "$dest/"
  fi
done
# Stop GitHub Pages / Jekyll from hiding underscored paths if someone republishes the folder as a branch root.
: > "$dest/.nojekyll"
echo "Assembled $dest"
