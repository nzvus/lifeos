# ADR-0048: The weekly check-in is optional, off by default, and an accepted week can be undone

**Status:** accepted (the developer: "I didn't understand this check-in thing, and now I can't remove it", 2026-10-10; decided by the agent as delegated)
**Date:** 2026-10-10
**Amends:** ADR-0043 (the check-in, accepted rows never changed)

## Context
ADR-0043 made a weekly check-in part of every goal. When it was due, its
card stayed on Today. An accepted week could not be changed. The developer
did not see what it was for, and could neither undo it nor turn it off.

## Options considered
### A. Keep it always on, explain it better
- Cons: still a card that can't be removed, for something not asked for.

### B. Optional, off by default; an accepted week can be undone (chosen)
- Pros: without it, each day follows the goal live, which is the simple
  model. Those who want fixed weeks turn it on. A mistake can be undone.
- Cons: a column on `goals` (migration 0034, with a default; the CI gate
  makes migrate run first). "Accepted rows are never changed" now has one
  exception: the user's own undo.

### C. Remove the check-in

## Decision
**B.**
- `goals.weekly_check_in`, default false. That includes the goals
  already saved: after the migration the developer's check-in is off.
- **Off:** no card. Days follow the goal live. Accepted check-ins are kept
  but not read, so turning it back on restores them.
- **On:** as ADR-0043. "Undo the check-in" under the day's goal line (on
  today and later days of a fixed week) deletes the check-in covering
  today, with its per-day shifts.
- With the check-in off, the calibration box keeps its own Accept.

## Consequences
- Migration 0034 (a column with a default).
- Settings → Goal has a "Weekly check-in" switch with a one-line
  explanation of on and off.

## What I learned
