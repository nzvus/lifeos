# Inbox — his words and open questions not yet in a change (PRD-43)

Every request, opinion or choice of the user goes here at once, in his words, with date and
source, unless a change is open (then into its `proposal.md`). Items: **W-nn** = his words to
turn into a change; **Q-nn** = a question only he can settle (never pick silently). When an item
moves into a change or is answered, delete it here (git keeps the history). The SessionStart
hook prints the open items.
A request Claude would do another way stays here with **«proposed differently: …»** and the
reason, never silently changed. Every «decided by Claude» note says how to undo it.

## Open
(Q-19…Q-24 answered 12 Nov by «ap yc», every recommendation taken: Q-19 → DT-34, Q-20 →
ROADMAP «Now», Q-21 → CLAUDE.md «Working agreements», Q-22 → CLAUDE.md rules 1 and 3 and done, Q-23/Q-24 →
`changes/2026-11-07-piano/proposal.md`.)

- **W-03** The user, 12 Nov: «you did not follow what was my original purposes, also, it is still
  redundunt and confusing, and messy, and slow». He wants a full, deep review (design, code, UI,
  process) and a refactor by Fable. The prompt is
  `LIFEOS/review/fable-refactor-prompt.md`: purpose first, then review, then options. He picks.
- **W-02** The user, 12 Nov: «lets skip q20». Q-20 (a) (a week of use only) is dropped; the next
  change is money/pantry as ROADMAP «Now» had it (Q-20 (b)). Goes into that change's proposal.
- **Q-25** Drop the old Piano tables (`templates`, `template_blocks`, `week_layouts`,
  `cycles_state`; Q-23 (a)'s second half). Since 12 Nov nothing in the app reads them; only the
  export, loading old files and merge still touch them, to keep their rows. Migration 0010 ran
  and the backup restores (drill of 12 Nov). (a) a migration that drops them after your next
  export, the export and loading code losing those tables too — recommended (it is a delete:
  outside «yc», so your answer); (b) keep them as history; (c) decide after the week of use.
- **W-01** One name per idea in every repo (12 Nov, his words: «I do not like that the same thing is
  called differently elsewhere»; the list is `~/Projects/fleet/GLOSSARY.md`). Done outside the spec on
  branch fleet/2026-11-12. Left for the next change, since one is open (PRD-41): «decided by Claude»
  in `domains/plan.md` (3 places; was the agent's wording) and «Claude» in `patterns.md` PAT-91 (was the same).

## Notes folded (his raw notes outside the repo; `check.py` warns when one changes)
- considerations.txt 80c476d19294 — folded 30 Oct (file of 15 Oct)
- considerations2 0fed8b127b3f — folded 30 Oct (file of 22 Oct)
