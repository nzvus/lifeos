# Ledger audit B (FOOD, TRAIN, BODY, HOME) — v2 code, branch s249-cleanup-phase0

Evidence is file-existence plus a spot read; items marked (spot) were not read line by line. Paths relative to apps/v2/src unless noted.

## FOOD (48)
| ID | ledger status | verdict | evidence | duplicate of / conflicts with |
|---|---|---|---|---|
| FOOD-01 | D | partial | core/food/score.ts:46 `value: null`; density, limits, fit, carbs, fat, satiety, variety built. Value 10 never scored | FOOD-10 (F, same score) |
| FOOD-02 | D | built | core/engines/targets/ranges.ts:41 four levels, caffeine, inulin; micros.ts | — |
| FOOD-03 | D | built | features/day/QuickIntakes.tsx, app/(app)/aggiungi/assunzione, core/food/intake.ts | FOOD-44 (refines) |
| FOOD-04 | D | built | features/add/rank.ts, app/(app)/aggiungi/page.tsx:3 (8 ranked rows), rank-actions.ts | — |
| FOOD-05 | D | built | features/day/QuickIntakes.tsx, Timeline.tsx (spot) | FOOD-13 (F, compounds on timeline) |
| FOOD-06 | D | partial | kinds.ts fatty acids, nutrients.ts leucine, score.ts protein quality as high/medium/low stand-in; no DIAAS bands, no GI | FOOD-07, FOOD-24 |
| FOOD-07 | D | built | core/food/kinds.ts, features/day/nutrients.ts, packages/kit/src/Nutrients.tsx | FOOD-28 (v2 instance) |
| FOOD-08 | F | future | micros built in part (core/engines/targets/micros.ts); full catalogue not | FOOD-29, FOOD-30 |
| FOOD-09 | F | future | slots.ts:4 gives pre/post/pre-sleep hints (built ahead) | FOOD-19, FOOD-34 |
| FOOD-10 | F | future | NRF density built in score.ts; distribution score not | FOOD-01 |
| FOOD-11 | F | future | inulin cap in ranges.ts:23; no tolerance band | FOOD-02 |
| FOOD-12 | F | future | no hunger input in v2 | — |
| FOOD-13 | F | future | built ahead: food/compounds.ts, features/day/compounds.ts | FOOD-18, FOOD-40 |
| FOOD-14 | F | future | no ratings in v2 (only core/convert/catalog.ts) | FOOD-24 |
| FOOD-15 | F | future | OFF provenance partial (food/off.ts) | HOME-06 |
| FOOD-16 | F | future | no «new from» an entry (spot: features/plan/from-day.ts is plan only) | FOOD-33, FOOD-42 |
| FOOD-17 | D | built | core/food/formats.db.test.ts, cost.ts, brands.ts, cibo/[id]/prodotto; FOOD-48 says formats built s246 | HOME-02 (same ADR-0055) |
| FOOD-18 | D | built | core/food/compounds.ts:1, creatine.ts, features/day/compounds.ts | FOOD-21, FOOD-40, FOOD-13 |
| FOOD-19 | D | superseded | No moment codes in v2; roles via engines/time/relations + slots.ts; superseded by FOOD-09/34 | contradicts FOOD-34 («set automatically from time») |
| FOOD-20 | D | built | core/food/edit.ts, app/(app)/voce/[id]/actions.ts updateMeal | — |
| FOOD-21 | D | built | CAFFEINE_HALF_LIFE_H=5 compounds.ts:13; creatine.ts; session levels (spot, unverified) | FOOD-18, FOOD-40 |
| FOOD-22 | D | built | core/food/copy.ts «Copia ieri»; planned/eaten in core/entries | — |
| FOOD-23 | D | built | features/food/MealWhen.tsx, features/day/slots.ts, aggiungi/pasto/page.tsx:33 | — |
| FOOD-24 | D | partial | NOVA field in cibo/[id]/modifica/actions.ts:32; origin, fibre types, ratings and derived shares not seen | FOOD-06, FOOD-14 |
| FOOD-25 | D | superseded | closed by FOOD-41 (own text says so); still marked D | FOOD-41 |
| FOOD-26 | D | built | core/food/totals.ts, core/entries (snapshots, totals on read) | — |
| FOOD-27 | v2 | built | features/food/Composer.tsx, composer.ts, LinePicks.tsx | FOOD-42 |
| FOOD-28 | v2 | built | core/food/kinds.ts «senza stima» (spot) | FOOD-07 |
| FOOD-29 | v2 | built | core/food/micros.ts, engines/targets/micros.ts | FOOD-08 |
| FOOD-30 | F | future | nothing contradicts | FOOD-08 |
| FOOD-31 | v2 | built | features/day/servings.ts; Composer.tsx:460 «Salva anche come pasto» | FOOD-47 |
| FOOD-32 | v2 | built | Composer.tsx:21, aggiungi/pasto/meal-input.ts:121 | — |
| FOOD-33 | D | built | «Parti da» app/(app)/[area]/pasto/[id]/page.tsx:44, createVariantSaved; no «Duplica» left in UI | FOOD-42, FOOD-46 |
| FOOD-34 | F | future | duplicates FOOD-09 | FOOD-09 duplicate; conflicts FOOD-19 |
| FOOD-35 | D | built | app/(app)/oggi/giornata/[id]/page.tsx:41 ROLE_ORDER, snack by time (spot) | — |
| FOOD-36 | F | future | nothing contradicts | — |
| FOOD-37 | F | future | editing exists (FOOD-20, FOOD-42), so mostly overtaken | FOOD-20, FOOD-42 |
| FOOD-38 | F | future | «× 1,5» on row built via FOOD-47; no «⋯» removal verified | FOOD-47; conflicts TRAIN-36 («Elimina only in ⋯») |
| FOOD-39 | F | superseded | barcode focus/file built via FOOD-43 (BarcodeBox.tsx torch, photo); receipt scan not built | FOOD-43, HOME-03, HOME-05 |
| FOOD-40 | D | built | core/food/creatine.ts, creatine-read.ts, features/day/compounds.ts (bedtime median) | FOOD-18, FOOD-21 |
| FOOD-41 | v2 | built | features/food/EstimateFields.tsx | closes FOOD-25 |
| FOOD-42 | v2 | built | app/(app)/[area]/pasto/nuovo, saved-composer.tsx, saved-actions.ts createSaved | FOOD-33 |
| FOOD-43 | v2 | built | features/library/BarcodeBox.tsx (torch, BarcodeDetector, photo input :276) | HOME-03, FOOD-39 |
| FOOD-44 | v2 | built | aggiungi/assunzione, core/food/intake.ts, ADR-0060 | FOOD-03 |
| FOOD-45 | v2 | built | cibo/[id]/page.tsx:184 spread of brands; core/food/brands.ts | FOOD-17 |
| FOOD-46 | v2 | partial | core/catalog/family.ts, doppioni asVariant; archive.ts covers only food/recipe/exercise, not route/activity/own kinds | FOOD-33, HOME-07, TRAIN-37 |
| FOOD-47 | v2 | built | Composer and row multiplier (features/day/servings.ts) | FOOD-38 |
| FOOD-48 | v2 | built | core/food/off.ts, cibo/[id]/modifica/actions.ts:108,162 | FOOD-17, FOOD-43 |

