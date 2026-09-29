# ADR-0008: Daily targets come from user-defined day profiles, and each day keeps a copy of the targets it was lived with

**Status:** accepted
**Date:** 2026-09-29

## Context

v1 had one set of daily targets per user (`user_settings.target_*`). The
developer's training changed on the same day this was decided: gym on
alternate days, the days in between alternating an 8 km run and full rest.
The diet plan already varies intake by kind of day (carbohydrates move with
training; protein, fat and fibre stay stable), so one set of targets makes
the day view wrong on most days. The kinds of day are themselves unstable:
the programme has changed twice in a month. How targets relate to days is a
data-model decision, expensive to reverse once days are recorded against it.
The ADR-0007 problem appears again: if a day only points at "the gym
profile", editing that profile rewrites every past gym day's comparison.

## Options considered

### A. A fixed set of kinds in code (gym, run, rest), targets per kind
- Pros: simplest model and UI; kinds can be referred to in code.
- Cons: every new kind ("gym + run", "refeed", "holiday") is a code change
  and a migration. The programme already changed twice; this option bets
  that it won't again.

### B. User-defined profiles; each day follows one, with a copy of its targets
- Pros: new kinds are data, created from the UI. A day's targets are frozen
  like logged food (ADR-0007), so past days never change. Costs one table
  more than A.
- Cons: an extra screen to manage; deleting a profile needs a rule (days keep
  their copy; the default can't be deleted).

### C. Kind derived from a training cycle (start date + repeating pattern)
- Pros: no daily click.
- Cons: needs the training module, which doesn't exist (ADR-0005 is still
  deferred); a skipped session shifts the cycle and the app is wrong until
  corrected by hand.

## Decision

**Option B now; C later, built on top of B.** A cycle, when it comes, only
chooses a profile for a day, so it needs B underneath anyway.

Mechanics:

- `day_profiles`: name and eight nullable targets per user. At most one
  default per user, enforced by a partial unique index, not by code. The
  first profile created becomes the default; the default can't be deleted
  (another must become default first).
- `day_plans`: one row per (user, day) holding the chosen profile's name and
  a copy of its targets; `profile_id` is a link only (set null on delete).
- A day's targets: its plan if it has one ("fixed"); else the default
  profile, live ("default"); else none. The first food logged on a day
  fixes the day to the default. Choosing a profile for a day (again) copies
  its current targets: the one deliberate way to apply an edited profile to
  a fixed day.
- Migration path is additive-first (ADR-0004): 0001 adds the tables, 0002
  copies each user's old targets into a default "Standard" profile, the app
  stops reading `user_settings.target_*`, and a later migration drops them.

Decisive reasons:

1. The kinds of day already changed twice; making them data is the only
   option where the next change costs nothing.
2. The same invariant as ADR-0007: a past day must not change because a
   definition changed. A copy gives that by construction.
3. It keeps C open without building it now.

**Tripwires — revisit this ADR if:** (i) choosing a profile every day
becomes a chore, which is the cue to build C on top; (ii) profiles need
per-meal targets, not only daily ones; (iii) re-choosing a profile to
refresh a fixed day turns out to be surprising in practice.

## Consequences

Now easier: a new kind of day is a form; each day's comparison is stable
history; exports carry profiles and day plans (export format version 2).

Now harder: targets have two homes to reason about (profile vs. day copy),
explained on the day page; `user_settings` carries eight dead columns until
the drop migration; a day without food and without a choice follows the
default live, which is intended but must stay visible in the UI.

Follow-up work: the migration dropping `user_settings.target_*`; option C
with the training module (ADR-0005).

## What I learned

Not written yet: this section is the developer's own.
