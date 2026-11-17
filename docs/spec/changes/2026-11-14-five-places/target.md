# The target, as tables — foods and meals first (approved 15 Nov, §47)

Step 3 of proposal §44. A draft by Claude, 15 Nov 2026: nothing here is decided until he says so
(rule 1). He reviews tables, not screens. §1 is fact, read from the code and two photos of 12 Nov
(`cibo_elenco_390`, `cibo_cibo_…_390`); §2–§4 are the proposal; §5 is what he must settle.
Not opened for this draft: the composer and the duplicates page as photos (code only), the kit's
`Composer` piece, the gym, every other type.

## 1. Today — the same thing, drawn again in each place

### A cibo is drawn 9 ways
| # | where | drawn by | shows | opens |
|---|---|---|---|---|
| 1 | Cibo · Elenco, Oggi · Elenco search | `Library.tsx` → `Box` row | icon · name · the sort's number · skyline + voto · «1 prodotto» | its page |
| 2 | Dispensa | `shelves.tsx` → `Box` row | name · scorte | its page at «In casa» |
| 3 | its page, the values | `ObjectPage` rows + `InPlace` | 9 label rows, one per line | edit in place |
| 4 | its page, voto and «Così appare» | `OpenBox` + a `<details>` with `Nutrients` | voto per 100 kcal; 100 g as a meal | in place |
| 5 | its page, «Marche» | `food-extra.tsx` → `Box` row | brand · €/kg · uses · formats as words | **nothing** |
| 6 | «Usato in», a pasto's «I cibi» | hand-made `k-line` rows | name · amount | a link, or nothing |
| 7 | the composer's search | `FoodSearch` → `Find` row | name · brand · kcal/100 | adds it |
| 8 | the composer's line | `Composer.tsx` card + `LinePicks` `<select>` | stepper · «Marca» · bar · «Togli» | — |
| 9 | an open meal on the day | `Nutrients` food chip | «200 g · 306 kcal» | lights its share |

Create: `FoodForm` (3 inputs by hand) and `BarcodeBox` (2 inputs, 5 buttons by hand).
**No screen links to a marca's or a formato's own page**: a brand can be made («+ Marca»), never
opened, changed, archived or merged from the app, though the registry gives it every verb.

### A pasto (saved) and a meal on the day are drawn 6 ways
| # | where | drawn by | shows | opens |
|---|---|---|---|---|
| 1 | Cibo · Elenco «Pasti salvati» | `Library.tsx` → `Box` row | name · the sort's number · «stima» | its page |
| 2 | the pasto's page | `recipe-extra.tsx`, hand-made `k-line` rows | totals as plain rows, its cibi as plain rows, Famiglia | «Registra», «Cambia i cibi» |
| 3 | the composer, 6 routes | `Composer.tsx` (730 lines) | lines, search, «come sarà» (`Nutrients`), the day with it | Salva |
| 4 | the day (Oggi) | `EntryRow.tsx` → `Box` | silhouette · skyline + voto · four bars; open: criteria, × servings, food chips, `Nutrients`, cost | in place; «›» = the composer |
| 5 | ⊕ | `aggiungi/page.tsx` → `Box` row | name · «5 giorni su 28 a quest'ora» | logs it |
| 6 | the composer's «Pasti» tab | `Find` row / `k-pick` + `Box` | kcal · protein · «adatto 80» | adds it |

The richest drawing (4: voto with its criteria, every nutrient, cost) exists only on the day.
The pasto's own page (2) has none of it: no voto, no bars, no micros, no cost.

### Taps to change one thing from the Elenco
| he wants to | today | pages crossed |
|---|---|---|
| change a food's amount in a saved meal | Elenco → pasto → «Cambia i cibi» → composer → Salva → pasto → Elenco | 3, and back |
| see a saved meal's voto or micros | not possible from the Elenco (log it first, read it on the day) | — |
| change a brand's price or values | not possible (no page is linked) | — |
| see which brands and sizes a food has | Elenco → cibo → scroll past 9 rows and 2 boxes | 2 |

### A quantity, a time or a date is typed 5 ways (map §1: 17 components)
`Field` stepper (9) · `Field` time (6) · `Stepper` (1) · `InPlace` (2) · `<input inputMode>` by hand (1).