## TRAIN (37)
| ID | ledger status | verdict | evidence | duplicate of / conflicts with |
|---|---|---|---|---|
| TRAIN-01 | D | built | features/training/ActivitySheet.tsx, core/training/activity.ts, engines/expenditure/acsm.ts | TRAIN-37 |
| TRAIN-02 | D | partial | catalog merge exists (core/catalog/merge.ts); specific Run→Corsa merges are data-repair, not verifiable in code | TRAIN-37 |
| TRAIN-03 | D | partial | auto mode, RIR last set only (Gym.tsx:607); readiness in engines/training/rests.ts; 78 s habit rests built | TRAIN-05, TRAIN-30, TRAIN-18 |
| TRAIN-04 | D | built | engines/training/trend.ts:14, expected.ts, present.ts:110-119 | TRAIN-11, TRAIN-15, TRAIN-33 |
| TRAIN-05 | D | built | engines/training/duration.ts, rests.ts | TRAIN-14 |
| TRAIN-06 | D | built | engines/training/stats.ts, score.ts, features/training/session-score.ts | — |
| TRAIN-07 | D | built | features/training/present.ts, SetForm.tsx, ExerciseSettings.tsx | TRAIN-36 |
| TRAIN-08 | D | partial | warmups.ts, superset.ts built («⋯» action); explicit «serie di avvicinamento» not verified | TRAIN-25 |
| TRAIN-09 | D | partial | Gym.tsx has setup/set/rest/Riprendi; button labels «Salta la pausa», «Inizia il prossimo» absent, differs from spec | TRAIN-10 |
| TRAIN-10 | D | partial | GymClock.tsx, NextList.tsx, Gym.tsx built; «Poi» split to do/done only via TRAIN-36 | TRAIN-36 |
| TRAIN-11 | v2 | partial | engines/quality/quality.ts (E9) flags; save-time incoherence flags not found in training write path | TRAIN-16 |
| TRAIN-12 | F | future | built ahead: Gym.tsx auto mode, beep + vibration :145, wakeLock :238; no 3-2-1 | TRAIN-32 |
| TRAIN-13 | F | future | built ahead: setupS in ExerciseSettings.tsx | TRAIN-30, TRAIN-32 |
| TRAIN-14 | F | future | rests in engines/training/rests.ts partly | TRAIN-05 |
| TRAIN-15 | F | future | e1RM built engines/training/sets.ts:8 | TRAIN-04, TRAIN-25 |
| TRAIN-16 | F | future | order note present (order-note.test.ts); no session volume cap | TRAIN-33 |
| TRAIN-17 | F | future | nothing contradicts | TRAIN-34 |
| TRAIN-18 | F | future | readiness input only; no recovery-driven deload | BODY-08 |
| TRAIN-19 | D | built | schema facts.ts:236 loadEntry per_dumbbell/per_side/total; SetForm.tsx | TRAIN-27, TRAIN-29 |
| TRAIN-20 | F | future | nothing contradicts | — |
| TRAIN-21 | D | partial | RIR in sets and engines; «too hard» hold rule in progression.ts (spot) | TRAIN-03 |
| TRAIN-22 | D | built | core/plans/cycles-repo.ts, app/(app)/[area]/ciclo | — |
| TRAIN-23 | D | not-built | «Sposta qui», «Scambia con…», drag absent; only skip + day model (core/plans/day-changes.ts) | — |
| TRAIN-24 | D | partial | day items/skip built; routine colour = region/icon (spot) | TRAIN-22 |
| TRAIN-25 | D | partial | Epley sets.ts, warm-up and rep range in ExerciseForm.tsx; guides/sources text not found | TRAIN-15 |
| TRAIN-26 | D | partial | Gym.tsx timed screen, unilateral sides; long-break flag (>3× rest) not found | — |
| TRAIN-27 | D | built | schema facts.ts:246 loadText, loadApprox; training/write.ts | TRAIN-19 |
| TRAIN-28 | D | partial | planned sessions counted at usual length (oggi/day-page.tsx:265) | — |
| TRAIN-29 | v2 | built | Gym.tsx, core/training/log.ts, plan.ts | TRAIN-30 |
| TRAIN-30 | v2 | built | trend, expected, rests, duration, setupS, auto, readiness all present | TRAIN-03, TRAIN-29 |
| TRAIN-31 | F | future | session-score.ts exists (built ahead); rack pairs not | TRAIN-06 |
| TRAIN-32 | D | built | auto toggle Gym.tsx:410-415, ExerciseSettings.tsx | TRAIN-12, TRAIN-13 (F duplicates) |
| TRAIN-33 | D | partial | order effect shown (order-note); «not simplistic %» via trend; context rows partial | TRAIN-04, TRAIN-16 |
| TRAIN-34 | D | partial | startedAt editable in session page (spot); chain edit F in TRAIN-17 | TRAIN-17 |
| TRAIN-35 | D | built | no LLM/AI call anywhere in apps/v2/src | — |
| TRAIN-36 | v2 | built | NextList.tsx:4,71 «Fatti» and «⋯»; present.ts | conflicts FOOD-38 on «⋯» |
| TRAIN-37 | v2 | built | ledger says s246; routes (core/movement/routes.ts) vs activity (core/training/activity.ts) | FOOD-46, TRAIN-02 |

