# ADR-0031: Sleep is logged by hand, and used for day quality, trends and weigh-ins, not for energy

**Status:** accepted (the developer accepted the recommended option, 2026-10-02)
**Date:** 2026-10-02

## Context
The developer wants to record sleep, to say more about how a day went and
how the long term goes. A PWA can't read Health Connect or Apple Health,
and nothing about sleep is stored today.

## Options considered
### A. By hand: bedtime, wake time, an optional quality 1–5
- Pros: works everywhere, takes a few seconds, and the data stays ours.
- Cons: by hand.
### B. Imported from the phone or watch
- Pros: automatic.
- Cons: a PWA can't read them directly. It needs an exported file or a
  native app. Kept for later.

## Decision
**A.**
- **Storage:** a new table `sleep_logs`, one row per user and wake-up day.
  It holds bedtime and wake time (instants, so a night across midnight is
  one row), an optional quality 1–5, and notes. Logged from the day page
  ("+" → Sleep) for the night that ended that day.
- **Day quality:** a sleep part, 100 at 7–9 h (AASM / NSF adult range),
  falling to 50 at 6 h or 10 h and to 0 at 4 h or 12 h. A day without
  sleep logged keeps today's score (no part).
- **Trends:** in Progress → Trends, the hours per night and their average
  over the period, beside food and training, so they can be compared by
  eye.
- **Weigh-ins (ADR-0027):** a night under 6 h is a clue ("short night"),
  reliability × 0.9.
- **Energy:** unchanged. The everyday factors already include a normal
  night, and an hour of sleep more or less changes expenditure by a few
  tens of kcal: a term for it would be falsely precise. Sleep matters for
  appetite, recovery and the next day's movement, which is where it is
  shown.

Tripwire: if B becomes possible (a native shell, or an export the
developer uses), add an import that writes the same rows.

## Consequences
- A migration that only adds a table.
- The export carries `sleep` (version 11). The trash doesn't need it:
  a night is replaced, not deleted.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
