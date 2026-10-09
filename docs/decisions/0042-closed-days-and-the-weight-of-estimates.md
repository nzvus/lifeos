# ADR-0042: A day can be closed as complete or partial; estimates are learnt as a factor of their own

**Status:** accepted (the developer's request, 2026-10-09; details decided by the agent as delegated)
**Date:** 2026-10-09
**Refines:** ADR-0041

## Context
ADR-0041 learns what you spend from the log and the scale. It guessed
which days were complete (logged ≥ 60 % of their cost). The developer
added two points:
1. "I should say, closing the day or with a tick, that what I ate is more
   or less what I logged."
2. "What weighs the most are the estimates: imprecise, and big, because you
   eat out."

Simulation sharpened the second point. Marking estimates as less sure,
alone, changed nothing: their error (±300 kcal) is small next to the
scale's water (±0.85 kg ≈ ±6,500 kcal). What does matter is that meals out
are usually *under*-estimated (larger and restaurant meals more so). With
meals out twice a week logged at 85 %, c came out at 1.05–1.07 instead of 1.10.

## Options considered
### Closing a day
- **A. A row per closed day** (`day_closures`: complete / partial), a chip
  and a sheet on Today, as for sleep, movement and mood.
- **B. Infer it** (the 60 % rule only). It misses days logged at 75 %.

### Estimates
- **A. Learn a factor k on estimated kcal** with c, in one Kalman filter
  over [weight, c, k]. Prior k = 1.15 ± 0.15. Learnt only while estimates
  are at most half the logged kcal, since beyond that c and k can't be told
  apart. Each day's intake also carries its own uncertainty.
- **B. Uncertainty only** (no k). Simulation showed it does not remove the bias.
- **C. Nothing.**

## Decision
**A and A.** In simulation, over 12 weeks:
- with 20 % of days logged at 75 %, closing them as "something missing"
  brought c's worst error from 0.06 to 0.02;
- with meals out twice a week under-estimated by 15 %, learning k brought it
  from 0.05 to 0.03. k itself stays near its prior (≈ 1.12 against a true
  1.18): a few meals a week carry little information, and the prior is
  deliberately cautious.

The proposal threshold moves to σ ≤ 0.05. The filter's σ was a little
cautious against the simulated errors, so ±0.05 is reached in about 8
weeks of daily weigh-ins.

Tripwire: if k settles far from 1 (outside 0.9–1.4) for a user, show it as
advice ("your estimates run short: add ~X %") rather than only using it.

## Consequences
- A new table `day_closures` (a migration; a new table is safe in any
  order). Export version 15 carries it. The lifeos importer accepts 15 and
  ignores it, like `mind`.
- Today: a fourth chip ("Log complete" / "something missing" / "Close the
  day?") opens `#day-close`. Today and past days can be closed.
- The calibration box tells the closed days, the share of estimates and the
  factor k.
- A log made only of estimates gets no k and stays unsure longer: that is
  the honest answer.

## What I learned