## BODY (31)
| ID | ledger status | verdict | evidence | duplicate of / conflicts with |
|---|---|---|---|---|
| BODY-01 | D/? | partial | core/movement/routes.ts, features/movement-words.ts, «Apri in Maps» shelves.tsx:214; OpenRouteService not used; Timeline import absent | BODY-27, BODY-31 |
| BODY-02 | D | built | features/day/burn.ts:119 «Speso finora … a fine giornata» | BODY-30 |
| BODY-03 | v2 | built | core/engines/body/filter.ts (Kalman, cTrain), density.ts | BODY-12 (F, same estimator) |
| BODY-04 | v2 | built | core/engines/expenditure/training.ts (EPOC), classes.ts | BODY-14, BODY-20 |
| BODY-05 | v2 | built | core/engines/hydration/hydration.ts, features/day/WaterRow.tsx | — |
| BODY-06 | v2 | built | engines/environment/open-meteo.ts, features/day/WeatherCard.tsx (EEA scale) | — |
| BODY-07 | F | future | built ahead: engines/sleep/sleep.ts (regularity, WASO), features/day/score.ts | BODY-24, BODY-29 |
| BODY-08 | F | future | partial: features/day/day-score.ts recovery = night only | TRAIN-18 |
| BODY-09 | F | future | check-in as kind exists (kit icons, andamento/legami reads «checkin»); no moments | — |
| BODY-10 | F | future | built ahead: engines/correlations, app/(app)/[area]/andamento/legami | — |
| BODY-11 | F | future | CAFFEINE_HALF_LIFE_H fixed 5; no setting | FOOD-21 |
| BODY-12 | F | future | built ahead: filter.ts | BODY-03 duplicate |
| BODY-13 | F | future | partial built: week learnt expenditure with σ (core/energy/week.ts); BODY-30 tunes by k | contradicts BODY-18/25 (accepted by hand) |
| BODY-14 | F | future | built ahead: everyday.ts incidental vs brisk, training.ts 0.75, filter.ts asymmetric density | BODY-04 duplicate |
| BODY-15 | F | future | nothing seen | — |
| BODY-16 | F | future | Katch-McArdle in expenditure/everyday.ts:22; no FFMI, no Navy | — |
| BODY-17 | ? | not-built | undecided; day-page.tsx:265 counts planned sessions at usual length at day end (partial reading) | — |
| BODY-18 | D | superseded | v1 factor-accepted-by-hand; v2 learns weekly (core/energy), energy_correction table gone (schema/account.ts:3) | BODY-13, BODY-25, BODY-30 |
| BODY-19 | D | built | core/energy/feet.ts, features/day/burn.ts hours on feet | ADR-0051, BODY-23 |
| BODY-20 | D | built | classes.ts strength MET; no digestion term (spot) | BODY-04 |
| BODY-21 | D | superseded | `energy_corrections` removed in v2 (schema/account.ts:3) | BODY-18, BODY-25 |
| BODY-22 | D | built | core/engines/body/weigh-in.ts (context, reliability), weighing.ts | BODY-03 |
| BODY-23 | S | superseded | by ADR-0051/BODY-19 hours on feet and BODY-31 covered windows | BODY-19, BODY-31 |
| BODY-24 | D | built | engines/sleep/sleep.ts, features/day/words sleep sheet | BODY-29, BODY-07 |
| BODY-25 | D | superseded | v1 acceptance factor; v2 week-learnt expenditure (BODY-30) | BODY-13, BODY-18 |
| BODY-26 | D | built | energy-day words, features/day/burn.ts | BODY-02, BODY-30 |
| BODY-27 | F | future | built: routes slice #292 (core/movement) | BODY-01 duplicate |
| BODY-28 | F | future | nothing contradicts | — |
| BODY-29 | v2 | built | engines/sleep/periods.ts JOIN_GAP_MIN=120, WASO; nightOf used in oggi/andamento/page.tsx:194 | BODY-24 |
| BODY-30 | D | built | features/day/burn.ts `tuneOf` (spot); «tarato» wording | BODY-02, BODY-13 |
| BODY-31 | ? | not-built | covered-window steps (details instead of adding): no code seen in core/energy/feet.ts; open question | BODY-01, BODY-27 |

