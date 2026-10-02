# ADR-0033: Where things live — each section its records and their stats; Progress the whole picture; sub-tabs everywhere

**Status:** accepted (the developer chose the recommended options, 2026-10-02)
**Date:** 2026-10-02

## Context
The design review (2026-10-02) gave the app tabs by task: Today, Training,
Food, Progress, Assistant. Food and Progress then got sub-tabs, Training
and Today did not. Training stats sat in two places (Training and
Progress), and the day page had grown long. The developer asked for
sub-tabs in Training, wondered about the overlap with Progress, and asked
whether Today should have sub-pages too.

## Options considered
### A. Sub-tabs in every section; stats with their records; Progress is the overview
- **Training:** Sessions · Exercises · Routines · Programs. Sessions holds
  the week, volume per muscle, the chart per day and the history; each
  other tab holds the stats of its own items.
- **Today:** the date, the week and the day type stay on top, always.
  Below them: Summary · Food · Training for the chosen day. Summary shows
  quality, totals, energy, sleep and movement, each leading to its tab.
- **Progress:** over time, across sections — body, intake against spending,
  sleep, the coming days. Per-item stats are not repeated there.
- Pros: one pattern everywhere (a tab, then its views); no stat in two
  places; a shorter day.
- Cons: one tap more to see the day's food from the summary.
### B. Training with three tabs (Exercises · Routines · Programs)
- Cons: the session history and the week's numbers would need another
  home (Progress), which brings the overlap back.
### C. Today as one long page, only reordered
- Pros: everything with one scroll (MacroFactor, Cronometer).
- Cons: the page the developer found too long, and different from the
  other sections.

## Decision
**A**, with Training's four tabs and Today's three. Views are URLs
(`/training/exercises`, `/?day=…&tab=food`), so back and links work.
Sheets (the "+") open from any view.

## Consequences
- Training's chart per day moves from Progress → Trends to Training →
  Sessions.
- Exercise and routine trends move from the Training page to their own tabs.
- The day page renders one view at a time, and its sheets outside them.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
