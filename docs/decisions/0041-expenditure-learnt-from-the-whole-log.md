# ADR-0041: What you spend is learnt from the whole log and scale at once, with its uncertainty

**Status:** accepted (refactor plan of 2026-10-09, Phase 2a; the developer delegated the details: "procedi")
**Date:** 2026-10-09
**Supersedes:** ADR-0020's estimator (its storage and Accept flow stay, with ADR-0026)

## Context
The energy model builds expenditure from formulas (BMR × an activity
factor, plus walking and training), and formulas miss individuals by
hundreds of kcal. ADR-0020 corrected it from one 28-day average: eaten −
weight slope × 7,700. That needed 80 % of days logged and gave no idea of
how sure it was. Two weeks of data were as convincing as two months. A
half-logged day (a dinner not entered yet) read as a big deficit. The
developer's question: "don't overestimate and don't underestimate".
MacroFactor's answer, which users praise most, is to back-solve
expenditure from intake and the weight trend continuously.

## Options considered
### A. Weekly Kalman updates over 14-day windows
- Pros: simple; follows change.
- Cons: in simulation it was slow and noisy: ±0.065 after 12 weeks for a
  body 10 % off. A trend's error falls with the period's length to the
  power 1.5, so short windows waste most of the data.

### B. One weighted least-squares fit over the whole window, with a prior
Each weigh-in = start + (everything eaten − everything spent before it) ÷
7,700, with spent = c × baseline + the rest. That is a straight line in c.
Weigh-ins are weighted by reliability (ADR-0027) and recency (half after 60
days). The result is combined with the prior c = 1 ± 0.12.
- Pros: in simulation (a known c of 1.10, 0.6 kg of daily scale noise, 10 %
  of days unlogged and 5 % half-logged), the estimate was within ±0.05 of
  the truth at 4–8 weeks, and the uncertainty fell from 0.07 (4 weeks) to
  0.03 (8 weeks) to 0.02 (12 weeks).
- Cons: assumes a constant c within the recency weighting; still needs the
  formula model for the shape of each day.

### C. Keep ADR-0020

## Decision
**B.**
- Unlogged and half-logged days (under 60 % of what the day costs) are
  filled in from the complete days within ±7 days, as MacroFactor does.
- The window starts at the first logged day.
- A factor is proposed only within ±0.04 and when it differs by ≥ 0.02 from
  the accepted one. It is accepted by hand, from that day on (ADR-0026),
  inside 0.80–1.20 (the table's constraint).
- A steady under-logging is not corrected for: targets are met in logged
  numbers, so it cancels out.

Tripwires:
- If accepted factors hit 0.80 or 1.20 for real users, widen the
  constraint (a migration).
- If the factor swings between weeks by more than its σ, shorten the half-life.

## Consequences
- The calibration box shows "you spend X kcal a day (low–high)", how many
  weeks it learnt from, the factor ± σ, the half-logged days left out, and
  the last 14 days' numbers. "Not sure enough yet" replaces a premature
  proposal.
- The estimator reads 84 days (one range query each for history, sessions,
  activity).
- The formula model itself is unchanged: it is the prior and the day-to-day
  shape (training days cost more). Goals as % of body weight a week and a
  calorie floor are Phase 2b (a new table).

## What I learned
