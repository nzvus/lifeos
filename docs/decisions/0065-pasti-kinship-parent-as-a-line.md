# ADR-0065: A pasto's parent is one of its lines, times a multiplier; kinship is found, never deleted

**Status:** accepted (the user, 21 Nov: «yc» on option a, proposal §157)
**Date:** 2026-11-21

## Context
On 21 Nov (§157) the user designed kinship between pasti salvati in the Elenco. A parent is
another pasto this one contains, with a multiplier written before its name. A pasto may have
several parents. A change to a parent reaches every child. Links are found automatically when the
exact foods exist in the same proportions. Nothing is deleted. «+ figlio» makes a copy.

ADR-0060 has variants: one base per pasto through `parentId`, and the variant stores only its
differences. In his data (local copy of his 10 Nov export) there are 25 pasti and 8 variants.
6 variants are their base × 1 plus extra foods. 2 change a quantity of their base. A detector
over all pairs finds 7 links: those 6, and one new one («GELATO proteico cioccolato e nocciola 2»
contains «Gelato Proteico» × 1). One pasto already holds another pasto as a line, and
`recipeChoices` drops that line today, because it keeps only foods.

## Options considered
### A. The parent is a line of the child: `catalog_parts.part_item_id` = the parent pasto, `quantity` = the multiplier
- Pros:
  - no migration: a part may already be any catalog item;
  - several parents for free;
  - a change to the parent reaches the child by construction (the child points, it does not
    copy);
  - the multiplier is a quantity he can step like any other.
- Cons:
  - every reader of a pasto's foods must expand parent lines, recursively and loop-safe;
  - the 6 variants must be rewritten into this form (a data job).
### B. Everything stays flat; kinship is computed only for display
- Pros: nothing to store; nothing to rewrite.
- Cons:
  - «a change reaches the children» means rewriting the children's foods;
  - after any edit to a child, nobody can tell which lines came from the parent.
### C. Keep ADR-0060's variant (one `parentId`, differences)
- Pros: built.
- Cons: one parent only; no multiplier; not what he asked for.

## Decision
**A** (his «yc», 21 Nov).
- Expansion: a parent line counts as its parent's foods × the multiplier, at any depth up to
  three, never in a loop. This is one function in `core/catalog/family.ts`, which every reader
  uses.
- Detection: pasto P is a parent of C when every food of P is in C, in the same unit, at
  P's quantity × one common k (within 2 %). Of the candidates, only the largest ones are kept: a
  parent of a parent is not a parent too. A found link that is not stored yet is turned into a
  parent line, once. The foods stay identical, and each rewrite is logged with its undo.
- Nothing is removed by hand: kinship follows from the foods (his «non ha senso eliminare
  genitori o figli»).
- A voce already logged never changes (ADR-0007); only catalog pasti follow their parent.

**Tripwire:** a child that needs a parent with one of its quantities changed. Today 2 variants
do this. They stay as ADR-0060 variants until he says otherwise (an open question in §158).

## Consequences
- Engine: `expandParts` (parent lines → foods) and `kinship` (detected parents with k) in
  `core/catalog/family.ts`. `resolvedParts`, `recipeChoices` and the composer read the expansion.
- Data: a one-time rewrite of the 6 variants plus 1 new pair into parent lines. It is a
  human-triggered job (ADR-0003/0004) that dumps first. The day's totals are checked equal before
  and after.
- Screens (PAT-30 level 1, the pasto's Box): two sideways rows, «Genitori» and «Figli», each
  headed by its icon and colour. A parent reads «× k · name» and k is stepped in place. A «+» at
  each row's end opens a search inline. Names in a kin chip are cut by the chip's width.
- ADR-0060's variant (`parentId` within the recipe catalog) is kept only for the two pasti above
  and gets no new uses: «+ Variante» becomes «+ figlio».

## What I learned
<to be written by the user>
