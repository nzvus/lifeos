#!/bin/sh
# scripts/vercel-ignore.sh — Vercel's "Ignored Build Step" (vercel.json
# ignoreCommand). Exit 1 = build this deployment, exit 0 = skip it.
#
# Why: Vercel Hobby allows 100 deployments a day, previews included; on
# 2026-10-01 a day of small PRs hit it and production stopped deploying.
# Production (main) always builds. A preview builds only when it is needed
# for what ADR-0004 uses previews for — rehearsing a migration on the PR's
# own Neon branch — or when asked for with a branch named *-preview.
set -u

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "production: build"
  exit 1
fi

case "${VERCEL_GIT_COMMIT_REF:-}" in
  *-preview)
    echo "branch ${VERCEL_GIT_COMMIT_REF} asks for a preview: build"
    exit 1
    ;;
esac

# Vercel clones shallowly: compare against the oldest commit available
# (or the previous deployment of this branch, when Vercel knows it).
BASE="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$BASE" ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  BASE=$(git rev-list --max-count=20 HEAD | tail -n 1)
fi

if git diff --quiet "$BASE" HEAD -- drizzle src/core/db; then
  echo "no schema or migration change since ${BASE}: skip the preview"
  exit 0
fi
echo "schema or migration change: build the preview (ADR-0004 rehearsal)"
exit 1
