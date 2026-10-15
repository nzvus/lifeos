# ADR-0053: lifeos v2 is one timeline engine over a hybrid schema, built as a parallel app

**Status:** accepted (the developer chose the recommended option of each question, 2026-10-15: hybrid database, a v2 app in parallel, design system + boards first, every domain from the start "and anything else that comes to mind")
**Date:** 2026-10-15
**Supersedes (when v2 replaces v1):** the domain models of ADR-0005, 0008, 0009, 0011, 0014, 0044, 0046 (their rules carry over into `docs/spec/v2/`, not their tables)

## Context
The spec of v1 (`docs/spec/`, PR #186) found the same fact entered or
estimated in several places, and each area with its own model. That
covers the targets, the weight trend, the moments, the rests and the
prices. There is also no object for "the whole day".

The developer asks for something larger: *"un'app completa per tracciare
tutto il mio quotidiano e tutti i miei avanzamenti in ogni ambito… 
temporalmente intelligente"*, with habits, goals in any domain,
activities at any hour and a journal. They want *"astrarre e unificare al
massimo: motori di tracciamento e pattern, e specializzare ogni
astrazione solo se necessario… anche a livello di pagine e di ui"*. A new
database is acceptable if the old data is converted.

Adding habits, activities and goals as more one-off modules would
repeat v1's problem in five more places.

## Options considered
### Data model
- **A. Hybrid** (chosen): one timeline of entries whose fields are
  declared by their kind; dedicated tables only where structure matters
  (food composition, nutrients as rows, sets, money lines, stock).
- **B. Fully generic** (entries + key/value for everything): maximum
  abstraction, but the database can no longer keep totals exact,
  references intact or queries fast.
- **C. Keep v1 and add a generic layer**: least risk, two models for ever.

### Transition
- **A. A v2 app in parallel** (chosen): its own URL and database; v1
  stays in use until v2 covers the screen inventory.
- **B. Rewrite in place**: one app, but old and new models together
  through every migration.

### Design
- **A. A design system from the code, then design boards** (chosen),
  commented by the developer before any screen is coded.
- **B. Straight to code** with phone screenshots.

## Decision

### 1. One model: everything is an entry on a timeline
| Concept | What it is |
|---|---|
| **Kind** | the definition of something trackable: fields (type, unit, range), instant or interval, composite or not, its metrics and default targets. Built-in kinds live in code; the user's own kinds live in the DB with the same shape. A new tracker never needs a migration. |
| **Entry** | one fact: kind, start (and end), status planned / done / skipped, values, parent entry, links to other entries, source (typed, device, import, derived) and confidence, note. |
| **Catalog item** | a reusable thing an entry refers to: a food, an exercise, a product, a habit, a place, a project; "new from…" another one. |
| **Template** | blocks at absolute or relative times ("40 min after training"), for a day, a week or a routine. It can extend another template. A recurrence turns it into planned entries, which can be moved or swapped mid-day. |
| **Goal** | a metric, a window, a target or range, an optional date. Progress, pace and ETA are derived. |
| **Metric** | a declared derivation over entries: sum, mean, count, last, streak, regularity, a filtered trend. Windows can be calendar, rolling, or relative to another entry ("within 2 h after training"). |
| **Judgement** | a score from declared parts, each with its source; scores of different domains are never mixed. |
| **Decision** | what must stay frozen: a closed day, an accepted week. |

### 2. Engines, generic; specialisations, few
- **Engines** (`core/`, pure, tested): time, metrics, goals, planning,
  judgement, correlations.
  - Time: windows, recurrence, relations between entries.
  - Metrics: series and windows; filters, including the weight and
    expenditure Kalman of ADR-0041.
  - Planning: templates → planned entries.
  - Correlations: n, effect size, interval.
- **Specialisations** are modules that add kinds and, only where a form
  cannot do it, an editor:
  - **nutrition**: food catalog, nutrients as rows with source and
    confidence, composition, a snapshot at logging (ADR-0007 carries
    over);
  - **training**: sets, gym mode with an automatic mode;
  - **money**: ledger lines, accounts;
  - **pantry**: stock derived from purchases;
  - **body**: the weight estimator.
- **Everything else is plain kinds**: habits, activities and time blocks,
  sleep, mood, water, supplements, reading, study, chores, the journal.

### 3. Screens, generic first
- **Generic:**
  - the day as one timeline with filters by domain;
  - an entry sheet generated from the kind;
  - a tracker page for any kind (list, chart, stats, goals);
  - a catalog page for any catalog;
  - Plan (templates, calendar, recurrence);
  - Goals;
  - Review (any metric, any range, correlations).
- **Specialised:** the food composer, gym mode, scanning.

### 4. Where v2 lives
- **One repository, an npm workspace:**
  - `apps/v1`: today's app, moved, unchanged;
  - `apps/v2`: the new one;
  - `packages/kit`: `ui/`, `design/`, `i18n` helpers, extracted now
    because v2 is its second consumer (ADR-0002's trigger);
  - `packages/` for what both apps need: test setup, auth config.
- v2 has its own Vercel project (its own URL) and its own database: a
  Neon branch `v2`, backed up by the same `backup.yml` pattern.
- **Data moves by file:** v2 imports a v1 export (v21, ADR-0052) through
  a converter. Parity checks must hold on the developer's data before any
  switch: day totals and cost, tonnage and e1RM, trend weight, sleep
  hours, money totals. Until the switch, v2 is re-imported from a fresh
  export whenever needed. After it, v1 is read-only, then retired.
- **Switch criteria:** every S-… id of `docs/spec/06-screens.md` is
  mapped in `docs/spec/v2/screens.md` to a v2 screen or to a recorded
  "dropped, because…"; parity checks green; one week of real use.

### 5. Process
`docs/spec/v2/` is the target. Every v2 slice starts from its spec page
and its approved board, ships with tests and is checked on the phone
against the developer's data (memory: lean-autonomous-mode).

Tripwire: if after the engine and two slices the generic forms make
common entries slower than v1 (more taps to log a meal or a set),
specialise that screen. The engine stays.

## Consequences
- Each step is large, so it ships behind its own spec page and its
  board, never as a bulk change.
- v1 receives only fixes until the switch. Its open proposals (spec 01–07)
  are implemented in v2, not in v1.
- Moving v1 into `apps/v1` and extracting `packages/kit` is a mechanical
  PR of its own (paths, lint rules, CI, Vercel root directory).
- Two Vercel projects count toward the same 100 deploys a day: previews
  stay off except for schema changes (memory: vercel-deploy-budget).
- ADR-0052's export becomes the bridge between the two apps; its
  coverage test protects the conversion.
- Follow-up ADRs: v2 schema (tables, constraints), each specialisation,
  the switch.

## What I learned
<!-- the developer's words -->
