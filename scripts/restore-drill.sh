#!/usr/bin/env bash
# scripts/restore-drill.sh — restore an encrypted backup into an EMPTY
# database and print row counts, to prove the backup actually works
# (ADR-0003: "a restore I have never performed does not count as a backup").
#
# Procedure and what to compare: docs/runbooks/restore-drill.md.
#
# Usage:  scripts/restore-drill.sh BACKUP.dump.age AGE_KEY_FILE TARGET_DATABASE_URL
#   TARGET must be an empty database: a Neon branch created for the drill, or
#   a local Postgres. The script REFUSES a database that already has tables,
#   so it can never overwrite real data by mistake.
set -euo pipefail

backup="${1:?usage: restore-drill.sh BACKUP.dump.age AGE_KEY_FILE TARGET_URL}"
key="${2:?age identity (private key) file required}"
target="${3:?target database url required}"

existing="$(psql "$target" -tAc "select count(*) from information_schema.tables where table_schema='public'")"
if [ "$existing" != "0" ]; then
  echo "refusing: target database already has $existing tables (use an empty one)" >&2
  exit 1
fi

plain="$(mktemp)"
trap 'rm -f "$plain"' EXIT
age --decrypt --identity "$key" --output "$plain" "$backup"
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$target" "$plain"

echo "restored $backup — row counts:"
psql "$target" -c "
  select 'user' as table_name, count(*) from \"user\"
  union all select 'ingredients', count(*) from ingredients
  union all select 'meals', count(*) from meals
  union all select 'meal_items', count(*) from meal_items
  union all select 'log_entries', count(*) from log_entries
  union all select 'log_entry_items', count(*) from log_entry_items
  union all select 'user_settings', count(*) from user_settings
  union all select 'migrations applied', count(*) from drizzle.__drizzle_migrations;"
