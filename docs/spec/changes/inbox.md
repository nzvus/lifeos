# Inbox — his words and open questions not yet in a change (PRD-43)

Every request, opinion or choice of the developer goes here at once, in his words, with date and
source, unless a change is open (then into its `proposal.md`). Items: **W-nn** = his words to
turn into a change; **Q-nn** = a question only he can settle (never pick silently). When an item
moves into a change or is answered, delete it here (git keeps the history). The SessionStart
hook prints the open items.

## Open
- **Q-01** Gym running mode without the NavBar (TRAIN-10) vs PAT-01 (the layout always holds it). [fold-training note 1, 6 Nov]
- **Q-02** Reference weight for food targets and fasce: trend weight W (FD-22, decided by the agent; the code's fasce read the 7-day mean of weigh-ins). [fold-food, 6 Nov]
- **Q-03** Meal ratings, free tags, food origin, fibre tolerance (FOOD-11/14/24): marked «not now (PRD-02)», no x answer covers them. [fold-food, 6 Nov]
- **Q-04** Levels of expansion: PRD-19 says two at most; weather and the week strip have three (UI-76, UI-80 «più gradi di espandibilità»). [fold-ui-prod, 6 Nov]
- **Q-05** 44 px: UI-89 (agent) allows 36 px controls inside a 44 px row and 36 × 46 calendar cells at 320 px; PRD-12 says never under 44. [fold-ui-prod, 6 Nov]
- **Q-06** UI strings: one catalogue (i18n) or inline under the glossary test (DT-61 / DATA-16). Needed for phase 3's glossary check. [fold-plan-data, 6 Nov]
- **Q-07** Full offline logging at the gym (UI-72): «not now»? Only saved instants and resume survive (PAT-63). [fold-ui-prod, 6 Nov]
- **Q-08** Decided by the agent inside the approved spec, to confirm or overturn: TR-20/24 «same position» = first exercise vs not first; TR-23 records from an exercise's 3rd session; TR-50 the voto's progression compares with the comparable set; BD-40 no 3,000-step baseline and no > 30 % disagreement check; PL-30 a ciclo step can hold several blocchi (the coffee 30 min before the scheda); PL-40 a day's previsti are written when it is first opened as today; PL-50 proposals at ≥ 50 % of days over 28 days and ≥ 8 times; PL-52 offer to remove a blocco skipped ≥ 75 % over 4 weeks; VIS assumed values carry «da confermare», swipe-to-trash stays as a shortcut, density frozen with the themes; PROD-10's project/place/person/book catalogs dropped (no data). [fold-*, 6 Nov]

## Notes folded (his raw notes outside the repo; `check.py` warns when one changes)
- considerations.txt 80c476d19294 — folded 30 Oct (file of 15 Oct)
- considerations2 0fed8b127b3f — folded 30 Oct (file of 22 Oct)
