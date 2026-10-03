#!/usr/bin/env bash
#
# Build the two upload-ready zips:
#   dist/mi-trends.zip        → Appearance → Themes → Add New → Upload Theme
#   dist/mi-trends-core.zip   → Plugins → Add New → Upload Plugin
#
#   bash tools/package.sh
#
# Runs sync-assets.sh first so the zips always carry the current assets.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bash "$ROOT/tools/sync-assets.sh" >/dev/null

mkdir -p "$ROOT/dist"
rm -f "$ROOT/dist/mi-trends.zip" "$ROOT/dist/mi-trends-core.zip"

( cd "$ROOT/theme" && zip -qr "$ROOT/dist/mi-trends.zip" mi-trends -x '*.DS_Store' )
( cd "$ROOT/plugins" && zip -qr "$ROOT/dist/mi-trends-core.zip" mi-trends-core -x '*.DS_Store' )

echo "Built:"
ls -lh "$ROOT/dist/"*.zip
