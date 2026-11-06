# Delta — 2026-11-06-guards

## MODIFIED
- **PRD-42** «built» means a test cites the requirement ID. `check.py` reads `Today: built` in
  the spec and fails when no test under `apps/v2`, `packages/kit` names the ID, unless the ID is
  in `docs/spec/untested.txt` (the baseline of 6 Nov, which may only shrink).
- **PRD-53** The copy-paste detector is `jscpd` on `apps/v2/src` and `packages/kit/src`, in CI,
  failing when duplication rises above the 6 Nov baseline.
- **PAT-24** `core/verbs`: one server-side function per verb (create, startFrom, variant, edit,
  merge, archive, restore, trash, delete, saveAs, undo) taking (type, id, payload), validated by
  the type's zod schema, through the identity-taking repositories (ADR-0057).
- **MOD-01/02** The registry covers catalog types: `core/kinds` gains `CatalogType` with the
  shape of MOD-01; food, product, format, pasto, assunzione, esercizio, scheda, tragitto,
  tracker, categoria are declared (declaration only; screens move in phase 4).

## ADDED
- **PAT-90** Lint fails a PR on: `<input type="search">`, `<form>` outside the kit's form pieces,
  `window.confirm`, a hand-made toast or `<svg>` chart in `features/` or `app/`, inline `style`,
  a comparison with a type key (`kind === "meal"`, `catalog === "food"`) outside
  `core/{food,training,money,engines}` and the registry. Files that break a rule on 6 Nov are
  listed in `apps/v2/lint-baseline.json`; a listed file may not grow its count.
- **PAT-91** Claude Code guards (`.claude/settings.json`): after an Edit/Write of a `.ts`/`.tsx`
  file, eslint and prettier run on it and their output returns to the agent; before the agent
  stops, `vitest related` runs on the changed files and blocks the stop when it fails; an
  edit under `docs/spec/` (except `changes/`) is blocked unless a change folder is open.
  Path rules in `.claude/rules/` load only when the matching files are touched.
- **PAT-92** Skills: `change` (propose → apply → archive, replaces `dossier`), `verify` (phone
  photos 390/360/320 dark + ui-check), `audit` (spec vs code, like `audit-2026-11`); `adr` and
  `retro` stay; `dossier` and `compress` retire.
- **PAT-93** UI strings: `apps/v2/src/i18n/<area>.ts` catalogues; the glossary test fails on a
  word of product.md §3's «Not» column in any catalogue or inline string.
- **PAT-94** Screenshots in CI: Playwright renders the `/kit` gallery (every kit piece, dark,
  390 and 320 px) and compares with committed images.

## Kit pieces built here (✗ → ✓ in patterns.md when done, each with a test citing its ID)
`(app)/layout.tsx` (PAT-01) · `Toast` + undo (PAT-21, PAT-74) · `Sheet` (PAT-23) · `Confirm`
(PAT-73) · `EmptyState` (PAT-70) · `Banner` (PAT-72) · `Find` (PAT-41) · `SortChips` (PAT-42) ·
`ObjectActions` (PAT-16…20, 22) · `ObjectPage` (PAT-30) · `EntryHeader` (PAT-31) · `ObjectForm`
generated from fields (PAT-61) · `Why` sheet (PAT-51) · `Unknown` («non so», PAT-55).
