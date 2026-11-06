---
name: audit
description: Check the lifeos spec against the code - each requirement's «Today» line, built vs untested, copies the guards baseline still lists - and report what drifted, like docs/spec/audit-2026-11. Use when the user says "audit", before closing a phase, or when the spec and the app seem to disagree.
---

# Audit (PAT-92, PRD-42)

Read-only until he answers: the audit reports, it does not fix.

1. Scope: one spec file (`product`, `model`, `patterns`, a `domains/` file) or all of them.
2. For each requirement: read the code its «Today» line names; mark **ok** (code does it, a
   test cites the ID), **untested** (code does it, no test cites the ID), **drift** (code does
   something else: say what, with `file:line`), **missing**.
3. Count the baselines: `apps/v2/lint-baseline.json`
   (violations per rule), `scripts/cpd-baseline.json` (duplicated lines), `docs/spec/untested.txt`
   (IDs). Each may only shrink; compare with the last audit.
4. Write the result as `docs/spec/audit-YYYY-MM/README.md` (a table per file: ID, verdict,
   evidence); the previous audit's report moves to `docs/archive/` (PRD-52: one truth; the
   `fold-*.md` files of `audit-2026-11` stay, the spec cites them). Drifts become inbox
   items (Q-nn) for him, never silent fixes.
5. `python3 scripts/check.py`; report the counts in three lines.
