# Change 2026-11-06-guards — phase 3: the guards and the generic pieces

**Why.** The developer, 6 Nov: «come ci assicuriamo che ricostruendo tutto pezzo per pezzo non
abbiamo di nuovo lo stesso problema da capo? Perché così è successo con v2» (PROD-38), and on
the rule of three: «va abbinato un sistema automatico che rileva il riutilizzo di snippet di
codice, o no?» (PROD-43). The audit (`audit-2026-11/README.md` §2) counts the copies this change
makes impossible to add: 17 bespoke forms, 11 archive/delete actions, 4 undo toasts, 5 search
fields, NavBar in 17 pages, ~114 type-key comparisons.

**What.** Build the checks of `patterns.md` §9 so they FAIL a PR, and the generic pieces marked
✗ in `patterns.md`, without migrating any type yet (that is phase 4, one change per type).
Existing copies are listed in a baseline that may only shrink.

**Not in this change.** Moving any type onto the registry; deleting bespoke pages; v1 retirement
(start of phase 4); the Piano data change (`plan_rules`, Rec → Obiettivi).

**Stop.** At the end the agent stops for his review (PROD-39), with photos of the kit gallery
showing every new piece at 390/320 px, dark.
