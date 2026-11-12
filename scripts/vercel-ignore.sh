#!/bin/sh
# scripts/vercel-ignore.sh — the Vercel project's "Ignored Build Step" (vercel.json).
# Exit 1 = build, exit 0 = skip.
#
# The deploy budget (100 a day): production builds only when something the app is
# made of changed (not docs/, the spec, Claude's .claude/, CI's .github/).
# Previews only for a migration rehearsal or a branch named *-preview.
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
  if git diff --quiet "$BASE" HEAD -- ":(top)" ":(top,exclude)docs" ":(top,exclude).claude" \
    ":(top,exclude).github" ":(top,exclude)*.md" ":(top,exclude)check.sh" ":(top,exclude)check.bat"; then
    echo "production: nothing of the app changed since ${BASE}: skip"
    exit 0
  fi
  echo "production: the app changed: build"
  exit 1
fi

if git diff --quiet "$BASE" HEAD -- ":/drizzle" ":/src/core/db"; then
  echo "no schema or migration change: skip the preview"
  exit 0
fi
echo "schema or migration change: build the preview"
exit 1
