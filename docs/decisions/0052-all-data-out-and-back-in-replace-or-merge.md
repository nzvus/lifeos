# ADR-0052: All data out and back in — a full backup, a replace, a merge, and CSV

**Status:** accepted (the developer chose A + B + C and the fallback rule, 2026-10-15: "voglio sia A che B, due funzionalità. anche C. se i conflitti di B non possono essere risolti, dice che si può fare solo con A")
**Date:** 2026-10-15
**Amends:** ADR-0003 (what the user-facing export holds), ADR-0034 (Settings imports more than packs)

## Context
The developer wants to download and import *"tutti, ma proprio tutti i dati
dell'app"*. Today:
- `GET /api/export` (version 20) leaves out caffeine and creatine per
  ingredient (`ingredient_compounds`), program day overrides, invites and
  everything in the trash.
- The only way back in is the CLI replace (`import:lifeos`), and it restores
  nutrition and settings only: training, body, sleep, movement, pantry, money,
  mind, goals, check-ins and closed days are lost on a round trip.
- Settings imports packs only (ADR-0034), which add catalog records by name.

PROJECT.md's primary invariant is that logged data is never lost. An export
that cannot come back whole only half-meets it.

## Options considered
### A. A full backup and a replace from Settings
Every owned table goes in the file, trash included. Settings → Data →
"Replace with a file" deletes the account's data and inserts the file's, in
one transaction.
- Pros: always possible; the result is exactly the file; simple to test
  (export → replace → export gives the same file, ids aside).
- Cons: destructive; whatever was logged after the file is gone.

### B. A merge from Settings
The file's records are added to what the account has. Same record → kept
once. Different record with the same identity → a conflict.
- Pros: combines two devices' or two accounts' data, or puts back an old
  week without losing this week.
- Cons: needs an identity for every kind of record and a rule for each
  conflict; references (a meal's ingredients, a session's exercises) must be
  remapped.

### C. A spreadsheet export
A zip with one CSV per table, readable in a spreadsheet. Export only.
- Pros: the data is readable without this app or a JSON viewer.
- Cons: one more format to keep in step with the schema; it cannot come back
  in (nested data such as snapshots is flattened).

## Decision
**A, B and C**, as three features over one file format.

1. **One format, version 21:** `lifeos-export` gains every owned table not yet
   in it, plus the trash (rows with `deletedAt`, marked as such). The format
   stays JSON with the row ids, because ids carry the references inside the
   file. Secrets stay out: password, sessions, and the assistant's key
   (encrypted with the server's secret, useless elsewhere). A test lists
   every table in `core/db/schema` and fails if one is neither exported nor
   on a short, commented exclusion list (auth tables, rate limits). This
   test is the guarantee of "proprio tutti".
2. **A — Replace.**
   - Before anything changes, the browser downloads the current export
     (a safety copy).
   - Then it asks for confirmation, naming what will be deleted (counts per
     area).
   - One transaction. New ids for every row, with the file's references
     remapped, so a file from another account never collides.
   - The login, the email and the language of the account are kept.
   - An older file (version < 21) replaces only the areas its version holds.
     The others are kept, and the report names them, so an old file never
     wipes training it did not contain.
3. **B — Merge.** A dry run first, always. It shows per area: added, already
   there, conflicts.
   - **Identity is natural, not the id** (the replace renews ids):
     - catalog records (ingredients, meals, exercises, routines, programs,
       products, tags, categories, day types) by name key, as packs do
       (ADR-0034);
     - per-day records (sleep, movement, check-ins, closures, day plans) by
       day;
     - weigh-ins by day and time;
     - log entries, sessions and money movements by day + time + name (or
       amount);
     - singletons (settings, the active goal) by the account.
   - **Resolved automatically:** identical records (kept once); a record
     only in the file (added, references remapped); a catalog record whose
     name matches and whose content differs, when nothing logged depends on
     the difference (kept as it is in the account, as packs do).
   - **Not resolvable: B stops.** For example two different sleep entries
     for the same night, a session on the same day and time with different
     sets, or two active goals. B lists each conflict and says why. Then it
     offers A: replace, with the safety copy first. It never writes half.
   - Tripwire: if real use shows the same conflicts every time, a per-conflict
     "keep mine / take the file's" choice is the next step (a new ADR).
4. **C — CSV.** "Download as spreadsheet": a zip with one CSV per table, in
   the same shape as the JSON (no extra joins). It is generated from the same
   rows as the JSON, so it can never disagree with it. Export only.
5. **Transport:** the file is gzip-compressed in the browser
   (`CompressionStream`) before upload. A 1 MB export becomes about 100 kB,
   far under Vercel's 4.5 MB request limit. The server validates the whole
   file (zod, every reference) before touching the database.

## Consequences
- `core/export` gains the missing tables. `core/import` gets one
  `replaceAll` and one `mergeAll` over a shared, versioned parser. The CLI
  `import:lifeos` becomes a thin wrapper over `replaceAll`, and the replace
  runbook loses its "not restored" list.
- Every future table must be added to the export, or the coverage test fails.
- Merge needs a natural key per kind. It lives next to the parser, one map,
  tested per kind (identical → kept, new → added, conflict → stop).
- Settings → Data gets: Download (JSON), Download as spreadsheet (CSV zip),
  Replace with a file, Merge a file. Packs stay as they are.
- PRs: (1) format v21 + coverage test; (2) replace in Settings (A);
  (3) merge (B); (4) CSV (C). None needs a migration.

## What I learned
<!-- the developer's words -->
