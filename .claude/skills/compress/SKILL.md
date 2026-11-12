---
name: compress
description: Audit and compress the lifeos docs - remove stale text, deduplicate, bring a doc back under its line budget, check docs against the code. Use when scripts/check.py reports a doc over budget ("run doc compression"), when docs feel bloated or stale, or the user says "compress".
---

# Documentation compression

Goal: most information per line, nothing stale. Every session pays for what it loads.

Budgets now (`scripts/check.py`, CFG `doc_budgets`):
!`python3 scripts/check.py 2>&1 | grep -iE "budget|lines" || echo "all docs within budget"`

1. **Audit:** for each root doc (`CLAUDE.md`, `ARCHITECTURE.md`, `PROJECT.md`, `ROADMAP.md`) and each file in `docs/spec/`, check against the code: stale? said elsewhere already? never linked? Report a short table before changing anything.
2. **Propose, then act** (deleting a whole file needs a yes):
   - A doc over budget → rewrite it to the current state only; rationale that leaked in moves to an ADR or is dropped in favour of the existing one.
   - The same knowledge in two places → one home, a link from the others.
   - Obsolete text → delete (git history is the archive; say so).
   - Spec files change only through an open change folder (PRD-41; the pre-edit guard enforces it): open one with `/change` first.
3. **Never compress ADRs** (`docs/decisions/`) or `docs/archive/`: they are history. A wrong ADR gets a superseding ADR.
4. Run `python3 scripts/check.py` until clean. Finish with one metric: total doc lines before → after, and one sentence on what sessions now load less of.
