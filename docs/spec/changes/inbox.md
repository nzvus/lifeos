# Inbox — his words and open questions not yet in a change (PRD-43)

Every request, opinion or choice of the developer goes here at once, in his words, with date and
source, unless a change is open (then into its `proposal.md`). Items: **W-nn** = his words to
turn into a change; **Q-nn** = a question only he can settle (never pick silently). When an item
moves into a change or is answered, delete it here (git keeps the history). The SessionStart
hook prints the open items.

## Open
- **Q-09** (change 2026-11-06-guards, 6 Nov) PAT-01 says every page has the NavBar and ⊕ except a
  running gym session; on 6 Nov 29 sub-pages had none (object pages, forms, ⊕'s sheets,
  Profilo), and on the 7 forms with a sticky «Salva» (PAT-14) ⊕ would sit on it. (a) the bar on
  every page, ⊕ hidden while a «Salva» is on screen; (b) the bar on every page, «Salva» raised
  above ⊕; (c) sub-pages keep no bar. Agent's pick: (a). Until then `features/shell/nav.ts`
  keeps the 6 Nov set.
- **Q-10** (change 2026-11-06-guards, 6 Nov; needs him) The CI job for the kit photos (PAT-94) is
  in `docs/runbooks/ui-audit.md`; the agent cannot push `.github/workflows/`. He runs
  `! gh auth refresh -h github.com -s workflow` (then the agent adds it), or pastes it.

## Notes folded (his raw notes outside the repo; `check.py` warns when one changes)
- considerations.txt 80c476d19294 — folded 30 Oct (file of 15 Oct)
- considerations2 0fed8b127b3f — folded 30 Oct (file of 22 Oct)
