#!/usr/bin/env bash
# Build a release zip from the committed tree (respects .gitignore) and print its sha256.
# Usage: tools/make_release.sh <out.zip>
set -euo pipefail
cd "$(dirname "$0")/.."
out="${1:?usage: tools/make_release.sh out.zip}"
git archive --format=zip --prefix=seaglobe/ -o "$out" HEAD
sha256sum "$out"
