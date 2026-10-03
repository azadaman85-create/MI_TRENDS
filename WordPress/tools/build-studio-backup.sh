#!/usr/bin/env bash
#
# Build dist/mi-trends-studio-backup.zip — a complete site (WordPress database +
# WooCommerce + MI Trends Core + MI TRENDS theme + product photos, store setup
# and catalogue import already done) that WordPress Studio can import
# (Studio → Add site → Import from a backup).
#
#   bash tools/build-studio-backup.sh
#
# Needs Node 20+ and internet access (downloads WordPress and WooCommerce).
# Takes ~10–15 minutes. Uses WordPress Playground to build the site, then
# repackages it in the layout Studio's "Playground" importer expects:
#   wp-content/database/.ht.sqlite  wp-content/plugins/…  wp-content/themes/…  wp-content/uploads/…

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

bash "$ROOT/tools/package.sh" >/dev/null
cp "$ROOT/dist/mi-trends.zip" "$ROOT/dist/mi-trends-core.zip" "$ROOT/tools/studio/blueprint.json" "$WORK/"

echo "Building the site (this takes a while)…"
( cd "$WORK" && npx -y @wp-playground/cli@latest build-snapshot --php=8.3 \
    --blueprint="$WORK/blueprint.json" --blueprint-may-read-adjacent-files \
    --outfile="$WORK/snapshot.zip" )

mkdir -p "$WORK/ex" "$WORK/pkg/wp-content/database" "$WORK/pkg/wp-content/plugins" "$WORK/pkg/wp-content/themes"
unzip -q "$WORK/snapshot.zip" -d "$WORK/ex" 2>/dev/null || true
SRC="$WORK/ex/wordpress/wp-content"
cp "$SRC/database/.ht.sqlite" "$WORK/pkg/wp-content/database/"
cp -R "$SRC/plugins/woocommerce" "$SRC/plugins/mi-trends-core" "$WORK/pkg/wp-content/plugins/"
cp -R "$SRC/themes/mi-trends" "$WORK/pkg/wp-content/themes/"
cp -R "$SRC/uploads" "$WORK/pkg/wp-content/uploads"
rm -f "$WORK/pkg/wp-content/uploads/mi-setup-log.txt"
find "$WORK/pkg" -name .DS_Store -delete

rm -f "$ROOT/dist/mi-trends-studio-backup.zip"
( cd "$WORK/pkg" && zip -qrX "$ROOT/dist/mi-trends-studio-backup.zip" wp-content )
ls -lh "$ROOT/dist/mi-trends-studio-backup.zip"
