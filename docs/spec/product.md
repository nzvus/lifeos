# lifeos — product (the constitution)

Status: **approved 2026-11-06** (PROD-44, ADR-0061). With `model.md` and `patterns.md` it
replaces, as the source of truth, the v1 spec
(`docs/archive/spec-v1/01–08`), `docs/archive/spec-v2/*`, the dossiers' «decided» parts and the ledger's D lines.
Those are archived in `docs/archive/` (phase 2b, 6 Nov) as sources; where each ledger line went
is in `audit-2026-11/fold-*.md`. Domain rules: `domains/` (food, training, body, plan, data);
the look: `visual.md`.

Each rule has an ID that tests, PRs and changes cite (`PRD-07`). The source in brackets is a
ledger ID, a phase 1 answer (`n06`, `c11`, `x03`: `audit-2026-11/needs.md`) or a document.

## 1. What lifeos is
- **PRD-01** One person's app to log and understand the day: food, training, body, sleep, mind,
  money. It is temporally aware: everything is an entry in time, judged against his goals.
  [PROD-01…14, ADR-0053]
- **PRD-02** **The core is what he uses**: meals, coffee and creatine, gym, weight, sleep, steps,
  water (17 Oct → 4 Nov data). A pattern is proven on the core before a domain grows; a domain
  without data gets no new structure. [n13, needs §0]
- **PRD-03** Every macro- and micro-function is an instance of a few horizontal mechanisms
  (`model.md`, `patterns.md`). A new kind of thing is a registry entry, never a new page or a
  new engine. [PROD-36, PROD-41, PROD-42]

## 2. Principles (each has a check in `patterns.md` §9)
| ID | Principle | Source |
|---|---|---|
| PRD-10 | One object, one page, the same actions | P1, n03 |
| PRD-11 | Edit where you read; it saves itself; «Salva» only while composing | P2, c11 |
| PRD-12 | The whole surface is the target, never under 44 px; named exceptions only: 36 px controls inside a 44 px row, calendar cells 36 × 46 at 320 px (his pick 6 Nov) | P3, UI-89 |
| PRD-13 | Decisions first: daily tasks in less than one screen | P4 |
| PRD-14 | One primary action per screen; one form per verb | P5 |
| PRD-15 | Lists and search from the kit | P6 |
| PRD-16 | One map: five areas, the same four tabs everywhere | P7, ADR-0059; to be replaced by ADR-0063 (change `2026-11-14-five-places`) |
| PRD-17 | Visible responses in his words; 24 h times | P8 |
| PRD-18 | System first: screens are composed from patterns, never drawn | P9, n12 |
| PRD-19 | Everything one tap away, never everything in view; two levels at most, three only for the weather and the week strip (his pick 6 Nov) | c01, n12, UI-76, UI-80 |
| PRD-20 | Fewer numbers, each with its «Perché?»; a number that serves no decision goes | n05, UI-73 |
| PRD-21 | Context shown beside the fact, never folded into the number | n08, c02 |
| PRD-22 | Never invent data: assumed values are low-confidence and stay out of trends until confirmed | c09, DATA-14 |
| PRD-23 | No judgement without coverage: below the threshold the app says «non so» | n11 |
| PRD-24 | Time is the container; roles and pre/post are derived labels | n04, c03 |
| PRD-25 | Engines are horizontal: progress, advice and prefill work on every kind | PROD-41 |
| PRD-26 | Every claim with a source (guideline, meta-analysis, convention), shown in its «Perché?» | PROD-29 |
| PRD-27 | No AI in the app for now; deterministic sources only (barcode, OFF) | PROD-24, c10 |
| PRD-28 | Dark first; one theme until the patterns are done | UI-74, x14 |

