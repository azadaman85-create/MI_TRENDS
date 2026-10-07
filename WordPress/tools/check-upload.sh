#!/usr/bin/env bash
#
# Final pre-upload check for the two zips in dist/.
#
#   bash tools/package.sh && bash tools/check-upload.sh
#
# Checks each zip has exactly one top-level folder with the right name, the
# files WordPress needs to recognise it, valid theme/plugin headers, no
# development leftovers, a reasonable size for upload limits, and that every
# file referenced by the code is present. Exits non-zero on any failure.

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
fail=0
pass() { printf '  \033[32m✔\033[0m %s\n' "$1"; }
bad()  { printf '  \033[31m✘\033[0m %s\n' "$1"; fail=1; }

check_zip() {
  local zip="$1" folder="$2"; shift 2
  local required=("$@")
  echo "$(basename "$zip")"
  [[ -f "$zip" ]] || { bad "missing — run tools/package.sh"; return; }

  local listing; listing="$(unzip -Z1 "$zip")"
  local tops; tops="$(printf '%s\n' "$listing" | cut -d/ -f1 | sort -u)"
  if [[ "$tops" == "$folder" ]]; then pass "single top-level folder '$folder/'"; else bad "top-level entries: $(echo $tops)"; fi

  for f in "${required[@]}"; do
    if printf '%s\n' "$listing" | grep -qx "$folder/$f"; then pass "has $f"; else bad "missing $f"; fi
  done

  local junk; junk="$(printf '%s\n' "$listing" | grep -Ei '(\.DS_Store|__MACOSX|\.git/|node_modules|\.env|\.log$|Thumbs\.db)' || true)"
  if [[ -z "$junk" ]]; then pass "no development leftovers"; else bad "junk files: $junk"; fi

  local nested; nested="$(printf '%s\n' "$listing" | grep -E "^$folder/$folder/" | head -1 || true)"
  if [[ -z "$nested" ]]; then pass "not double-nested"; else bad "double-nested folder ($nested)"; fi

  local bytes; bytes=$(stat -f%z "$zip" 2>/dev/null || stat -c%s "$zip")
  local mb; mb=$(awk "BEGIN{printf \"%.1f\", $bytes/1048576}")
  if (( bytes < 8*1048576 )); then pass "size ${mb} MB (fits the usual 8 MB+ upload limit)"; else bad "size ${mb} MB — may exceed upload limits"; fi
  echo "  files: $(printf '%s\n' "$listing" | grep -vc '/$')"
}

check_zip "$DIST/mi-trends.zip" "mi-trends" \
  style.css functions.php index.php header.php footer.php front-page.php page.php single.php \
  archive.php search.php 404.php sidebar.php screenshot.png \
  woocommerce/archive-product.php woocommerce/single-product.php woocommerce/content-product.php \
  woocommerce/cart/cart.php woocommerce/checkout/form-checkout.php woocommerce/myaccount/form-login.php \
  assets/css/storefront-globals.css assets/js/mi-trends.js assets/icons/icons.json \
  assets/fonts/inter-latin-400-normal.woff2 assets/images/hero-oversized.jpg

check_zip "$DIST/mi-trends-core.zip" "mi-trends-core" \
  mi-trends-core.php uninstall.php readme.txt includes/class-mi-core-plugin.php \
  database/class-mi-core-schema.php database/seed/catalog.json database/seed/coupons.json database/seed/pages.json \
  assets/css/admin-panel.css assets/icons/icons.json assets/seed/images/tee-01-a.jpg \
  templates/emails/mi-status-update.php

echo "headers"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
unzip -q "$DIST/mi-trends.zip" -d "$tmp"; unzip -q "$DIST/mi-trends-core.zip" -d "$tmp"
for h in "Theme Name: MI TRENDS" "Text Domain: mi-trends" "Requires PHP:" "Version:"; do
  grep -q "$h" "$tmp/mi-trends/style.css" && pass "style.css: $h" || bad "style.css missing '$h'"
done
for h in "Plugin Name:       MI Trends Core" "Requires Plugins:  woocommerce" "Text Domain:       mi-trends-core" "Version:"; do
  grep -q "$h" "$tmp/mi-trends-core/mi-trends-core.php" && pass "plugin header: $h" || bad "plugin header missing '$h'"
done
png=$(file "$tmp/mi-trends/screenshot.png")
[[ "$png" == *"1200 x 900"* ]] && pass "screenshot.png 1200×900" || bad "screenshot.png: $png"

echo "references"
# Every PHP require/include in the plugin points at a file that exists.
while IFS= read -r ref; do
  [[ -e "$tmp/mi-trends-core/$ref" ]] || bad "plugin requires missing file/folder $ref"
done < <(grep -rhoE "MI_CORE_DIR \. '[^']+'" "$tmp/mi-trends-core" | sed -E "s/MI_CORE_DIR \. '//; s/'$//" | sort -u)
for ref in $(grep -rhoE "'(includes|admin|api|database)/[a-z0-9/_.-]+\.php'" "$tmp/mi-trends-core/includes/class-mi-core-plugin.php" | tr -d "'" | sort -u); do
  [[ -f "$tmp/mi-trends-core/$ref" ]] || bad "plugin loader references missing $ref"
done
# Every theme require and every template part / page template referenced exists.
for ref in $(grep -hoE "MI_THEME_DIR \. '/[^']+'" "$tmp/mi-trends/functions.php" | sed -E "s/MI_THEME_DIR \. '\///; s/'$//"); do
  [[ -f "$tmp/mi-trends/$ref" ]] || bad "theme requires missing $ref"
done
for part in $(grep -rhoE "mi_trends_part\( *'[^']+'" "$tmp/mi-trends" | sed -E "s/.*'([^']+)'/\1/" | sort -u); do
  [[ -f "$tmp/mi-trends/template-parts/$part.php" ]] || bad "missing template part $part"
done
for tpl in $(grep -hoE '"template": "page-templates/[^"]+"' "$tmp/mi-trends-core/database/seed/pages.json" | sed -E 's/.*"(page-templates[^"]+)"/\1/' | sort -u); do
  [[ -f "$tmp/mi-trends/$tpl" ]] || bad "pages.json uses missing template $tpl"
done
for asset in $(grep -hoE "'assets/(css|js)/[^']+'" "$tmp/mi-trends/inc/assets.php" | tr -d "'" | sort -u); do
  [[ -f "$tmp/mi-trends/$asset" ]] || bad "theme enqueues missing $asset"
done
for img in $(grep -hoE '"(image|back_image)": "[^"]+"' "$tmp/mi-trends-core/database/seed/catalog.json" | sed -E 's/.*: "([^"]+)"/\1/' | sort -u); do
  [[ -f "$tmp/mi-trends-core/assets/seed/images/$img" ]] || bad "catalog photo missing $img"
done
for img in $(grep -rhoE "mi_trends_image\( *'[^']+'" "$tmp/mi-trends" | sed -E "s/.*'([^']+)'/\1/" | sort -u); do
  [[ -f "$tmp/mi-trends/assets/images/$img" ]] || bad "theme image missing $img"
done
[[ $fail -eq 0 ]] && pass "all referenced files present"

echo
if [[ $fail -eq 0 ]]; then echo "READY TO UPLOAD"; else echo "FIX THE ITEMS ABOVE BEFORE UPLOADING"; fi
exit $fail
