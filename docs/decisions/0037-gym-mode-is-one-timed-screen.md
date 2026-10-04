# ADR-0037: The gym mode is one timed screen, for sessions and routines

**Status:** accepted (the developer delegated the choices: "vedi tu", 2026-10-04)
**Date:** 2026-10-04

## Context
The developer asked to change several things at once:
- measure each set's time: the rest counts down, then on into overtime
  until "Go"; the set counts up until ✓;
- resume a session after leaving the page or closing the app, with the time
  away counted as rest;
- split sets of exercises done one side at a time, with half the rest
  between the sides;
- delete single sets while training;
- warm-ups that follow the loads;
- one editor instead of two, and a routine that can be edited for next
  time without starting it.

The second editor also confused: with nothing changed, Save was disabled
and only Cancel left the page.

## Options considered
### A. Instants on each set; the clock derived from them
- `sets.started_at` and `sets.ended_at` are saved with the set.
- The phase (idle / set / rest), the rest's overtime and the session's
  active minutes are pure functions of those instants (core/training/live.ts).
- Pros: a reload, another device or a closed app resume exactly; the time
  away is simply rest; nothing else to store.
- Cons: two columns on an existing table (safe, because the CI gate makes
  the migration run before the merge).

### B. A separate "clock state" stored per session
- Pros: the sets table is untouched.
- Cons: a second truth that can disagree with the sets; more writes.

### Routines
- **A. A routine saved by hand after its last session wins.** Otherwise the
  last session is repeated, as before. `routines.items_saved_at` records the
  save.
- **B. Always the routine.** Loses "always at its latest version"
  (presets.ts).

## Decision
A and A.
- **Two modes, one screen.** The gym-mode screen has a session mode and a
  routine mode. `/training/routines/<id>` opens the routine there: nothing
  is ticked or timed, and it can be saved to the routine, started now or
  planned today. Name and notes moved to `./details`.
- **Unilateral halves.** The two halves of an unilateral set are kept in
  the browser's draft (`halfAt`, `resumedAt`). The set saves its start and
  end, with the half rest inside.
- **Long breaks.** A break of more than 3× the planned rest and over
  10 minutes is shown: the session compares less well.
- **Active minutes.** A session's minutes are now the first start to the
  last end, when the sets are timed.
- **Save with nothing changed (ui/ActionBar)** goes back, on every edit page.

Tripwire: if set times turn out noisy (forgotten ✓), progress should use the
median, not the sum.

## Consequences
- Migration 0027: `sets.started_at`, `sets.ended_at`,
  `routines.items_saved_at`. Data: "Cable lateral raise" and "Bulgarian
  Split Squat" become unilateral.
- Still to do:
  - the done-session editor folds into the same screen (day, time and notes
    are its last reasons to exist);
  - per-exercise rest and density in Progress.

## What I learned
Not written yet: this section is the developer's own.
