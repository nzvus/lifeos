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

## Decided by the agent (details inside the approved spec, PRD-51)
- Lint baseline = ESLint's own bulk suppressions (`--suppressions-location lint-baseline.json`):
  a file may not grow a rule's count, and a fixed breach must leave the file (unpruned → fail).
- jscpd and the glossary test also fail when their count drops without the baseline lowered,
  so a removed copy cannot come back. jscpd runs inside `npm run lint` (CI's static job), as no
  workflow file changes here (the agent's token cannot push `.github/workflows/`).
- «Built» for `check.py`: a block with «Today: built», or in `patterns.md` a kit ✓ with no ✗.
  141 IDs had no citing test on 6 Nov (`untested.txt`): tests citing ledger IDs (FOOD-, UI-)
  do not count.
- Glossary: «record» as a personal best stays (MOD-50 uses it); the «Not» means a voce called
  record. A «Not» word with a qualifier («allenamento (as object)») is left to review.
  Catalogues: `apps/v2/src/i18n/common.ts` now (verbs and states), one per area as its types
  move in phase 4; the kit's own words in `packages/kit/src/words.ts`.
- Registry: the assunzione catalog type is keyed `intake_item` (stored as a food with the
  `intake` flag), so no catalog type shares a key with a voce kind (`intake`).
- `core/verbs`: each result carries its undo as the inverse verb (archive ↔ restore,
  create/startFrom/variant/saveAs → delete, edit → previous values, trash ↔ restore); merge
  answers `undo: null` and is confirmed first (PAT-73). «Elimina» on an object is a soft delete
  (`deletedAt`), so it can be undone too. Trackers (`kinds` rows): archive/restore only until
  phase 4; specialised values (nutrients, sets) are not edited through `edit`.
- Kit pieces: each is a pure module (tested in node) plus its component (markup tested with
  `renderToStaticMarkup`); no DOM test library added. Sheets render in a portal on `<body>`
  after the mount (a «Perché?» inside a paragraph broke hydration on 6 Nov). Find forgives one
  typo from four letters on («cafe» finds «Caffè»). The gallery opens a sheet with
  `/kit?aperto=altro|conferma|perche|toast`; the ObjectPage is at `/kit/oggetto`.
- Layout (PAT-01): `(app)/layout.tsx` mounts the NavBar and ⊕ through `features/shell/nav.ts`
  on exactly the addresses that had them on 6 Nov; the 17 pages no longer mount them. Checked
  pixel by pixel: 17 pages at 390 and 320 px are identical before and after.

## Open questions (his call, asked at the stop)
- **Q-guards-1** PAT-01 says every page has the NavBar and ⊕ except a running gym session.
  On 6 Nov 29 sub-pages had none (object pages, forms, ⊕'s sheets, Profilo), and on the 7
  forms with a sticky «Salva» (PAT-14) ⊕ would sit on top of it. Options: (a) the bar on every
  page, ⊕ hidden while composing (a «Salva» on screen); (b) the bar on every page, the sticky
  «Salva» above ⊕; (c) sub-pages stay without the bar (PAT-01 says «the area pages»). The
  agent's pick: (a). Until he answers the layout keeps the 6 Nov set (`nav.ts`).
