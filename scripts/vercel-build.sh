#!/usr/bin/env bash
set -euo pipefail

echo "→ Generating Prisma client…"
npx prisma generate

if [ -n "${DATABASE_URL:-}" ]; then
  echo "→ Syncing database schema…"
  if ! npx prisma db push --skip-generate; then
    if [ "${VERCEL:-}" = "1" ]; then
      echo "✗ Database sync failed on Vercel — check DATABASE_URL"
      exit 1
    fi
    echo "⚠ Database not reachable — skipping schema sync (OK for local builds)"
  fi
else
  echo "→ DATABASE_URL not set — skipping db push (scanner still works)"
fi

echo "→ Building Next.js…"
next build
