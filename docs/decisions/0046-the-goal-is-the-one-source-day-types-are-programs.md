# ADR-0046: The goal is the one source of a day's numbers; day types are the day's program; recomposition can have a target

**Status:** accepted (the developer delegated it: "fai tutto quello che ritieni meglio", 2026-10-10, after the audit)
**Date:** 2026-10-10
**Amends:** ADR-0008 and ADR-0014 (what a day type is), ADR-0043, ADR-0045

## Context
After ADR-0043–0045 the developer asked: *"Today still shows the day type.
And shouldn't recomposition let me set the target weight, or at least how
much fat to lose? For now it says 0 deficit. I'm starting to think the
rest is a bit buggy too; maybe it should all be redone from scratch."*

An audit on the developer's data (the 2026-10-09 export, every page on a
phone) found:
- The engine's arithmetic is right. Five display bugs are fixed apart
  (#164).
- The concepts overlap. A goal (Settings) decides energy and macros. But
  a dynamic day type still showed its own goal presets, deficit, protein
  and fat, ignored when a goal exists. Today led with "Day type: Rec ·
  fixed", and the line read "Goal 0.00 % a week".
- Recomposition was always maintenance (ADR-0045): there was no way to say
  "and lose 3 kg of fat".

## Options considered
### A. Keep both, explain better
- Cons: two places still look like they decide the deficit.

### B. The goal decides; a day type becomes the day's program (chosen)
- With a goal, a dynamic type's editor hides its own deficit, protein and
  fat (kept, for days without a goal) and says "Follows your goal".
- On Today, the type picker is "Day program". It is not shown at all with
  a single type, and it has no fixed/default badge. The line names the
  goal: "Recomposition · maintenance", "Lose fat · −0.66 % a week".
- Settings explains day types as programs. A new type starts dynamic when
  a goal exists.
- Pros: one place decides the numbers. No migration: the stored columns
  stay, read only without a goal.
- Cons: day types without a goal still work the old way. Two behaviours
  remain in the code until goals are universal.

### C. Remove day types' targets entirely (a migration), or rewrite from scratch
- Cons: fixed day types still serve days you want to pin by hand. A
  rewrite would throw away the parts the audit found working: logging,
  pantry, training, backups and export.

## Decision
**B**, and recomposition takes an optional target:
- **Lower target:** a slow loss, 0.25–0.5 % of body weight a week (0.35
  without a day). Slow enough to keep building muscle with high protein
  and training.
- **Higher target:** a slow gain, 0.05–0.15 % a week.
- **No target, or within 0.3 kg of it:** maintenance.
- Any direction is accepted. "How much fat to lose" is the target weight:
  your weight minus that.

Tripwire: if the developer still finds the picker confusing with more
than one type, move the program choice into the Plan and drop it from
Today.

## Consequences
- No migration.
- `planGoal` gains the `recompLose` and `recompGain` ranges.
- `goalKind` reads a goal from before ADR-0045 by its rate's sign.
- Backlog: once goals are universal, drop `day_profiles.deficit_kcal`,
  `protein_g_per_kg` and `fat_g_per_kg` with the old `user_settings.target_*`.

## What I learned
