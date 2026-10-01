# ADR-0025: A macro's floor and ceiling are health limits, or the useful maximum where none exists

**Status:** accepted (the developer's clarification of ADR-0023, 2026-10-01). Amends ADR-0023's numbers; its structure (floor / good zone / ceiling, zone-based score) stands.
**Date:** 2026-10-01

## Context
ADR-0023 drew its floors and ceilings from sports-nutrition ranges, so
an hour's run made the carbs' "floor" 5 g/kg and the dynamic target fell
outside its own zone. The developer meant something else: the lower and
upper limits are the ones recommended for HEALTH, given their data. Where
no health maximum exists (protein, carbs), the ceiling is the USEFUL
maximum, beyond which there is no further benefit. The developer also
found the ranges hard to see and understand.

## Options considered
### A. Health floor / goal zone / health-or-useful ceiling
- Protein: floor 0.8 g/kg (RDA) · good 1.6–2.2 (cut 1.8–2.4) · useful max = top of good.
- Carbs: floor 130 g (RDA) · good rest 2–3 / training 3–5 / long 5–7 g/kg · useful max = top of good.
- Fat: floor 20 % kcal · good 25–30 % (≥0.6 g/kg) · health max 35 % (AMDR).
- Fibre: floor 25 g (EFSA AI) · good 14 g/1000 kcal–50 g · useful max 70 g.
- Pros: each line means one thing. Cons: a 1–2 h "long" day is still a guess from minutes.
### B. Keep ADR-0023's sports ranges
- Cons: it is what the developer said is wrong.

## Decision
**A.** Past a useful maximum the score stays at 70: nothing is gained, but
nothing is harmed. Past a health maximum it falls as before. "Long" training
starts at 2 h, or 90 min of cardio (an hour's run is "training"). A dynamic
day's fat is never under 25 % of its energy; its carbs stop at the top of
their good zone. The bar is drawn in grams with coloured zones and a legend
with the numbers.
Tripwire: if the developer still reads the bars wrongly, replace them with
words only.

## Consequences
- Energy has no band (it has its own target); sugars, saturated fat and salt keep their health maxima.
- `ui/BandBar` draws the banded macros; `ui/TargetBar` the others.

## What I learned