## HOME (14)
| ID | ledger status | verdict | evidence | duplicate of / conflicts with |
|---|---|---|---|---|
| HOME-01 | D | partial | core/pantry/stock.ts (stockOf, toBuy), shelves.tsx:75 «spesa ogni N giorni», cibo/[id]/dispensa.ts; no best-before/FEFO, no «Porzioni pronte», no Oggi reminder | HOME-04, HOME-10 |
| HOME-02 | D | built | ADR-0055; core/food/formats, cost.ts price observations | FOOD-17 |
| HOME-03 | F | future | built mostly via FOOD-43 (BarcodeBox torch, photo); own→OFF→new in cibo/nuovo | FOOD-43 |
| HOME-04 | F | future | no best-before, location, minimum fills list | HOME-01 |
| HOME-05 | F | future | no receipt review in v2 (only v1 conversion) | FOOD-39 |
| HOME-06 | F | future | OFF fills fields (off.ts); no crop review | FOOD-15 |
| HOME-07 | F | superseded | built: «Unisci» core/catalog/merge.ts, elenco/doppioni | FOOD-46 |
| HOME-08 | F | future | nothing contradicts | HOME-13 |
| HOME-09 | D | partial | core/money/index.ts movements, categories, features/money; receipt lines → purchases and aliases not found | HOME-05 |
| HOME-10 | D | built | core/pantry/stock.ts derived stock; price into snapshots (cost.ts) | HOME-01 |
| HOME-11 | D | partial | batch entry kind (features/day/words.ts «Cucinato»); consume-on-cook and reminders unverified | HOME-01 |
| HOME-12 | F | future | umbrella of HOME-04/05/06/08 | duplicate |
| HOME-13 | F | future | no accounts or importers | HOME-08 duplicate |
| HOME-14 | D | partial | core/food/cost.ts, features/day/priced.ts built #318; costs.md slices b–d (week, typical day) pending per own text | HOME-02 |

