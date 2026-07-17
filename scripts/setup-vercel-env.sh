#!/usr/bin/env bash
# Optional helpers for SEOScan env vars on Vercel.
set -euo pipefail

add_env() {
  local key="$1"
  local value="$2"
  if [ -z "$value" ]; then
    echo "skip $key (empty)"
    return
  fi
  echo "setting $key"
  printf '%s' "$value" | npx vercel env add "$key" production --force >/dev/null || true
}

add_env NEXT_PUBLIC_SITE_URL "${NEXT_PUBLIC_SITE_URL:-https://seoscan-five.vercel.app}"
add_env PAGESPEED_API_KEY "${PAGESPEED_API_KEY:-}"
add_env DATAFORSEO_LOGIN "${DATAFORSEO_LOGIN:-}"
add_env DATAFORSEO_PASSWORD "${DATAFORSEO_PASSWORD:-}"

echo "Done."
