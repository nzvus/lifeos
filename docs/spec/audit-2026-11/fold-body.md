# Fold — BODY ledger lines → `domains/body.md`

Phase 2b, 6 Nov 2026. Every `BODY-*` line of `docs/spec/v2/ledger.md` (32) with its destination.
«x», «c», «n» = his phase 1 answers (`needs.md`); BD = `docs/spec/domains/body.md`. A line with
several parts names each part's destination.

| ID | Ledger | What it says (short) | Destination |
|---|---|---|---|
| BODY-01 | D/? | movement dossier: phone steps once a day, else trips ÷ stride + baseline 3 000; trips as spans and cadence bands; ⊕ Tragitto; routes with Maps; level dropped | phone count → **BD-40**; tragitto one tap → **BD-43**; level → **BD-42** (hours); trips → steps, baseline, > 30 % check, spans/bands, ORS, Timeline, Andamento by band/mode → **not now (x05)** |
| BODY-02 | D | the day's energy: burn on each row, «finora · a fine giornata», pieces, hours on feet with six words, targets do not follow the day, «ranges everywhere» | **BD-16, BD-24, BD-31, BD-32, BD-42**; «ranges everywhere, never a single kcal» → **superseded by BD-23** (BODY-30, n05) |
| BODY-03 | v2 | E4 Kalman (W, c, cT, k), asymmetric density, weigh-ins by reliability, intake uncertainty, Katch-McArdle | **BD-01, BD-02, BD-04, BD-10** |
| BODY-04 | v2 | E4a set by set, classes, rests, Compendium floor, EPOC, tail, × 0.75, tonnage a check, steps by cadence, everyday from blocks, Energia | **BD-13, BD-14, BD-41, BD-24**; «everyday factor from the day's blocks» → **superseded by BD-42** (hours as a number; blocks hold no hours) |
| BODY-05 | v2 | E10 hydration: EFSA, sweat, heat, caffeine as fluid, 1.25–1.5 × loss | **BD-60** |
| BODY-06 | v2 | E11 weather card; F: store hours as entries | card → **BD-61**; storing → **dropped (x11)** |
| BODY-07 | F | sleep vs learnt need, regularity/SRI, timing, quality, caffeine at bedtime, bedtime from the plan | duration, regularity, quality → **BD-53**; countdown → **BD-55**; bedtime as a blocco → **MOD-30**; learnt need, SRI → **not now (x08)**; caffeine at bedtime → food domain (caffeine rule, FOOD-21) |
| BODY-08 | F | a recovery score of its own | **not now (x08)** |
| BODY-09 | F | check-in with a moment (morning, evening, soreness) | **not now** (PRD-02: check-in on 8 of 16 days; same criterion as x09); a moment = a field of the type (MOD-01) when data asks |
| BODY-10 | F | personal correlations after n ≥ 21, chosen pairs | defaults, n ≥ 21, ρ + interval, never advice → **BD-80** (MOD-55); its own pairs (caffeine after 14:00, carbs → e1RM, hunger) → **not now (x08)** |
| BODY-11 | F | caffeine half-life 3/5/7 h setting | **not now (x08)**; the fixed 5 h stays in food's caffeine rule |
| BODY-12 | F | one weight estimator for every screen | **BD-01** |
| BODY-13 | F | learnt expenditure is the expenditure, σ from week one, no accepting; check-in an optional review | **BD-20, BD-21**; «optional review» → **superseded by BD-30** (automatic week, «Ricalcola») |
| BODY-14 | F | PAL to FAO/WHO, cadence bands, MET on work time, × 0.7–0.8, c_train, asymmetric density | **BD-11, BD-13, BD-14, BD-41, BD-01** |
| BODY-15 | F | planned vs counted; only counted feeds calibration | **BD-06** |
| BODY-16 | F | Katch-McArdle, lean mass for protein, FFMI, waist-to-height, US Navy | **BD-10, BD-70, BD-71**; protein per kg → food targets (**MOD-42**) |
| BODY-17 | ? | planned sessions move today's target | **resolved: no → BD-31** (energy-day §9.3) |
| BODY-18 | D | learnt from the whole log, fill ±7, factor accepted by hand, closed days, k, advice if k far from 1 | accepting by hand → **superseded by BD-20/BD-22** (c07, BODY-30); fill and closed days → **BD-04**; k and its advice → **BD-05** |
| BODY-19 | D | steps from zero; level = time on feet (factors); v2 hours as a number | **BD-11, BD-41, BD-42** |
| BODY-20 | D | no separate digestion term; strength 3.5–5 MET | digestion → **BD-12** (TEF a share inside the everyday, never on top); 3.5–5 MET → **superseded by BD-13** (set by set, 3.5 floor); kept for previste in **BD-16** |
| BODY-21 | D | factor applies from its day (`energy_corrections`) | **superseded by BD-20** (no stored factor; table gone in v2) |
| BODY-22 | D | weigh-ins with context → reliability 0.25–1; weighted fit; trend 10 %/day; BMI and indices | reliability → **BD-02**; voto → **BD-03**; trend 10 %/day → **superseded by BD-01** (one estimator); indices → **BD-71** |
| BODY-23 | S | most measured source → steps adjust the day type at one cost per step | **superseded by BD-41, BD-42** (ADR-0051: steps from zero, hours on feet) |
| BODY-24 | D | sleep by hand, quality 1–5; 100 at 7–9 h; short night a weigh-in clue; not in energy | **BD-52, BD-53, BD-02, BD-57** |
| BODY-25 | D | least squares over 28 days, accepted by hand, 0.80–1.20 | **superseded by BD-20/BD-22** (c07) |
| BODY-26 | D | expenditure gradual, understandable, never over or under; say where macros come from | **BD-23, BD-24, BD-30**; the «Perché?» itself → **PAT-51, MOD-40** |
| BODY-27 | F | steps replaced by routes, Google Maps, vertical layer | routes → **BD-43**; «steps replaced by routes» → **superseded by BD-40** (BODY-32); Maps, vertical layer → **not now (x05)** |
| BODY-28 | F | sleep import from Health Connect / Apple Health | **BD-44** (future change with its ADR) |
| BODY-29 | v2 | broken night and naps; the day of a piece | **BD-50, BD-51, BD-52, BD-53, BD-54, BD-55, BD-56** |
| BODY-30 | D | «un numero tarato»: priors × t, 0.6–1.6, ± in proportion; open «+ 0 kcal» | **BD-22, BD-23**; the open defect → **BD-12** |
| BODY-31 | ? | steps over covered windows, trips netted inside them | **dropped (x05, c06)**: the learnt expenditure absorbs constant step errors |
| BODY-32 | D | phone steps typed once a day; Health Connect shell later with its ADR | **BD-40, BD-44**, **MOD-54** |

