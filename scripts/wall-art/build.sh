#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
src=assets/wall-art
out=public/media/wall
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p "$out"

magick "$src/break-the-code.png" -alpha off -crop 693x1008+280+121 +repage -resize 560x808! -quality 82 "$out/poster-break.webp"
magick "$src/we-live-in-the-code.png" -alpha off -crop 278x392+122+65 +repage -resize 560x808! -quality 84 "$out/poster-live.webp"

node -e "import('./scripts/wall-art/circuit.mjs').then((m) => { const fs = require('fs'); fs.writeFileSync('$work/white.svg', m.circuitSvg()); fs.writeFileSync('$work/red.svg', m.circuitSvg({ color: '#e5322d', stroke: 9 })); })"
magick -background none "$work/white.svg" -resize 1024x -rotate 90 -quality 90 -define webp:alpha-quality=90 "$out/circuit.webp"

W=560 H=808
magick -size ${W}x${H} xc:'#0a0a0c' -attenuate 0.35 +noise Gaussian -colorspace gray -fill '#0a0a0c' -colorize 82% "$work/bg.png"
magick -background none "$work/red.svg" -resize 520x -channel A -evaluate multiply 0.85 +channel "$work/chip.png"
for line in 'root@zhugez:~# whoami' 'zhugez' 'root@zhugez:~# nmap -sV 10.0.0.7' '22/tcp  open  ssh' '443/tcp open  https' 'root@zhugez:~# ./studio --listen' 'listening on :1337 ...'; do printf '%s\n' "$line"; done > "$work/term.txt"
magick -background none -fill '#8d8f96' -font 'DejaVu-Sans-Mono' -pointsize 11 -interline-spacing 3 label:@"$work/term.txt" "$work/term.png"
title() { magick -background none -fill "$1" -font 'Inter-Display-Black' -pointsize 132 -kerning 2 label:"$2" -resize 74%x100% "$3"; }
for word in HELLO FRIEND; do
  text=$([ "$word" = HELLO ] && echo 'HELLO,' || echo 'FRIEND.')
  title '#ece6dc' "$text" "$work/$word-w.png"
  title '#e5322d' "$text" "$work/$word-r.png"
  title '#2ec5d6' "$text" "$work/$word-c.png"
  magick "$work/$word-r.png" \( "$work/$word-c.png" -geometry +7+0 \) -compose Screen -composite \( "$work/$word-w.png" -geometry +3+0 \) -compose Over -composite "$work/$word.png"
done
magick -background none -fill '#9a9ca3' -font 'DejaVu-Sans-Mono' -pointsize 13 -kerning 1 label:'MAKE SOMETHING THAT STICKS.' "$work/foot.png"
magick "$work/bg.png" \
  \( "$work/chip.png" \) -gravity north -geometry +0+150 -compose Over -composite \
  \( "$work/term.png" \) -gravity northwest -geometry +30+30 -composite \
  \( "$work/HELLO.png" \) -gravity south -geometry +0+178 -composite \
  \( "$work/FRIEND.png" \) -gravity south -geometry +0+64 -composite \
  \( "$work/foot.png" \) -gravity south -geometry +0+40 -composite \
  "$work/poster.png"
magick "$work/poster.png" \
  \( +clone -crop ${W}x14+0+520 +repage \) -gravity northwest -geometry +11+520 -composite \
  \( "$work/poster.png" -crop ${W}x9+0+640 +repage \) -geometry -8+640 -composite \
  \( -size ${W}x${H} xc:none -fill 'rgba(0,0,0,0.13)' -draw "$(for y in $(seq 0 4 $H); do printf 'line 0,%d %d,%d ' "$y" "$W" "$y"; done)" \) -geometry +0+0 -composite \
  -quality 84 "$out/poster-hello.webp"
ls -l "$out"
