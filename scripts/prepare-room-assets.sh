#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p public/models
npx -y @gltf-transform/cli@4.5.1 resize assets/studio-room.glb "$work/resized.glb" --width 1024 --height 1024
npx -y @gltf-transform/cli@4.5.1 webp "$work/resized.glb" "$work/textures.glb" --quality 85
npx -y @gltf-transform/cli@4.5.1 meshopt "$work/textures.glb" public/models/studio-room.glb --level high
