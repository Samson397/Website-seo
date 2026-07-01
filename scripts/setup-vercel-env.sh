#!/usr/bin/env bash
# Run once after: npx vercel login
# Then: bash scripts/setup-vercel-env.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if ! npx vercel whoami &>/dev/null; then
  echo "Not logged in. Run: npx vercel login"
  exit 1
fi

if [ ! -f .vercel/project.json ]; then
  echo "Linking to Vercel project (seoscan)…"
  npx vercel link --yes --project seoscan 2>/dev/null || npx vercel link --yes
fi

# Load from .env.local if present
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

add_env() {
  local key="$1"
  local value="$2"
  if [ -z "$value" ]; then
    echo "⚠ Skipping $key (empty)"
    return
  fi
  echo "→ $key"
  npx vercel env rm "$key" production --yes 2>/dev/null || true
  npx vercel env rm "$key" preview --yes 2>/dev/null || true
  printf '%s' "$value" | npx vercel env add "$key" production --yes --no-sensitive
  printf '%s' "$value" | npx vercel env add "$key" preview --yes --no-sensitive
}

add_env DATABASE_URL "${DATABASE_URL:-}"
add_env NEXTAUTH_SECRET "${NEXTAUTH_SECRET:-}"
add_env NEXTAUTH_URL "${NEXTAUTH_URL:-https://seoscan-five.vercel.app}"
add_env NEXT_PUBLIC_SITE_URL "${NEXT_PUBLIC_SITE_URL:-https://seoscan-five.vercel.app}"
add_env CRON_SECRET "${CRON_SECRET:-}"
add_env PAGESPEED_API_KEY "${PAGESPEED_API_KEY:-}"

echo ""
echo "✓ Env vars added. Deploying…"
npx vercel deploy --prod --yes

echo ""
echo "Done. Check: https://seoscan-five.vercel.app/api/setup"
