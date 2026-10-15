# lifeos v2 — the target

Decided by ADR-0053 (2026-10-15). The v1 spec (`docs/spec/01–08`)
describes the app as it is and why it must change; this folder describes
the app to build. Every v2 slice starts from its page here and its
approved design board.

| File | What it says |
|---|---|
| [concepts.md](concepts.md) | the one model: time, kinds, entries, catalog items, templates, metrics, goals, judgements, decisions; what stays specialised |
| [kinds.md](kinds.md) | every built-in kind by domain, with fields, entry mode, metrics, targets, relations |
| [engines.md](engines.md) | time, metrics, planning, body state, targets, training, judgements, correlations, data quality: inputs, outputs, formulas, sources |
| [schema.md](schema.md) | the v2 tables (hybrid), constraints, what is never stored |
| [migration.md](migration.md) | every v1 table → its v2 place; parity checks before the switch |
| [screens.md](screens.md) | the 15 v2 screens; every v1 screen id → its v2 screen |

Design: the "lifeos v2" Design System and design boards (claude.ai
artifacts; links in the PR and in ROADMAP once approved).