## 2. Target — one type, one of each

One rule for every catalog type: **the row, the box and the page are the same piece at three
levels** (VIS-40, VIS-70), so a thing looks and acts the same wherever it is met.

| level | what it is | where it is used |
|---|---|---|
| 0 · row | `Box` closed: icon · name · one value · score chip | every list, search result, ⊕ row, «Usato in», a meal's cibi, Marche, Dispensa |
| 1 · open in place | the same `Box` open: its doors, one at a time; values edited by a tap (`InPlace`) | the same lists: a tap opens it where it is, no page change |
| 2 · page | the same open box alone on a page, plus «Altro» (parti da, variante, unisci, archivia) | only by «Apri» from level 1, a link, or an address |

| type | row value | doors when open | children shown nested (MOD-21) | form | verbs |
|---|---|---|---|---|---|
| cibo | kcal/100 or the sort's number | Voto (criteria rulers) · Nutrienti (`Nutrients`, 100 g) · Etichetta (the 9 values, `InPlace`) · Marche · In casa · Usato in | its marche, each with its formati | one `ObjectForm` from the registry + the barcode as a `Field` | crea · parti da · unisci · archivia |
| marca (prodotto) | €/kg | Etichetta (only what differs from the cibo) · Formati · Prezzi | its formati | the same form, «di» its cibo | crea · unisci · archivia |
| formato | size · € | Prezzi (MOD-22: each one seen) | — | generated | crea · archivia |
| pasto (saved) | kcal · voto | Voto · Nutrienti · Cibi (each a cibo row with its amount as the value, changed in place) · Costo · Varianti | its varianti, each saying only what differs | `Composer` (the one editor of lines) | crea · parti da · variante · unisci · archivia · registra |
| meal on the day (voce) | kcal · voto | the same four doors as a pasto, plus quanto · quando (PAT-31) | — | the same `Composer` | fatto · salta · sposta · salva come pasto · elimina |

So a pasto in the Elenco and a meal in Oggi are **one box**: the day adds only when, how much
and its status (VIS-22). This is his example of 15 Nov («i pasti vengono visualizzati sia in oggi
che in elenco… è naturale pensare che tutto questo debba essere uniformato»).

### One way to type each thing
| what is typed | the one control | never |
|---|---|---|
| an amount while composing or in a form | `Field` stepper, 44 high, unit inside (VIS-86) | a bare `Stepper`, an `<input>` |
| a value he reads and sometimes corrects | `InPlace` (tap, leave saves, «Salvato · Annulla», PAT-13) | a form page for one value |
| a time, a date | `Field` time / date | — |
| a choice from a list he extends (marca, formato) | `Field` `grows` drop-down (his 15 Nov) | `<select>`, chips |

## 3. What each place composes
| place | composes | does not own |
|---|---|---|
| Cibo · Elenco | `Find` + sort + one `List` of rows per type (cibi, pasti, dispensa), each row opening in place | no drawing of a cibo or pasto of its own |
| Oggi (the day) | the time rail + the same boxes with quando and status | no meal box of its own |
| ⊕ | `Capture`: the same rows, one tap logs | — |
| the composer | `Find` + lines, each line a cibo row whose value is the amount | no ingredient card of its own |
| the object page | the box at level 2 + «Altro» | no sections written per type |

## 4. Backlog — today minus target (each item removes more than it adds)
| # | convergence | replaces | by | deletes (about) |
|---|---|---|---|---|
| B1 (page built 15 Nov, §48; the Elenco row comes with B2) | a pasto's page and Elenco row show the day's meal box | `recipe-extra.tsx` hand rows (125 lines) | the box `EntryRow` already draws, moved out of `features/day` | 1 renderer, the plain totals |
| B2 (pasti built 16 Nov, §50; cibi with B3) | a row opens in place in the Elenco | page hop for reading | `Box` open, as on the day | 2 of the 3 pages in the table above |
| B3 | Marche and formati nested under their cibo, each a row that opens | the Marche row that opens nothing | the same row at level 0/1 | — (adds the missing link and edit) |
| B4 (built 16 Nov, §55; the cibi came with B1) | «Usato in» and a pasto's cibi are rows | 2 hand-made `k-line` lists | `List` of rows | 2 hand lists |
| B5 | the composer's line is the cibo row | the composer's own card + `LinePicks` `<select>` | row + `Field` stepper + `Field` `grows` | 1 card, 1 select |
| B6 | cibo and marca created by the generated form | `FoodForm` (209 lines, 3 inputs by hand) | `ObjectForm` + the barcode field | 1 form |
| B7 | one typed-amount control | `Stepper` in `WaterRow`, the `<input>` in `BarcodeBox` | `Field` stepper | 2 variants |
| B8 | the guard | — | a check that fails when a type gains a second renderer or editor; `map --check` in CI | — |

