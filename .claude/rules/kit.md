---
paths:
  - "packages/kit/**"
---

# Kit pieces (PRD-18, PAT-94)

- One piece realises one pattern of `docs/spec/patterns.md`; its test cites the pattern ID
  (`describe("Toast (PAT-74)")`), or `check.py` keeps the requirement unbuilt (PRD-42).
- Every piece has an entry in the `/kit` gallery (`src/app/(app)/kit`), dark, with the
  states that matter (empty, long text, 320 px); the gallery is photographed in CI (PAT-94).
- Tokens only (`packages/kit/styles`): no inline `style`, no hex in a component (PAT-80, VIS-).
  Targets ≥ 44 px except the named exceptions of PRD-12.
- The kit knows no type: it takes labels, values and callbacks; a type's words come from the
  caller's catalogue (PAT-81). No client constants imported into server pages, no inline
  functions passed to client components from a server page (memory «client component props»).
