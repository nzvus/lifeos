# Change 2026-11-06-bar-everywhere — the NavBar on every page (Q-09)

**Why.** The guards change moved the NavBar and ⊕ into one `(app)/layout.tsx` but kept them on
the 6 Nov set of pages, because on the 7 forms with a sticky «Salva» (PAT-14) ⊕ would sit on it.
The developer, 6 Nov, answering Q-09: «2 a» — the bar on every page, ⊕ hidden while a «Salva»
is on screen.

**What.** PAT-01 as he picked: every signed-in page shows the NavBar; ⊕ hides while a sticky
«Salva» (a sub-page's foot, an ObjectForm's foot) is on the page; that foot sits above the bar.
A running gym session stays full screen (TRAIN-10). ⊕'s own sheets cover the bar as today.

**Not in this change.** Moving forms onto `ObjectForm` (phase 4).

**Stop.** None: inside his answer. Photos of the changed pages at 390/320 dark in the PR.
