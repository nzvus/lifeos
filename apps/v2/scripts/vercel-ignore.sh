#!/bin/sh
# apps/v2/scripts/vercel-ignore.sh — the v2 project's "Ignored Build Step"
# (apps/v2/vercel.json). Exit 1 = build, exit 0 = skip.
#
# The deploy budget (100 a day, both projects together): v2 builds only
# when something it is made of changed (apps/v2, packages/kit, the lockfile).
# Previews only for a migration rehearsal or a branch named *-preview, as v1.
set -u

case "${VERCEL_GIT_COMMIT_REF:-}" in
  *-preview)
    echo "branch ${VERCEL_GIT_COMMIT_REF} asks for a preview: build"
    exit 1
    ;;
esac

BASE="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$BASE" ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  BASE=$(git rev-list --max-count=20 HEAD | tail -n 1)
fi

# ":/" pathspecs are from the repository's root, whatever the working directory.
if [ "${VERCEL_ENV:-}" = "production" ]; then
  if git diff --quiet "$BASE" HEAD -- ":/apps/v2" ":/packages/kit" ":/package-lock.json"; then
    echo "production: nothing of v2 changed since ${BASE}: skip"
    exit 0
  fi
  echo "production: v2 changed: build"
  exit 1
fi

if git diff --quiet "$BASE" HEAD -- ":/apps/v2/drizzle" ":/apps/v2/src/core/db"; then
  echo "no v2 schema or migration change: skip the preview"
  exit 0
fi
echo "v2 schema or migration change: build the preview"
exit 1
