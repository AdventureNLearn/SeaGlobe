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
cp -a screens/. "$dest/screens/"
cp -f pages/videos.html "$dest/videos.html"
for f in LICENSE README.md DATA.md SOURCES.md ASSETS-LICENSES.md THIRD-PARTY-NOTICES.md INTENT.md; do
  if [ -f "$f" ]; then
    cp -f "$f" "$dest/"
  fi
done
# Stop GitHub Pages / Jekyll from hiding underscored paths if someone republishes the folder as a branch root.
: > "$dest/.nojekyll"
echo "Assembled $dest"
