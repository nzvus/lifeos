---
paths:
  - "apps/v2/src/app/**"
  - "apps/v2/src/features/**"
---

# Screens are compositions (PRD-18, PAT-90)

- A screen composes kit pieces (`@lifeos/kit`, list in `docs/spec/patterns.md`); a shape used a
  third time becomes a kit piece (PRD-53), never a third copy. jscpd in `npm run lint` counts.
- Never in `features/` or `app/`: `<input type="search">` (use `Find`, PAT-41), a raw `<form>`
  (`ObjectForm`/`Composer`, PAT-61/62), `window.confirm` (`Confirm`, PAT-73), a hand-made toast
  (`Toast`, PAT-74), an `<svg>` chart (`Chart`, PAT-53), inline `style` (tokens, PAT-80).
- No comparison with a type key (`kind === "meal"`): read the registry (MOD-02). The
  specialisation folders (`core/food`, `core/training`, `core/money`, `core/engines`) are
  the only exception.
- Verbs (archive, delete, merge, start from…) go through `core/verbs` (PAT-24), not a new
  per-feature server action. NavBar and ⊕ live in `(app)/layout.tsx` only (PAT-01).
- UI strings come from `apps/v2/src/i18n/<area>.ts`, words from `product.md` §3 (PAT-81).
- `lint-baseline.json` may only shrink: fix the file you touch, never add to the baseline.
- Before the PR: the `verify` skill (photos 390/360/320 dark, ui-check).
