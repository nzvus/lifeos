# ADR-0009: A log entry is either planned or eaten, has an optional time, and may be an estimated meal

**Status:** accepted
**Date:** 2026-09-30

## Context

The developer wants to plan the day's food and confirm it as it is eaten,
with the time of eating (default: when the box is ticked, editable), and to
log meals that can't be described with ingredients using approximate
totals. Until now an entry was always "eaten", with no time, and always
made of ingredient lines. This is a change to the log's data model, which
holds the history the primary invariant protects (PROJECT.md §3), so it is
recorded before building on it. The developer delegated the choice ("procedi
come preferisci"), so this records the recommended option.

## Options considered

### A. Status and time on the existing entry; estimates as a one-line entry
- Pros: one table stays the single record of a day; totals keep being
  computed from lines (ADR-0003) — an estimate is one line of 100 g whose
  per-100 values are the typed totals; planned vs eaten is a filter, not a
  second structure; additive migration (defaults: eaten, no time).
- Cons: an estimate stores 0 for sugars, saturated fat and salt, which are
  unknown rather than zero; the `estimated` flag must be shown in the UI.

### B. A separate "plan" table, copied into the log on confirmation
- Pros: the log stays "only what happened".
- Cons: two places to read a day from; moving rows between tables on every
  tick, with its own failure modes; ADR-0007 snapshots taken twice.

### C. Estimates as a separate entry kind with its own totals columns
- Pros: unknown nutrients could be NULL instead of 0.
- Cons: stored totals — exactly what ADR-0003 rules out; every total
  computation gets a second code path.

## Decision

**Option A.** `log_entries` gains `status` ('planned' | 'eaten', default
'eaten', CHECK constraint), `at` (timestamp with time zone, nullable) and
`estimated` (boolean). Migration 0003 is purely additive.

Rules: the day's **eaten** totals are the day's totals (label, history,
charts); planned entries appear translucent and are added to an
"eaten + planned" projection. Ticking sets `at` to now; the time stays
editable; times typed as HH:MM are converted in the user's time zone
(`core/shared/dates.ts instantFor`, tested across daylight saving).
"Repeat yesterday" creates planned entries. An estimated meal is one line
of 100 g with the typed values as per-100 values; a typed cost becomes a
100 g package at that price, so the cost adds up exactly.

**Tripwires — revisit this ADR if:** (i) estimates are used often enough
that their unknown sugars/saturated fat/salt distort the auto limits
(ADR-0008 panel) — then show them as "unknown", not 0; (ii) plans need
their own lifecycle (e.g. weekly meal plans), which is the case for B;
(iii) times are needed for insights (meal timing vs training), which may
call for making `at` required.

## Consequences

Now easier: plan the day and confirm it; see where the day will end if the
plan is followed; log restaurant/party meals honestly as estimates.

Now harder: every totals consumer must decide eaten vs eaten+planned
(history and charts: eaten only); exports are version 3 (the importer
still reads 1 and 2, with the defaults).

Follow-up work: tags and ratings (ADR-0010).

Update 2026-10-04: an estimate takes every nutrient of a label (sugars,
saturated fat and salt were stored as 0). A pack's `estimates` plan dishes
on a day (a restaurant's menu, ADR-0034) without adding anything to the
catalog, and "Remove what's still planned" trashes what was not chosen,
with one Undo.

## What I learned

Not written yet: this section is the developer's own.
