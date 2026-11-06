# ADR-0061: One horizontal spec (product, model, patterns) and a type registry drive every screen

**Status:** accepted (6 Nov 2026, «Approvo, procedi»)
**Date:** 2026-11-06

## Context
Audit of 6 Nov (`docs/spec/audit-2026-11/`): one decision written in 3–9 places, ~102 of 369
ledger lines only partly built, 5 of 10 sampled «decided» lines absent from the code; 17 bespoke
forms against 1 generic, 11 archive/delete actions, 4 undo toasts, 5 search fields, NavBar copied
in 17 pages. v2 was planned per domain (dossiers) and per screen (UI-70…102), so every common
verb was re-implemented per type, and remarks were fixed one screen at a time. The developer:
«l'astrazione delle feature non è attuata… come ci assicuriamo che… non abbiamo di nuovo lo stesso
problema?» (PROD-36, PROD-38), and «astrazione è la chiave» (PROD-42). Ledger: PROD-35…43.

## Options considered
### A. Keep the per-domain dossiers, add a pattern chapter
- Pros: no rewrite of the docs; dossiers keep their research.
- Cons: the vertical axis stays primary; patterns stay prose; the ledger, dossiers and spec v2
  keep duplicating each other.
### B. One horizontal spec + domain rules + change deltas, enforced by a type registry in code
- `docs/spec/product.md` (principles, words, not-now, process), `model.md` (every type once,
  horizontal engines), `patterns.md` (every verb and shape once, each with its kit piece and
  check), `domains/*.md` (formulas only), `changes/YYYY-MM-DD-name/` (proposal, delta, tasks) merged
  then archived. In code: a registry (extends `core/kinds` to catalog types), one verb layer in
  `core/verbs`, generic kit pieces, lint and tests that fail on ad-hoc copies.
- Pros: each rule in one place; a new type is a registry entry; drift fails CI.
- Cons: a phase 3 of infrastructure before visible features; the migration of v2 types one by one.
### C. An external toolkit (GitHub Spec Kit, OpenSpec CLI)
- Pros: a known workflow.
- Cons: Spec Kit writes per-feature documents (the sprawl again); OpenSpec is young and adds a
  dependency; neither builds the registry or the guards.

## Decision
**B**, the developer's pick on 6 Nov («Stile OpenSpec nel repo», «Migrare v2»). The two decisive
reasons: the failure was horizontal (common verbs), so the spec and the code need a horizontal
spine; and only checks that fail stop drift. Tripwire: if after phase 4's first two types a new
type still needs its own page or verb, the registry shape is wrong and this ADR is reopened.

## Consequences
- Supersedes, as source of truth, `docs/spec/v2/*`, the dossiers' decided parts, and ADR-0058's
  pattern list (kept as history); ADR-0054's model section is replaced by `model.md` §4.
- Phase 2b: `domains/*.md`, ledger lines folded in as sources, ledger and spec v1/v2 archived.
- Phase 3: registry, `core/verbs`, kit pieces marked ✗ in `patterns.md`, lint, glossary test,
  jscpd, requirement-ID tests, Playwright shots, Claude Code hooks.
- Phase 4: types moved one at a time; each PR counts pages, implementations and lines removed.

## What I learned
<to be written by the developer>
