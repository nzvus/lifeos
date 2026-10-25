# ADR-0058: v2 screens are composed from nine interaction principles and the kit patterns that keep them

**Status:** accepted
**Date:** 2026-10-25

## Context
Using v2 every day, the developer found it uncomfortable everywhere:
editing, adding, understanding. They asked for a deep study of what is
systemic. The study (https://claude.ai/artifact/Fjd7fC38yDZbC1BCSWwd9x)
measured 30 real tasks on the app with the developer's data (16.6 food
entries a day, 71 % from a saved meal):
- 10 tasks could not be done at all;
- 15 had a hard step;
- 44 % of tap targets were under 44 px;
- daily tasks needed about 1,800 px of scroll;
- «aggiungi» took 11 forms.

The causes were common to all screens: each slice assembled its own page
from the parts it had, and the kit had no patterns for an object page, a
list, an in-place edit, a removal with undo, or an action hierarchy.

## Options considered
### A. Principles P1–P9 plus kit patterns, then redesign the flows
- Pros: fixes the causes; every screen gets the same behaviour; a script
  can check the rules, so they don't drift again.
- Cons: many screens get rebuilt; weeks of work before the app feels
  better in every corner.
### B. Fix each defect where it is
- Pros: quick, visible progress.
- Cons: the 52 audit defects were symptoms. Without shared patterns the
  next slices bring the same problems back.
### C. Adopt an external component library (Radix/shadcn) for behaviour
- Pros: accessible menus, sheets and toasts for free.
- Cons: it brings behaviour, not our object model or order of decisions.
  It is a second visual system next to the boards' kit, and a large
  dependency for a small app.

## Decision
A. The developer confirmed the nine principles on 2026-10-25 and allowed
a redesign where the study shows one is needed. The patterns live in
`docs/spec/v2/interaction.md` and in the kit. Each redesigned flow is drawn
as a board and approved before its code.

Tripwire: if a redesigned flow does not beat today's numbers on its tasks
(taps, scroll, dead ends), the flow is redrawn before it ships. If the
kit's own sheet, menu and toast cost more than a week of accessibility
fixes, revisit C for those three parts only.

## Consequences
- New kit parts:
  - `ObjectPage`, `Section`, `ValueRow`, `List`, `Find`;
  - `ActionRow`, `Toast` with Undo, `MoreSheet`.
- `Box` opens or follows its link from its whole surface.
- Every catalog object gets the full matrix:
  - create, read, edit in place, duplicate;
  - archive, delete when unused, restore.
  This needs the core functions that are missing (catalog delete and
  restore; routine create and edit; exercise, route and goal edit).
- Cycles get days with several sessions and a shift. That is a schema
  change, decided in its own dossier and ADR.
- A UI check script runs on UI PRs and keeps the study's task numbers
  from getting worse.
- Separate «Modifica» pages and the row's lone «›» link are retired.

## What I learned
