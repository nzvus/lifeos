# ADR-0038: Today at the centre of four areas; supplements are food; one density setting

**Status:** accepted (the developer chose the recommended option of each question, 2026-10-04)
**Date:** 2026-10-04
**Supersedes:** ADR-0035 and ADR-0036 in part (the tabs)

## Context
The app grew one slice at a time, and similar things now live in several
places. The developer wants to add:
- a diary and an emotional rating of the day;
- short- and long-term goals, hobbies and habits, time planning;
- gamification: every area scored in ranges (low / good / high), dynamic,
  from personal goals or general wellness guidelines;
- caffeine, energy drinks and creatine, with their estimated levels in the
  body counting in training and progress.

They also want widgets that are icons first, bars that use the full width
without empty rows, and no "overwhelmed" feeling. A phone holds at most
five tabs.

## Options considered
### Navigation
- **A. Four areas around Today:** Body · Food · (Today, a central circle) ·
  Money · Mind. Each area holds its library, its planning and its progress.
  Today sums up every area with its score and what is next.
- **B. Today + the current tabs, with the new things inside Progress.**
  Progress becomes a drawer for everything.
- **C. Today + a grid menu.** One more tap for every area.

### Supplements
- **A. As food:** a "Drinks and supplements" type in the catalog, with
  active compounds per serving. Logged on the day like a meal; a Red Bull's
  kcal and sugars already count.
- **B. A separate log.** The same drink would be entered twice.

### Density
- **A. One global setting** (compact / comfortable), applied through the
  design tokens.
- **B. Per widget.** Many more settings and cases to test.
- **C. Only rework the worst widgets.**

## Decision
A, A, A.
- **Areas.**
  - Body = training (plan, programs, routines, exercises, sessions) +
    weight, sleep, movement and their progress.
  - Food = meals, ingredients, pantry, nutrition trends.
  - Money = as ADR-0036.
  - Mind (new) = diary, mood, goals, habits, hobbies, time planning.
  - Today = the day across the areas: one score ring, per-area scores, the
    timeline of what is next, the "+" for everything.
- **Scores.** Every tracked thing gets a band (floor / good zone / ceiling,
  the shape of ADR-0023) from the user's goal or a general guideline. Day,
  week and month roll-ups. Points and streaks sit on top of the bands, never
  instead of them.
- **Supplements.** Compounds with a pharmacokinetic model:
  - caffeine: half-life ~5 h, so its level falls over the day;
  - creatine: muscle stores saturate in ~3–4 weeks at 3–5 g a day, and fall
    back in ~4 weeks after stopping.

  Sessions show the levels they were done at; trends compare them with
  performance. Estimates, labelled as such.
- **Density.** `data-density` on <html> scales spacing and type tokens.
  Widgets become icon-first with one ⓘ legend per widget; bars always span
  the width.

Tripwires:
- users get lost between Body and Today (→ revisit B);
- one density does not fit the gym screen (→ a per-screen override).

## Consequences
- Order of work (ROADMAP S13):
  1. a map of every page and component, and their unification;
  2. the new navigation and Today's hub;
  3. density and icon-first widgets;
  4. supplements;
  5. Mind (diary, mood, goals, habits, hobbies, time);
  6. scores and gamification.
- Old URLs redirect (as /plan did). Each step ships with its own ADR when it
  adds tables.

Update 2026-10-04 (step 1, the foundations):
- density is a per-device cookie (`data-density`); compact = a 14 px root,
  which scales every rem in every theme;
- lighter chrome: the app header is smaller, tab pages have no visible
  title (the tab and the view switch say it), cards have 1 px frames and
  headings a 2 px rule;
- row actions (⋯, bin) are `ghost` buttons;
- explanations sit behind ui/InfoTip;
- "Day totals" uses the same one-line bars as "The day with the plan".

## What I learned
Not written yet: this section is the developer's own.