Order proposed: B1 → B2 → B4 → B3 → B5 → B6 → B7, B8 with B1. Each is one PR, shown as photos of
the real screen before merging (design.md rule 1). Line counts above are of today's files; what
each PR really deletes is measured in the PR.

## 5. Settled: his «ap yc» of 15 Nov took (a) on all five (proposal §47)
1. **Row = box = page at three levels** for every catalog type (§2). (a) yes, as written
   *(recommended: it is his «riusare le schede che si usano in oggi»)* · (b) keep a separate
   page layout, share only the pieces inside it · (c) something else.
2. **Opening in place in the Elenco** instead of going to the page. (a) a tap opens in place,
   «Apri» goes to the page *(recommended: removes the page hops)* · (b) a tap still goes to the
   page, which becomes the box.
3. **Marche and formati**: (a) nested under their cibo, opened in place, no list of their own
   *(recommended)* · (b) also a «Marche» shelf in the Elenco.
4. **The label's 9 values** of a cibo: (a) behind one door «Etichetta», closed at first
   *(recommended: the page now opens on 9 rows before anything judged)* · (b) stay first.
5. **The order** of §4, and whether exercises and schede follow the same table next
   *(recommended: yes, after B1–B2 are approved on foods and meals)*.

## 6. Planning for everything — sveglia, pesata, misure, passi (settled 17 Nov, §57)

His words (proposal §49): «la pianificazione inoltre va ripensata anche in funzione di come si
possa applicare anche per cose come sveglia, pesata, misure, passi, e altre cose.» Read for this
draft: MOD-30…36, PL-03, PL-10, PL-20, PL-21 and `core/plans/day-blocks.ts` by its header only.
Not opened: where the wake time is set, the Obiettivi code.

### Today
The model already lets any type be planned (PL-03: a blocco = what + when + how often; a due
abitudine is covered by any voce of its type that day). What it cannot say:
| thing | what he means by «planned» | what a blocco can say today | the gap |
|---|---|---|---|
| a meal, a session | this, at about this time | what + when + how often → a previsto voce | none |
| pesata, misure | due on these days, after waking | the same → a previsto voce | none in the model; no screen proposes it |
| sveglia (and going to bed) | a time to hit | «after waking + N» only as an anchor for others | the time itself is not a planned thing, so it is not judged or changed per day |
| passi | an amount to reach by the end of the day | nothing: a blocco has no amount | «how much» lives nowhere in the Piano |
| acqua, creatina, caffè | an amount per day | water: a computed target; a food: the goal «al giorno» of §45, not built | the same amount would live in two places (Piano, Obiettivi) |

### Proposed: «planned» has three shapes, declared once per type in the registry (MOD-01)
| shape | for | what is planned | on the day (Oggi) | done when | judged by |
|---|---|---|---|---|---|
| **a voce due** | meal, session, pesata, misure, any tracker | what · when · how often | a previsto box at its time (VIS-22); one tap fills it | a voce of its type that day (PL-03) | adherence (PL-21) |
| **a time to hit** | sveglia, going to bed | a clock time · how often (weekdays may differ) | a mark on the time rail; other things anchor to it (PL-10) | the sleep voce says when he woke | distance from the time |
| **an amount to reach** | passi, acqua, an assunzione | how much · how often, no time | a bar towards the amount, under «Senza orario» or in its own box | the day's sum reaches it | the fascia of the amount (MOD-41) |

One ritmo = what + its shape's fields + how often. A new kind is planned by declaring its shape,
never by a new screen (MOD-02).

