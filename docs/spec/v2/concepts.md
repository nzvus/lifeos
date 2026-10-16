# v2 — Concepts

The whole app is one model. Every domain (food, training, body, mind,
money, habits, activities, learning, journal…) is described with these
nine concepts; a domain adds code only where they are not enough
(`kinds.md` says where). Decided by ADR-0053.

## 1. Time

- **Instant or interval.** An entry has `start` and, for intervals,
  `end` (a night, a work block, a session). Stored as UTC instants.
- **The logical day.** An entry belongs to the day of its start in the
  user's time zone, shifted by a **day boundary** (default 04:00). A
  snack at 01:30 belongs to the evening before, and a night to the day
  it ends (sleep says which, see `kinds.md`).
- **Planned, done, skipped.** Every entry has a status:
  - *planned*: something meant to happen, typed or produced by a
    template;
  - *done*: it happened;
  - *skipped*: it was planned and consciously not done. It counts for
    habits and for the plan's adherence, never as zero intake.
  A done entry may **fulfil** a planned one (a link), so plan vs actual
  is always answerable ("planned 08:00, eaten 08:40").
- **Future days** hold planned entries only (v1's rule, kept).
- **Unknown time** is allowed: an entry may have a day and no time ("a
  coffee, some time today"). It sits at the end of its day.

## 2. Kind

A kind is the definition of something trackable. Built-in kinds are
declared in code (`core/kinds/*`); the user's own kinds are rows in the
DB with the same shape, made from Settings → Trackers.

```
Kind
  key, name, domain, icon, colour
  shape         instant | interval
  fields[]      key, label, type, unit, scale, min/max, required, default
                type ∈ number | integer | duration | boolean | choice | scale(1–5|1–10) | text | ref(catalog kind) | time
  composite     none | lines(of catalog kind, quantity field)        ← e.g. a meal, a session
  metrics[]     declared derivations (see §6), e.g. "kcal: sum per day"
  targets       the default target kinds it offers (at least, at most, range, reach)
  entry         how it is entered: quick (one tap), form, timer, specialised editor
  relations     declared temporal relations to other kinds (see §8)
```

Examples, in full in `kinds.md`:
- **water**: instant; `ml` (number); metric: sum per day; target at
  least 2,000.
- **habit "stretching"**: instant; boolean done; recurrence 3× a week;
  metrics: streak, completion %.
- **mood**: instant; mood, energy, stress as scales 1–5; moment
  (morning / evening).
- **work block**: interval; project ref, focus scale; metric: hours
  per day / week.
- **meal**: instant; composite lines of food; specialised editor (the
  food composer); metrics: every nutrient, cost.

## 3. Entry

```
Entry
  id, kind, start, end?, day (logical, derived), status
  values        one per field of the kind (exact numbers; text; choices)
  lines[]       for composite kinds: catalog item + quantity (+ the snapshot of its values)
  parent        an entry it belongs to (a set's exercise belongs to the session)
  links[]       fulfils (planned → done), from-template (block), related (free)
  source        typed | quick | timer | device | import | template | derived
  confidence    0–1: how sure the values are (typed weighed food 1, an estimate 0.6, a guess 0.3)
  note
```

- An entry's values are what happened. Only the user edits them. A later
  correction of a catalog item never rewrites past entries (the
  snapshot, ADR-0007).
- Confidence is what the estimators use (v1's closed days, estimated
  meals and weigh-in reliability, generalised).

## 4. Catalog item

Reusable things that entries point at.

```
CatalogItem
  id, catalog (food | exercise | product | habit | project | place | person | book | …), name
  values        per its catalog's fields (a food: nutrients per 100 g as rows, each with source + confidence)
  based_on      the item it was made from ("new from…": v1's duplicate goes away)
  parts[]       for composite items: a recipe's ingredients, a routine's exercises
  archived      out of pickers, still in history
```

A product (brand, barcode, package) is a catalog item linked to its food.
A purchase is an entry that refers to the product (spec 05 P-1).

## 5. Model: block, day type, week layout, cycle (ADR-0054)

```
Model
  id, scope (block | day | week | cycle), name, extends? (a model of the same scope)
  block    kind (+ catalog item or defaults), status planned
           when: absolute "08:00" | relative "40 min after <block>" | "after wake / before bed"
           duration?, shares? (a meal block's share of the day's kcal and protein)
  day      blocks[]; targets: fixed values | follow the goal (deficit, protein and fat g/kg)
  week     weekday → day model | cycle
  cycle    steps[] (any models: day types, blocks, sets of blocks)
           advance: per occurrence | per date; on skip: shift | lose
           bound to? a block of a day model ("training takes the next step",
           "dinner rotates four recipes"); position (the next step)
  recurrence (habits): daily | weekdays | every N days | N times a week | on dates
```

- **Made:**
  - Piano → Modelli → "+";
  - from a day: "Salva come modello";
  - from an entry: "Ripeti come abitudine";
  - "duplica", "estendi".
- **Extends.** It makes macro-types of day: Lavoro → Lavoro + palestra;
  Riposo → Viaggio. Editing the base changes every model built on it.
  A model can never extend itself or any model built on it: the
  editor leaves them out of the choice, so no loop can be made.
- **A model built on a base stores only its differences**, never a copy:
  - blocks it adds (local);
  - inherited blocks it removes (hidden here, kept in the base);
  - fields it changes on an inherited block (a time, a share).

  Everything else follows the base: when the base changes, the model
  changes too, except where it has its own value. Each block shows
  where it comes from (from the base, local, changed here, removed
  here), with a way back.
- **Removing every inherited block** does not unlink the model. The
  editor offers "Scollega" (unlink) instead. Unlinking makes the visible
  blocks local, with today's values.
- **Changing the base** asks first, listing what changes:
  - **replace:** the inherited blocks become the new base's; local blocks
    stay; changes stay where their block still exists, marked as a
    conflict when the new base has a different value;
  - **merge:** only the new base's missing blocks are added;
  - **cancel.**

  Local blocks and changes are never lost without saying so.
- **Applying** a model to a date writes planned entries linked to their
  blocks. Moving a block moves the entries relative to it: the
  pre-workout meal follows the session.
- **Cycles:**
  - a cycle step lands on its bound block or, unbound, on the day itself
    (a cycle of day types);
  - a skipped occurrence shifts or loses the step, by the rule.
- **Swapping mid-day:** choose another day model; done entries stay;
  planned entries ahead are replaced; the swap is undoable.
- **Habits** are block models with a recurrence; their entries are
  planned, done or skipped like any other.

## 6. Metric

A metric is a declared derivation, computed on read and never stored as
truth (it may be cached per day, and the cache is always rebuildable).

```
Metric
  source     kind.field | kind (count) | another metric
  filter     status = done, catalog item, relation ("within 2 h after training"), time of day
  aggregate  sum | mean | min | max | count | last | first | streak | regularity | share
  window     day | week | month | rolling N days | session | custom range
  transform  trend (EMA or Kalman, with σ) | rate (per week) | ratio (x / y) | per kg
```

Examples:
- protein per day;
- kcal after 21:00 (share of the day);
- sets per muscle per week (indirect ½);
- e1RM(RIR) best per session, trend;
- sleep regularity over 7 days;
- money spent per category per month;
- days in a row with stretching;
- hours of focus per week.

## 7. Goal, target, judgement

```
Goal
  metric, window, kind of target: at least | at most | range | reach (a value by a date)
  value(s), since (history: a goal changes from a day on, past days keep theirs)
  derived: progress, pace needed vs actual, ETA, "on track"
```

- **The day's targets** for food are goals too: kcal "range around the
  day's target", protein "at least", salt "at most". The weight goal
  derives the energy target through the expenditure engine
  (`engines.md`).
- **Judgement**: a score made of declared parts, each part a metric
  against its band, with its weight and its source. Each judgement is a
  **scoring model** in a registry (`engines.md` E7):
  - versioned and dated;
  - its weights adjustable by the user within allowed ranges;
  - health limits locked;
  - explained on its own page with the science and the sources. A part that cannot be
  computed is left out and said. The scores are kept apart: targets, food
  quality, distribution, recovery, training, habits; each domain's own.

## 8. Relations between entries (time awareness)

Kinds declare which relations matter; the engine computes them, never
the user:
- **before / after with a gap**: a meal 0–3 h before training =
  pre-workout; 0–2 h after = post-workout; 0–3 h before bed = pre-sleep;
  caffeine 6 h before bed.
- **during**: a set during a session; a work block during the day.
- **since last**: hours since the last meal, the last coffee, the last
  session for this muscle.
The relations show as tags on entries ("post-workout"), feed metric
filters, and are evaluated by judgements (spec 02 P-2). Skip the
training and the tag goes by itself.

## 9. Decision

What must not change when formulas change:
- a closed day (complete / partial);
- an accepted week of targets;
- a frozen target snapshot of a past day;
- a skipped planned entry.
Stored as rows, never recomputed; the UI marks numbers made under an
older formula.

## What stays specialised (and why)

| Specialisation | Why the generic model is not enough |
|---|---|
| Food composition + nutrient rows | quantities × per-100 vectors, exact sums, snapshots of ~40 nutrients per line |
| Training sets + gym mode | a session → exercises → sets hierarchy with timers, rests and effort |
| Money ledger | signed exact cents, lines, accounts and balances |
| Pantry stock | derived from purchases, consumption and counts |
| Body weight estimator | a Kalman over scale + intake (ADR-0041/0042), not a plain aggregate |

Everything else (sleep, mood, water, supplements, habits, activities,
learning, journal, chores, social, screen time) is plain kinds.