## 3. Words (one word, one sentence; UI in Italian)
| Concept | Word | Sentence | Not |
|---|---|---|---|
| a thing logged in time | **voce** | «una cosa fatta, a un'ora» | record, log |
| state of a voce | **previsto · fatto · saltato** | — | pianificato, completato |
| a thing you reuse | the type's own name: **cibo, prodotto, pasto, esercizio, scheda, tragitto, tracker** | «una cosa che riusi» | oggetto, item |
| a gym session model | **scheda** | «gli esercizi di una sessione» | routine, modello, workout |
| a gym visit | **sessione** | «quando ti alleni» | allenamento (as object) |
| something planned that repeats | **blocco** | «cosa, quando, ogni quanto» | modello, giornata tipo, settimana tipo |
| blocks that advance one by one | **ciclo** | «una scheda dopo l'altra» | programma |
| the plan of an area or of all | **Piano** (tab) | «cosa ti aspetta» | routine |
| a 0–100 judgement | **voto** | — | punteggio, score |
| a range with a source | **fascia** | «il minimo, il buono, il massimo» | range, soglia |
| a number the app computed | **stima** (pill) | «calcolato da …» | — |
| the areas | **Corpo · Cibo · Oggi · Mente · Soldi** | — | places, Libreria |
| the four tabs | **Diario · Piano · Elenco · Andamento** | — | — |

**abitudine** = a blocco whose object is a tracker («bere 2 l ogni giorno»): same structure,
its own word because he recognises it (PROD-45). Words outside this table fail the glossary test.
[CONTRA-04, PLAN-33, TRAIN-37, content.md §2]

## 4. Not now (his answers x01–x15, 6 Nov)
Receipt reading · bank/PayPal import and monthly reports · a pantry that plans (expiry,
places, minimums) · plan layers with cross rules · step windows and a vertical movement layer ·
the mean across brands and formats inside meals · macros judged by absorption beyond DIAAS ·
chosen correlations, recovery and readiness scores · hunger 1–5 · adjustable score weights ·
weather saved as entries · several users, friends, packs · Obsidian, home automation, rewards ·
themes beyond dark · goals with no data (log them or remove them). Each comes back only as a
`changes/` proposal with data that asks for it. [PROD-40]

## 5. How the spec works
- **PRD-40** Three horizontal files (`product`, `model`, `patterns`) + `domains/<area>.md` for
  rules and formulas only. A rule lives in one file; others cite its ID. [PROD-37, PROD-39]
- **PRD-41** A change is a folder `docs/spec/changes/YYYY-MM-DD-name/` with `proposal.md`
  (why, his words), `delta.md` (requirements ADDED / MODIFIED / REMOVED, WHEN/THEN) and
  `tasks.md`. Approved → built → the delta is merged into the spec and the folder moves to
  `changes/archive/`. One change open at a time. [PROD-38, OpenSpec model]
- **PRD-42** A requirement is «built» only when a test cites its ID. `check.py` reads «Today:
  built» in the spec (in `patterns.md`: a kit ✓ with no ✗) and fails when no test under
  `src`, `e2e`, `eslint`, `packages/kit` or `scripts` names the ID, unless the ID is in
  `docs/spec/untested.txt` (the baseline of 6 Nov, which may only shrink: a tested or unbuilt ID
  listed there fails too). ADRs stay for expensive choices and cite the requirement IDs they
  decide. — Today: built (`scripts/check.py`, `scripts/guards.test.mjs`).
- **PRD-43** His words still become a line at once: in the open change's `proposal.md`, or, with
  no change open, in `changes/inbox.md`. The ledger is archived at the end of phase 2b.

## 6. Process (CLAUDE.md «Process rules» is the operational copy)
- **PRD-50** Decide per pattern, never per screen; a screen remark changes a pattern or is
  dropped with a reason. [PROD-39]
- **PRD-51** «Procedi senza di me» covers details inside the approved spec only; a new pattern,
  type, word or expensive choice is a question. [PROD-39]
- **PRD-52** Adding a document removes or archives one. [PROD-39]
- **PRD-53** Rule of three: a shape used a third time becomes a kit piece; a copy-paste detector
  keeps it honest: `jscpd` on `src` and `packages/kit/src` inside `npm run lint` (CI),
  failing when duplicated lines rise above `scripts/cpd-baseline.json` (909 on 6 Nov) or drop
  without the baseline lowered. [c12, PROD-43] — Today: built (`scripts/cpd.mjs`).
