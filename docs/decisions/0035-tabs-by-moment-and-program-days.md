# ADR-0035: Tabs by moment — do (Today), plan (Plan), build (libraries), review (Progress) — and a program day is a list

**Status:** accepted (the developer delegated the choice: "fai come preferisci", 2026-10-03)
**Date:** 2026-10-03
**Supersedes:** ADR-0033 in part (where training stats live; Progress → Coming days)

## Context
After ADR-0033 the same things lived in several places:
- the program was in Training → Programs, Progress → Coming days and the day page;
- the sessions were in Training → Sessions and Today.

The developer asked to:
- drop Progress → Coming days and give programs a month view;
- remove "Start from", since the "+" does it;
- start gym mode only from the day;
- move what is left of Sessions into Progress;
- let a program day hold several routines or exercises, or be skipped;
- add more colour and icons.

They also asked for deeper changes where sensible. The root cause: tabs were by **subject** (training, food), while the app is used by **moment** — doing today, planning the coming days, building the library, looking back.

## Options considered
### A. Tabs by moment
- The tabs: **Today** · **Plan** · **Training** · **Food** · **Progress**. The **Assistant** moves to the header, reachable from every page.
- **Today:** records the day, as now. The only place gym mode starts from.
- **Plan (new):**
  - a calendar with month, week and agenda views; each day shows its program items, coloured by muscle region, its day type, and done, missed or planned;
  - a day sheet to add a routine or exercise, skip, rest, move or swap, change the day type, or open the day.
  - It replaces Progress → Coming days and the coming days in Programs.
- **Training:** the library — Exercises · Routines · Programs — with no stats. Sessions goes.
- **Food:** Meals · Ingredients · Pantry, as now.
- **Progress:** Overview · Body · **Training**. Training holds the session history, volume per muscle, the chart per day, and exercise and routine records and trends.
- Pros: each thing in one place; libraries stay clean; planning gets a real home.
- Cons: a new tab to learn; ADR-0033's "stats with their records" is reversed.

### B. Same tabs; Training → Calendar replaces Sessions; Progress gains Training
- Pros: less to relearn.
- Cons: the calendar is one level down; food cannot join it naturally; the Assistant keeps a tab.

### C. Only the listed changes
- Cons: the overlap stays.

### Program days
- **List:** a day holds routines and/or exercises in order, or nothing (rest).
- **Single:** a day keeps one routine or exercise; extra training is planned as sessions.

## Decision
**A**, and **a program day is a list**.
- **Program day items:** a new table, `program_slot_items` (slot, position, routine or exercise).
  - A migration copies each slot's routine or exercise into it. The old columns stay until a later release (expand and contract).
  - A day counts as done when any of its items is done; the day shows each item.
- **Skip:** a new table, `program_skips` (program, day). It consumes the slot due without doing it, and the cycle moves on. New tables, not columns on existing ones (the migration-merge-order lesson).
- **Adding a routine to a date:** a planned session, which already exists, not a program change.
- **Colour and icon of a routine:** derived, not stored. The colour is its main muscle region, the icon its main movement. They are the same in the calendar, the day, the program editor and the library.
- **"+" → Training:** gains *like a past session* (start from one done before).

Tripwire: if Plan is rarely opened after a month, fold it back into Training (option B).

## Consequences
Slices, in order:
1. Plan with the month calendar, read-only. Progress → Coming days and the coming days in Programs go.
2. The day sheet in Plan (skip, rest, move, swap, add). Skip needs its migration.
3. The program day list: migration and new editor.
4. Progress → Training (history and stats).
   - Training → Sessions goes, and with it "Start from".
   - Gym mode starts only from Today.
   - "Like a past session" joins the "+".
5. The Assistant in the header; colours and icons everywhere.

ARCHITECTURE.md's navigation line changes with slice 1.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
