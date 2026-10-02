# ADR-0029: A program's coming days can be changed with per-day overrides

**Status:** accepted (the developer chose option A, 2026-10-02)
**Date:** 2026-10-02

## Context
ADR-0024 derives a program's plan from its ordered slots and the sessions
done, and stores nothing per day. The developer wants to shift, swap or move
a routine or exercise to a specific day once the program exists, perhaps by
dragging. A derived plan has nowhere to keep "on Friday do Legs".

## Options considered
### A. Per-day overrides on top of the cycle
- Pros: the cycle stays as it is. An override says "on this day, this slot
  (or rest)". Swap, move and "rest today" are all one or two overrides.
  Drag and drop is only a way to write them.
- Cons: one more table, and the derivation has to place the overrides first.
### B. A fixed-weekday program as an alternative mode
- Pros: predictable weekdays.
- Cons: it doesn't solve "this week only", and it is a second set of rules
  (ADR-0024 option C).

## Decision
**A.**
- **Table:** `program_overrides` (user, program, day, slot position, or null
  for rest), unique per program and day. Only today and later can be set.
  Past days are what was done.
- **Derivation:** `core/training/program.ts`, still pure.
  - Overrides take their days first. The slots still due fill the other days
    in cycle order, skipping the ones already placed by an override in the
    same round.
  - A session done counts as today (ADR-0024). An override on a past day is
    ignored.
- **Actions:**
  - "Move here": choose the slot for a day.
  - "Swap with…": two overrides.
  - "Rest": an override set to null.
  - "Reset": delete the override.
  - Drag and drop on the next-days list writes the same overrides.

## Consequences
- A migration that only adds a table (safe either way, as in #103).
- The day page, the energy model and the outlook read the plan as before.
  It simply has the overrides in it.
- Overrides older than today can be purged. They change nothing.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