### Settled: his «ap yc» of 17 Nov took (a) on all four (proposal §57)
1. **Three shapes** as above. (a) yes *(recommended: it is the smallest model that covers his
   four examples)* · (b) only «a voce due»; times and amounts stay outside the Piano.
2. **Where an amount lives.** (a) in the ritmo, and Obiettivi shows every «al giorno» amount by
   reading the ritmi — one truth *(recommended; it settles §45's 2a the same way)* · (b) in
   Obiettivi, and the Piano holds only what has a time.
3. **Sveglia.** (a) a ritmo of the shape «a time to hit», changed for one day with «Questa
   volta» like any other *(recommended)* · (b) it stays outside the Piano, as now.
4. **Pesata and misure.** (a) proposed as ritmi by the app from what he already does (MOD-34),
   accepted with one tap *(recommended)* · (b) only made by hand.


## 7. Exercises, schede and the session (draft by Claude, 17 Nov, his to settle)

His notes of 16 Nov (proposal §56). Read for this draft: `domains/training.md` whole, the
registry entries (`core/kinds/catalog.ts`), `core/training/read.ts` and `write.ts` (types),
`exercise-extra.tsx`, `routine-extra.tsx`, `shelves.tsx` and `Library.tsx` by grep,
`features/progress/period.ts` by grep. **Not opened:** the gym and session photos, `Gym.tsx`
(791 lines) and its parts, `advice.ts` beyond its header, his data. So §7.1 is fact from code;
his first note is checked on made-up histories (7.5), not yet on his data.

### 7.1 Today
| what | where it is drawn | shows | opens |
|---|---|---|---|
| esercizio, row | Corpo · Elenco «Esercizi» (`Library.tsx`, `Box` row) | name · uses or best e1RM | its page |
| esercizio, page | `ObjectPage` + `exercise-extra.tsx` | sessions as hand-made `k-line` text «10×40, 8×40», best e1RM, a trend sentence, «Usato in» rows | sessions open nothing |
| esercizio, in the gym | `Gym.tsx` card + `gym-parts.tsx` | obiettivo, andamento, l'ultima volta, a row per set | — |
| esercizio, settings | `ExerciseSettings.tsx`, a link inside the gym | rest and setup, two steppers | — |
| scheda, row | Elenco «Schede» (`shelves.tsx`) | name · uses | its page |
| scheda, page | `routine-extra.tsx` | «Inizia», «Cambia gli esercizi», its exercises as rows «1. Squat» | each exercise's page |
| sessione, on the day | `EntryRow` → `Box` | skyline + voto, criteria open | the session page |
| Andamento | `period.ts` | sessions, working sets, minutes per week | — |

What an esercizio knows (catalog values): `pattern` (one of the guides), `equipment`,
`unilateral` (yes/no), `muscleGroups` (text, main first), `kind`, `restS`, `setupS`. The registry
declares only `guide`: the rest is read by `core/training`, so the generated form and page
cannot show or edit them (MOD-01 broken for this type).

### 7.2 His notes against the spec
| his note (§56) | the spec today | the gap |
|---|---|---|
| (4) increments: plates are not any weight | TR-02: 2,5 kg from 20 kg, else 1 kg; dumbbells by the rack | one global step; not his gym's real steps per exercise |
| (4) one side at a time, or both sides with the load split in two | TR-01 side sx/dx; TR-02 «totale · per manubrio · per lato» as typed | `unilateral` is yes/no; «split in two» is a typing choice per set, not a fact of the exercise |
| (4) muscle groups | TR-03, TR-25 read `muscleGroups` | a free text, no primary/secondary weight on the page, not editable from the app |
| (4) warm-ups how, when, how much | TR-03 generated ramp | not shown on the exercise, not set per exercise |
| (4) rest per exercise | TR-10…TR-13 (learnt, then defaults) | set only inside the gym; its source not on the exercise |
| (4) adjusted in the session to the moment | TR-26 context, TR-33 readiness | partial; nothing changes the plan for the day except readiness |
| (1) sets and reps from the first session only, sometimes absurd | TR-30/31: reps and load from the **last** session only (the one before only for a step down); sets = the more of the last two | **confirmed, 7.5** |
| (1) progress measures strange | TR-20…24 | TR-20 comparable and TR-23 records not built; TR-21 adds RIR |
| (7) Andamento almost missing | TR-24 trend, TR-50 voto | Andamento shows counts only: no per-exercise trend, no voto over time |
| (6) periodisation of groups of blocks | PL-, ciclo (MOD-33) | a ciclo repeats steps; no phases (e.g. 4 weeks build, 1 light) |

### 7.3 Target — the same three levels as §2
| type | row value | doors when open | children (MOD-21) | form | verbs |
|---|---|---|---|---|---|
| esercizio | best e1RM or the last top set | Andamento (trend chart, records, comparable) · Carico (kind, steps, sides) · Muscoli (primary · secondary) · Riscaldamento · Recupero · Sessioni (each a row) · Usato in | its varianti | `ObjectForm` from the registry, every field above declared | crea · parti da · variante · unisci · archivia |
| scheda | n esercizi · last done | Esercizi (each an esercizio row whose value is the sets × reps planned) · Volume per muscle (TR-25 fascia) · Durata (TR-37) · Sessioni | its varianti | `Composer` (the one editor of lines) | crea · parti da · variante · unisci · archivia · inizia |
| sessione (voce) | voto | the same doors as its scheda, plus each exercise's sets done vs proposed, context (TR-26) | — | the gym (PAT-63) | fatto · riprendi · salva nella scheda · elimina |

The gym itself (his notes 2 and 5) is a design he judges on photos: not drafted here; it comes
after he settles 7.4, shown one screen at a time (design.md rules 1–2), with the layout check
of `e2e/layout.ts` run on it (his «un controllo obbligatorio»: it exists for 5 pages; the gym
is not one of them).

### 7.4 His to settle (Claude's pick first)
1. **The exercise's facts move into the registry** (pattern, equipment, muscles, sides, steps,
   rest, setup, warm-up), so its form and page are generated. (a) yes *(recommended: MOD-01;
   ends the one-off settings link)* · (b) keep them in `core/training` and add a page section.
