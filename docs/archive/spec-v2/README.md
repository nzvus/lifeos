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
| [find.md](find.md) | search, ranking, sorts, filters, groups and periods: v1's rules plus typos, aliases, quantities, barcodes, the reason on the row; the Find part and its checks |
| [content.md](content.md) | words, formats and states: the one formatter, the glossary and microcopy, the judgement scale and status colours, provenance, empty/loading/error/undo/confirm, the content audit |
| [flows.md](flows.md) | the places, every object's create/see/edit/delete and what it sets off, the event chains, every v1 screen → its v2 place |
| [kit.md](kit.md) | the shared parts every screen is built from: registry, `kit.css`, Box (with the time rail), Skyline, Nutrients; which screen uses which |
| [icons.md](icons.md) | the icon system: places › domains › kinds › items, the resolver, marks and tags, food groups and dishes, sizes and the text beside them, header and backdrop |
| [method.md](method.md) | how v2 is built from 2026-10-23: a dossier per domain (research, data audit, model, acceptance tests), reviewed, then slices |
| [shapes.md](shapes.md) | the shape system: seven levels from page to mark, concentric corners, the space/corner/type scales, domain silhouettes, one role per button, choice, tab and bar, field states, the audit |
| [interaction.md](interaction.md) | the nine principles (ADR-0058) and the patterns that keep them: the object page, edit in place, removing, the action vocabulary, lists, decisions first, the map, the checks |
| [design-register.md](design-register.md) | the redesign's register: every design decision already taken (principles, the system, components, dossier behaviour, the developer's choices and notes, themes and density), where it was decided, whether v2 has it, how it stays; boards and PRs cite its rows |

Design (claude.ai artifacts, private to the developer):
- design system "lifeos" (tokens, type, fonts from `src/design/`): https://claude.ai/artifact/G56wCe8VdGjWpyi4oTML2D
- boards "lifeos v2" (V-01 day, V-02 capture, V-03 entry, V-04 food composer,
  V-05 gym auto mode, V-06 Andamento and trackers, V-08 day template, V-09 goals),
  drawn on the developer's data of 2026-10-15: https://claude.ai/artifact/Q2fD1qXBKgMJ2N9BuTgHbZ
