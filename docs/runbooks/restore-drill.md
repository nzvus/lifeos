# Runbook: restore drill

ADR-0003: "an untested backup is only a promise". This drill restores a real
backup into an **empty** throwaway database and compares row counts with
production. Do it once after setup, then every few months, and after any
change to `scripts/backup.sh` or the workflows.

## Steps (local, no root needed)

```bash
# 1. Download the newest backup artifact (web UI: Actions -> backup -> run -> Artifacts,
#    or with GitHub CLI):
gh run download --name db-backup-v2-RUN_ID --dir /tmp/drill

# 2. Start a throwaway Postgres in /tmp (does not touch any system database):
initdb -D /tmp/drill-pg -U drill --auth=trust
pg_ctl -D /tmp/drill-pg -o "-p 5433 -k /tmp" -l /tmp/drill-pg.log start
createdb -h /tmp -p 5433 -U drill drill

# 3. Decrypt + restore + count (refuses a non-empty target):
scripts/restore-drill.sh /tmp/drill/lifeos-*.dump.age ~/.config/lifeos/backup-key.txt \
  "postgres://drill@/drill?host=/tmp&port=5433"

# 4. Compare with production, the direct URL of lifeos_v2 (read-only query):
PGSSLROOTCERT=system psql "$DATABASE_URL_DIRECT" -c "select (select count(*) from catalog_items) items,
  (select count(*) from entries) entries, (select count(*) from entry_lines) lines"

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
| 2026-09-29 | `db-backup-36580999618` (`lifeos-2026-09-29T14-13-30Z.dump.age`), production | **pass**: restored into Postgres 18.6 in /tmp; user 1, ingredients 47, meals 22, meal_items 80, log_entries 0 — identical to production; migrations applied 1. `pg_dump` (CI) and `psql` (local) both connected with `sslmode=verify-full` + `PGSSLROOTCERT=system` | Dino — **the S01 drill** |
| 2026-11-12 | `db-backup-v2-43206503569` (`lifeos-2026-11-12T11-08-34Z.dump.age`), production v2 — **the first v2 drill** (Q-19 (a), «yc» by the user) | **pass**: restored into Postgres 18.6 (scratch dir, port 5433), migrations applied 10 (= `drizzle/` 0000–0009). Compared with the user's export of 10 Nov 22:06 UTC (production psql is blocked for Claude): catalog_items 516, catalog_values 4854, goals 9, cycle_steps 34 identical; entries created before the export 1328 = the export's 1328; the backup holds 41 more (logged 11–12 Nov). Second key copy: **left to the user** | Claude |
