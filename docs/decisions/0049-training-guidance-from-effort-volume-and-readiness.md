# ADR-0049: Training guidance from effort, volume per muscle and readiness

**Status:** accepted (the developer: "procedi" on the recommendations, 2026-10-10; details decided by the agent)
**Date:** 2026-10-10
**Would amend:** ADR-0028 (exercise guides and personal targets)

## In one sentence each (what you would see)
1. **Effort:** after a set, one tap says how many more reps you had left
   (0, 1, 2, 3, 4+).
2. **Progression:** the "Today: 3 × 10 × 42.5 kg" line uses that tap. It
   adds weight only when the reps came at the right effort, and holds when
   you were already at the limit.
3. **Volume:** each muscle shows its hard sets this week. A set that works
   the muscle only indirectly counts half. A band says too little, good
   or too much.
4. **Readiness:** on a day after a short night or a high-stress check-in,
   the session shows a hint ("keep the load, one set fewer"). Nothing
   changes by itself.

## Context
Refactor plan, Phase 4 (§2.3). Sets have no effort data. Without it the
app can't tell an easy set from a set to failure, and proximity to
failure is the main dial for hypertrophy (Robinson 2024). Volume counts
every set as 1, while the evidence counts indirect sets as ½ (Pelland
2024) and its returns diminish. Sleep, mood and stress are collected but
never reach training. Rest is stored in four places.

## Options considered
### Q1. Where effort is stored
- **A. A nullable `rir` column on `sets`** (recommended). One migration.
  Every place that reads sets gets it for free. The CI gate makes migrate
  run before merge.
- **B. A new table `set_efforts(set_id, rir)`.** Follows "new tables
  first", but every read of sets needs a join.
- **C. RPE (6–10) instead of RIR.** The same information, but harder to
  answer between sets.

### Q2. How targets progress
- **A. Double progression gated by RIR** (recommended). Target RIR 1–3;
  the last set of an isolation exercise may go to 0–1.
  - Reps go up while RIR ≥ the target.
  - The load goes up when the top of the range is reached at the target
    RIR.
  - Two sessions in a row under the target RIR: hold, or reduce by one step.
  - Without RIR (an old set, or a skipped tap): today's rule, reps only.
- **B. Keep today's rule** (reps only).
- **C. Percentage-of-1RM programming** from the estimated 1RM.
  - Cons: strict, and wrong when the estimate is off.

### Q3. Volume per muscle
- **A. Each exercise's first muscle group counts 1, the others ½**
  (recommended). The band is 10–20 hard sets a week, shown as diminishing
  above 20. Warm-ups and sets at RIR ≥ 5 don't count.
- **B. A muscle map per guide.** More precise; a table to keep.
- **C. As now** (every set 1).

### Q4. Readiness
- **A. A hint only** (recommended).
  - From: last night's sleep under 6 h, check-in energy ≤ 2 or stress
    ≥ 4, and a falling e1RM over 3 sessions.
  - The hint: "keep the load, one set fewer".
  - After 6–8 hard weeks or a falling trend: a deload suggestion.
- **B. Adjust targets automatically.**
  - Cons: decides for you, from noisy inputs.
- **C. Nothing.**

And, delegable: one rest field. The planned rest stays on the routine;
the actual rest is derived from set times. Rest by the evidence:
isolation 60–90 s, compound 90–180 s.

## Decision
**A, A, A, A.** The details:
- **`sets.rir`:** 0–4, null = not said. 4 means "4 or more"; the tap
  offers 0, 1, 2, 3, 4+.
- **Effort targets:** RIR 1–3. On an isolation exercise the last working
  set may go to 0.
- **"Too hard":** a working set at RIR 0 outside that allowance.
  - If the heaviest load's sets were too hard: same load (`hold_effort`).
  - If the session before was too hard as well: one load step down
    (`reduce`).
  - Reaching the top of the range only adds load when no set there was
    too hard.
  - Sets without RIR progress as before (reps only).

## Consequences
- Migration 0035: `sets.rir` (nullable, 0–4).
- About 2 PRs:
  1. the RIR tap in gym mode and on the session page, and progression
     gated by RIR;
  2. volume per muscle with ½ for indirect sets, and readiness hints.
- Rest: the gym clock uses the planned rest or the guide's. The per-set
  and per-session rest columns go to the backlog for removal.

## What I learned
