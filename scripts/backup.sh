#!/usr/bin/env bash
# scripts/backup.sh — make ONE encrypted database backup (ADR-0003).
#
# Used by .github/workflows/backup.yml (daily) and migrate.yml (before every
# migration); can also be run by hand. Steps:
#   1. pg_dump in "custom" format (-Fc): compressed, and restorable table by
#      table with pg_restore. Portable: it restores onto ANY Postgres, not
#      only Neon — the backup outlives the vendor.
#   2. Sanity check: pg_restore --list must be able to read the dump, so we
#      never store a corrupt file and believe it's a backup.
#   3. Encrypt with `age` to a PUBLIC key. Whoever runs this (e.g. GitHub's
#      servers) can encrypt but cannot decrypt: only your private key, which
#      never leaves your machine, can. The plaintext dump is deleted.
#
# Usage:  DATABASE_URL=... AGE_RECIPIENT=age1... scripts/backup.sh OUT_DIR
# DATABASE_URL: use Neon's DIRECT url (no "-pooler"): pg_dump needs a real session.
# With sslmode=verify-full, pg_dump (libpq) must know which certificate
# authorities to trust: export PGSSLROOTCERT=system (the workflows do).
set -euo pipefail # stop on any error, unset variable, or failed pipe

out_dir="${1:?usage: backup.sh OUT_DIR}"
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${AGE_RECIPIENT:?AGE_RECIPIENT (age public key) is required}"

mkdir -p "$out_dir"
stamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
plain="$(mktemp)"
trap 'rm -f "$plain"' EXIT # delete the plaintext even if a step fails

pg_dump --format=custom --no-owner --no-privileges --file="$plain" "$DATABASE_URL"
pg_restore --list "$plain" > /dev/null # fails loudly if the dump is unreadable

target="$out_dir/lifeos-$stamp.dump.age"
age --encrypt --recipient "$AGE_RECIPIENT" --output "$target" "$plain"

echo "backup: $target ($(du -h "$target" | cut -f1)), sha256 $(sha256sum "$target" | cut -c1-16)…"
