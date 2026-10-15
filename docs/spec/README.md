# lifeos — the specification

> Decided 2026-10-15 (ROADMAP "Now"): before more features, one complete
> description of what the app does, what it collects, where each datum is
> used, how it is aggregated and on which evidence each number rests. It is
> written from the code and the running app with the developer's data, not
> from memory. Code that disagrees with this spec is either a bug or a
> proposal to discuss.

## How to read it

One file per area. Each feature is written the same way:

- **Today**: what the app does now, with the file that does it.
- **Data**: what is entered (where, how), stored (table), derived (formula).
- **Used by**: every place that reads it.
- **Evidence**: the source of each number; `docs/spec/sources.md` lists them.
- **Issues** ⚠: what is wrong, duplicated, unused or unclear, as found.
- **Proposals** 💡: what the agent suggests; each one waits for the developer.
  A proposal marked **[decision]** is expensive to reverse and needs an ADR.

| File | Area |
|---|---|
| [01-day-energy-body.md](01-day-energy-body.md) | The day's targets: goal, expenditure, movement, weight, check-in, day programs |
| [02-food.md](02-food.md) | Ingredients, meals, the log, moments and slots, quality, scores |
| [03-training.md](03-training.md) | Exercises, routines, programs, sessions, gym mode, guidance |
| [04-recovery-mind.md](04-recovery-mind.md) | Sleep, check-ins, readiness, compounds |
| [05-pantry-money.md](05-pantry-money.md) | Products, purchases, stock, receipts, scanning, money |
| [06-interface.md](06-interface.md) | Navigation, Today, the shared components: issues and proposals |
| [06-screens.md](06-screens.md) | Every screen and what it does today: the inventory a rebuild checks against |
| [07-data-platform.md](07-data-platform.md) | Export/import, packs, trash, backups, the assistant |
| [08-model.md](08-model.md) | The whole picture: every table, the aggregation hierarchy, the decisions, the order of work |

## Principles every area follows

These are the rules the spec checks the code against. Most already exist
in ADRs; the spec makes them explicit so they can be tested.

1. **One fact, one place.** A datum is entered once, stored once, and
   derived everywhere else. Two inputs for one fact (a declared level and
   counted steps) or two estimators for one quantity (three weight trends)
   make the numbers drift apart.
2. **Raw → derived → aggregate → judgement.** Each layer only reads the one
   below it, and is recomputed, never edited. Only raw data and decisions
   (an accepted check-in, a closed day) are stored.
3. **Every number has a source.** A constant in `core/` carries its source
   and ADR in a comment and a test that pins it.
4. **Honest uncertainty.** Estimates are ranges or carry their σ; a
   judgement is never shown as more precise than its inputs.
5. **Context over isolation.** A day is read in its week, a set in its
   session, a session in the training block and in the body's state.
6. **Explainable.** Every score or target can say how it was built, in
   steps a person can follow ("How this number is built").
7. **Ask the human for intent, derive the numbers.** Forms ask goals,
   targets and dates; the app derives rates, grams and percentages within
   evidence-based ranges and says why (memory: ask-human-inputs).
8. **Never lose data.** Every table is exported and can come back in
   (ADR-0052); past days keep their snapshots and frozen decisions.
