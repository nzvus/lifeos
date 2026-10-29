# Design register — what the redesign keeps, decides and must not lose

Phase A of the redesign (handoff §8, approved 2026-10-26). One row per
decision already taken somewhere: what it is, where it was decided, whether
v2 has it today, and how it stays in the redesign. **Every board of phase B
cites the rows it follows** (a line «Registro: S3, S7, C2, B1…» in its notes),
and every PR of phase D says which rows it builds. A row changes only by a new
decision written where the row points.

Status words: **sì** (v2 has it and it stays), **parziale**, **no** (to build),
**da rifare** (exists but against the row).

## P — Principles (confirmed by the developer, 25 Oct; `interaction.md` §1)
| ID | Decision | Where | v2 today | In the redesign |
|---|---|---|---|---|
| P1 | One object, one page, the same actions everywhere | interaction.md §1, ADR-0058 | parziale: 74 pages, «Aggiungi» in 11 forms | each object type gets one page pattern (C7) |
| P2 | Edit where you read, one way to save | interaction.md §2, ADR-0015 | parziale | ValueRow (C3) edits in place; no «Modifica» pages |
| P3 | The whole surface is the target, never under 44 px | interaction.md §3, shapes.md (44 px rule) | no: 44 % of targets < 44 px, 496 are the «›» | Box whole-surface target (C1); the «›» goes |
| P4 | Decisions first: the page in the order of the task | interaction.md §4 | parziale (composer's role at 2 500 px) | page order from the task's first decision |
| P5 | One primary action, one form per verb | interaction.md §5 | no: 31 pages without a primary action | ActionRow (C4): one primary, verbs from C10 |
| P6 | Lists and Find from the kit | find.md, interaction.md §6 | parziale: Find only in Libreria | List + Find (C5) on every list > 8 rows |
| P7 | A map of places | ADR-0054, screens.md | sì (Oggi · Piano · ⊕ · Andamento · Libreria) | kept; the Map board updated |
| P8 | Visible answers, the person's words, 24 h times | content.md, interaction.md §8 | parziale (01:45 PM in Piano) | Toast (C6) after every change; `F.time` only |
| P9 | System first, rules checked by a script | interaction.md §8 | no: `scripts/ui-check.mjs` missing | write `ui-check.mjs` (30 tasks, targets, words) before phase D |

## S — The system that exists: keep it all (handoff §5)
| ID | Decision | Where | v2 today | In the redesign |
|---|---|---|---|---|
| S1 | Tokens and one scale of shapes (radius 0–20, space 0–32, font 12–40) | shapes.md §2, kit.css | sì | kept; the shapes audit at 0 on every board |
| S2 | One colour per meaning; fixed hues for macros, moments, muscles | kit.md, tokens.css | sì | kept; themes (T) change the ground, not the meanings |
| S3 | Barlow + Barlow Condensed | tokens.json | sì | kept as the default theme's faces |
| S4 | Domain silhouettes (plate, cup, bite; notched bar; moon; tag; receipt; cloud; capsule; drop; calendar) | kit.css `.k-shape` | sì | kept on Box (C1) |
| S5 | Planned things are hatched | kit.md | sì | kept, everywhere a thing is planned |
| S6 | The drawing in the box (`k-art` a1/a2) grows ≈ 1.9× on open | kit.css | sì | kept |
| S7 | The time rail 20 → 64 px | ADR-0050, kit.css | sì | kept on Oggi |
| S8 | Buttons by role and their states; segmented → menu past 4 options | kit.md | sì | kept; verbs from C10 |
| S9 | Glyph: Tabler 3.19 + own drawings, 4-level resolver, 18 food groups, dishes, 36 movements, corner mark, sizes with thinning stroke, domain backdrop 320 px at 6 % | icons.md | sì | kept; pages pass data, never icon names |
| S10 | `F`: decimal comma, «−», decimals by unit, no-break space; judgement scale 70/40 (`judge`, `cap`, `reach`, `tone`) | content.md, kit `format.ts` | sì | kept; no page formats a number itself |
| S11 | Nutrients L0, L1 (macro icons that grow and turn); L2 the window | kit.md | parziale: L2 without the foods as highlighted chips | L2 complete (foods highlighted in every bar) |
| S12 | Ranges: ruler under the bar, tip coloured by the band (25 Oct «C + D») | memory heat-strip-design, kit.md §4 | sì | kept (kit.md §4 already says it) |
| S13 | Score chip in the box's head | kit.md | sì | kept, restyled (D2) |
| S14 | Week strip, 4 thin bars a day | DateNav | sì | kept, thinner (D3) |
| S15 | Weather card (animated icon, temperature trace, hourly curve, air quality, light arc) | WeatherCard | parziale: fixed hex colours | colours from tokens |
| S16 | Chart (trend, bands, bars) | kit Chart | sì | kept; one chart frame |
| S17 | One animation time, reduced motion respected | kit.css | sì | kept |
| S18 | `k-empty`, `k-banner`, `k-toast` with Annulla, swipe to delete | content.md §4 | parziale: `k-skel` unused | every list has its empty state, every load its skeleton |
| S19 | The skyline behind the box was rejected: it is drawn when the box opens | kit.md, screens.md | sì (kit.md table fixed 29 Oct) | kept |
| S20 | From v1, to weigh again: ConcentricRings (overflow lap dashed), MacroStrip, NovaBar, ChartFrame (scrolls from the right), ExerciseIcon | v1 `src/ui` | no | each one a board option in phase B, kept only if chosen |

## C — Components the redesign adds (handoff §8 phase B, ADR-0058)
| ID | Decision | Where | v2 today | In the redesign |
|---|---|---|---|---|
| C1 | Box: the whole surface is the target; the «›» goes | P3, interaction.md §3 | no | first board of phase B |
| C2 | Undo, not confirm, for what can be undone; a summary sheet for what has consequences | interaction.md §3, ADR-0015 | parziale (gym, ⊕, Oggi have «Annulla») | one rule in every flow |
| C3 | ValueRow: a value read and changed in place | P2 | no | kit component |
| C4 | ActionRow: «Parti da… · Archivia · Elimina» at the bottom of an object | P5, memory no-duplicate-start-from | no | kit component; never «Duplica» |
| C5 | List with Find (typo, alias, sort with its reason) | find.md | parziale | kit List; aliases from «Unisci» found |
| C6 | Toast: what happened, with «Annulla» for 5 s | content.md §4 | parziale | one component, one duration |
| C7 | One page pattern per object: head, values, history, ActionRow | P1 | no | used by food, meal, exercise, routine, model, tracker |
| C8 | «⋯» MoreSheet for an object's secondary actions | ADR-0058, session.md §6 | parziale (gym «Poi» inline row) | one sheet component |
| C9 | A summary page before a consequential action (Finisci, Unisci) | session.md §6, capture.md §4 | parziale (Finisci sheet, Unisci page) | one component |
| C10 | One word per verb: Aggiungi, Fatto, Salta, Annulla, Parti da, Archivia, Elimina, Unisci, Riprendi | content.md §2 glossary | parziale | the glossary checks every board (content audit) |

## B — Behaviour decided in the dossiers (keep it when the screens are rebuilt)
| ID | Decision | Where | v2 today |
|---|---|---|---|
| B1 | «Fatto» at the time of the tick; the planned time kept | capture.md §4 (0b) | sì |
| B2 | The meal's role stored from the time unless chosen; pre/post-workout as labels, not roles | capture.md §4, handoff §6 | sì |
| B3 | Coffee, creatine, supplements are «assunzioni» (`intake`) | capture.md §9.0, ADR-0038 (supplements are food) | sì |
| B4 | ⊕ ranks: «Per te», at most 8 rows; «Tutti i tipi» grouped | capture.md §5 | sì |
| B5 | «Unisci» duplicates; the other kept as an alias, never deleted | capture.md §4 | sì |
| B6 | A gym session: states prima · riscaldamento · serie · pausa · riepilogo; resume from saved instants; Wake Lock | session.md §5.6, board «Sessione — gli stati» | sì |
| B7 | Generated warm-ups from the person's ramp | session.md §5.1 | sì |
| B8 | «Poi»: Fai dopo, Cambia, In superserie, Salta, each undoable; the order effect said | session.md §5.2 | sì |
| B9 | «Finisci…» opens the summary; a finished session «Riprendi» | session.md §6 | sì |
| B10 | Activity after the fact (minutes, km, pace, effort); steps as the phone's total | activity.md | sì |
| B11 | Each session's and the steps' burn as a range; the day's «finora · a fine giornata»; hours on feet as a number | energy-day.md | sì |
| B12 | Targets weekly from the 7-day mean; a day never changes the macros | targets.md §9 | sì |
| B13 | Every estimate is a range, ≥ ± 15 % | energy-day.md §3 | sì |
| B14 | Trash 30 days, a parent takes its children | data-repair.md, #296 | sì |
| B15 | Meals grouped only when neighbours ≤ 60 min apart, nothing between | interaction.md §6 | sì |
| B16 | The Piano organizes everything: meal blocks, typical meals, routines, habits, trackers, relative times | handoff §6, memory plan-everything | no → phase C |

## D — The developer's graphic choices (db `choices`, 24–25 Oct)
| ID | Choice | v2 today | In the redesign |
|---|---|---|---|
| D1 | Ranges: C + D, «combina C e D e dammi altre opzioni» | sì (C + D) | two more options on the Nutrients board |
| D2 | Score: C, but «graficamente fanno schifo» | parziale | a new score chip, options from real components |
| D3 | Week: C, thinner, transparent, no horizontal bar | parziale | thinner bars, no base line |
| D4 | Weather: B, opening to A, with weather-like drawings and motion | parziale | kept; tokens instead of hex |
| D5 | Meals: C, a nutrition label that adds up and, opened, shows the contributions like the day; an intuitive way to change meals | parziale | the meal box board |
| D6 | Score criteria: carb and fat quality, satiety, variety, timing, protein spread; «forse cambiare tutto il design» | parziale (meal-score.md) | criteria on the Scores board, redrawn |
| D7 | Gym: A, «se puoi migliorala» | sì (board «Sessione — gli stati») | the session screen rebuilt from it |

## N — The developer's notes still to cover (considerations.txt, handoff §7)
| ID | Note | Status |
|---|---|---|
| N1 | Gym in auto mode, setup delay, sensible side and warm-up rests, context-aware advice, non-simplistic progress % | sì (training.md, session.md) |
| N2 | Open meals and foods more modular and compact | no → meal box board (D5) |
| N3 | Multiplier, «aggiorna ai valori attuali» and Elimina at the top of a meal | no → meal page (C7) |
| N4 | Snacks before or after the other meals by time | sì (timeline, B15) |
| N5 | Micros with true optimal bands and limits from sources | parziale (ranges.md) |
| N6 | Quality aggregates and charts; data well collected and used, refinement hierarchies with formulas and sources | parziale |
| N7 | Expenditure gradual and understandable | sì (B11) |
| N8 | One kind of macro bar everywhere | parziale → Nutrients L0–L2 only (S11) |
| N9 | Usable ingredients, portions, times, moments | parziale → composer board |
| N10 | Create from a base («Parti da»), never «Duplica» | parziale → ActionRow (C4) |
| N11 | Barcode that focuses and loads from a file | parziale (V-13) |
| N12 | Smarter pantry, brands, accounts and transactions | parziale (pantry slice a) |
| N13 | The session is not always at 17:30 | parziale (session.md links) → phase C |
| N14 | Estimates saved later in Libreria (pizza, hamburger menu) | sì |
| N15 | Routes compatible with Google Maps | sì (#292) |

## T — Themes and density (plan, A3)
v1 has five themes over one kit (ADR-0010: a theme is a token set plus
replacements for a closed list of slots) and one density setting (ADR-0038:
`data-density` scales spacing and type). v2 has the column `settings.theme`
(default `label`) and `settings.density` (default `compact`) and reads
neither: it only switches light and dark (`app/layout.tsx`).

| ID | Decision | Where | v2 today | Plan |
|---|---|---|---|---|
| T1 | Five themes: Label (EU nutrition label), Quaderno (ivory, blue ink, serif titles), Sport (black and white with lime, capitals), Minimal (no frames), Notte (indigo black, amber titles) | ADR-0010, v1 `src/design/themes/*.css` | no | port each as a token set on `kit.css` (`[data-theme-name=…]`), meanings (S2) untouched |
| T2 | Surface tokens `--panel-*`, `--tile-*`, `--item-*`, `--heading-*`, `--icon-chip-*` | v1 `src/design/theme.css` | no | add to `tokens.css`; Box, Field, Glyph read them |
| T3 | Light and dark per device; the theme per device too | ADR-0010 | parziale (light/dark only) | `settings.theme` is the default, the device can override (localStorage, as light/dark) |
| T4 | Contrast of every text token on every ground ≥ 4.5:1 | v1 `src/design/theme.test.ts` | no | port the contrast test to `packages/kit`, run on every theme × light/dark |
| T5 | One density: compact (default) and comfortable | ADR-0038 | no (column unread) | `data-density` on `<html>` scales `--sp-*` and the type scale; targets stay ≥ 44 px in both |
| T6 | Every board rendered in dark and in one more theme before publishing | memory v2-boards-kit | parziale (dark only) | boards tools get a theme switch (`dark_all.mjs` → any theme) |

Order: T2 and T4 first (tokens and the test), then T1 one theme at a time with
the test green, then T3 and T5; boards render the default and Notte from then
on (T6). This is phase D's «kit first» part; the boards of phase B already use
the token names of T2.
