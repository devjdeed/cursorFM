#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/public"
M4A="$OUT_DIR/dev-mix.m4a"
WAV="$OUT_DIR/dev-mix.wav"
DEV_VARS="$ROOT/.dev.vars"

mkdir -p "$OUT_DIR"

write_dev_vars() {
  local url="$1"
  if [[ -f "$DEV_VARS" ]]; then
    return
  fi
  cat > "$DEV_VARS" <<EOF
AUDIO_PUBLIC_URL=$url
DURATION_SECONDS=30
EOF
  echo "Wrote $DEV_VARS"
}

if [[ -f "$M4A" || -f "$WAV" ]]; then
  echo "Dev mix already exists."
  exit 0
fi

if command -v ffmpeg >/dev/null 2>&1; then
  echo "Generating 30s AAC placeholder with ffmpeg…"
  if ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "sine=frequency=110:duration=30:sample_rate=44100" \
    -c:a aac -b:a 96k -movflags +faststart \
    "$M4A"; then
    write_dev_vars "/dev-mix.m4a"
    echo "Created $M4A"
    exit 0
  fi
  echo "ffmpeg AAC encode failed; falling back to WAV."
fi

echo "ffmpeg not found; generating a 30s WAV drone instead…"
node "$ROOT/scripts/make-dev-mix.mjs" "$WAV"
write_dev_vars "/dev-mix.wav"
echo "Created $WAV"
echo "Install ffmpeg later to encode AAC: ffmpeg -i your-mix.wav -c:a aac -b:a 128k -movflags +faststart study.m4a"
