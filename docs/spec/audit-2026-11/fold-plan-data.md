# Fold — PLAN, DATA, PLAT and KEEP ledger lines → the new spec

Phase 2b, 6 Nov 2026. Every `PLAN-*`, `DATA-*`, `PLAT-*` and `KEEP-*` line of
`docs/spec/v2/ledger.md` (90) with where it now lives: `PL-nn` (`docs/spec/domains/plan.md`),
`DT-nn` (`domains/data.md`), `FD-`/`BD-`/`TR-` (`domains/food.md`, `body.md`, `training.md`;
topic named beside the ID because those files are still being numbered), `MOD-`/`PAT-`/`PRD-`
(horizontal spec), «not now (xNN)» (his phase 1 answers, `needs.md` §4, product.md §4),
«superseded by …» or «dropped (reason)». Status = the ledger's own mark (D decided · F future ·
v2 built in v2 · v1 a v1 feature · S superseded · ? open). KEEP = «v1 features a rebuild must
not lose»: each says where it lives now, or why it does not.

## DATA (22)
| Ledger ID | Status | Now lives in |
|---|---|---|
| DATA-01 | D | DT-33 (repairs as idempotent SQL), DT-31 (trash takes children); role from time → FD-10; coffee/creatine → assunzione FD-64; duplicates merged → PAT-18; steps level kept unread → BD-42 |
| DATA-02 | D | DT-23 (import review outliers); expenditure priors → BD-10…13; food lookups with source and confidence → MOD-12, FD-04; exercises in Italian → TR (catalog) |
| DATA-03 | D | this fold (KEEP rows below); search/sort parity → PAT-41, PAT-42; its «Duplica» rows superseded by PAT-16 |
| DATA-04 | v2 | DT-03 (unknown, never zero), DT-04 (band edges), MOD-60 (gaps); recurrence → PL-20, PL-21 |
| DATA-05 | v2 | DT-10 (exact decimals), DT-11 (per kg on trend weight), DT-13 (streak, regularity), DT-03 |
| DATA-06 | v2 | MOD-43; parts per domain → FD-50…54 (food, day), BD-03 (weighing), BD-53 (sleep), TR-50 (session), FD-72 (water); weights movable on «Come valutiamo» → not now (x10); recovery → not now (x08) |
| DATA-07 | v2 | DT-15 (statistics), MOD-55 (six pairs, ≥ 3 months), BD-80; pairs added by him → not now (x08) |
| DATA-08 | v2 | DT-22 |
| DATA-09 | D | DT-14 (only facts and decisions stored, recompute except decisions), MOD-40, MOD-44; the L0–L4 list is the registry's metrics/relations (MOD-01) |
| DATA-10 | D | split: one weight estimator → BD-01; learnt expenditure → MOD-54, BD-20; goal the only source → MOD-42, FD-20; day templates of blocks → superseded by MOD-30 (blocchi, no day types, x04); meal role + relations → FD-10, MOD-60; nutrients as rows → FD-04; separate scores → MOD-43, recovery → not now (x08); gym auto + e1RM → TR-16/17, TR-21 (RIR not in e1RM, c02); one food identity → FD-01; areas → PRD-16. The build order → superseded by the phase plan (PROD-39) |
| DATA-11 | F | bank, PayPal, receipts → not now (x01, x02); Health Connect → BD-44 / MOD-54 (future change with ADR); FitForge → dropped (its history is already in v1 → v2); packs → not now (x12); the «one review screen for any import» → DT-23, DT-41 (merge dry run) |
| DATA-12 | F | DT-34 (second copy of the backup key) |
| DATA-13 | ? | closed: MOD-20, PAT-20 (delete only if unused, else archive), DT-31 |
| DATA-14 | D | PRD-22 (never invent), DT-14 (raw → derived, stored vs computed), MOD-40 + PAT-51 (every number explained), MOD-12 (uncertainty), MOD-53 (context beside); «ask intent, derive numbers» → MOD-42 |
| DATA-15 | D | PRD-26 (every claim with a source); the sources are cited in FD/BD/TR rules |
| DATA-16 | D | DT-60 (framework-free core, slices, lint); «no literal values outside design/i18n» → PAT-80 for values; **strings: open, DT-61** (contradicted in v2) |
| DATA-17 | D | DT-32, DT-34, DT-40 |
| DATA-18 | D | DT-32 (human-triggered migrate after a dump), DT-34 (dead-man's switch) |
| DATA-19 | D | DT-30 (isolation at `core/`, RLS deferred), DT-60 (one owner) |
| DATA-20 | D | MOD-01 (each datum declared: fields, ranges, metrics), MOD-12 (how well), DT-22 (quality), DT-21 (convergence) |
| DATA-21 | F | superseded by n08/c02: context beside the fact, never inside the number → MOD-53, TR-26; readiness and recovery → not now (x08) |
| DATA-22 | F | DT-22 (E9), DT-20; «audit of what is collected» → PRD-02 (structure only for data he logs) |

## PLAN (36)
| Ledger ID | Status | Now lives in |
|---|---|---|
| PLAN-01 | ? | PL-01 (any object in a blocco), PL-03 (abitudine of any tracker), PL-30 (several blocchi per ciclo step), MOD-30; pre/post as labels → MOD-60, FD-12; day templates by meal category, cycles of day types → superseded by MOD-32 (no day types, x04) |
| PLAN-02 | D | FD-20…23 (day targets are Obiettivi, weekly, deficit from pace, «Ricalcola»), BD-30; the order «day's decision → day's model → default model» → superseded by PROD-45 (targets in Obiettivi, no day models) |
| PLAN-03 | D | FD (day box words) + PAT-51 (Perché? generated from the metric), BD-25 (few-data and old-trend wording); «· modello «Rec»» → superseded by PROD-45 |
| PLAN-04 | D | superseded by plan.md (3 Nov) and MOD-32 (x04): day models, week layout, «Cambia la giornata» go; kept → PL-40 (computed on read), PL-43 (Salta, Copia ieri), PL-33 (ciclo line), PL-72 (PLPRR kept, programs archived); meal shares from 28 days → superseded by c04 (PL-60) |
| PLAN-05 | D | superseded by ADR-0059 / PAT-03 (Piano tab per area + Oggi · Piano); shelves → the area's Piano and Elenco (PL-70) |
| PLAN-06 | D | split: eat → FD (totals, voto, targets); buy → not now (x01 receipts, x03 pantry), movements → DT-50; plan → PL-40, PL-31 (week layout → day types → superseded, x04); weigh → BD-01…03; train → TR-21…34; make a food → FD-90…92 (label OCR dropped, c10); build a habit → PL-44 (Ripeti) |
| PLAN-07 | D | Copia ieri, Togli i previsti → PL-43, PL-42; future days only previsti → DT-02; «Ripeti come abitudine» → PL-44; swap the day's model, «Salva come modello» → superseded (no day models, x04); weekly check-in card → superseded by PLAN-02 (no «accept»); pantry reminders → not now (x03); supplements compact → FD-64 (assunzione); close the day → MOD-44, BD-04 |
| PLAN-08 | D | PAT-54 (one period navigator); score dot per day → PAT-52 |
| PLAN-09 | v2 | PL-11, PL-12, PL-43 (apply skips present, swap keeps typed) |
| PLAN-10 | v2 | FD-20…22 (kcal, protein, fat), FD-40 (EFSA micros, UL scope), FD-12 (pre/post hints); «± template shift» → superseded (no day types, MOD-32) |
| PLAN-11 | D | not now (x04): `extends`, rebase, «Scollega» (MOD-32); engine `rebase.ts` parked for phase 4 removal |
| PLAN-12 | D | PL-40 (writing previsti), PL-13 (anchored voci follow), PL-43 (day changes keep fatto), PL-20 (frequencies); «habits are block models» → PL-03, PROD-45 |
| PLAN-13 | D | PL-30, PL-31, PL-32 |
| PLAN-14 | S | PAT-16 (Parti da), PL-70 (no «Duplica»); code still contradicts (`ModelEditor.tsx`) |
| PLAN-15 | F | superseded by MOD-30…33 (blocchi with real objects); week layout, template extends → not now (x04); peri-workout → MOD-60; moving training moves meals → PL-13; switching mid-day → PL-43 |
| PLAN-16 | F | MOD-42 (goal the only source), FD-20; «fixed» numbers → a goal with a fixed value (MOD-42) |
| PLAN-17 | F | FD-22, FD-31 (protein per kg of the reference weight, fascia) |
| PLAN-18 | D | superseded by MOD-30/31: blocco + ciclo; day type with extends, week layout → not now (x04); «training takes the next step» → PL-30/31; «dinner rotates four recipes» → PL-02 (rotation) |
| PLAN-19 | D | FD-20…22 (one day engine, carbs the rest, tripwire) |
| PLAN-20 | D | MOD-42 (goal history, pace, ETA), FD-21 (pace ranges → deficit), BD-03 (pace judged) |
| PLAN-21 | D | «the goal is the one source» → MOD-42; slots with kcal/protein shares → superseded by c04 / MOD-35 (PL-60: shares only judge); ± kcal shift → superseded (no day types) |
| PLAN-22 | D | dropped: superseded by PLAN-02 (no accept; FD-23, BD-30) |
| PLAN-23 | D | FD-23, FD-33 (the week's reading, 7-day means of limits), BD-30; «propose a day ±30 %» → FD-23 (advice only) |
| PLAN-24 | D | Oggi = the Diario of every area (PAT-03) composed from PAT-30…33, PAT-40, PAT-54; day card numbers → FD, BD-32; «come nasce questo numero» → PAT-51; slot bars vs share → superseded by MOD-35 (PL-60) |
| PLAN-25 | D | FD-30…33 (four levels, fasce, useful/health maxima) |
| PLAN-26 | D | MOD-41 (fascia + coverage for every measured thing), MOD-43; roll-ups → DT-12 |
| PLAN-27 | D | MOD-44 (frozen past targets), FD-23 |
| PLAN-28 | D | superseded by MOD-54 / BD-20 (learnt expenditure); Mifflin and factors live on as priors → BD-10, BD-11; «missing data → no targets, never a guess» → PRD-23, BD-25 |
| PLAN-29 | D | PRD-03, MOD-30…34, PL-01…72; «incremental» templates → not now (x04); «interchangeable during the day» → PL-43 |
| PLAN-30 | v2 | PAT-03 (Piano tab), PL-40, PAT-11 («+ previsto») |
| PLAN-31 | v2 | MOD-42 (Obiettivi: progress, pace, ETA), DT-53 (no data → «non so») |
| PLAN-32 | D | PL-03 (as abitudini: weigh-in each morning), PL-50 (proposed from history); why they matter → BD-01, BD-04; close the day → MOD-44 |
| PLAN-33 | D | MOD-20, PL-70 (listed, archive, delete only if unused), PL-71 (one word each), PL-62 (aggregations) |
| PLAN-34 | D | MOD-30, MOD-35, PL-01, PL-02, PL-60 |
| PLAN-35 | D | not now (x04): layers with cross rules (`plan_rules` parked); the core pair (coffee before the gym) → PL-30 |
| PLAN-36 | D | MOD-34, MOD-51, PL-50, PL-51, PL-52 |

## PLAT (10)
| Ledger ID | Status | Now lives in |
|---|---|---|
| PLAT-01 | D | DT-42; timing superseded by PROD-39 (v1 retired at the start of phase 4); «never delete the Neon project» → DT-34 |
| PLAT-02 | D | DT-34 (transfer budget, narrow columns, counting proxy) |
| PLAT-03 | D | DT-40 (format, version 100 for v2, not 21), DT-41 (Replace, Merge) |
| PLAT-04 | D | not now (x12): friends, invitations, packs; the invites table stays (DT-60) |
| PLAT-05 | S | dropped for now: PRD-27 (no AI in the app) |
| PLAT-06 | D | DT-60 |
| PLAT-07 | F | habits → PL-03 (abitudine); day planner → the Piano (MOD-30…34); tasks → not now (no data, PRD-02); rewards → not now (x13) |
| PLAT-08 | F | not now (x13): Obsidian, home bridge |
| PLAT-09 | F | not now (x12); per-user isolation kept → DT-30 |
| PLAT-10 | F | outside the product spec: a process item for the kit's changelog (retro skill, ROADMAP backlog) |

## KEEP (22)
| Ledger ID | Status | Now lives in |
|---|---|---|
| KEEP-01 | v1 | PAT-54 (arrows, swipe, month, «↩ oggi», reload keeps the day); week strip's kcal bar and ±balance → FD (day numbers) on PAT-54 |
| KEEP-02 | v1 | FD (the day's balance) + BD-23/32 («speso finora / a fine giornata»); «come nasce questo numero» → PAT-51 (generated, not 4 hand-written steps) |
| KEEP-03 | v1 | Oggi composition (PAT-03): sleep → BD-50…55, steps → BD-40, mood → DT-51, close the day → MOD-44 |
| KEEP-04 | v1 | FD-34 (eaten + planned, planned lighter), FD-31 (fasce), PL-40 (the planned part) |
| KEEP-05 | v1 | slots with share targets → superseded by MOD-35 / PL-60 and FD-10/11 (roles from time); peri-workout hints → FD-12, MOD-60; «saltato?» on empty past slots → superseded by FD-13 (never «saltata» for an empty slot), past previsti → PL-42; slot «+» suggesting meals → MOD-51, FD-53 («Pasti adatti»); rail with wake, bed, weigh-ins, now → PAT-03, MOD-53 |
| KEEP-06 | v1 | tick → PAT-15; servings −/+ → PAT-31, FD-93; eye «leave out of the total» → FD-34 (planned lighter; a per-row eye dropped: one rule for planned lines); «aggiorna ai valori attuali» → MOD-11 ↺, PAT-31; delete with Undo → PAT-20/21; in place → PAT-13, PAT-32; quality block (NOVA, protein by origin, fibre) → FD-05, FD-50 |
| KEEP-07 | v1 | PL-42 (Togli i previsti, ≥ 2, one Annulla), PL-43 (Copia ieri), DT-02 (future days only previsti) |
| KEEP-08 | v1 | pantry reminders → not now (x03); day quality parts → MOD-43, FD-54, «voto if the plan is followed» → FD-34; week catch-up → FD-23; energy and calibration → BD-20…25; training of the day, program's day → PL-33, TR; supplements → FD-60…64 |
| KEEP-09 | v1 | PAT-60 (⊕), PAT-62 (composer), FD-92 (stima), MOD-14; portions from a batch → FD (batch); quick new food with 8 label values → FD-91, PAT-61 |
| KEEP-10 | v1 | PAT-60; «plan at a time» → a previsto voce (DT-02, PL-12); routine · one exercise with last sets · a past session · an estimate → TR-01, TR-30, PAT-16 (Parti da a past session), MOD-12 (estimate) |
| KEEP-11 | v1 | steps → BD-40 (one reading a day; +1 000/+2 500 buttons → PAT-61 steppers); weigh-in fasted/toilet pre-ticked before 11:00 → BD-02; implausible weight asks → DT-22; mood five taps, tap again clears → DT-51 |
| KEEP-12 | v1 | PAT-42 (sort chips from declared keys); food sort keys per nutrient, per kcal/€/protein, protein per 100 kcal, price per kg → FD-81, FD-84 |
| KEEP-13 | v1 | ObjectPage → PAT-30 (food laid out like a label: FD-04); «meals that use it» with the % change → PAT-30 «Usato in» + FD; barcode → OFF → FD-90, PAT-64; label photo OCR → dropped (c10, PRD-27: label typed field by field, FD-91) |
| KEEP-14 | v1 | adherence per nutrient → FD (Andamento); per day type → superseded (no day types, x04): adherence per area → PL-62; eating window and energy by part of day → FD-13, MOD-53; plans never confirmed → PL-42, PL-52 |
| KEEP-15 | v1 | open, skip, rest, another step, back to the ciclo → PL-32 (overrides, skips); add a scheda, remove a planned session → PL-43, PAT-20; coming days ↑/↓ → PL-32 (one override per day); multi-select and drag → dropped (one tap per day covers it; no data asks) |
| KEEP-16 | v1 | ObjectPage PAT-30 (guide, records TR-23, e1RM chart TR-24 via PAT-53), Unisci PAT-18; «suggest from the name» → TR (exercise catalog) |
| KEEP-17 | v1 | TR-01 (fields by kind), TR-30 (last time's sets, the proposal), PAT-62 (add set copies the previous) |
| KEEP-18 | v1 | TR-07 (gym timer states, resume), TR-03 (warm-up ramp), TR-22 (vs last time in words, no %: c02), TR-30 (target), PAT-63; readiness hint → TR-33 (typed), measured readiness → not now (x08, TR-61) |
| KEEP-19 | v1 | week vs last week, sets per muscle 10–20 → TR-25, TR-34; scheda runs, e1RM trends → TR-24, MOD-50, PAT-53; weight chart with reliability dots, weekly rate → BD-02, BD-03; BMI/WHtR/FFMI → BD-71; each weigh-in in words → BD-02 |
| KEEP-20 | v1 | DT-50 |
| KEEP-21 | v1 | DT-51 |
| KEEP-22 | v1 | time zone → DT-01; language → DT-61 (open: Italian only today); theme → PRD-28 (dark only, x14), layout/density → PAT-80; body → BD-70; goal with the pace explained → MOD-42, FD-21; moment bounds → FD-10; automatic maxima → FD-30, FD-31; rating factors → not now (x10); data → DT-40, DT-41; invitations, packs → not now (x12); trash → DT-31 |
