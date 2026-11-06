# Change 2026-11-06-kit-patterns — the patterns still missing in the kit (phase 4, step 1)

**Why.** Phase 4 of the cleanup plan (approved 6 Nov): «i pattern nel kit → il tipo più
semplice (abitudine/tracker) → cibo e pasto → esercizio e scheda → Piano → soldi/dispensa».
His words of 6 Nov behind it: «l'astrazione delle feature non è attuata… come ci assicuriamo che
ricostruendo non abbiamo di nuovo lo stesso problema?» (PROD-35…39). After phase 3, `patterns.md`
still marks these pieces ✗; every type change after this one needs them. His OK to start
phase 4: 6 Nov, «continua».

**What.** Each piece built once, in `packages/kit` or `core/` as `patterns.md` says, with its
entry in the `/kit` gallery, its photos (PAT-94) and a test citing its ID. No screen moves
yet: each type change moves its screens onto them and deletes the bespoke ones.
1. **PAT-04** one family route `src/app/(app)/[area]/[type]/[id]` reading the registry
   (`core/kinds/catalog.ts`); `nuovo` is the create address (PAT-11). A type not yet moved
   keeps its page, reached through this route; the 15 per-type folders go as each type moves.
2. **PAT-13** edit in place: a value on an ObjectPage becomes editable on tap, leaving saves
   through `act(… "edit" …)`, toast «Salvato · Annulla» (PAT-21, PAT-74).
3. **PAT-18** `MergeSheet`: pick the other, preview what moves, confirm (PAT-73), `act merge`.
4. **PAT-19 + PAT-43** Elenco of an area: its types as `List` sections, an «Archiviati» filter
   chip that restores, the «Possibili doppioni» hint from the one detector.
5. **PAT-14 + PAT-62** generic `Composer` (search + lines + totals + sticky «Salva»), from
   today's food composer, for any type with `lines` in the registry.
6. **PAT-10 + PAT-60** `Capture`: ⊕ opens one `Find` over every type and object (PAT-41).
7. **PAT-33** the context line under an open voce (MOD-53), one component.
8. **PAT-52** one judgement chip (`F.judge`) and one fascia bar; the copies listed.

**Decided by the agent** (inside the spec, cheap to reverse): PAT-63 Timer and its offline
queue go to the change «esercizio e scheda», where the gym clock it replaces lives; this
change's slices follow the list above, each pushed when green.

**Not in this change.** Moving any screen (the type changes do it); new patterns or words.

**Stop.** (a) Now, for his OK. (b) A detail the spec leaves open that is a new pattern or
word → written here as a question, the rest goes on. (c) At the end: the PR, photos of each
new piece at 390/320 dark.
