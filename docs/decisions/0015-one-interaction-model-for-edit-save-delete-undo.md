# ADR-0015: One interaction model for navigating, saving, cancelling, deleting and undoing

**Status:** accepted (developer chose B, 2026-10-01)
**Date:** 2026-10-01

## Context
The developer (2026-10-01): every page, form and single item should give
priority to navigation, restore, delete, save and cancel; everything should
be more intuitive, and this goes with the visual refactoring. An audit of
the 21 signed-in pages found:
- **Delete** is one tap, with no confirmation and no undo, on 9 kinds of
  record (log entries, ingredients, meals, day types, sessions, exercises,
  routines, measurements, rating factors). A wrong tap loses data, which
  breaks the first invariant in spirit (PROJECT.md §3: data is never lost).
- **Cancel** does not exist. Leaving a form with unsaved changes loses them
  silently.
- **After saving**, behaviour depends on the page. Ingredients, meals and
  day types go back to their list; exercises, sessions and settings stay
  with a "saved" banner. "←" always leads to a fixed list, not to the page
  you came from (e.g. a meal opened from the day page goes back to Meals).
- **Placement:** "Save" sits at the end of long forms (the session editor
  is several screens long), and "Delete" sits right under it with similar
  weight. Row actions differ between lists: an icon on log entries, nothing
  on cards.
- **Restore** exists only in gym mode (↺ to last time's values).

The decision is expensive to reverse: it sets the shape of every page,
the behaviour of every repository delete, and possibly the schema.

## Options considered
### A. Conventions on today's pages (no schema change)
- Every edit page:
  - a bar pinned to the bottom of the screen with Cancel and Save, shown
    once something has changed; Save is the primary button, on the right;
  - Delete moves into a "⋯" menu at the top right, away from Save;
  - a confirmation dialog before any delete;
  - a warning when leaving with unsaved changes.
- "←" and "after save" return to where you came from.
- Pros: no migration; small, safe steps, page by page.
- Cons:
  - deleting is still permanent; a confirmation trains people to tap "Yes"
    without reading;
  - no way to undo a save.
### B. A + undo instead of confirmation, and a trash (soft delete)
- Everything in A, except deleting asks nothing. The record is moved to the
  trash (`deleted_at`) and a message shows "Deleted · Undo" for about 10 s.
- **Trash:** a page under Settings, to restore or delete for good. It is
  emptied after 30 days.
- **Save:** also offers "Undo" for a few seconds (the previous values, saved
  again).
- **"↺ Restore":**
  - in the pinned bar, it resets the form to the saved values;
  - per field where a default exists (last time, the day type's targets).
- **Single items:**
  - every row and card opens with a tap;
  - a "⋯" menu holds the quick actions (duplicate, delete, plan/tick).
- Pros: nothing is lost by one wrong tap (Gmail/Google Docs pattern); fewer
  dialogs, so faster on a phone; restoring becomes a habit, not a feature.
- Cons:
  - a migration adds `deleted_at` to about 8 tables;
  - every list query must exclude deleted rows (a repository helper next to
    `ownedBy()`, and tests per entity, as for cross-user reads);
  - delete rules change meaning: "a meal still uses this ingredient" means a
    live meal, and a meal in the trash still holds its ingredient;
  - the export must state whether it includes the trash.
### C. Edit in place, save automatically everywhere (like gym mode)
- No Save buttons: every field saves itself, with an undo history. Items
  open in a panel over the list (a bottom sheet on a phone, a side panel on
  a desktop) instead of a separate page.
- Pros: the most fluid; one model with gym mode.
- Cons:
  - autosave is wrong for edits that ripple: an ingredient's values reach
    every meal and future snapshot, a day type changes targets, so half-typed
    values would apply;
  - validation errors become per-field and continuous;
  - it rewrites every form and every page;
  - it is the largest cost and risk for the least gain over B.

## Decision
**B** (developer, 2026-10-01; the agent's recommendation). It is the only
option where one wrong tap never costs data, and it removes dialogs instead
of adding them. Autosave stays where it fits: logging that happens in real
time (gym mode, ticking food as eaten). Explicit Save stays for definitions
(ingredients, meals, day types, routines).

## Consequences
- **Migration PR first:** `deleted_at timestamptz null` on ingredients,
  meals, log entries, day profiles, exercises, routines, training sessions
  and measurements. Additive, merge-order safe.
- **core:**
  - a `live()` filter used by every list and lookup, with a test per entity;
  - delete becomes trash, plus restore and purge (purge also runs from the
    daily backup workflow after 30 days).
- **ui/ kit:** a pinned `ActionBar` (Cancel / ↺ / Save), a `Toast` with
  Undo, an item `Menu` ("⋯"), and an unsaved-changes guard. Navigation
  returns to its origin through `?from=` (falling back to the list).
- **Order of work:** kit components on one page (meal editor) with phone
  screenshots → every edit page → lists and rows → trash page. Each step
  is its own PR, together with the visual refactoring of those pages.
- Tripwire: if undo after save confuses more than it helps (developer
  review), keep it for delete only.

## What I learned
<!-- developer: write 1–3 sentences in your own words -->
