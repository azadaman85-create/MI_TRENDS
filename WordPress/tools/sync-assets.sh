#!/usr/bin/env bash
#
# Copy the shared design assets from WordPress/assets into the theme and the
# plugin. WordPress/assets is the source of truth; the copies inside
# theme/mi-trends/assets and plugins/mi-trends-core/assets are what gets
# uploaded. Run this after changing anything in WordPress/assets.
#
#   bash tools/sync-assets.sh
#
# Optional: --from-original re-copies the four files that come verbatim from
# the Next.js project (globals.css, account.css, filter-token-bar.css,
# admin.css) and the product photos, from ../mi-trends. It only reads that
# folder; nothing in the original project is written.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets"
THEME="$ROOT/theme/mi-trends/assets"
PLUGIN="$ROOT/plugins/mi-trends-core/assets"
ORIGINAL="$ROOT/../mi-trends"

if [[ "${1:-}" == "--from-original" ]]; then
  if [[ ! -d "$ORIGINAL" ]]; then
    echo "Original project not found at $ORIGINAL" >&2
    exit 1
  fi
  cp "$ORIGINAL/app/globals.css"                   "$SRC/css/storefront-globals.css"
  cp "$ORIGINAL/components/account/account.css"    "$SRC/css/account.css"
  cp "$ORIGINAL/components/ui/filter-token-bar.css" "$SRC/css/filter-token-bar.css"
  cp "$ORIGINAL/app/admin/admin.css"               "$SRC/css/admin-panel.css"
  cp "$ORIGINAL/public/images/products/"*.jpg      "$SRC/images/products/"
  cp "$ORIGINAL/public/images/"hero-*.jpg          "$SRC/images/"
  cp "$ORIGINAL/app/icon.svg"                      "$SRC/icons/brand-icon.svg"
  echo "Re-copied original stylesheets and images into $SRC"
fi

mkdir -p "$THEME"/{css,js,images/products,icons,fonts} "$PLUGIN"/{css,js,seed/images,icons} "$ROOT/plugins/mi-trends-core/database/seed"

# Theme: everything the storefront renders.
cp "$SRC/css/fonts.css" "$SRC/css/storefront-globals.css" "$SRC/css/account.css" \
   "$SRC/css/filter-token-bar.css" "$SRC/css/pages.css" "$SRC/css/woocommerce.css" "$THEME/css/"
cp "$SRC/js/mi-trends.js" "$SRC/js/filter-bar.js" "$SRC/js/checkout.js" "$THEME/js/"
cp "$SRC/images/hero-oversized.jpg" "$THEME/images/"   # the sign-in/sign-up photo (AuthShell); the other hero shots are kept in assets/ only
cp "$SRC/images/products/"*.jpg "$THEME/images/products/"
cp "$SRC/icons/icons.json" "$SRC/icons/brand-icon.svg" "$THEME/icons/"
cp "$SRC/fonts/"*.woff2 "$SRC/fonts/Inter-OFL-LICENSE.txt" "$THEME/fonts/"

# Plugin: the admin design system, the icon set (admin screens use it) and the
# catalogue photos the importer loads into the Media Library.
cp "$SRC/css/admin-panel.css" "$PLUGIN/css/"
cp "$SRC/icons/icons.json" "$PLUGIN/icons/"
cp "$SRC/images/products/"*.jpg "$PLUGIN/seed/images/"

# Plugin: the seed data its importer reads (built by tools/build-seed.mjs).
cp "$ROOT/database/seed/catalog.json" "$ROOT/database/seed/coupons.json" "$ROOT/database/seed/pages.json" "$ROOT/plugins/mi-trends-core/database/seed/"

echo "Synced assets into:"
echo "  $THEME"
echo "  $PLUGIN"