## Counts
32 lines, all placed: 28 go wholly or in part to BD rules; 10 have a superseded part (BODY-02,
04, 13, 18, 20, 21, 22, 23, 25, 27; BODY-21 and 25 superseded whole); 7 have a «not now» part
(BODY-01, 07, 08, 09, 10, 11, 27; BODY-08, 09, 11 whole); 2 have a dropped part (BODY-06 storing,
BODY-31 whole); 1 «?» resolved (BODY-17 → BD-31). None without a destination.

## Contradictions resolved here
- BODY-18/21/25 (factor accepted by hand) ↔ BODY-13 ↔ BODY-30: automatic and reversible (c07) → BD-20/22.
- BODY-02 «ranges everywhere» ↔ BODY-30 / n05 «one number, the width when opened» → BD-23.
- BODY-27/31 (routes and windows replace steps) ↔ BODY-32 (phone count) → BD-40, BD-43; windows dropped.
- BODY-20 «no digestion term» ↔ E4a «TEF in the prior» → TEF counted only as a share inside the
  everyday part (BD-12), which is what the code does.
- BODY-22 trend 10 %/day ↔ BODY-12 one estimator → BD-01; the weight chart's own smoothing is a
  defect to remove.
- sleep.md §7 «a wake before 04:00 belongs to the day before» ↔ §5.3 «the calendar date of the
  wake» (built) → BD-51 keeps the calendar date; §7's line is stale.
- movement.md §5 baseline 3 000 when no count ↔ PRD-22 (never invent data) → no assumed baseline (BD-40).
