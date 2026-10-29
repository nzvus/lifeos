# v2 — Interaction: nine principles, the patterns that keep them

Decided by ADR-0058 (2026-10-25). The design study of 25 Oct
(https://claude.ai/artifact/Fjd7fC38yDZbC1BCSWwd9x) measured 30 real
tasks on the app: 10 had no way to be done, 15 had a hard step, 44 % of
the tap targets were under 44 px, and «aggiungi» took 11 forms. The causes
were systemic: no object model, reading and editing apart, small and hidden
targets, page order against task order, no action hierarchy, lists without
structure, no map, weak feedback, and pages assembled slice by slice. The
developer confirmed the nine principles below. flows.md says where each
object lives; shapes.md and content.md say how a control looks and speaks;
this file says how a person acts on things, and every screen follows it.

## 1. The principles, each with its check

| | Principle | Checked by |
|---|---|---|
| P1 | One object, one page, the same actions | the CRUD matrix (§3) is complete for every object in flows.md §3 |
| P2 | Edit where you read; one way to save per page | no page has two save buttons; no object has a separate «Modifica» page |
| P3 | The whole surface is the target, never under 44 px | 0 targets under 44 × 44 outside text links in running prose |
| P4 | Decisions first | daily tasks (§6) need less than one screen of scroll |
| P5 | One primary action per screen; one form per verb | ≤ 1 `primary` per screen; each verb of §4 in its one form |
| P6 | Lists and search from the kit | no list renders more than its window (§5) without «Mostra altri»; every search is `Find` |
| P7 | One map of places | every page is reachable from its place (§7); «‹ parent» names the parent |
| P8 | Visible responses, your words | every action shows its result where it was tapped; times 24 h; no system word without its sentence |
| P9 | System first | pages are composed from the patterns below; the checks run on every PR (§8) |

## 2. The object page (`ObjectPage`)

Every object of flows.md §3 that persists (food, product, format, saved
meal, exercise, routine, cycle, day type, habit, route, tracker kind, goal)
has one page, built the same way, top to bottom:

1. **Header**: «‹ parent» (the place's list it belongs to), the object's
   glyph and name, one line of what it is and how often it is used.
2. **What matters first**: the one or two facts the object exists for
   (a food: per 100 and its score; a cycle: today's step and the next; a
   goal: progress and pace).
3. **Sections**, each a fold whose whole header row opens it, in the
   order the person needs them. Every value in a section is shown as it
   reads and changes in place (§3).
4. **The object's actions** at the end, always the same row: «Parti da…» ·
   Archivia · Elimina (§3), the last two with Undo. «Parti da…» opens a
   new object filled from this one, already renamed and editable: the
   person builds from a base and never gets a silent copy to tidy up (no
   «Duplica»).
5. **The bar** (NavBar), as on every page that is not a sheet or a
   running mode (gym).

A new object opens the same page empty, with the minimum fields first
(§4 «Crea»); nothing else differs between creating and editing.

## 3. Reading, editing, removing

**Edit in place.** A value is a row: tapping anywhere on it turns it into
its field (Field, with the row's label), right there. The page saves:
- **objects** (catalog, templates, goals): each change saves when the
  field is left, with a toast «Salvato · Annulla» (content.md §4). No
  «Salva» button on an object page.
- **a new entry being composed** (a meal in the composer, a set in the
  gym): one sticky primary «Salva» / «Serie fatta» at the bottom, because
  the entry does not exist until then.

**Removing, the same for every object:**
- **Archivia**: out of lists and pickers, kept in history; Undo; restored
  from Impostazioni → Archiviati (one list for every object kind).
- **Elimina**: only when nothing refers to it (no entry, no template,
  no recipe); it goes to the trash for 30 days, with Undo, like entries.
  When something refers to it, the button reads «Archivia» and the line
  under it says why («usato in 12 pasti: lo archivio, così i pasti
  restano»).
- **Entries**: Elimina with Undo (as today), from the entry's own sheet
  and from the row's swipe.

**The matrix every object must fill** (P1):
Crea · Leggi · Modifica sul posto · Parti da… · Archivia · Elimina (se non
usato) · Ripristina. A missing cell is a bug, not a later slice.

**Reversibility decides the form of an action.** Every action is put in
one of four classes, and the class, not the screen, decides how it is
reached and confirmed:

| Class | Example | Form |
|---|---|---|
| Free (nothing lost) | open, filter, move between exercises | one tap anywhere |
| Undoable | log an entry, tick a set, archive, delete an entry | one tap, then the toast «… · Annulla» (5 s) and a way back from the object itself (reopen, restore) |
| Consequential (ends or changes several things) | finish a session, shift a cycle, change a day type | a secondary button that opens a summary sheet of what will change; the primary action is inside the sheet, and the result can still be reopened |
| Irreversible | empty the trash, delete an account | in Impostazioni only, typed or held confirmation |

Rules that follow: a consequential action is never the primary button of
a running mode or the bottom-most target of a page; nothing is
irreversible from Oggi, ⊕ or a running mode; a repeated identical log
within a few seconds (two taps on «Acqua») shows the first as done and
asks before making a second.

## 4. The action vocabulary (P5)

One form per verb, from the kit:

| Verb | Form | Where |
|---|---|---|
| **Aggiungi** (a new thing anywhere) | ⊕ in the bar | everywhere |
| **Aggiungi qui** (a thing into this list or object) | the list's last row «+ Nuovo …», full width, 48 high | the end of its list |
| **Apri** | the whole row or box (P3) | — |
| **Modifica** | tap the value (§3) | in place |
| **Fatto / Salta** (a planned thing) | `act` pills on the row | the row |
| **Salva** (only for something being composed) | sticky primary at the bottom | composer, sheets, gym |
| **Parti da… / Archivia / Elimina** | the object's action row (§2.4) | the page's end |
| **Annulla** (undo) | the toast's action, 44 high | above the bar, 5 s |
| **Indietro** | «‹ parent» in the header | every sub-page |
| **Altro** (rare actions of a row) | «⋯» opening a sheet of actions | the row's trail |

Removed: «›» as the only link of a row; «Modifica» as a separate page;
«X», «×», «↑↓» as row controls (a drag handle ↕ and the row's «⋯» take
their place).

## 5. Lists (`List`) and search (`Find`)

- **Window**: a list shows 8 rows, then «Mostra altri (n)»; a page that
  is the list itself (Libreria → Cibi) shows 20 and loads more on scroll.
  Never every row at once.
- **Above the list**: `Find` (find.md §6), then the filter chips, then
  the sort as a chip («Più usati ▾»), then the reason line («107 cibi · i
  più usati per primi»).
- **Groups**: by the collection's group (food group, moment, muscle) with
  a count; a group folds.
- **The row**: Box `density="row"`, whole row tappable (P3), the value
  on the right, «⋯» for its rare actions.
- **Empty**: content.md §4 «Empty», with its «+ Nuovo …».

## 6. Decisions first (P4)

Each task's screen puts first what the person decides first; the long
content comes after.

| Task | Order on screen |
|---|---|
| Log a meal (16 a day) | when (Adesso · ora) and which meal (from the time, changeable), then the saved meals and foods, then the totals |
| Correct a logged entry | its sheet opens on the field that is changed most (grams, time) |
| Log water, coffee, creatine | one tap on Oggi's row or from ⊕'s first screen |
| Gym | where I am (exercise n of N), the set to do and how, «Serie fatta»; the rest below; «Finisci…» opens a summary (§3, consequential) |
| A day in Piano | the day's plan and its actions (Riposo · Salta · Sposta · Slitta · Cambia la giornata) as one row each |

The meal's moment follows the time by default, from ranges set in
Impostazioni → Pasti; changing it by hand keeps it. Oggi groups meals of
the same moment only when they are next to each other on the timeline,
with nothing between them and at most 60 minutes apart.

## 7. The map of places (P7)

flows.md §1 stays, with these homes made explicit:
- **Oggi**: one day.
- **Piano**: what repeats, for everything (meals, sessions, habits,
  trackers), on shelves: Calendario; Giornate tipo (and the week layout);
  Cicli; Routine (the sessions a cycle uses); Pasti tipici (a saved meal
  or a rotation); Abitudini; Tracker (what to log and when).
- **Libreria**: what you use: Cibi (with products and formats), Pasti,
  Esercizi, Dispensa, Tragitti, Tipi di tracker.
- **Andamento**: the past and its numbers, Soldi, Obiettivi.
- **Impostazioni**: you, the app, Archiviati, Cestino.

A sub-page's «‹ parent» is its list in its place, never «Indietro»; the
bar shows on every page except sheets and running modes.

## 8. The checks (P9)

A script (`scripts/ui-check.mjs`, Playwright at 390 px on the local
database) runs on the PRs that touch UI and reports per page:
- targets under 44 × 44 (P3);
- primary buttons (P5);
- forms per verb found in the DOM (P5);
- lists longer than their window (P6);
- scroll needed to reach each daily task's first control (P4);
- the 30 tasks of the study, with taps, screens, fields and dead ends:
  a PR may not make a task longer or turn a done task into a dead end.

## 9. In the kit

New parts: `ObjectPage`, `Section` (fold with a whole-row header),
`ValueRow` (read ↔ edit in place), `List`, `Find`, `ActionRow`, `Toast`
with Undo, `MoreSheet` («⋯»). Box changes: the whole box opens or
follows its link (P3); `act` and «⋯» keep their own taps. kit.md lists
each part with its board when it is drawn.
