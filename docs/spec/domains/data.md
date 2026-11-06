# lifeos — domain: Data (time, metrics, quality, storage, minor trackers)

Status: **draft 2026-11-06** (phase 2b fold; horizontal shape approved in `model.md`, PROD-44).
Rules beyond MOD-10…12 (voce, source, confidence), MOD-40…44 (metric, fascia, goal, voto,
decision) and MOD-60 (relations). IDs: `DT-nn`. Sources: `v2/engines.md` E1 Time, E2 Metrics,
E8, E9; `v2/schema.md`; `v2/migration.md`; `v2/dossiers/data-repair.md`; ADR-0003, -0004,
-0006, -0052, -0057; `v2/kinds.md` (Money, Mind, Work, Habits, user-made). «Today» = the app (`src/`),
6 Nov. Fold map: `audit-2026-11/fold-plan-data.md`.

## 1. Time
- **DT-01** Instants are stored in UTC; a voce has `start` and, for intervals, `end > start`.
  Its **logical day** = the local date of (start − boundary) in *his* time zone (never the
  server's); boundary default 04:00 (`day_boundary_min` 240). A snack at 01:30 belongs to the
  evening before. `day` is stored for indexing. A voce may have a day and no time: it sits at
  the end of its day. A typed time becomes an instant across clock changes (`instantAt`).
  [E1, concepts §1, PROD-07, schema `entries`] — Today: built (`engines/time/logical-day.ts`).
- **DT-02** Status previsto · fatto · saltato: a saltato counts for adherence, never as zero
  intake, and relates to nothing (MOD-60); a previsto relates (the day «with the plan»). A
  fatto voce may *fulfil* a previsto one (link `fulfils`: «previsto 08:00, mangiato 08:40»).
  Future days hold previsto voci only. [concepts §1, DATA-04, KEEP-07] — Today: built (statuses,
  links); fulfils link partial (Piano matches by role, PL-40).
- **DT-03** Windows: day, ISO week (Monday on), month, rolling N days, a session, a custom
  range. A day **has data** when it holds a voce of the source type in a counted status, before
  other filters: an unlogged day is *unknown*, never zero; a logged day without the thing is 0
  («nessuno spuntino dopo le 21» = 0 kcal). [E1, E2, DATA-04, DATA-05, v1 «an unlogged day is
  not a fast»] — Today: built (`engines/time/window.ts`, `metric()`).
- **DT-04** Relation bands: edges count; where two bands meet, the first declared wins; every
  related voce is tested, not only the nearest (a meal can be post of one session and pre of the
  next). The gaps themselves are MOD-60. [E1, ISSN 2017, Kerksick 2017] — Today: built
  (`relations.ts`).

## 2. Metrics (beyond MOD-40)
- **DT-10** Sums of nutrients and money use exact decimals (big.js), rounded once at display:
  totals = parts. Values are `numeric(14,4)`; money is signed integer cents. [E2, schema,
  v1 invariant] — Today: built.
- **DT-11** Shares, ratios and «per kg» read the trend weight (E4, the bucket's mean), never a
  single weigh-in. [E2, DATA-05] — Today: built.
- **DT-12** Buckets: per day, ISO week (clipped to the window), month, whole window. Filters:
  status (fatto; with previsti = the day with the plan), catalog object, relation tag, time of
  day (wrapping past midnight). A metric's source may be a per-day metric (the week's mean
  daily protein). Trend = EMA by half-life with σ; rate per week. [E2] — Today: built
  (`engines/metrics/`).
- **DT-13** **Streak** = consecutive windows meeting the target; a window with no data breaks
  it; today, open and not met yet, does not; a saltato with a reason (sick, travel) can be set
  not to break it. **Regularity** = 1 − coefficient of variation; for times of day, circular SD
  of the minute. [E2, DATA-05] — Today: built (engine).
- **DT-14** **Stored vs derived**: only raw facts (voci, values, lines, sets, movements, catalog
  values, goals, blocchi) and decisions are stored; every metric, voto, trend, stock, balance
  and estimate state is computed on read. A per-day cache, if speed needs one, is rebuildable and
  out of the export. When a formula changes, past numbers are recomputed except decisions
  (closed days, frozen targets, snapshots: MOD-44), and the UI marks a number frozen under an
  older formula. [DATA-09, DATA-14, concepts §9, schema «Not tables»] — Today: partial (all
  derived on read; the «older formula» mark is not built, PROD-15).
- **DT-15** Correlations (the six default pairs of MOD-55): Spearman ρ with a seeded bootstrap
  95 % interval, lagged pairs, n ≥ 21 paired days, worded «potrebbe essere un caso», never
  turned into advice. [DATA-07, E8, x08] — Today: built (`engines/correlations/`); the ≥ 3
  months gate of MOD-55 not built.

## 3. Quality and confidence (beyond MOD-12)
- **DT-20** Estimates never train anything: the learnt expenditure, the weight trend, voti,
  correlations and records read measured values only; an estimate fills a box, it never
  becomes a measurement. Subjective values (mood, energy, sleep quality, ratings) and goals are
  never estimated: empty or asked. Each filled value carries source, confidence and the
  «stima» pill. [migration.md «Missing data», PRD-22, c09] — Today: partial (source and
  confidence stored; not every engine filters by confidence).
- **DT-21** **Convergence**: when two sources measure the same quantity on the same day, the
  higher-confidence measurement replaces the lower one, never adds to it; a disagreement above
  the type's declared share (30 % for steps) is said beside the value, naming both. The
  per-type use (steps) is BD-40. [PROD-29, BODY-01, method.md] — Today: not built (one source per
  quantity today).
- **DT-22** Quality checks for every type (E9): missing days, values outside the field's range,
  duplicates (same day and minute), unit-like jumps (×10, ×1000; ×2 only for fields typed per
  side or per dumbbell — steps doubling is a real day), the estimated share. Shown in Andamento ›
  «Qualità dei dati» (last 30 days up to yesterday, each issue opening its voce) and before
  saving where cheap (an implausible weight asks). [DATA-08, DATA-22, E9, KEEP-11] — Today:
  built (`engines/quality`, `core/quality/read.ts`).
- **DT-23** Import review outliers (any file brought in): kcal vs Atwater beyond ± 15 %, sugars
  > carbs, saturated > fat, weight jumping > 2 % in a day, loads doubling between sessions,
  timed sets kept only at 1.5–8 s per rep, rests from gaps capped at 10 min, nights > 14 h or
  reversed, duplicates; each change listed with old value, new value and reason, loaded only
  after he reads it. [DATA-02, migration.md «Review»] — Today: built for v1 → v2 (`core/convert`).

## 4. Storage, isolation, migrations
- **DT-30** Every table carries `user_id`, children included; foreign keys are composite
  `(id, user_id)`; every query goes through a `core/` repository with an `Owner` (`ownedBy`);
  a test per table proves another user's row is refused. Isolation sits at the data boundary,
  never in middleware; RLS deferred. [ADR-0057, ADR-0006, ADR-0003 §3, DATA-19] — Today: built.
- **DT-31** Removing a voce moves it to a 30-day trash (`deleted_at`); trashing a parent trashes
  its children in the same transaction and restoring brings them back. A catalog object is
  deleted only when unused, else archived (MOD-20, PAT-20). [DATA-01 R1, DATA-13, schema]
  — Today: partial (trash and parent→children built; purge after 30 days and the «used by»
  check before delete not built).
- **DT-32** Schema change: edit `core/db/schema` → `drizzle-kit generate` → read the SQL →
  commit; every `npm test` applies all migrations to PGlite from zero; rehearsed on the PR's
  Neon branch; applied to production only by the human-triggered job (`migrate-v2.yml`) after a
  dump. Never `push` on a shared database, never on build or merge. Code that needs a column
  merges after its migration is applied; «applied» is said only after checking the data.
  [ADR-0003, ADR-0004, ADR-0057, DATA-17, DATA-18] — Today: built.
- **DT-33** A data repair is one committed, idempotent SQL migration per repair, tested on PGlite
  with a copy of his export, logging its counts, run by his job; the acceptance is the same audit
  on the next export. Each repair is his call. [DATA-01, data-repair §2] — Today: built
  (`drizzle/0002…0005`).
- **DT-34** Backup: a daily `pg_dump` outside Neon (GitHub Actions, encrypted, several
  generations), a dead-man's switch on the backup and on `/api/health`, the restore drilled and
  written down; a second copy of the backup key in the restore runbook. Neon's transfer budget
  (5 GB/month): narrow columns, measured locally with a counting proxy, never against Neon. The
  Neon project is never deleted. [ADR-0003, ADR-0004, DATA-12, DATA-17, PLAT-02] — Today:
  built (`backup.yml` dumps branch `v2` daily since 6 Nov, #329 — before that only v1 was
  dumped; `/api/health`; `scripts/restore-drill.sh`); second key copy not built; no restore
  drill of a v2 dump yet.

## 5. Export and import
- **DT-40** One file, `lifeos-export` version 100 (the v2 line): every owned table, flat, in
  dependency order, the trash included, secrets out; a coverage test fails on a table neither
  exported nor on the commented exclusion list. CSV = a zip of one CSV per table from the same
  rows. Uploads are gzipped in the browser; the server validates the whole file before touching
  the database. v1 files (≤ 21) go through the converter. [ADR-0052, PLAT-03, schema «Export»]
  — Today: built (export, CSV, `core/convert/file.ts`).
- **DT-41** **Replace**: a safety copy is downloaded first, a confirmation names the counts per
  area, one transaction, new ids with references remapped, login, email and language kept.
  **Merge**: always a dry run first; identity is natural (catalog by name key, per-day records by
  day, weigh-ins by day and time, voci by day + time + name); identical kept once, new added;
  any unresolvable conflict stops the whole merge, lists why and offers Replace; never half.
  [ADR-0052, PLAT-03] — Today: partial (`loadFile`/`replaceFile` and the v1 → v2 merge built;
  no Replace or Merge of a v2 file in Impostazioni).
- **DT-42** v1 is retired: WHEN the export of v1 is verified against v2's (6 Nov) THEN v1's
  Vercel project is removed, v1's code leaves the repository, v2 lives at the repository root
  (`src/`, with `packages/kit` a workspace) and v1's tables are dropped on Neon branch
  `production` by him; the Neon project stays (DT-34) and v1 export files still load (DT-40).
  [PLAT-01 as amended by PROD-39; his 25 Oct pick «ok come consigli tu»; change
  2026-11-06-retire-v1] — Today: built (export verified, Vercel `lifeos` deleted, code out,
  root layout); the table drop is his step (`docs/runbooks/retire-v1.sql`).

## 6. Minor trackers (no structure until data asks: PRD-02)
- **DT-50** **Soldi**: a movement = signed cents, category (a sub-category counts for its
  parent), shop, method, note. The month: spent, earned, pace vs the same day of the month
  before, by category, by day with the day's total. Accounts, balances, receipts, bank or PayPal
  import and monthly reports: not now (x01, x02). [kinds.md «Money», KEEP-20, HOME-08] — Today:
  built (`core/money/month.ts`).
- **DT-51** **Mente**: check-in = mood, energy, stress 1–5 and moment (morning, evening), one
  tap each, tapping the same value again clears it; judged only against his own 28-day baseline
  and only with coverage (MOD-41); the last 30 days as three short bars with the note and the
  means. Hunger 1–5: not now (x09). [kinds.md «Mind», KEEP-11, KEEP-21] — Today: partial
  (check-in type built; baseline, tap-to-clear and 30-day bars not found).
- **DT-52** **His own trackers** (study, reading, guitar…): a registry row (MOD-01) with a name,
  a family (habit, mind, body, sleep, drink, food), instant or duration, ≤ 6 fields (number with
  unit, whole number, 1–5, yes/no, choice, text, minutes) in his words; no migration, no new
  screen; archived ones leave ⊕, their voci stay. Planned as an abitudine (PL-03). Activity
  categories (work, study, commute…) are a field, not types. [kinds.md «user-made», «Work»,
  PROD-06] — Today: built (`core/kinds/user.ts`).
- **DT-53** A goal whose metric has no voci in its window shows «non so» with what is missing;
  goals with no data since they were set are offered for removal (log them or remove them).
  [x15, MOD-41/42, kinds.md «Habits and goals»] — Today: not built.

## 7. Platform
- **DT-60** Installable PWA, online first, no user data cached on the device; offline logging
  only if the gym shows the need. One owner; the invites table stays, several users not now
  (x12). Logic in a framework-free `core/`, feature slices without cross-slice imports, engines
  free of Drizzle, all lint-enforced. [PLAT-06, ADR-0001, ADR-0002, ADR-0019, DATA-16, PROD-20]
  — Today: built.
- **DT-61** No literal values outside tokens (PAT-80) and the string catalogue: UI strings move
  to one catalogue per area (`i18n/`), type by type in phase 4; the glossary test reads it
  (PAT-81; his pick 6 Nov «Catalogo unico»). [DATA-16, ADR-0002, audit ledger-A] — Today: not
  built (v2 strings inline).
