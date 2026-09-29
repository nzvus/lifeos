# Runbook: restore drill

ADR-0003: "an untested backup is only a promise". This drill restores a real
backup into an **empty** throwaway database and compares row counts with
production. Do it once after setup, then every few months, and after any
change to `scripts/backup.sh` or the workflows.

## Steps (local, no root needed)

```bash
# 1. Download the newest backup artifact (web UI: Actions -> backup -> run -> Artifacts,
#    or with GitHub CLI):
gh run download --name db-backup-RUN_ID --dir /tmp/drill

# 2. Start a throwaway Postgres in /tmp (does not touch any system database):
initdb -D /tmp/drill-pg -U drill --auth=trust
pg_ctl -D /tmp/drill-pg -o "-p 5433 -k /tmp" -l /tmp/drill-pg.log start
createdb -h /tmp -p 5433 -U drill drill

# 3. Decrypt + restore + count (refuses a non-empty target):
scripts/restore-drill.sh /tmp/drill/lifeos-*.dump.age ~/.config/lifeos/backup-key.txt \
  "postgres://drill@/drill?host=/tmp&port=5433"

# 4. Compare with production (read-only query):
PGSSLROOTCERT=system psql "$DATABASE_URL_DIRECT" -c "select (select count(*) from ingredients) ing,
  (select count(*) from log_entries) entries, (select count(*) from log_entry_items) items"

# 5. Clean up:
pg_ctl -D /tmp/drill-pg stop && rm -rf /tmp/drill-pg /tmp/drill
```

Pass = counts match (production may be slightly ahead if you logged food since
the backup ran), and `migrations applied` equals the number of files in
`drizzle/` at that time.

## Drill log

| Date | Backup | Result | By |
|---|---|---|---|
| 2026-09-29 | local test data, script development | pass: all 7 tables' counts matched; non-empty target refused | agent (sandbox, Postgres 16) — does NOT count as the S01 drill |
