# ADR-0024: A training program is an ordered cycle that slips when a day is missed

**Status:** accepted (the developer chose the recommended option, 2026-10-01)
**Date:** 2026-10-01

## Context
Sessions are planned one at a time. The developer wants to program weeks
or spans of days, with sensible behaviour when a session is skipped, done
on another day, or swapped.

## Options considered
### A. Ordered cycle
A sequence of routines and rest days (Push, Pull, Legs, Rest…) starting
on a date. The next slot is the first one not done: a missed session is
not lost, the rest slides forward. Future days are planned from it.
- Pros: matches how gym splits are run; missing a day needs no editing.
- Cons: a fixed weekday (e.g. football on Tuesday) needs a separate fixed entry.
### B. Fixed calendar
- Pros: predictable weekdays. Cons: a missed day is lost or moved by hand.
### C. Both
- Pros: covers everything. Cons: twice the rules and UI.

## Decision
**A.** A program has ordered slots (routine or rest) and a start day. The
plan of the coming days is DERIVED, never stored, from the slots and the
sessions actually done (as stock is in ADR-0017). Doing a different routine
counts against the slot it matches, or else as extra.
Tripwire: if fixed weekdays are needed often, add fixed slots (C).

## Consequences
- New tables `programs` and `program_slots` (migration-only PR first).
- The day page and the energy model treat the derived slot as a planned session.
- The targets page uses the coming days' plan.

## What I learned
