# 07 — The data platform: durability, export/import, packs, trash, auth, assistant

Read from: `core/export/*`, `core/import/*`, `core/catalog/*`,
`core/trash/*`, `core/auth/*`, `core/assistant/*`, `scripts/*`,
`.github/workflows/*` (as described in ARCHITECTURE.md), ADR-0003, 0004,
0006, 0015, 0018, 0019, 0034, 0052.

## 1. What exists and works (keep through any rebuild)

| Capability | How | Status |
|---|---|---|
| Logged data never lost | daily encrypted `pg_dump` outside Neon (age), 30-day artifacts, a drilled restore into an empty DB; migrations only as committed SQL, rehearsed on preview branches, applied to production by a human-triggered job after a backup; healthchecks.io dead-man's switch | ✅ |
| Snapshots | log entries and batches copy what was eaten (ADR-0007); quality copied too | ✅ (ADR-0007 still "proposed") |
| Exact numbers | `numeric` + big.js, money in integer cents, totals computed on read, rounded once | ✅ |
| Isolation | `Owner` brand only from a verified session; `ownedBy()` in every query; composite FKs `(id, user_id)`; cross-user tests per entity | ✅ |
| Trash | `deleted_at` on catalog and log rows; Undo toasts; `/settings/trash` restore / delete for good; purge after 30 days, containers first, restrict FKs respected | ✅ |
| Export | v21: every owned table, trash included, no secrets; coverage test (ADR-0052) | ✅ (#184) |
| Replace | any version, validated whole, dry-run plan, one transaction, new ids, safety copy first; CLI and Settings | ✅ (#184, #185) |
| Packs | hand-written JSON referencing by **name**: exercises, routines, programs, ingredients, meals, estimates; adds only what is missing; a starter for every new account | ✅ |
| Auth | Better Auth, email + password, DB sessions (30 days), rate limits; sign-up closed unless `ALLOW_SIGNUP`, by one-use invitation (hash stored, claimed atomically) | ✅ |
| Assistant | off by default; the user's OpenRouter key encrypted (AES-GCM); tools wrap core with the Owner; writes with Undo, deletes/imports confirm first; a compact context of 14 days + 12 weekly averages | parked ("no AI for now") |
| PWA | installable, pages network-only, static files cached, no user data cached | ✅ |
| i18n | English reference + Italian, the shape type-checked; no user text outside `i18n/` (lint) | ✅ |
| Themes | tokens in `design/`, five themes, light/dark/system, density per device | ✅ |

## 2. Still to build (ADR-0052)

- **B — Merge** a file: natural identity per kind (catalog by name key,
  per-day records by day, weigh-ins by day + time, entries and sessions
  by day + time + name), a dry run with added / already there /
  conflicts; resolvable cases automatic; any unresolvable conflict stops
  it, names each conflict and offers the replace.
- **C — CSV**: a zip with one CSV per table, same rows as the JSON,
  grouped in folders by area (`core/export/areas.ts`).

## 3. Issues found

**P-1 Backups depend on the developer's machine for the key.** The age
private key lives only there (by design); losing that machine loses every
backup. A second copy (a password manager, paper) should be in the
restore runbook.

**P-2 The trash and references.** A trashed meal still referenced by log
entries, or a routine referenced by a program day, is invisible in the
catalog but alive in the data. The v20 export showed 12 entries pointing
at trashed meals and a program day at a trashed routine (ADR-0052
rehearsal). Deleting a routine used by an active program should at least
say so.

**P-3 Packs and exports are two formats.** Packs reference by name, the
export by id. Merge (B) will add natural keys to the export path; packs
could then become "a merge of a partial file" and lose their own
applier (one less code path).

**P-4 ADR-0007 is still "proposed"** after being the basis of every log
since S01.

**P-5 The assistant duplicates the app.** Its tools wrap every action.
It has been off since 2026-10-09, and each new feature must also keep its
tool in step or drop it.

## 4. Proposals

💡 **P-1 Merge (B) and CSV (C)** as ADR-0052 says (the next two PRs).

💡 **P-2 Packs as partial merges** (after B): one importer for packs,
exports and future imports (FitForge, Health Connect, bank CSV), each a
converter into the same file shape.

💡 **P-3 Importers as converters.** Every external source (FitForge,
Health Connect sleep and steps, bank and PayPal statements, receipts)
writes a v21-shaped partial file that goes through the merge's dry run:
one review screen for every import.

💡 **P-4 The assistant stays parked** until the spec is implemented; then
its tools are generated from the same action registry the UI uses, so
they can't drift.

💡 **P-5 Accept ADR-0007**, with the developer's "What I learned".

💡 **P-6 A second copy of the backup key**, written into the restore
runbook.
