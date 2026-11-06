# Delta — 2026-11-06-bar-everywhere

## MODIFIED
- **PAT-01** One `(app)/layout.tsx` holds NavBar (Corpo · Cibo · Oggi · Mente · Soldi) and ⊕ on
  every page; pages never mount them. WHEN a sticky «Salva» is on the page (PAT-14, PAT-61)
  THEN ⊕ is hidden and the «Salva» sits just above the bar. One exception: a running gym
  session is full screen, left with «Finisci» or «‹ Corpo» (TRAIN-10, his pick 6 Nov).
  [Q-09, his answer 6 Nov «a»]
