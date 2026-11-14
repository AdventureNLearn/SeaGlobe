#!/usr/bin/env bash
# Join the air-layer walkthrough: desktop part + phone part (placed on a 1280x720 frame, captions burned in) + closing card.
# Usage: tools/video/air_join.sh <desktop.mp4> <phone-raw.mp4> <end.mp4> <out.mp4>
set -euo pipefail
desk="$1"; phone="$2"; end="$3"; out="$4"
font="${FONT:-/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf}"
tmp="$(mktemp -d)"
# Caption text goes through textfile= so colons and commas need no escaping.
cap() { local f; f="$(mktemp -p "$tmp" cap.XXXX)"; printf '%s' "$1" > "$f"; printf "drawtext=fontfile=%s:textfile=%s:fontcolor=0xeaf6ff:fontsize=%s:x=70:y=%s:enable='between(t,%s,%s)'" "$font" "$f" "$2" "$3" "$4" "$5"; }
vf="scale=-2:680,setsar=1,pad=1280:720:760:20:color=0x02040c"
vf="$vf,$(cap 'PHONE LAYOUT (390 x 844, touch)' 22 200 0 22)"
vf="$vf,$(cap 'The v2.2.1 phone layout keeps working' 30 250 0 22)"
vf="$vf,$(cap 'with the air layer: globe, slim top strip,' 24 310 0 3)"
vf="$vf,$(cap 'one bottom bar' 24 345 0 3)"
vf="$vf,$(cap 'Menu sheet: eras, layers, routes' 24 310 3 8.5)"
vf="$vf,$(cap 'Tap a 747: its card opens as a bottom sheet' 24 310 8.5 22)"
vf="$vf,$(cap 'with the reconstruction label and citations' 24 345 8.5 22)"
ffmpeg -y -loglevel error -i "$phone" -vf "$vf" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -r 30 -an "$tmp/phone.mp4"
ffmpeg -y -loglevel error -i "$desk" -i "$tmp/phone.mp4" -i "$end" -filter_complex "[0:v]setsar=1[a];[1:v]setsar=1[b];[2:v]setsar=1[c];[a][b][c]concat=n=3:v=1:a=0[v]" -map "[v]" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -movflags +faststart "$out"
rm -rf "$tmp"
echo "wrote $out"
