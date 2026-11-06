# lifeos — patterns (every common verb and shape, once)

Status: **approved 2026-11-06** (PROD-44, ADR-0061). Replaces, as truth,
`docs/archive/spec-v2/interaction.md`, `find.md`, `content.md` §3–4, `kit.md`, `shapes.md`,
`design-register.md` and ADR-0058's pattern list. IDs: `PAT-nn`, written WHEN / THEN.
«Kit» = the piece in `packages/kit` that realises it: ✓ exists · ✗ to build. Each piece has its
entry in the `/kit` gallery (`/kit/oggetto` for the ObjectPage), photographed by PAT-94.
A screen is only a composition of these pieces (PRD-18).

## 1. The page shell
- **PAT-01** One `(app)/layout.tsx` holds NavBar (Corpo · Cibo · Oggi · Mente · Soldi) and ⊕ on
  every page; pages never mount them. WHEN a sticky «Salva» is on the page (PAT-14, PAT-61) THEN
  ⊕ is hidden and the «Salva» sits just above the bar (his answer to Q-09, 6 Nov: «a»). ⊕'s own
  sheets cover the bar. One exception: a running gym session is full screen, left with
  «Finisci» or «‹ Corpo» (TRAIN-10, his pick 6 Nov). Kit: `NavBar` ✓, layout ✓
  (`(app)/layout.tsx`, `features/shell/nav.ts`; the bar's height is `--nav-h`).
- **PAT-02** Every sub-page header: «‹ parent» naming the parent, title, one-line meta.
  One prop name (`back`). Kit: `PageHeader` ✓ (4 prop names today).
- **PAT-03** An area page = the same four tabs, Diario · Piano · Elenco · Andamento, each a
  registry-driven view filtered by area; Oggi = all areas. A tab with nothing shows the empty
  state of PAT-70, not a page of its own. Kit: `AreaTabs` ✓. [ADR-0059]
- **PAT-04** Object addresses: `/{area}/{type}/{id}`; one route per family
  (`[area]/[type]/[id]`), not one per type. Kit: route ✗ (15 per-object routes today).

## 2. The verbs (one form each; the registry says which apply)
| ID | Verb | WHEN he… | THEN | Kit |
|---|---|---|---|---|
| PAT-10 | Aggiungi | taps ⊕ anywhere | Capture sheet (PAT-60) opens, the current area's types first | `Capture` ✗ |
| PAT-11 | Aggiungi qui | taps the last row «+ Nuovo …» of a list | the type's form opens prefilled (MOD-51) | `List` ✓ |
| PAT-12 | Apri | taps a row or box anywhere on it | its object page or voce sheet | `List`, `Box` ✓ |
| PAT-13 | Modifica | taps a value | it becomes editable in place; leaving saves; toast «Salvato · Annulla». No `/modifica` pages | `Field` ✓, in-place ✗ |
| PAT-14 | Salva | is composing (meal, set, new object) | one sticky primary at the bottom; «Annulla» beside it | `Composer` ✗ |
| PAT-15 | Fatto / Salta | taps the pill on a previsto row | status changes, time = now (MOD-13), toast with Annulla | `act` pill ✓ |
| PAT-16 | Parti da… | opens «Altro» on an object | a new object based on it, its form prefilled | `ObjectActions` ✓ |
| PAT-17 | Variante | opens «Altro» on an object with variants | a child that stores only its differences | `ObjectActions` ✓ |
| PAT-18 | Unisci | opens «Altro» or a «doppioni» hint | pick the other, preview what moves, confirm (PAT-73) | `MergeSheet` ✗ |
| PAT-19 | Archivia / Ripristina | opens «Altro» | archived at once + toast Annulla; Elenco has an «Archiviati» filter to restore | `ObjectActions` ✓, filter ✗ |
| PAT-20 | Elimina | opens «Altro» | a voce: trash + toast Annulla; an object: only if unused, else offer Archivia | `ObjectActions` ✓ |
| PAT-21 | Annulla | taps the toast's action within 5 s | the last change is reverted exactly (the verb's undo, PAT-24) | `Toast` ✓ (4 copies to replace) |
| PAT-22 | Salva come … | opens «Altro» on a voce | MOD-14 | `ObjectActions` ✓ |
| PAT-23 | Altro | taps «⋯» on a row or page | a sheet with the rare verbs, destructive last, in tomato | `Sheet` ✓ |
- **PAT-24** Every verb is one function in `core/verbs`, `act(db, owner, verb, type, id,
  payload)` — create, startFrom, variant, edit, merge, archive, restore, trash, delete, saveAs —
  validated against the type's registry declaration (its fields as a zod schema), through the
  identity-taking queries (ADR-0057); each result carries its exact undo as the inverse verb
  (merge: none, so it is confirmed first); `undo` runs it. No per-feature archive/delete/merge
  actions. [n03, audit README §2] — Today: built (`core/verbs`); the 11 feature paths move to
  it type by type in phase 4.

