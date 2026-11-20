# lifeos — patterns (every common verb and shape, once)

Status: **approved 2026-11-06** (PROD-44, ADR-0061). Replaces, as truth,
`docs/archive/spec-v2/interaction.md`, `find.md`, `content.md` §3–4, `kit.md`, `shapes.md`,
`design-register.md` and ADR-0058's pattern list. IDs: `PAT-nn`, written WHEN / THEN.
«Kit» = the piece in `packages/kit` that realises it: ✓ exists · ✗ to build. Each piece has its
entry in the `/kit` gallery (`/kit/oggetto` for the ObjectPage), photographed by PAT-94.
A screen is only a composition of these pieces (PRD-18).

## 1. The page shell
- **PAT-01** One `(app)/layout.tsx` holds the NavBar on every page; pages never mount it: Elenco ·
  Piano · **Oggi** · Andamento · Obiettivi, Oggi the middle item and the start page (ADR-0063). **No
  ⊕** and no Aggiungi page: everything is added where it will show (PAT-100; his 20 Nov, proposal
  §112–§113). WHEN a sticky «Salva» is on the page (PAT-14, PAT-61) THEN it sits just above the
  bar. One exception: a running sessione (Palestra) is full screen, left with «Finisci» or «‹ Oggi».
  On desktop the bar is a side rail, same five, same order. Kit: `NavBar` ✗ (today: the five areas
  and ⊕ in the layout).
- **PAT-02** Every sub-page header: «‹ parent» naming the parent, title, one-line meta.
  One prop name (`back`). Kit: `PageHeader` ✓ (4 prop names today).
- **PAT-03** A place is a **preset** of the two spaces (PRD-16) answering one question over every
  type: Elenco «Cosa ho?» = le cose · Piano «Cosa farò?» = il tempo after now · Oggi «Cosa sto
  facendo?» = il tempo, a day · Andamento «Come sta andando?» = il tempo, a week or more ·
  Obiettivi «Dove vado?» = il tempo with the obiettivi as channels and as Boxes. A place draws
  nothing of its own; WHEN a type has nothing in a place THEN it has no line there. The four tabs
  are gone. Kit: `AreaTabs` removed ✗. [ADR-0063, reframe §3, his «yc per ora» 20 Nov]
- **PAT-95** The area filter: one row of chips, «Tutto» · Cibo · Corpo · Mente · Soldi, under the
  header of every place but Oggi, which filters by kind with its own chips (his «yc», 14 Nov).
  WHEN he taps a chip THEN the place shows only that area's types; WHEN he changes place THEN the
  chip stays. An area is never a page. Kit: `AreaFilter` ✗.
- **PAT-97** Oggi holds every day, and what it shows follows the time: a past day what happened,
  today done before now and planned after it, a day to come only what is planned — each line
  saying where it comes from (its ritmo as a tag, else «solo questo giorno»), every part shown, an
  empty one as a gap that offers what is missing («+ Pranzo»). The Piano is the same rail after now
  (reframe §14), and the ritmi and cicli it holds, as the kit `Elenco`. [his 15 Nov «tanto vale
  unirle», proposal §38, §42–§43; his 20 Nov] Kit: `DateNav` ✓, `Elenco` ✓, the Piano as the rail's
  future ✗ (today `PianoList` only).
- **PAT-04** Object addresses: `/{area}/{type}/{id}`; one route per family
  (`[area]/[type]/[id]`), not one per type: the type is found by its word (`typeAtSlug`), a
  wrong area redirects to the type's own, the page is the generic ObjectPage
  (`features/objects/ObjectView`), its `nuovo` the type's create form; a type's own sections
  come from one map by type key (`extras.tsx`, `new-forms.tsx`). WHEN a type has lines THEN
  `/{area}/{type}/{id}/componi` is its Composer (PAT-62), from the same map (`COMPOSERS`).
  Kit: route ✓ (`src/app/(app)/[area]/[type]/[id]`, mounted again as `oggi/[type]/[id]`
  because the `oggi` folder wins over `[area]`). Moved: the tracker (`/oggi/tracker/<id>`,
  change 2026-11-06-tracker; `/profilo/tipi` gone); cibo, prodotto and pasto (change
  2026-11-07-food-meal; the `cibo/` and `pasto/` folders gone); esercizio and scheda (change
  2026-11-07-exercise-scheda; the `esercizio/` folder gone, the scheda's `/componi`); blocco and ciclo (change
  2026-11-07-piano: `/oggi/blocco/<id>`, `/oggi/ciclo/<id>`; `[area]/ciclo/[id]` redirects there,
  `componi` mounted under `oggi` too, `compose-route.tsx`). The other per-type folders leave as
  their types move (phase 4).

