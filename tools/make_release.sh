#!/usr/bin/env bash
# Build a release from the committed tree (respects .gitignore). Local only: nothing is uploaded or pushed.
# Usage: tools/make_release.sh [out-dir] [download-url]
# Writes, in out-dir (default release/<version>/):
#   seaglobe-<version>.zip     git archive of HEAD (prefix seaglobe/)
#   version.json               the published version file, stamped with the commit, zip sha256 and download URL
#   grokme-lite-manifest.json  the Grok.me lite manifest stamped with the commit
#   SHA256SUMS
# The version.json inside the zip keeps "[set at release]" (a file cannot hold its own zip's hash); the PC updater
# and the Pages site use the stamped copy from out-dir.
set -euo pipefail
cd "$(dirname "$0")/.."
ver="$(tr -d '[:space:]' < VERSION)"
out="${1:-release/$ver}"
url="${2:-[set at release]}"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then echo "commit first: the tree has uncommitted changes" >&2; exit 1; fi
commit="$(git rev-parse HEAD)"
mkdir -p "$out"
zip="$out/seaglobe-$ver.zip"
git archive --format=zip --prefix=seaglobe/ -o "$zip" HEAD
zsha="$(sha256sum "$zip" | cut -d' ' -f1)"
python3 tools/stamp_version.py --commit "$commit" --zip-sha256 "$zsha" --download-url "$url" --out-dir "$out"
python3 - "$commit" "$out" <<'PY'
import json, sys
m = json.load(open("grokme/lite-manifest.json")); m["commit"] = sys.argv[1]
json.dump(m, open(sys.argv[2] + "/grokme-lite-manifest.json", "w"), indent=1)
PY
( cd "$out" && sha256sum "seaglobe-$ver.zip" version.json grokme-lite-manifest.json > SHA256SUMS )
echo "release $ver commit $commit"
echo "zip sha256 $zsha"