## 3. Object page and voce
- **PAT-30** **ObjectPage**, the same for every catalog type: header (PAT-02) · the values that
  matter as editable rows · its parts or lines · «Andamento» (progress, MOD-50) · «Usato in»
  · actions row at the end (Parti da, Variante, Archivia; «⋯» for the rest). Kit ✓ `ObjectPage`
  (8 bespoke pages move in phase 4).
- **PAT-31** **Voce header**, the same for every type: quanto (× servings / quantity) · quando
  (time, previsto/fatto/saltato) · ↺ only when its catalog object changed after it · «⋯».
  The body below edits in place. Kit ✓ `EntryHeader`. [n02, FOOD-38, FOOD-47]
- **PAT-32** A voce opens as a sheet with two levels: closed = one row with its key number;
  open = header + body + context line (MOD-53). Kit: `EntrySheet` ✓ (13 types) → all types.
- **PAT-33** The context line under an open voce is generic (MOD-53). Kit ✗.

## 4. Lists and search
- **PAT-40** Every list is `List`: 8 rows, then «Mostra altri (n)»; the rest scrolls in its own
  box; the whole row is the target. Kit ✓ (16 uses). [UI-41, UI-100]
- **PAT-41** Every search is `Find`: one field, one matcher (accent-folding, aliases, typos),
  ranking «di solito a quest'ora» then use count then name; filters as chips; one typo forgiven
  from four letters on. Kit ✓ `Find` (5 fields, 4 matchers, 3 `fold` to replace). [find.md,
  needs §3]
- **PAT-42** Sort is a chip row of the type's declared sort keys, never a drop-down. Kit ✓
  `SortChips`.
- **PAT-43** Elenco of an area = its types as `List` sections + «Archiviati» + «Possibili
  doppioni» hint when the duplicate detector finds some (one detector). Kit ✗.

## 5. Numbers
- **PAT-50** Every number shown is a `Metric` value through `F` (format, unit, 24 h). Kit: `F` ✓.
- **PAT-51** **Perché?**: tapping a number opens one sheet generated from its metric
  declaration: formula in words, inputs with sources and confidence, coverage, source of the
  fascia, formula version. No page writes an explanation by hand. Kit ✓ `Why`. [n05, MOD-40]
- **PAT-52** One judgement chip (`F.judge`): mark + number + word; one fascia bar (ruler with
  min / buono / max). Kit: `Box` score ✓, chip unification ✗. [UI-102]
- **PAT-53** One `Chart` for every trend (period G/S/M/6M/A, points, trend line, fascia band);
  no SVG drawn in a feature. Kit: `Chart` ✓ (1 use, 5 hand-drawn today).
- **PAT-54** One period navigator (swipe, arrows with a mouse, «↩ oggi»). Kit: `DateNav`,
  `RangeNav`, `Swipe` ✓.
- **PAT-55** «Non so» when coverage is below the threshold, with what is missing. Kit ✓
  `Unknown`.

## 6. Forms and capture
- **PAT-60** **Capture** (⊕): one `Find` over every type and object, ranked by habit at this
  hour; one tap logs with the proposal (MOD-51) and shows Annulla; an unknown thing becomes a
  stima object at once. One door per type. [n01]
- **PAT-61** **ObjectForm**: generated from the type's fields (labels, units, help, ranges);
  numbers with − / + steppers; time and date with one native picker each (no typed
  «AAAA-MM-GG»). A type adds a custom section only through its specialisation. Kit: `Field` ✓,
  `ObjectForm` ✓ (17 bespoke forms move in phase 4).
- **PAT-62** **Composer** for types with lines (pasto, sessione): search + lines + totals +
  sticky «Salva». Kit: food Composer ✓ → generic ✗.
