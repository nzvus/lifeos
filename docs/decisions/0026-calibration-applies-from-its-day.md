# ADR-0026: An accepted calibration applies from its day on; past days change only when the formulas are fixed

**Status:** accepted (the developer's request, 2026-10-02). Amends ADR-0020.
**Date:** 2026-10-02

## Context
ADR-0020 stored one factor in `user_settings`, and every day's energy was
computed with the current one, so accepting a calibration rewrote the past.
The developer wants past days to stay as they were for changes in their
body (a calibration reflects the body at that time), and to change only
when the formulas themselves are corrected (ADR-0021 was such a fix).

## Options considered
### A. A history of factors, each from the day it was accepted
- Pros: a day uses the factor in force on it; formulas still compute on read,
  so a formula fix still reaches every day. A new table: safe in any merge order.
- Cons: one more lookup per day.
### B. Copy the factor onto each day's plan (day_plans)
- Cons: a column on an existing table (unsafe before migrating, see #103),
  and days without a plan would still follow the current factor.

## Decision
**A.** `energy_corrections(since_day, factor)`; the factor on a day is the
latest one with `since_day` ≤ that day, else 1.00. Accepting writes a row
for today (replacing today's if any). `user_settings.energy_correction`
stays as "the current one" for display until it is dropped.
Tripwire: if a past day must be re-calibrated on purpose, add a "since"
day to the accept action.

## Consequences
- Migration 0018 (with ADR-0024's exercise slots, both new tables).
- getBody takes the factor for its day; calibration compares each day with
  the factor of that day.

## What I learned