## 2. The verbs (one form each; the registry says which apply)
| ID | Verb | WHEN he… | THEN | Kit |
|---|---|---|---|---|
| PAT-10 | Aggiungi | taps where the thing will show (PAT-100) | a search row opens there, ranked for the hour | `Capture` to remove ✗ |
| PAT-11 | Aggiungi qui | taps the last row «+ Nuovo …» of a list | the type's form opens prefilled (MOD-51); a type with plain declared fields gets the generated form (`NewObjectForm`, `objectCreate` through `core/verbs`; ciclo, blocco) | `List` ✓ |
| PAT-12 | Apri | taps a row or box anywhere on it | its object page or voce sheet | `List`, `Box` ✓ |
| PAT-13 | Modifica | taps a value (the name too) | it becomes editable in place; leaving saves; toast «Salvato · Annulla». No `/modifica` pages | `InPlace` ✓ |
| PAT-14 | Salva | is composing (meal, set, new object) | one sticky primary at the bottom; «Annulla» beside it | `Composer` ✓, `ObjectForm` ✓ |
| PAT-15 | Fatto / Salta | taps the pill on a previsto row | status changes, time = now (MOD-13), toast with Annulla | `act` pill ✓ |
| PAT-16 | Parti da… | opens «Altro» on an object whose type's form can start from one | a new object based on it, its form prefilled (`nuovo?da=<id>`) | `ObjectActions` ✓ |
| PAT-17 | Variante | opens «Altro» on an object with variants | a child that stores only its differences, its form (`nuovo?variante=<id>`) | `ObjectActions` ✓ |
| PAT-18 | Unisci | opens «Altro» or a «doppioni» hint | pick the other, preview what moves, confirm (PAT-73) | `MergeSheet` ✓ |
| PAT-19 | Archivia / Ripristina | opens «Altro» | archived at once + toast Annulla; Elenco has an «Archiviati» filter to restore | `ObjectActions` ✓, `Elenco` filter ✓ |
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
- **PAT-30** One piece per type at three levels (his «ap yc», 15 Nov; his «riusare le schede che si
  usano in oggi»): 0 the row = the `Box` closed (icon · name · one value · score chip), in every
  list, search, «Usato in», a pasto's cibi, Marche, Dispensa; 1 the same Box open in place, its
  doors one at a time, a value edited by a tap (PAT-13); 2 the page = the same open Box alone, plus
  «Altro» (PAT-23). A pasto salvato in Elenco and a pasto on the day are one Box: the day adds
  quanto, quando and the state (PAT-31, VIS-22). A type has one renderer and one editor; a second
  fails the guard (PAT-90). A cibo's label values sit behind the door «Etichetta», closed at first.
  A `ref` field is a row, a choice of his live objects of its catalog (`readRefs`); a field marked
  `internal` is stored, never a row. Kit: `ObjectPage` ✓, the shared Box from the registry ✗
  (Deliver ③).
- **PAT-31** **Voce header**, the same for every type: quanto (× servings / quantity) · quando
  (time, previsto/fatto/saltato) · ↺ only when its catalog object changed after it · «⋯».
  The body below edits in place. Kit ✓ `EntryHeader`. [n02, FOOD-38, FOOD-47]
- **PAT-32** A voce opens as a sheet with two levels: closed = one row with its key number;
  open = header + body + context line (MOD-53). Kit: `EntrySheet` ✓ (13 types) → all types.
- **PAT-33** The context line under an open voce is generic (MOD-53): its parts in words, one
  line beside it, never inside the number. Kit ✓ `ContextLine`.