- **PAT-63** **Timer** capture for interval types (set, rest, run, study): states, saved instants,
  resume after closing, auto mode with assumed values marked (MOD-12); without network the voci
  wait on the phone and leave by themselves when it returns, shown «da inviare» (his pick 6 Nov,
  UI-72). Kit: gym clock → ✗.
- **PAT-64** **Scanner**: one barcode reader (camera, file) for every type with a barcode. [FOOD-43]

## 7. States and feedback
- **PAT-70** Empty: the type's glyph, what is missing, one action to fill it. Never a
  placeholder page. Kit ✓ `EmptyState` (3 styles to replace).
- **PAT-71** Loading: skeleton of the level that comes; a waiting button is busy. Kit `k-skel` ✓.
- **PAT-72** Error saving: banner with «Riprova», what was typed stays. Kit ✓ `Banner`.
- **PAT-73** Confirm only what cannot be undone: a sheet asking in words, «Annulla» + the
  destructive verb. Never `window.confirm`. Kit ✓ `Confirm`.
- **PAT-74** Toast: one at a time above the NavBar, 5 s, action only for Annulla. Kit ✓ `Toast`,
  `useToast`.

## 8. Layout and words
- **PAT-80** Spacing, paddings and radii from tokens only; no inline `style`, no feature CSS.
  Every box measured at 390/360/320 (no overflow). [UI-84, L section]
- **PAT-81** Words from the glossary (product.md §3); buttons say the verb; destructive verbs
  name what they destroy; «tu», no exclamation marks. Every UI string lives in one catalogue per
  area (`i18n/`), never inline; the glossary test reads the catalogue (his pick 6 Nov, DT-61). [content §2]

## 9. The checks (each fails a PR; their baselines of 6 Nov may only shrink)
- **PAT-90** Lint (`apps/v2/eslint/fitness.mjs`) fails a screen (`app/`, `features/`) with
  `<input type="search">`, a raw `<form>`, `window.confirm`, a hand-made toast, an `<svg>`,
  inline `style`, or a comparison with a type key (`kind === "meal"`, `catalog === "food"`);
  the last also anywhere in `core/` outside `core/{food,training,money,engines,kinds}`. The
  keys are `eslint/type-keys.json`, kept equal to the registry by a test. Breaches of 6 Nov:
  `apps/v2/lint-baseline.json` (ESLint suppressions): a file may not grow a rule's count, a
  fixed breach must leave the list. — Today: built.
- **PAT-91** Claude Code hooks (`.claude/settings.json`, `scripts/hooks/guard.py`): after an
  Edit/Write of a `.ts`/`.tsx` in v2 or the kit, prettier and eslint run on it and errors go back
  to the agent; before the agent stops, `vitest related` then `tsc` run on the branch's changed
  files and block the stop once when they fail; an edit under `docs/spec/` (except `changes/`)
  is blocked unless a change is open. Path rules in `.claude/rules/` load with the files they
  cover. — Today: built.
- **PAT-92** Skills: `change` (propose → apply → archive), `verify` (photos 390/360/320 dark +
  ui-check), `audit` (spec against code); `adr`, `retro`, `kickoff` stay; `dossier` and
  `compress` retired 6 Nov. — Today: built.
- **PAT-93** UI strings live in `apps/v2/src/i18n/<area>.ts` (with `common.ts`) and the kit's
  `packages/kit/src/words.ts`; the glossary test fails on a word of product.md §3's «Not»
  column in a catalogue, and on an inline string above the file's 6 Nov count
  (`i18n/glossary-baseline.json`). «record» as a personal best is allowed (MOD-50). — Today:
  built.
- **PAT-94** Playwright photographs the `/kit` gallery (every kit piece, each sheet open, the
  ObjectPage), dark, at 390 and 320 px, against `apps/v2/e2e/kit.spec.ts-snapshots/`
  (`npm run shots -w apps/v2`; runbook `ui-audit.md`), in CI as the `kit-shots` job. — Today:
  built.

| Check | Enforces |
|---|---|
| PAT-90 lint with baseline | PAT-21, 41, 53, 61, 73, 80, MOD-02 |
| PAT-93 glossary test | PAT-81, product §3 |
| jscpd with baseline | PRD-53 |
| requirement IDs cited by tests (`check.py`) | PRD-42 |
| PAT-94 photos of the kit gallery | PRD-18 |
| ui-check in CI: targets ≥ 44, one primary, overflow per box | PRD-12, 14, PAT-80 — not yet in CI |
| PAT-91 hooks | PRD-41 |
