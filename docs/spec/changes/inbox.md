# Inbox — his words and open questions not yet in a change (PRD-43)

Every request, opinion or choice of the user goes here at once, in his words, with date and
source, unless a change is open (then into its `proposal.md`). Items: **W-nn** = his words to
turn into a change; **Q-nn** = a question only he can settle (never pick silently). When an item
moves into a change or is answered, delete it here (git keeps the history). The SessionStart
hook prints the open items.
A request Claude would do another way stays here with **«proposed differently: …»** and the
reason, never silently changed. Every «decided by Claude» note says how to undo it.

## Open
Source of Q-19…Q-23: the outside review of 11 Nov, `docs/archive/review-fable-2026-11.md`
(asked by him: «le domande che dovrei decidere io… da mettere in inbox.md»).
- **Q-19** Restore (DT-34): the v2 dump was never restored, the backup key has one copy, his
  6 Nov export does not load back. (a) drill + second key copy before the next «migrate v2»,
  loader fix next — recommended, ~1 h of his time; (b) after the Piano change closes;
  (c) accept the risk and write it in DT-34.
- **Q-20** What comes after the Piano: 1 previsto voce and 0 blocchi in his data, 2 money
  movements ever. (a) a week of use only, the next change from what slowed his daily log —
  recommended; (b) money/pantry as in ROADMAP; (c) pantry only («In casa», FD-81), no money.
- **Q-21** Review and learning: PRs of 4–8 thousand lines merge in under an hour, migrations
  run from the PR branch. (a) he reads each migration's SQL before running it and explains one
  diff a week — recommended; (b) keep today's way and take «LEARN» out of CLAUDE.md's role;
  (c) back to reviewing every PR, smaller PRs.
- **Q-22** Process diet: 288 IDs, 64 ADRs, 45 memories, rules that contradict each other
  (review §1.5). (a) remove the expired phase rules and the memories CLAUDE.md repeats, ADRs
  only for expensive-to-reverse picks, say which of «small steps» and «few PRs» wins —
  recommended; (b) (a) and `untested.txt` stops being a gate; (c) leave it.
- **Q-23** The old Piano tables (`templates`, `template_blocks`, `week_layouts`,
  `cycles_state`) still hold rows and are still read. (a) retire reads, then drop them after
  Q-18 and a verified export — recommended; (b) retire the reads, keep the tables as history;
  (c) leave both until money/pantry.
- **W-01** One name per idea in every repo (12 Nov, his words: «I do not like that the same thing is
  called differently elsewhere»; the list is `~/Projects/fleet/GLOSSARY.md`). Done outside the spec on
  branch fleet/2026-11-12. Left for the next change, since one is open (PRD-41): «decided by Claude»
  in `domains/plan.md` (3 places; was the agent's wording) and «Claude» in `patterns.md` PAT-91 (was the same).

## Notes folded (his raw notes outside the repo; `check.py` warns when one changes)
- considerations.txt 80c476d19294 — folded 30 Oct (file of 15 Oct)
- considerations2 0fed8b127b3f — folded 30 Oct (file of 22 Oct)
