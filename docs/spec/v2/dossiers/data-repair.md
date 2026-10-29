# Dossier — data repair (what the 29 Oct export shows is wrong, and the rules that stop it)

Status: **draft 2026-10-29**. **Decided 2026-10-29 by the agent at the developer's request** («procedi senza di me… fai le scelte migliori»): §9 as recommended; the developer reviews after. Data repairs run on production only by the developer's migrate job. **R1 and R3 written 2026-10-29** as `apps/v2/drizzle/0002_data_repair_orphans.sql` (tested on PGlite, idempotent); **R2 written 2026-10-29** as `apps/v2/drizzle/0004_data_repair_roles.sql` (a timed meal with no role takes its local time's role from the person's bounds, `roleSource = auto`; runs after R6, so coffee and creatine get none). R5 waits for «Unisci». **R6 written 2026-10-29** as `apps/v2/drizzle/0003_data_repair_intake.sql` (single-food meals with no energy → `intake`, their role removed; 51 in the export of 29 Oct; tested on PGlite, idempotent): run only after the intake code (#303) is deployed.
data, so each repair is the developer's call (method.md §2). Short by
design: the causes are fixed in session.md, capture.md and activity.md;
this page lists the rows already wrong and how to repair them once.

## 1. What is wrong (export 29 Oct)
| # | Rows | Cause | Repair | Rule that stops it |
|---|---|---|---|---|
| R1 | **176** `session_exercise` still planned, children of sessions already in the trash | `trashEntry` / `trashPlanned` (`core/entries/write.ts:79`, `:89`) trash the session, not its children | trash them with their parent's `deleted_at` | trashing an entry trashes its children in the same transaction; restoring restores them |
| R2 | **60** done meals without a role (25 of 33 since 26 Oct) | MealWhen sends `role = ""` when «Senza scelta» | backfill the role from the meal's time and today's bounds, `roleSource = auto` | capture.md §4: store the role at save |
| R3 | **8** exercises with no set marked done inside finished sessions | `finishSession` marked every child done | → `skipped` | fixed in #294 for new sessions |
| R4 | **28** steps entries with a «level» | the v1 form | keep, no longer read (movement.md §4) | the level is not asked |
| R6 | Single-food «meals» of coffee, creatine, supplements | no intake kind | → `intake` entries with the same time and dose, if capture.md §9.0 is accepted | the intake kind |
| R5 | Catalog duplicates: Run/Corsa, Treadmill/Tapis roulant | two seeds | merge into the Italian name, keep the other as alias, move entries | «Unisci» (capture.md §4) |

## 2. How
- One data migration per repair (R1, R2, R3, R5), written as committed SQL in
  `apps/v2/drizzle/`, rehearsed on the PR's Neon branch and on PGlite with a
  copy of the export, applied only by the human-triggered `migrate` job
  after the dump (ADR-0003/0004).
- Each migration is idempotent and logs its counts; the acceptance test
  is the same audit script run on the next export: R1 → 0 orphans, R2 → 0
  done meals without a role, R5 → one «Corsa».

## 3. Acceptance tests
1. After R1, no live entry has a trashed parent.
2. After R2, the 27 Oct 11:09 meal has role `lunch`, source `auto`.
3. A session trashed and restored from the trash comes back with its
   exercises and sets.

## 4. Questions for the developer — decided 2026-10-29, as recommended
1. Run R1, R2, R3 and R5 on production after the code fixes ship?
   Recommended: yes, R1 first (it is pure cleanup).