## 4. Lists and search
- **PAT-40** Every list is `List`: 8 rows, then the rest on one line that names every item («e
  altri 14: A · C · …», two lines at most) and opens in place (`Condensed`), its state kept per
  piece (VIS-70); the whole row is the target. Inside a piece the same rule: rows for what matters
  (worst first: a voto's lost points, micros not fine), the rest on one condensed line (a voto's
  «Pieni» and «Non contano», micros «A posto»). A list without names keeps «Mostra altri (n)».
  Kit ✓ (16 uses; Elenco names its rows). [UI-41, UI-100; his pick of 19 Nov «condensare
  l'informazione ma mostrarla anche interamente», «anche i "Non contano"»]
- **PAT-41** Every search is `Find`: one field, one matcher (accent-folding, aliases, typos),
  ranking «di solito a quest'ora» then use count then name; filters as chips; one typo forgiven
  from four letters on. For a short choice it may list every item with nothing typed (`all`,
  «Unisci»), or given rows (`idle`, ⊕'s types). Kit ✓ `Find` (5 fields, 4 matchers, 3 `fold`
  to replace). [find.md, needs §3; change 2026-11-06-kit-patterns]
- **PAT-42** Sort is a chip row of the type's declared sort keys, never a drop-down. Kit ✓
  `SortChips`.
- **PAT-43** Elenco of an area = its types as `List` sections + «Archiviati» + «Possibili
  doppioni» hint WHEN a detector finds some: the one name detector (`core/catalog/twins.ts`:
  the same words without accents, case, punctuation, small words or order) for every type, and
  for cibo and pasto also their proposals — «X è una marca di Y» (a brand in the name) and
  «variante» (two pasti with mostly the same cibi; ADR-0060) — never a pair he said are
  different (his «scegli tu» on Q-11, 7 Nov). The hint opens «Possibili doppioni», one pair per
  box with the proposal as its first button (Uniscili · È una marca di · Variante di · Sono
  diversi); «Unisci» on an object's page is the `MergeSheet` (PAT-18). Kit ✓ `Elenco`, detector
  `core/catalog/twins.ts`, read by `features/library/twins.ts` for cibi and esercizi. WHEN he taps
  a row THEN it opens in place (PAT-30 level 1) and «Apri» goes to its page; children are nested
  under their parent (MOD-21): a cibo's marche, each with its formati; a pasto salvato's varianti;
  marche and formati have no shelf of their own. The Dispensa is a filter of Elenco (the formati in
  casa; product.md §4).

## 5. Numbers
- **PAT-50** Every number shown is a `Metric` value through `F` (format, unit, 24 h). Kit: `F` ✓.
- **PAT-51** **Perché?**: tapping a number opens one sheet generated from its metric
  declaration: formula in words, inputs with sources and confidence, coverage, source of the
  fascia, formula version. No page writes an explanation by hand; where the day's targets come from
  («dispendio ≈ … per il ritmo dell'obiettivo») is said once, in Obiettivi (his 15 Nov). Kit ✓
  `Why`. [n05, MOD-40]
- **PAT-98** A voto is its number in the judgement's colour, with no word beside it; WHEN the app
  cannot score (PRD-23) THEN «–», the reason in its «Perché?». Kit: ✗.
- **PAT-52** One judgement chip (`F.judge`): mark + number, no word beside it (PAT-98); one fascia bar
  (the zones ruler: da evitare · pessimo · ok · ottimo, FD-30). Kit ✓ `Judge`, `Fascia` (+ `FasciaBar`, `scoreFascia`): Nutrients and a
  score's parts draw the one ruler; hand-written marks move to `Judge` type by type. [UI-102]
- **PAT-53** One `Chart` for every trend (period G/S/M/6M/A, points, trend line, fascia band);
  no SVG drawn in a feature. Kit: `Chart` ✓ (1 use, 5 hand-drawn today).
- **PAT-54** One period navigator (swipe, arrows with a mouse, «↩ oggi»). Kit: `DateNav`,
  `RangeNav`, `Swipe` ✓.
- **PAT-55** «Non so» when coverage is below the threshold, with what is missing. Kit ✓
  `Unknown`.

## 6. Forms and capture
- **PAT-60** **Adding in place** replaces Capture: nothing covers the page; what appears pushes the
  rest down or slides sideways. A voce is added on the rail at its time (a gap, «adesso», or
  «Senza orario» at the day's end): a search row opens there, one `Find`, with what he logs at that
  hour ranked first (MOD-51: previsti to tick, the usual at this hour, schede, acqua, the last
  pasti); one tap logs with Annulla; the time makes it previsto or fatto (MOD-15), no «Adesso ·
  Previsto · Prima». A riga is added at the end of its card's righe, an object at the end of its
  list in Elenco, a new kind of thing at the end of the search's results («Nuovo tipo», MOD-01). An
  unknown thing becomes a stima object at once (FD-92). [his 20 Nov «on place negli stessi posti in
  cui si visualizza… togliessimo quell'orribile bottone +», reframe §15] Kit: `Capture` and
  `/aggiungi` to remove ✗ (Deliver ④).
- **PAT-99** The dock («Al volo»): one strip stuck above the bar on Oggi: the water drunk with +250
  and +500, then what he pinned, in his order, then the app's guesses up to four chips, sideways.
  WHEN he taps «Modifica» THEN a sheet lists the pins («Su», «Togli») and the other assunzioni
  («Fissa»); each tap saves. Pins live in his settings. The one shortcut kept (his «yc», §113).
  Kit: ✗.
- **PAT-100** **One grammar, three spots** (his §112–§113; `round-1.md` D3): on the thing's card —
  change, skip, start from, merge, archive, drill, compare, why; where it will show — at a time on
  the rail, at the end of a list or of a card's parts; two named shortcuts — the dock (PAT-99) and
  Palestra (PAT-63). No ⊕, no page for an action; `orca/actions` lists each action's spot and
  `check.py` refuses ⊕ there. Kit: ✗.
- **PAT-61** **ObjectForm**: generated from the type's fields (labels, units, help, ranges);
  numbers with − / + steppers; time and date with one native picker each (no typed
  «AAAA-MM-GG»). A type adds a custom section only through its specialisation. Kit: `Field` ✓,
  `ObjectForm` ✓ (17 bespoke forms move in phase 4). A day is `Field type="date"` (registry
  type `date`, ISO, native picker). WHEN a field says how often (a blocco's `recurrence`, PL-20)
  THEN it is «Ogni quanto»: one choice (ogni giorno · certi giorni · ogni N giorni · N volte a
  settimana · in certe date · nel ciclo) and that kind's own control (weekday chips in two rows,
  a stepper, native date pickers; «Nel ciclo» none, it says «Nel Piano quando il passo del
  ciclo che lo tiene è di turno, o con il blocco a cui è legato»), said in words under it («lun,
  mer, ven»); it posts the engine's `Recurrence` as JSON text, checked by the kit and again by
  the registry. Kit ✓ `Recurrence` (in `Field`, `type="recurrence"`; gallery `#ogni-quanto`),
  the stepper shared as `Stepper`. [Q-15 (a), Q-18 (a), Q-24 (a)]
- **PAT-62** **Composer** for types with lines (pasto, scheda): search + lines + totals +
  sticky «Salva»: the lines, the search under them, the totals, the type's own fields, then
  «Annulla» + «Salva». Kit ✓ `Composer` (`readLines`; the caller's `lines`, a line's `below`,
  its own `search`, `head`, `title`). The food composer is it (change 2026-11-07-food-meal;
  its search `FoodSearch` on `Find`). WHEN a type's lines have no quantity (a scheda's
  exercises) THEN its lines have no stepper and move up and down («Su» / «Giù»); the order is
  what it posts (`counted={false}`, `readOrder`; the scheda's `RoutineComposer`, change
  2026-11-07-exercise-scheda). A session is not composed: gym mode is its own full screen of
  kit pieces (`Timer`, `Box`, `Find`; PAT-01's exception, TR-07) and follows its scheda (Q-13
  «a», his «decidi tu» 7 Nov, change 2026-11-07-gym-mode-q13). A line may be `fixed`: no
  stepper, its quantity posted as it is (a blocco's type, PL-03). A ciclo's steps are composed as
  ordered lines (`counted={false}`) with a fixed «+ Riposo» under the search that adds an empty
  step; the search offers his blocchi «nel ciclo» first, then his schede (a scheda picked
  becomes such a blocco on save), each line said by what it is («blocco nel ciclo» · «scheda» ·
  «Riposo»). [Q-16 (a), Q-18 (a)]
- **PAT-63** **Timer** capture for interval types (set, rest, run, study): states, saved instants,
  resume after closing, auto mode with assumed values marked (MOD-12); without network the voci
  wait on the phone and leave by themselves when it returns, shown «da inviare» (his pick 6 Nov,
  UI-72). Kit ✓ `Timer` (`timerClock`: countdown, running, at rest; change
  2026-11-07-exercise-scheda): the gym clock (`GymClock`) is it; resume and the offline queue
  still live in gym mode (`Gym.tsx`).
- **PAT-64** **Scanner**: one barcode reader (camera, file) for every type with a barcode. [FOOD-43]

## 7. States and feedback
- **PAT-70** Empty: the type's glyph, what is missing, one action to fill it. Never a
  placeholder page. Kit ✓ `EmptyState` (3 styles to replace).
- **PAT-71** Loading: skeleton of the level that comes; a waiting button is busy. Kit `k-skel` ✓.
- **PAT-72** Error saving: banner with «Riprova», what was typed stays. Kit ✓ `Banner`.
- **PAT-73** Confirm only what cannot be undone: a sheet asking in words, «Annulla» + the
  destructive verb. Never `window.confirm`. Kit ✓ `Confirm`.
- **PAT-74** Toast: one at a time above the NavBar, 5 s, «Annulla» and at most **one other choice**
  when the act had two sensible outcomes: after «Fatto» on a previsto that took the tick's time,
  «tieni le 20:00» puts the planned time back (still fatto); «Annulla» after it swaps again (his
  «yc» 15 Nov, proposal §23 Q2). Choices never wrap. Kit ✓ `Toast`, `useToast`, DayView's toast
  (`swapPlannedStart`, `core/entries/write.ts`).

## 8. Layout and words
- **PAT-80** Spacing, paddings and radii from tokens only; no inline `style`, no feature CSS.
  Every box measured at 390/360/320 (no overflow). [UI-84, L section]
- **PAT-81** Words from the glossary (product.md §3); buttons say the verb; destructive verbs
  name what they destroy; «tu», no exclamation marks. Every UI string lives in one catalogue per
  area (`i18n/`), never inline; the glossary test reads the catalogue (his pick 6 Nov, DT-61). [content §2]

## 9. The checks (each fails a PR; their baselines of 6 Nov may only shrink)
- **PAT-90** Lint (`eslint/fitness.mjs`) fails a screen (`app/`, `features/`) with
  `<input type="search">`, a raw `<form>`, `window.confirm`, a hand-made toast, an `<svg>`,
  inline `style`, or a comparison with a type key (`kind === "meal"`, `catalog === "food"`);
  the last also anywhere in `core/` outside `core/{food,training,money,engines,kinds}`. The
  keys are `eslint/type-keys.json`, kept equal to the registry by a test. Breaches of 6 Nov:
  `lint-baseline.json` (ESLint suppressions): a file may not grow a rule's count, a
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
- **PAT-93** UI strings live in `src/i18n/<area>.ts` (with `common.ts`) and the kit's
  `packages/kit/src/words.ts`; the glossary test fails on a word of product.md §3's «Not»
  column in a catalogue, and on an inline string above the file's 6 Nov count
  (`i18n/glossary-baseline.json`). «record» as a personal best is allowed (MOD-50). — Today:
  built.
- **PAT-94** Playwright photographs the `/kit` gallery (every kit piece, each sheet open, the
  ObjectPage), dark, at 390 and 320 px, against `e2e/kit.spec.ts-snapshots/`
  (`npm run shots`; runbook `ui-audit.md`), in CI as the `kit-shots` job. — Today:
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
