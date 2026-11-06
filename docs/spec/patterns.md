# lifeos — patterns (every common verb and shape, once)

Status: **draft 2026-11-06, phase 2a**, waiting for approval. Replaces, as truth,
`docs/spec/v2/interaction.md`, `find.md`, `content.md` §3–4, `kit.md`, `shapes.md`,
`design-register.md` and ADR-0058's pattern list. IDs: `PAT-nn`, written WHEN / THEN.
«Kit» = the piece in `packages/kit` that realises it: ✓ exists · ✗ to build in phase 3.
A screen is only a composition of these pieces (PRD-18).

## 1. The page shell
- **PAT-01** One `(app)/layout.tsx` holds NavBar (Corpo · Cibo · Oggi · Mente · Soldi) and ⊕;
  pages never mount them. Kit: `NavBar` ✓, layout ✗ (copied in 17 pages today).
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
| PAT-16 | Parti da… | opens «Altro» on an object | a new object based on it, its form prefilled | `ObjectActions` ✗ |
| PAT-17 | Variante | opens «Altro» on an object with variants | a child that stores only its differences | `ObjectActions` ✗ |
| PAT-18 | Unisci | opens «Altro» or a «doppioni» hint | pick the other, preview what moves, confirm (PAT-73) | `MergeSheet` ✗ |
| PAT-19 | Archivia / Ripristina | opens «Altro» | archived at once + toast Annulla; Elenco has an «Archiviati» filter to restore | `ObjectActions` ✗ |
| PAT-20 | Elimina | opens «Altro» | a voce: trash + toast Annulla; an object: only if unused, else offer Archivia | `ObjectActions` ✗ |
| PAT-21 | Annulla | taps the toast's action within 5 s | the last change is reverted exactly | `Toast` ✗ (4 copies today) |
| PAT-22 | Salva come … | opens «Altro» on a voce | MOD-14 | `ObjectActions` ✗ |
| PAT-23 | Altro | taps «⋯» on a row or page | a sheet with the rare verbs, destructive last, in tomato | `Sheet` ✗ |
- **PAT-24** Every verb is one server action in `core/verbs` taking (type, id, payload),
  validated by the type's zod schema; no per-feature archive/delete/merge actions.
  [n03, audit README §2]

## 3. Object page and voce
- **PAT-30** **ObjectPage**, the same for every catalog type: header (PAT-02) · the values that
  matter as editable rows · its parts or lines · «Andamento» (progress, MOD-50) · «Usato in»
  · actions row at the end (Parti da, Variante, Archivia; «⋯» for the rest). Kit ✗ (8 bespoke).
- **PAT-31** **Voce header**, the same for every type: quanto (× servings / quantity) · quando
  (time, previsto/fatto/saltato) · ↺ only when its catalog object changed after it · «⋯».
  The body below edits in place. Kit ✗. [n02, FOOD-38, FOOD-47]
- **PAT-32** A voce opens as a sheet with two levels: closed = one row with its key number;
  open = header + body + context line (MOD-53). Kit: `EntrySheet` ✓ (13 types) → all types.
- **PAT-33** The context line under an open voce is generic (MOD-53). Kit ✗.

## 4. Lists and search
- **PAT-40** Every list is `List`: 8 rows, then «Mostra altri (n)»; the rest scrolls in its own
  box; the whole row is the target. Kit ✓ (16 uses). [UI-41, UI-100]
- **PAT-41** Every search is `Find`: one field, one matcher (accent-folding, aliases, typos),
  ranking «di solito a quest'ora» then use count then name; filters as chips. Kit ✗ (5 fields,
  4 matchers, 3 `fold` today). [find.md, needs §3]
- **PAT-42** Sort is a chip row of the type's declared sort keys, never a drop-down. Kit ✗.
- **PAT-43** Elenco of an area = its types as `List` sections + «Archiviati» + «Possibili
  doppioni» hint when the duplicate detector finds some (one detector). Kit ✗.

