# Ledger audit A (PROD, DATA, PLAN, PLAT, KEEP, CONTRA) — branch s249-cleanup-phase0

Method: grep/read sampling of apps/v2/src and packages/kit/src, no repo file modified. "built" = sampled, not exhaustive. Paths are relative to apps/v2/src unless noted.

## PROD
| ID | status | verdict | evidence | duplicate of / conflicts with |
|---|---|---|---|---|
| PROD-01 | D | process: followed | dossiers/fidelity.md audit + kit photographing (kitshot, ui-check); lesson applied | PROD-32 |
| PROD-02 | D | built | core/db/schema: 30 tables, decisions (plans.ts:279), price_observations, settings day_boundary 240 (account.ts:26) | |
| PROD-03 | v2 | built | core/kinds/user.ts:28 MAX_FIELDS=6, USER_FAMILIES | |
| PROD-04 | D | partial | core/kinds/builtins.ts has meal/water/session/steps/weigh_in/sleep…; no blood pressure/medication kind found | |
| PROD-05 | D | partial | core/plans/habits.ts habit = template; but goals is its own table (plans.ts:248, weight kinds), not metric+window+target | PLAN-12, PLAN-20 |
| PROD-06 | D | built | app/(app)/andamento/[tracker], aggiungi/[kind], core/kinds/user.ts (no migration per kind) | |
| PROD-07 | D | built | core/engines/time/logical-day.ts; entries status planned/done/skipped (facts.ts:88) | |
| PROD-08 | D | partial | core/kinds/kind.ts typed fields exist; entry mode / declared default targets not confirmed | PROD-16 |
| PROD-09 | D | built | facts.ts:70 source enum, :71 confidence + check | |
| PROD-10 | D | built | definitions.ts catalog_items (based_on, deleted_at), catalog_values confidence:123 | PROD-16 |
| PROD-11 | D | built | core/engines/metrics/metric.ts declared, computed on read, exact decimals | DATA-05 |
| PROD-12 | D | partial | core/goals: weight goals with pace/ETA; no generic at-least/at-most/range goal on any metric | PLAN-20 |
| PROD-13 | D | built | core/engines/judgements/registry.ts; app/(app)/oggi/andamento/come-valutiamo | DATA-06 |
| PROD-14 | D | built | core/engines/time/relations.ts + relations.test.ts | DATA-04 |
| PROD-15 | D | partial | decisions table frozen (closure.ts, week_targets); no «older formula» marker in UI found | |
| PROD-16 | D | built | schema entries/kinds/templates/goals/decisions as described | PROD-08, PROD-10 |
| PROD-17 | D | built | core/engines/* generic (time, metrics, planning, judgements, correlations) | |
| PROD-18 | D | partial | generic [area]/andamento/[tracker] and aggiungi/[kind] exist, but bespoke pages cibo/pasto/esercizio/tragitto/ciclo/abitudine | PROD-36 (admits gap) |
| PROD-19 | D | built | apps/v2, packages/kit; eslint.config.mjs bans Drizzle in engines/features | DATA-16 |
| PROD-20 | D | built | one-owner today; Owner/ownedBy (core/identity/owner.ts:27), invites table | PLAT-09 |
| PROD-21 | D | built | ownedBy on every query; totals engines; export guarantee test | |
| PROD-22 | D | built | no paid services; app/manifest.ts, no native app | |
| PROD-23 | D | built | training burn as kcalEstimate / expenditure/training.ts estimate | |
| PROD-24 | D | built | no assistant code in apps/v2 (ASSISTANT_ENABLED absent) | PLAT-05 |
| PROD-25 | D | process: followed | packages/kit extracted from v2 screens (Box, List, DateNav…) | |
| PROD-26 | D | process: followed | docs/spec/v2 dossiers, handoff, ledger | |
| PROD-27 | D | process: partial | ROADMAP.md exists but plan lives also in ~/.claude/plans and archived branches (PROD-35) | PROD-39 |
| PROD-28 | D | process: followed | 23 dossiers in docs/spec/v2/dossiers | |
| PROD-29 | D | process: followed | engines cite sources (EFSA, Spearman, ISSN) in code | DATA-15 |
| PROD-30 | D | process: followed | scripts/vercel-ignore.sh, CLAUDE.md test rules | |
| PROD-31 | D | process: not-followed | «Duplica» still in features/plan/ModelEditor.tsx:277 after «Parti da» replaced it (PLAN-14) | PLAN-14 |
| PROD-32 | D | process: followed | scripts/ui-check.mjs, ui-audit.mjs, ui-baseline.json | PROD-01 |
| PROD-33 | D | process: followed | core/convert + parity.ts load the export; 592 values compared | DATA-02 |
| PROD-34 | D | process: followed | scripts/check.py, ledger_reminder.py SessionStart hook, PR template «Ledger» section | PROD-38 (partly) |
| PROD-35 | D | process: followed | commit f5c3a45 phase 0 (freeze, exports folder, handoff cut) | PROD-36..39 same plan |
| PROD-36 | D | not-built | phase 3 future; FoodForm, ExerciseForm, RouteForm, HabitForm, CycleEditor, ModelEditor separate; no catalog-object registry | PROD-18 |
| PROD-37 | D | process: in progress | phase 1 inventory (this audit); no spec/ OpenSpec tree yet | PROD-35 |
| PROD-38 | D | not-built | eslint.config.mjs only has import boundaries; check.py has no «built needs test»; no test cites requirement IDs; no hooks/path rules | PROD-34, DATA-16 |
| PROD-39 | D | process: followed | one branch s249, single commit; rules in CLAUDE.md/ROADMAP | PROD-35 |

## DATA
| ID | status | verdict | evidence | duplicate of / conflicts with |
|---|---|---|---|---|
| DATA-01 | D | built | drizzle/0002..0005_data_repair_*.sql, core/db/data-repair.test.ts | |
| DATA-02 | D | built | core/convert/parity.ts, convert.test.ts (data review before import) | PROD-33 |
| DATA-03 | D | partial | parity table in migration.md; missing: label OCR, adherence trends, sparklines, packs (see KEEP) | KEEP-* |
| DATA-04 | v2 | built | core/engines/time/window.ts, relations.ts, recurrence.ts + tests | PROD-14 |
| DATA-05 | v2 | built | metric.ts big.js exact decimals; unlogged day = unknown | PROD-11 |
| DATA-06 | v2 | built | judgements/registry.ts, model.ts | PROD-13 |
| DATA-07 | v2 | partial | correlations.ts MIN_PAIRS=21, Spearman+bootstrap; Legami page; user-added pairs (F) absent | |
| DATA-08 | v2 | built | engines/quality + core/quality/read.ts + oggi/andamento/qualita page | |
| DATA-09 | D | built | principle; layered engines raw→derived→judgement (sampled) | DATA-14 |
| DATA-10 | D | partial | sampled: learnt expenditure, role, e1RM exist; full D-1..D-10 not individually verified | |
| DATA-11 | F | future | core/convert/merge.ts only precursor; no import review screen for FitForge/bank | |
| DATA-12 | F | future | nothing contradicts | |
| DATA-13 | ? | not-built | no «used by» check before deleting trashed objects (grep) | |
| DATA-14 | D | built | principle; ownedBy, decisions, derived-on-read (sampled) | DATA-09 |
| DATA-15 | D | process: followed | sources cited in engines/targets/hydration code | PROD-29 |
| DATA-16 | D | contradicted | core/ framework-free lint yes; but no v2 i18n/design dir and no lint on literal values: Italian strings inline everywhere | PROD-38; v1 src/{design,i18n} only |
| DATA-17 | D | built | .github/workflows/backup.yml, scripts/restore-drill.sh, app/(app)/profilo/esporta | PLAT-03 |
| DATA-18 | D | built | workflows ci.yml, migrate-v2.yml, backup.yml heartbeat | |
| DATA-19 | D | built | core/auth/auth.ts Better Auth; core/identity/owner.ts ownedBy | |
| DATA-20 | D | partial | considerations principle; no systematic per-datum audit in code | DATA-22 |
| DATA-21 | F | future | nothing contradicts | |
| DATA-22 | F | future | nothing contradicts | DATA-20 |

## PLAN
| ID | status | verdict | evidence | duplicate of / conflicts with |
|---|---|---|---|---|
| PLAN-01 | ? | not-built | features/plan/ModelEditor.tsx:332 still only Pasto/Allenamento; rethought in plan.md, code parked | PLAN-15, PLAN-29, PLAN-34 |
| PLAN-02 | D | built | core/energy/ensure.ts («Ricalcola»), engines/targets/week.ts | PLAN-28 |
| PLAN-03 | D | partial | features/day/goal-line.ts one-line; full traceable words not confirmed | |
| PLAN-04 | D | partial | models-repo/day-changes, «Copia ieri», swap; header «Giornata … ciclo» not verified | |
| PLAN-05 | D | partial | superseded in part by ADR-0059: shelves split per area ([area]/piano) | |
| PLAN-06 | D | partial | chains partly (eat→totals, buy→pantry); not verified end to end | |
| PLAN-07 | D | partial | Copia ieri, Togli i previsti (entries/write.ts:205), Salva come modello (oggi/day-page.tsx:747) built; weekly check-in card absent | PLAN-22, KEEP-07 |
| PLAN-08 | D | partial | kit DateNav.tsx, RangeNav.tsx, calendar.ts exist; score dots/month sheet not verified | KEEP-01 |
| PLAN-09 | v2 | built | engines/planning/apply.ts, time.ts, rebase.ts | |
| PLAN-10 | v2 | built | engines/targets/day.ts, micros.ts, slots.ts, ranges.ts | PLAN-25 |
| PLAN-11 | D | built | rebase.ts «Scollega», templates.extends_id (plans.ts:44) | |
| PLAN-12 | D | built | planning/apply.ts; core/plans/habits.ts recurrence | PROD-05 |
| PLAN-13 | D | built | engines/planning/cycle.ts; CycleEditor.tsx:159 slitta/si perde | |
| PLAN-14 | S | contradicted | «Duplica» button still in features/plan/ModelEditor.tsx:277 though superseded by «Parti da» | PROD-31, PLAN-33 |
| PLAN-15 | F | future | partly present (blocks, extends); nothing contradicts | PLAN-01, PLAN-18 |
| PLAN-16 | F | future | nothing contradicts | PLAN-21 |
| PLAN-17 | F | future | nothing contradicts | |
| PLAN-18 | D | partial | models generic in schema/engine; UI limited (see PLAN-01) | PLAN-01 |
| PLAN-19 | D | built | core/energy/day.ts one day engine | |
| PLAN-20 | D | built | goals since_day (plans.ts:248), engines/targets/pace.ts | PROD-12 |
| PLAN-21 | D | built | day model as program, goal source (core/day/targets.ts) | PLAN-16 |
| PLAN-22 | D | superseded | by PLAN-02 («no accept»); core/energy/ensure.test.ts «never a v1 check-in» | PLAN-07, PLAN-02 |
| PLAN-23 | D | partial | week read in engines/targets/week.ts; «propose a day» ±30 % not found | |
| PLAN-24 | D | built | app/(app)/oggi/day-page.tsx Timeline, OpenBox, DayView | KEEP-01..08 |
| PLAN-25 | D | built | engines/targets/ranges.ts bands | PLAN-10 |
| PLAN-26 | D | partial | bands for nutrients; every tracked thing not confirmed | |
| PLAN-27 | D | built | decisions day_targets/week_targets frozen | |
| PLAN-28 | D | built | engines/expenditure/everyday.ts Mifflin | PLAN-02 |
| PLAN-29 | D | partial | plan everything: schema yes, UI limited | PLAN-01 |
| PLAN-30 | v2 | built | app/(app)/piano, oggi/piano «+ previsto» | |
| PLAN-31 | v2 | built | oggi/andamento/obiettivi, obiettivi/nuovo | PLAN-20 |
| PLAN-32 | D | partial | day closure built (core/day/closure.ts); morning weigh-in prompt as habit not confirmed | |
| PLAN-33 | D | not-built | plan_rules/layers parked on archive/s247-v2-plan until phase 4; «scheda» absent (CONTRA-04) | CONTRA-04, PLAN-34/35 |
| PLAN-34 | D | not-built | blocks with real meals/rotations parked (same migration 0006) | PLAN-01 |
| PLAN-35 | D | not-built | layers per category + cross rules parked, none in code | PLAN-33 |

## PLAT
| ID | status | verdict | evidence | duplicate of / conflicts with |
|---|---|---|---|---|
| PLAT-01 | D | superseded | timing replaced by PROD-39 (v1 retired at start of phase 4); v1 still at repo root src/ | PROD-39 |
| PLAT-02 | D | process: followed | backup.yml, budget noted in memory; no Neon measuring in code | |
| PLAT-03 | D | partial | v2 file is version 100 not v21 (core/convert/file.ts:3); export/csv/merge exist; Replace with safety copy not found | |
| PLAT-04 | D | partial | invites table (schema/auth.ts), auth.ts; packs absent | PLAT-09 |
| PLAT-05 | S | built (absent) | no assistant in v2 | PROD-24 |
| PLAT-06 | D | built | app/manifest.ts, no service worker, public/icon-*.png | |
| PLAT-07 | F | future | nothing contradicts | |
| PLAT-08 | F | future | nothing contradicts | |
| PLAT-09 | F | future | invites table exists; no multi-user UI | PLAT-04, PROD-20 |
| PLAT-10 | F | future | nothing contradicts | |

## KEEP (v1 features v2 must not lose)
| ID | status | verdict | evidence | duplicate of / conflicts with |
|---|---|---|---|---|
| KEEP-01 | v1 | partial | kit DateNav/Swipe/calendar.ts exist; «Torna a oggi» string absent (Oggi chip per PLAN-08) | PLAN-08 |
| KEEP-02 | v1 | partial | features/day/goal-line.ts; «come nasce questo numero» three-way balance not found | PLAN-24 |
| KEEP-03 | v1 | partial | chips on day-page (sleep/steps); mood sheet unconfirmed | PLAN-24 |
| KEEP-04 | v1 | built | kit Nutrients.tsx, features/day/nutrients.ts, OpenBox.tsx | |
| KEEP-05 | v1 | partial | features/day/slots.ts, Timeline.tsx; «saltato?» hint absent | PLAN-24 |
| KEEP-06 | v1 | partial | EntryRow.tsx eye/servings; «aggiorna ai valori attuali» absent; NOVA bar only in convert | |
| KEEP-07 | v1 | built | entries/write.ts:205 Togli i previsti; core/food/copy.ts Copia ieri | PLAN-07 |
| KEEP-08 | v1 | partial | pantry/quality/calibration in day-page; whole panel set not verified | |
| KEEP-09 | v1 | built | features/food/Composer.tsx, EstimateFields, Porzioni; app/aggiungi | |
| KEEP-10 | v1 | built | aggiungi + Palestra «come l'ultima volta» (migration.md parity) | |
| KEEP-11 | v1 | partial | weigh_in fasted/afterToilet fields; +1,000/+2,500 steps, mood tap-clear not found | |
| KEEP-12 | v1 | built | features/library/Library.tsx sorts | |
| KEEP-13 | v1 | partial | BarcodeBox + OFF prefill, cibo/[id] impact; label photo OCR absent | |
| KEEP-14 | v1 | not-built | no adherence / eating-window trends found | |
| KEEP-15 | v1 | partial | piano calendar exists; drag/↑↓ of coming days only in EntryRow | |
| KEEP-16 | v1 | partial | esercizio/[id]/unisci merge, ExerciseForm; «suggest from name» only in convert | |
| KEEP-17 | v1 | built | features/training SetForm, Gym last sets | |
| KEEP-18 | v1 | built | GymClock.tsx overtime, engines/training/warmups.ts, resume in training/write.ts | |
| KEEP-19 | v1 | partial | BMI/WHtR in body/density; sparkline of routines absent | |
| KEEP-20 | v1 | built | core/money/month.ts, features/money | |
| KEEP-21 | v1 | partial | oggi/andamento/qualita; 30-day mind bars not confirmed | |
| KEEP-22 | v1 | partial | settings: locale, theme, density, timezone, trash (profilo/cestino); packs absent | PLAT-04 |

## CONTRA
| ID | status | verdict | evidence | duplicate of / conflicts with |
|---|---|---|---|---|
| CONTRA-01 | D | built | settled by UI-78; not individually re-verified in kit CSS | |
| CONTRA-02 | D | built | settled by UI-77; DayPart.tsx in kit | |
| CONTRA-03 | D | built | settled by UI-79; not re-verified | |
| CONTRA-04 | D | not-built | settled «scheda», but code uses «routine» ~149 times (core/training readRoutines…), «scheda» 1 | PLAN-33 |
| CONTRA-05 | ? | open (still real) | 46 «Salva» / 32 «Annulla» uses in app/features vs interaction.md §3 | |
| CONTRA-06 | ? | open | not decided | |
| CONTRA-07 | ? | open | not decided | |
| CONTRA-08 | ? | superseded | ADR-0059 (areas again) is the code today (app/(app)/[area], features/area-index.ts); status should become D | PLAN-05 |

## Findings
- Counts by verdict are in the report; main pattern: the engines/data layer is largely built, the decided UX layer (Piano, shelves, vocabulary) is the gap.
- PLAN-33/34/35 and PLAN-01: plan_rules + migration 0006 parked on archive/s247-v2-plan; main still limits blocks to Pasto/Allenamento (ModelEditor.tsx:332).
- PLAN-14 «no Duplica» contradicted: ModelEditor.tsx:277 still has «Duplica»; migration.md parity table also still says «Duplica» (conflicts with FOOD «Parti da» rule).
- CONTRA-04 «scheda» settled 3 Nov but not applied: «routine» ~149 code occurrences (identifiers; few visible).
- PROD-38 guards are not built: eslint only enforces import boundaries; no requirement-ID tests, no «built needs test» in check.py, no off-glossary lint.
- DATA-16 contradicted: «no literal values outside design/i18n, lint-enforced» holds for v1 only; v2 has no i18n/design dir and Italian strings are inline.
- PROD-36/PROD-18: no catalog-object registry; Food, Exercise, Route, Habit, Cycle, Model each have own form and pages.
- PLAN-22 weekly check-in superseded by PLAN-02 («no accept»), yet PLAN-07 still lists the check-in card: internal conflict.
- PLAT-01 superseded by PROD-39 (v1 retired at start of phase 4); PLAT-03 says v21 but v2 file is version 100; no Replace with safety copy found.
- KEEP gaps: label OCR (13), adherence/eating-window trends (14), «aggiorna ai valori attuali» (06), steps +1,000/+2,500 (11), routine sparklines (19), packs (22), «come nasce questo numero» (02), «saltato?» hint (05).
- PROD-04 blood pressure / medication kinds absent; PROD-15 no «older formula» marker; PROD-12/PROD-05 goals are weight-only, not generic metric goals.
- DATA-13 (trashed object still referenced) still unbuilt and unanswered (status ?).
- CONTRA-08 is resolved by ADR-0059 but still «?»; CONTRA-05/06/07 still open.
- Process: ledger/check.py/SessionStart hook/PR template (PROD-34) are really in place; PROD-31 (retire what a feature replaces in the same PR) not followed (Duplica).
- Duplicate clusters: PROD-35/36/37/38/39 (one plan); PLAN-01/15/18/29; PLAN-02/21/28/16; PROD-24/PLAT-05; DATA-09/14; PROD-14/DATA-04; PROD-13/DATA-06; PROD-11/DATA-05; DATA-20/22; PLAT-04/09.
