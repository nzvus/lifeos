---
paths:
  - "docs/spec/**"
---

# The spec (ADR-0061, PRD-40…43)

- Three horizontal files (`product`, `model`, `patterns`) + `domains/` (rules, formulas) +
  `visual.md`. A rule lives in one file with its ID; elsewhere it is cited by ID, never copied.
- Outside `changes/` the spec is edited only while a change is open (`change` skill; the hook
  blocks it otherwise). One change open at a time.
- His words go in at once, quoted with the date: in the open change's `proposal.md`, else in
  `changes/inbox.md` (W-nn words, Q-nn questions only he settles).
- «Built» = a test cites the ID (PRD-42); an ID in `docs/spec/untested.txt` is a debt that may
  only shrink. «Today:» lines say what the code does now, with paths.
- `python3 scripts/check.py` after every edit: duplicate IDs, uncited ADRs, incomplete changes.
