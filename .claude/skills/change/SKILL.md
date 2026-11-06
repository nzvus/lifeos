---
name: change
description: Change the lifeos spec through one folder - propose (proposal, delta, tasks), apply (build the slices with tests citing IDs), archive (merge the delta into the spec). Use when a request of the developer changes a pattern, type, word or rule, when he says "change" or "proposta", or when the inbox has an item to turn into work.
---

# Change (PRD-41, PAT-92)

One change open at a time; the spec (`docs/spec/` outside `changes/`) is edited only while one
is open (the `pre-edit` hook blocks it otherwise).

## 1. Propose
1. Read `docs/spec/product.md`, `model.md`, `patterns.md` and the `domains/` file touched.
2. Create `docs/spec/changes/YYYY-MM-DD-name/`:
   - `proposal.md`: **Why** (his words, quoted, with date), **What**, **Not in this change**,
     **Stop** (when the agent stops for his review).
   - `delta.md`: `## ADDED` / `## MODIFIED` / `## REMOVED`, each requirement with its ID
     (new IDs: next free number in its file) written WHEN / THEN; a MODIFIED one is rewritten
     whole, not as a diff.
   - `tasks.md`: numbered slices, each «tests citing IDs, docs touched».
3. Remove the item from `changes/inbox.md` if it came from there. Decide per pattern, never per
   screen (PRD-50): a new pattern, type or word is his call (PRD-51), ask before building.
4. `python3 scripts/check.py`; stop for his OK when the proposal is new.

## 2. Apply
- One branch, one PR for the change (`--base main`); slices in `tasks.md` order, `[x]` when done.
- Every built requirement has a test whose name or comment cites its ID (`PAT-21`); `check.py`
  fails a «built» requirement without one (PRD-42).
- His new words while the change is open go into its `proposal.md` at once (PRD-43).
- UI slices: the `verify` skill before pushing.

## 3. Archive
1. Merge each delta item into its home file (the spec text replaces the old one; «Today:» lines
   updated; ✗ → ✓ in `patterns.md` for built kit pieces).
2. `git mv docs/spec/changes/<id> docs/spec/changes/archive/<id>`.
3. `python3 scripts/check.py` (fails an incomplete change), update the handoff, `retro` skill.