## Findings
- FOOD-01: score `value` part is hard-null (core/food/score.ts) although prices now exist (cost.ts); the 10 points are never scored.
- TRAIN-23 not built: «Sposta qui», «Scambia con…», drag on future days; v2 has only skip and day model (core/plans/day-changes.ts).
- TRAIN-09/10 gym state machine and labels («Salta la pausa», «Inizia il prossimo») differ from Gym.tsx; the spec is stale or the UI is.
- BODY-31 and BODY-17 (both «?») not built; steps still counted without covered-window netting of trips.
- BODY-18/21/25 are v1 mechanics (accepted factor, `energy_corrections`) superseded by the weekly learnt expenditure and BODY-30 «tarato»; BODY-13 (F) contradicts the D lines. Mark them superseded.
- FOOD-19 (moments never from time) contradicts FOOD-34/FOOD-09 (tags set automatically from time); code follows the tags (slots.ts, relations).
- FOOD-25 should be marked closed (FOOD-41); FOOD-39 and HOME-03 largely delivered by FOOD-43; HOME-07 delivered; F lines marked future are already built ahead: FOOD-13, TRAIN-12/13, BODY-07/10/12/14/27.
- Duplicates: FOOD-09=FOOD-34; BODY-03=BODY-12; BODY-04≈BODY-14; BODY-01/27/31 overlap; FOOD-17=HOME-02; HOME-12/13 overlap HOME-04/05/08; TRAIN-12/13≈TRAIN-32; TRAIN-17≈TRAIN-34.
- FOOD-06/24: DIAAS bands, glycaemic index, origin, fibre types and meal ratings (FOOD-14, FOOD-24) are not in v2; only NOVA and a three-level protein-quality stand-in.
- HOME-01 (decided D) is only a slice: no best-before/FEFO «Da usare prima», no «Porzioni pronte», no Oggi reminder; HOME-04 is the same thing marked F.
- FOOD-38 says no «⋯» on opened meals; TRAIN-36 puts Elimina in «⋯» in NextList.tsx. Rows use two different action idioms.
- Archive is implemented for food, recipe and exercise only (core/catalog/archive.ts:11), though FOOD-46/ADR-0060 promise one family model for routes, activities and user kinds; user kinds archive separately (profilo/tipi/actions.ts), trash/restore is a third path (profilo/cestino).
- Merge/«Parti da»/variant: one engine (core/catalog/merge.ts, family.ts) but separate server actions per domain: cibo/[id]/modifica/actions.ts mergeFood, esercizio/[id]/actions.ts mergeExercise, doppioni/actions.ts, pasto saved-actions.ts createVariantSaved; no route/activity equivalents seen.
- Add flow forks: aggiungi/{pasto,assunzione,attivita,tragitto,spesa,[kind]} each with its own actions.ts, plus Gym start in palestra/actions.ts; undo is per-surface («Annulla» only on one-tap log and exercise reorder, core/training/write.ts:580,614), no shared undo mechanism.
- Judge/score is split: food score (core/food/score.ts), day score (features/day/score.ts, day-score.ts), session score (features/training/session-score.ts), sleep (engines/sleep/sleep.ts), with `engines/judgements` registry only partly shared.