2. **Load steps.** (a) per exercise, defaulting from its equipment (bilanciere 2,5 kg, manubri
   the rack, macchina 5 kg / its own, cavi 2,5) and editable *(recommended)* · (b) one list per
   gym, chosen per exercise.
3. **Sides.** (a) three values: both together · one side at a time (each side its own set, TR-13)
   · both, load per side (the total = 2 × typed) *(recommended: his three cases)* · (b) keep
   yes/no and the per-set typing.
4. **Muscles.** (a) a primary and up to three secondary from a fixed list, secondary counted
   × 0,5 as TR-25 already does *(recommended)* · (b) free text as now.
5. **Order of work.** (a) first check his note (1) on his data and fix what is wrong (a bug,
   no design); then 1–4 as one model change; then the exercise box (7.3) in the Elenco; then
   the gym on photos; then Andamento *(recommended)* · (b) the gym first.

### 7.5 His note (1), checked 17 Nov (`adviseExercise`, made-up histories, no data of his)
| he did | the app proposes next | why |
|---|---|---|
| curl 8–12: 10, 9, 8 × 14 kg | 9, 8, 7 × 14 kg | TR-30 puts the weakest set + 1 (9) on the **first** set, then TR-31 takes the drop off again: the drop counts twice, so the plan is below what he did |
| press: 12, 11, 10 × 60, then 10, 9, 8 × 60 | 9, 8, 7 × 60 | only the last session counts for reps and load (his «solo sulla prima scorsa») |
| press: six sessions of 10, 9, 8 × 60 | 9, 8, 7 × 60, for ever | the same double count: he never gets a plan above what he does |

So the spec rule itself (TR-30 + TR-31) is wrong, not only the code. Proposed fix, his to pick
(question 6): the first set aims at **his last first set at that load + 1 rep** (up to the top of
the range), each next set loses his learnt drop; the load goes up when every set reached the top
in **both** of the last two sessions (one good day is not enough); a session clearly worse than
the one before (another context, TR-26) does not lower the next plan.

6. **TR-30/31 fix** as just written. (a) yes, with a test per row of the table above
   *(recommended: it is a formula, cheap to undo, and the table proves it)* · (b) another rule.
