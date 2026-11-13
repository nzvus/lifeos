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

- **W-05** The user, 13 Nov, on the map of places (https://claude.ai/artifact/6Sv5TmBwiEGC3fhmwA2HK1):
  «no, preferisco 1 per azione, ma magari fatto meglio. per varie ragioni: è piu espandibile, inoltre
  il + centrale si puo togliere, oggi va al centro, e magari mettiamo 2 pagine per lato, solo che non
  so se mi sta bene che siano quelle Piano, Andamento e Elenco (oltretutto ce ne vorrebbe un'altra)…
  molte aree hanno azioni, quindi ha senso… invece delle aree (colonne) mettere le azioni (righe)… e
  portando oggi nelle azioni… di sicuro una deve gestire le funzionalità di aggiunta di elementi come
  cibi, o esercizi o sessioni, non so se mostrare anche elenchi dei obiettivi e piani… di sicuro una
  possiamo dedicarla a solo gli andamenti con tanti grafici e tutto il resto… una sicuramente anche
  alla pianificazione e gestione del calendario, la quale costruzione pero ovviamente deve tenere
  conto anche degli obiettivi e degli andamenti… probabilmente va rivisto tutto. senti, tu hai adesso
  una buona idea di cosa voglio, se volessi ripensare tutto da capo come progetteresti il tutto?»
  → the bar by action, Oggi in the middle, no central ⊕, two places a side, the area as a filter.
  Supersedes ADR-0059's bar by area when the ADR is written; Claude's proposal for the five places
  is in the chat of 13 Nov, his pick pending.
- **W-04** The user, 13 Nov, 19 comments on the three target-design pages (verbatim in
  `LIFEOS/review/2026-11-13/comments-2026-11-13.md`; feature map of 543 rows beside it). The line that
  sets the task: «tu adesso hai tutto il contesto necessario per provare a ricostruire tutto, sempre
  partendo da questa base, ma essendo che molte funzionalità sono implementate male a livello ui e non
  solo, devi capire come farle». Re-ordering is not enough: he wants each screen rethought. His points:
  gym «rethink all this page completely» (timer always in view; warm-up proposed «in a conscious way»,
  not on every exercise; «sides» instead of «per manubrio»; a done set re-stacks the order; progress,
  rest, other days and energy feed the advice) · composer (ingredient card «badly done and excessive»;
  «Pasto» automatic unless he picks; a planned meal has a time and a flag «overwrite or not» when done;
  how to choose a meal's variants) · Oggi (more levels, «all informations … and even more»; many goals,
  not one; the four tabs on every area are «ridondanti … molto confusionario»; the dock customisable;
  the header interactive with the weather; a future day must plan that day, also intakes; scores
  missing on some meals; skylines not drawn on the phone). Becomes the proposal of the refactor change.
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
