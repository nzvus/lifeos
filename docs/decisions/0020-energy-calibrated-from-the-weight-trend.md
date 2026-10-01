# ADR-0020: The energy estimate is calibrated from the weight trend, as a visible proposal

**Status:** accepted (the developer chose the recommended option, 2026-10-01)
**Date:** 2026-10-01

## Context
ADR-0014 estimates a day's energy from components (BMR, activity,
walking, training, digestion); population equations are ±10–15 % for an
individual. It planned "C later": correcting the estimate from what the
body actually did — weight change versus food eaten. A wrong correction
would move every dynamic target, so how it is applied matters.

## Options considered
### A. A visible proposal
- Pros: after enough data (≥ 21 days with weigh-ins at both ends and ≥ 80 % of days logged) the app computes the observed expenditure (eaten − 7700 kcal × weight change ÷ days), shows the gap with the estimate (e.g. −180 kcal/day) and its uncertainty, and proposes a correction factor the user applies with a tap; nothing changes on its own.
- Cons: one more thing to look at now and then.
### B. Automatic weekly correction
- Pros: no attention needed.
- Cons: missing weigh-ins or unlogged days bias it silently, and targets move without the user knowing why.
### C. Not yet
- Pros: nothing to build.
- Cons: the estimate's individual error stays.

## Decision
**A.** A pure core function computes, over a window (default 28 days), the
weight trend (least-squares slope of the measurements, not two single
weigh-ins), the average eaten energy on logged days, the observed
expenditure and its gap with the model's average estimate, with a quality
verdict (enough days, enough weigh-ins, enough logging). A stored
correction (`user_settings`, a factor 0.80–1.20 on the everyday baseline)
is applied only when the user accepts it, and can be reset.
Tripwire: if accepted corrections swing by more than ±10 % between months,
lengthen the window or drop the feature.

## Consequences
- Migration PR: `user_settings.energy_correction` (numeric, default 1.00).
- core/energy gains the calibration and applies the factor to the baseline.
- The Energy section shows the proposal when the data is good enough.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