## 5. Numbers
- **PAT-50** Every number shown is a `Metric` value through `F` (format, unit, 24 h). Kit: `F` ✓.
- **PAT-51** **Perché?**: tapping a number opens one sheet generated from its metric
  declaration: formula in words, inputs with sources and confidence, coverage, source of the
  fascia, formula version. No page writes an explanation by hand. Kit ✗. [n05, MOD-40]
- **PAT-52** One judgement chip (`F.judge`): mark + number + word; one fascia bar (ruler with
  min / buono / max). Kit: `Box` score ✓, chip unification ✗. [UI-102]
- **PAT-53** One `Chart` for every trend (period G/S/M/6M/A, points, trend line, fascia band);
  no SVG drawn in a feature. Kit: `Chart` ✓ (1 use, 5 hand-drawn today).
- **PAT-54** One period navigator (swipe, arrows with a mouse, «↩ oggi»). Kit: `DateNav`,
  `RangeNav`, `Swipe` ✓.
- **PAT-55** «Non so» when coverage is below the threshold, with what is missing. Kit ✗.

## 6. Forms and capture
- **PAT-60** **Capture** (⊕): one `Find` over every type and object, ranked by habit at this
  hour; one tap logs with the proposal (MOD-51) and shows Annulla; an unknown thing becomes a
  stima object at once. One door per type. [n01]
- **PAT-61** **ObjectForm**: generated from the type's fields (labels, units, help, ranges);
  numbers with − / + steppers; time and date with one native picker each (no typed
  «AAAA-MM-GG»). A type adds a custom section only through its specialisation. Kit: `Field` ✓,
  generator ✗ (17 bespoke forms).
- **PAT-62** **Composer** for types with lines (pasto, sessione): search + lines + totals +
  sticky «Salva». Kit: food Composer ✓ → generic ✗.
- **PAT-63** **Timer** capture for interval types (set, rest, run, study): states, saved instants,
  resume after closing, auto mode with assumed values marked (MOD-12). Kit: gym clock → ✗.
- **PAT-64** **Scanner**: one barcode reader (camera, file) for every type with a barcode. [FOOD-43]

## 7. States and feedback
- **PAT-70** Empty: the type's glyph, what is missing, one action to fill it. Never a
  placeholder page. Kit ✗ (3 styles today).
- **PAT-71** Loading: skeleton of the level that comes; a waiting button is busy. Kit `k-skel` ✓.
- **PAT-72** Error saving: banner with «Riprova», what was typed stays. Kit ✗.
- **PAT-73** Confirm only what cannot be undone: a sheet asking in words, «Annulla» + the
  destructive verb. Never `window.confirm`. Kit ✗.
- **PAT-74** Toast: one at a time above the NavBar, 5 s, action only for Annulla. Kit ✗.

## 8. Layout and words
- **PAT-80** Spacing, paddings and radii from tokens only; no inline `style`, no feature CSS.
  Every box measured at 390/360/320 (no overflow). [UI-84, L section]
- **PAT-81** Words from the glossary (product.md §3); buttons say the verb; destructive verbs
  name what they destroy; «tu», no exclamation marks. [content §2]

## 9. The checks (phase 3 makes each one fail a PR)
| Check | Enforces |
|---|---|
| ESLint: no `<input type=search>`, raw `<form>`, `window.confirm`, toast or `<svg>` chart outside the kit; no type-key comparisons outside specialisation folders | PAT-21, 41, 53, 61, 73, MOD-02 |
| Glossary test over UI strings | PAT-81, product §3 |
| Copy-paste detector with baseline (jscpd) | PRD-53 |
| Requirement IDs cited by tests; `check.py` fails a «built» requirement with none | PRD-42 |
| Playwright screenshots: ObjectPage, List, Capture, Form per type, dark, 390/320 | PRD-18 |
| ui-check in CI: targets ≥ 44, one primary, overflow per box | PRD-12, 14, PAT-80 |
| Claude Code hooks: lint + typecheck after edits, related tests before stop, spec edits only inside an open change | PRD-41 |
