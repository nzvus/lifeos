# v2 — Content: words, formats, judgements and the states of a screen

Decided 2026-10-16. After icons and shapes, the developer asked whether
the same method should cover navigation, content, formulas, data and
more. It pays only where the same choice repeats on many screens and has
already drifted. Navigation (flows.md), formulas (engines.md) and data
(the one `DATA` block) already have their system; words, number formats,
judgements and the states of a screen did not. The boards had 16
hand-made decimal commas, 8 local formatters, 19 status colours named
by pages and the score thresholds copied into two components, and a
date had already come out as the wrong weekday. This file refines the kit
(kit.md) inside ADR-0054; no new ADR.

**Principle.** A page passes raw values (numbers with their unit, ISO
dates, a score, a state) and the kit turns them into text and tone. The
same thing is always written the same way.

## 1. Formats: one formatter (`F`)

| What | Rule | Examples |
|---|---|---|
| Numbers | decimal comma, thousands dot, minus sign "−" | 1.738 · 75,6 · −0,4 |
| Decimals | by unit: kg 1, g 1 under 100 and 0 above, kcal 0, mg 0, % 0, € 2, l 1, ml 0; trailing zeros dropped (not for €) | 37,7 g · 212 g · 0,2 g · 3,50 € |
| Units | a non-breaking space before the unit, fixed symbols | 75,6 kg · 30 % · 22 °C |
| Value of a target | value / target unit | 103 / 159 g |
| Signs | + only for a change | +262 kcal · −0,4 kg/sett. |
| Approximate | ≈ before the value | ≈ 70 mg |
| Ranges | en dash, the unit once | 10–35 % · 7–9 h |
| Durations | a clock for timers, h and min otherwise | 1:35 · 1:02:05 · 6 h 02 · 55 min |
| Dates | always computed from the ISO date, never typed | giovedì 15 · 15 ott · 15 ottobre · sett. 42 · G |
| Counts | the number and the right form | 1 passo · 4 passi |

`F` lives in one source (`boards-tools/fmt.js`; `packages/kit` in v2)
and is built into every board that formats, as `Glyph` holds the icon
registry. It also holds the judgement scale (§3).

## 2. Words

**One word per concept** (the app's Italian, as on the boards):

| Concept | Word | Not |
|---|---|---|
| a logged item | voce | record, log |
| a planned slot | blocco | slot, evento |
| a reusable plan | modello (di blocco, giornata tipo, settimana tipo) | template, preset |
| a sequence of models | ciclo | programma, piano a rotazione |
| a gym model | sessione | routine, workout |
| a recurrence | abitudine | routine |
| what happens to a planned item | previsto · fatto · saltato | pianificato, completato |
| a 0–100 judgement | voto | punteggio, score |
| the places | Oggi · Piano · Aggiungi (⊕) · Andamento · Libreria · Impostazioni | Home, Dashboard, Storico |
| catalog items | cibo (ingrediente, prodotto) · pasto · ricetta · esercizio | alimento, food |
| the stock | dispensa · scorta · lista della spesa | inventario |

**Microcopy:**
- **Buttons:** the verb of the action, as an infinitive or an imperative
  ("Salva", "Aggiungi alla spesa", "Chiudi la giornata"), never "OK" or
  "Conferma". A destructive button names what it destroys ("Elimina il
  modello").
- **Section titles:** nouns ("Pasti", "Gli ultimi giorni").
- **Meta line:** what, how much, where from ("dalla dispensa · aggiungilo
  alla spesa").
- **Errors:** what happened, then what to do ("Non salvato: sei offline.
  Riprova quando torni in linea"). Never blame the user, no codes.
- **Tone:** "tu", short sentences, no exclamation marks, no emoji.
- **Help under a field:** one line saying what the value means or where
  to find it, not what the field is called.

## 3. Judgements and states

- **One scale for every score** (engines.md E7):

  | Level | Score | Mark | Label (screen reader) | Tone |
  |---|---|---|---|---|
  | met | ≥ 70 | filled dot | raggiunto | herb |
  | part | ≥ 40 | half dot | in parte | warn |
  | no | < 40 | ring | non raggiunto | tomato |
  | none | no score | none | nessun voto | — |

  `F.judge(score)` returns the level, the mark class, the labels and the
  tone. Box, DateNav, Skyline and Scores call it; nobody else compares a
  score with 70 or 40.
- **Against a ceiling or a target:** `F.cap(v, max)` (sugars, salt,
  caffeine: over the max is bad, over 85 % is warn) and `F.reach(v, t)`
  (a micro, a goal: reached is good, half is warn) return a state.
- **Status colours mean one thing each:**
  - herb: good, or the primary action;
  - warn: attention;
  - tomato: error, or destructive.
  
  A page passes the state (`good · warn · bad · danger · info ·
  muted`); `F.tone(state)` gives the colour. Status is never only
  colour: it also has a mark, a word or a shape.
- **Provenance** (the pills of icons.md §4):
  - "stima": a value the app computed;
  - "da confermare": a value read from a label or a receipt;
  - "modificato": a value changed by you (the field's herb dot, shapes.md §5);
  - the source: where it comes from.
  
  A value shows at most one of them, the strongest.

## 4. The states of a screen

| State | When | How |
|---|---|---|
| Empty | nothing yet (no meals, no goals, a new tracker) | `k-empty`: the domain glyph at xl, what is missing, one action to fill it ("Aggiungi un pasto") |
| Loading | data on its way | `k-skel`: the shapes of the level that will come (card, row, line), never a page spinner; a button that waits is busy (shapes.md §4) |
| Error in a field | a value out of range or malformed | the field's error (shapes.md §5) |
| Error saving, offline | the change did not reach the server | `k-banner` at the top of the page, warn or bad, with "Riprova"; what was typed stays |
| First use | a place opened for the first time | the empty state plus one line on what the place is for; never a tour |
| Undo | anything that can be redone: an entry removed, a block skipped, an archive | `k-toast` above the NavBar for 5 s: what happened + "Annulla" (flows.md §3) |
| Confirm | only what cannot be undone: emptying the trash, deleting a model others use, deleting the account | a sheet (L1) asking the question in words, "Annulla" + the destructive verb in tomato |
| Toast | a result elsewhere ("Aggiunto alla spesa") | one at a time, above the NavBar, no action unless Undo |

## 5. Navigation: what is checked

flows.md stays the rule. The content audit adds two checks:
- every screen is reachable from one of the five places;
- every link points at a board that exists (check.py already does this).

## 6. In the kit and on the boards

- `F` is built into every board that formats or judges: the kit
  components and all the pages. Pages pass raw values.
- Classes: `k-empty`, `k-skel`, `k-banner`, `k-toast`, and
  `k-btn primary danger` for a destructive confirm.
- The "Testi e stati" board, next to "Icone" and "Forme", shows the
  formats, the words, the judgement scale and the states of a screen,
  with right and wrong.
- **Audit** (`boards-tools/content_audit.py`), on the sources:
  - formatting outside the kit;
  - banned words in visible text;
  - status colours or thresholds named by a page;
  - a weekday that does not match its ISO date;
  - screens no place reaches.
  
  Since the rollout (2026-10-16) it is at zero and runs with `max 0`,
  like the shapes audit.
