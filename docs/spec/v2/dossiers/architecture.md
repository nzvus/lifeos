# Dossier — the app's architecture, from scratch (places, what lives where, how it grows)

Status: **decided 2026-10-30 — ADR-0059** (§9: the developer chose a fourth candidate, D, after asking for symmetry). Method: `../method.md`.
Phase 1 of the review (plan `non-ci-siamo-in-memoized-dongarra.md`); phase 0 is on the
canvas «lifeos v2 — revisione» and in `../design-register.md` § V and § L. The choice
here replaces or extends ADR-0054 (the five places) and drives every board of phase 3.

## 1. Question
The developer, 29–30 Oct: «l'app è completamente inusabile, era molto più comprensibile
v1… cercando di migliorare abbiamo peggiorato molto. non si capisce nulla» and «l'idea era
ripensare da capo anche a questo, come riprogettarla al meglio, pensando a tutto quello
che vogliamo implementare, anche in futuro, all'espandibilità… prendendo il meglio dalle 2
versioni». So: which places, what lives in each, where each task starts, and how a new
domain enters without breaking the rest.

## 2. Today
- **v1, by topic** (`src/app/(app)/layout.tsx:28`, ADR-0038): Corpo · Cibo · **Oggi** (centre)
  · Soldi · Mente. Each area has its tabs on top (Cibo: Pasti · Ingredienti · Dispensa ·
  Andamento, `features/nutrition/nav/FoodNav.tsx`; Corpo: Piano · Schede · Esercizi ·
  Progressi, `features/training/nav/TrainingNav.tsx`). Understood: you always know where
  you are and what sits next to it (register V2). Weak: a new domain needs a new area; Oggi
  and the areas repeat the day; the plan of the day lived in two places.
- **v2, by action** (ADR-0054): Oggi · Piano · ⊕ · Andamento · Libreria. One object is
  spread over several places: an exercise is in Libreria (the object), Piano (routines,
  cycles), Andamento (its trend) and the gym (doing it); sub-pages are text links
  («Obiettivi › Soldi › Legami ›») or hidden (register V2). 54 pages, 48 % of targets under
  44 px, 20 pages with no primary action (`scripts/ui-baseline.json`).

## 3. Evidence
- **Bottom bar: 3–5 destinations of equal importance**, the same across screens; more go
  to a drawer or a rail (Android Compose navigation bar; SAP Fiori for Android, M3
  navigation bar usage). G.
- **Apple Health** (iOS 13 on): two tabs, *Summary* (what you chose to see) and *Browse*
  (every category, with search); reviews note that a large Browse can overwhelm (MacStories
  2019; secondary sources). M.
- **Task-based vs content-based**: task-based structure was more efficient and learnable in
  a redesign study; content-based gave the clearer big picture (Univ. Tampere thesis 2015;
  European Commission web guide). M. Both are needed: tasks start from the day, objects
  live under their topic.
- **Bearable** (tracks mood, symptoms, habits, sleep, medication, food, anything the person
  adds): the check-in split into tabs by kind; reports across factors. O.
- **The developer's own evidence**: v1 understood, v2 not (register § V, the canvas board
  «v1 e v2 a confronto», same data and day).

## 4. Data
What the app holds (v2 export 29 Oct 22:00; 41 days with entries) and how often it is used:

| Kind | per day | Kind | per day |
|---|---|---|---|
| meal | 5.2 | weigh-in | 0.6 |
| intake (coffee, creatine) | 1.2 | check-in | 0.5 |
| gym session | 0.9 | water | 0.3 |
| sleep | 0.7 | batch, journal, money | < 0.1 |
| steps | 0.7 | | |

Catalogs: 117 foods (62 products, 64 formats), 16 saved meals, 70 exercises, 9 routines,
51 money categories; 12 day models, 35 cycle steps, 6 goals. Planned to come (ROADMAP,
dossiers, handoff): trips and routes (movement), pantry b, receipt and label scanning
(V-13), the Piano for everything (typical meals, habits, trackers), the meal score,
invites (multi-user), the person's own kinds (`kinds.md`: «Mal di testa», later Studio,
Farmaci…). **The app grows by kinds and domains, not by pages.**

## 5. Model — three candidates
Every candidate keeps: **Oggi** as the day (log, tick, see the balance, start what is
planned), **⊕** to add anything, the register's V and L rules, one object in one place (P1).

**A · By action, with tabs** (v2 mended). Bar: Oggi · Piano · ⊕ · Andamento · Libreria;
each place gets tabs by domain (Libreria: Cibi · Pasti · Esercizi · Dispensa · Tragitti;
Andamento: Peso · Sonno · Allenamento · Soldi…; Piano: Settimana · Modelli · Cicli · Abitudini).

**B · By topic, fixed** (v1 mended). Bar: Allenamento · Cibo · **Oggi** · Corpo e mente ·
Soldi; each area with the same tabs: Diario · Piano · Elenco · Andamento.

**C · Topics on one template, the bar chosen by the person** (recommended). Bar: **Oggi**
· two or three topics the person pins (default: Cibo, Allenamento) · ⊕ · **Tutto**.
*Tutto* lists every topic — Cibo, Allenamento, Corpo (peso, misure, sonno, energia), Mente
(come stai, diario), Movimento (passi, tragitti), Soldi, the person's own kinds — plus
Obiettivi and Impostazioni. **Every topic is the same page with the same four tabs**:
*Diario* (its entries by day), *Piano* (its part of the plan: meal blocks, routines and
cycles, habits), *Elenco* (its objects: foods, meals, exercises, routes, categories) and
*Andamento* (its trends and scores). Oggi gets a second tab, *Settimana*, for the whole
plan across topics. A new topic (a kind the person creates) appears in Tutto with the four
tabs at once and can be pinned to the bar.

**D · Four areas around Oggi, the same four tabs everywhere** (chosen). The developer,
30 Oct, on C: «vorrei che fosse un po' simmetrico… ma che sarebbe "Tutto"? vorrei fosse
coerente e simmetrico anche funzionalmente». «Tutto» is a catch-all, not a place like the
others. D: bar **Corpo · Cibo · Oggi · Mente · Soldi** (v1's), every area with Diario ·
Piano · Elenco · Andamento, **Oggi with the same four tabs over all areas**, ⊕ in the same
corner of every page adding to that place, a new kind joins an area. Costs as C for the
tasks below, except: weight trend = Corpo · Andamento = 2; plan the week = Oggi · Piano = 1;
Farmaci = a kind in Corpo, nothing else changes. Price: fixed areas.

## 6. Experience — the tasks, measured
Taps from opening the app (Oggi), for the tasks weighted by the real use (§4); the same ⊕
and Oggi rows in all three, so the frequent tasks cost the same; the difference is in
finding things and in growing.

| Task (frequency) | A | B | C |
|---|---|---|---|
| Log a meal (5/day) | ⊕ · Pasto · food · Salva = 4 | 4 | 4 |
| Tick a planned item (several/day) | 1 | 1 | 1 |
| See the day's balance (several/day) | 0 | 0 | 0 |
| Coffee, creatine (1/day) | ⊕ «Per te» = 1 | 1 | 1 |
| Start today's gym (1/day) | Oggi row = 1 | 1 | 1 |
| Sleep, steps, weight, how I feel (each < 1/day) | ⊕ · kind · value · Salva = 4 | 4 | 4 |
| Weight trend (weekly) | Andamento · Peso = 2 | Corpo e mente · Andamento = 2 | Tutto · Corpo · Andamento = 3 (2 if pinned) |
| Plan the week (weekly) | Piano = 1 | Cibo · Piano and Allenamento · Piano = 2 places | Oggi · Settimana = 1 |
| An exercise's progress (weekly) | Andamento · Allenamento · exercise = 3, **or** Libreria · Esercizi · exercise = 3 (two places) | Allenamento · Andamento · exercise = 3 | Allenamento · Elenco · exercise = 3 (one place: the exercise's page shows its trend) |
| Fix a food's values (rare) | Libreria · Cibi · food = 3 | Cibo · Elenco · food = 3 | Cibo · Elenco · food = 3 |
| Make a routine (rare) | Piano · Modelli **or** Libreria? = 3 | Allenamento · Piano · Nuova = 3 | Allenamento · Piano · Nuova = 3 |
| Where am I / what is next to it (always) | place + domain tab | area + tab | topic + tab, the same four everywhere |

**Growing — the test: add «Farmaci»** (a kind of the person's: a list of medicines, a
schedule, ticks, adherence):
- A: the kind in ⊕, the list in Libreria, the schedule in Piano, adherence in Andamento:
  four places, each needs a new tab.
- B: the bar is full; Farmaci goes inside «Corpo e mente» or nowhere: the fixed topics
  break.
- C: «Farmaci» appears in Tutto with Diario · Piano · Elenco · Andamento, nothing else
  changes; pinned, it takes a bar slot.

## 7. Edge cases
A topic with no catalog (Mente: check-ins, journal) shows Elenco empty or hides it; a kind
with no plan hides Piano: the tab row never changes order. Cross-topic things (the day's
energy, the scores, «legami») live in Oggi (the day) and in the topic they judge; the
cross-topic trends («legami», data quality) are a topic of Tutto («Insieme»). Settings and
the trash stay behind Tutto, not in the bar. Desktop: the bar becomes a rail with the same
items.

## 8. Acceptance tests
1. Every object of §4 has one page, under one topic; no object page is reachable only by a
   text link.
2. Every task of §6 costs no more taps than in v1 (the v1 counts measured on the local v1 of
   29 Oct) and no more than in v2 today.
3. Adding a kind of the person's adds one topic in Tutto with the four tabs and no new route
   in the code.
4. Every page shows its topic and its tab (register V2) and one primary action (V7).

## 9. Decision
D, accepted 2026-10-30 (ADR-0059). The questions that led there:
1. **Which architecture?** Recommended: **C** — the day and ⊕ from v2, the topics with
   their tabs from v1, one template for every topic so the app grows by adding topics, the
   bar chosen by the person.
2. In C, **which topics in the bar by default?** Recommended: Cibo and Allenamento (the
   most used after the day: §4), the rest in Tutto.
3. **The four tabs' names**: Diario · Piano · Elenco · Andamento? Recommended: yes (the
   person's words, one meaning each).

Sources: Android Developers, «Navigation bar» (Compose); SAP Fiori for Android, M3
navigation bar usage; MacStories, «Health in iOS 13» (2019); Tampere University, «Redesigning
website navigation from content-based to task-based» (2015); European Commission web guide,
«Task-based information architecture»; Bearable (screensdesign showcase, App Store).

## 10. The map of D (decided by the agent, 30 Oct; canvas «lifeos v2 — revisione», board «La mappa»)
**Built so far (31 Oct, ledger UI-90):** the bar, ⊕, the tabs, Oggi's four tabs (`/oggi`, `/oggi/piano`, `/oggi/elenco`, `/oggi/andamento`; `/piano`, `/libreria`, `/andamento` redirect), each area's Diario (`/{area}[/<day>]`); an area's other tabs list today's pages. The rows below still to move: sub-pages, ⊕ as a sheet, objects under their area.
Where every page of today goes, generated by `boards-tools/map_data.py --md` (the same data
draws the board). Choices the agent made while the developer was away, cheap to change until
phase 4:
- **Addresses**: `/{area}` is its Diario, `/{area}/piano`, `/{area}/elenco`,
  `/{area}/andamento`; an object is `/{area}/{kind}/{id}` (`/cibo/cibo/:id`,
  `/corpo/esercizio/:id`). Old URLs redirect.
- **⊕ forms are a sheet** over the page you are on (no page of their own), except the meal
  composer, which is long enough to need one (`/cibo/nuovo/pasto`).
- **Editing happens on the object's page** (P2): the `…/modifica` pages go away.
- **Uncertain areas**: «Mal di testa» (a symptom) and the person's health kinds → Corpo;
  chores, reading, work and study → Mente; «legami» → Mente · Andamento (ADR-0059's rule), with
  the day's picture in Oggi · Andamento; all goals listed in Oggi · Andamento, each also in its
  area's Andamento, a new goal created from the area.
- **Typical days** that span areas (`/piano/modello/:id`) live in Oggi · Piano; cycles in
  Corpo · Piano; habits in Mente · Piano.
- **⊕ placement**: a floating button bottom right, above the bar, the same on every page (the bar
  holds the five places only).

| Page today | Name | Place · tab | New address |
|---|---|---|---|
| `/oggi` | Oggi | Oggi · Diario | /oggi |
| `/oggi/:day` | Un altro giorno | Oggi · Diario | /oggi/:day |
| `/voce/:id` | Una voce (modifica) | Oggi · Diario | foglio sopra la pagina, /voce/:id |
| `/aggiungi` | Il foglio Aggiungi | Oggi · ⊕ | foglio ⊕ su ogni pagina |
| `/aggiungi/pasto` | Pasto · compositore | Cibo · ⊕ | /cibo/nuovo/pasto |
| `/aggiungi/water` | Acqua | Cibo · ⊕ | foglio ⊕ |
| `/aggiungi/attivita` | Attività fatta | Corpo · ⊕ | foglio ⊕ |
| `/aggiungi/tragitto` | Tragitto | Corpo · ⊕ | foglio ⊕ |
| `/aggiungi/weigh_in` | Peso | Corpo · ⊕ | foglio ⊕ |
| `/aggiungi/steps` | Passi | Corpo · ⊕ | foglio ⊕ |
| `/aggiungi/sleep` | Sonno | Corpo · ⊕ | foglio ⊕ |
| `/aggiungi/measurements` | Misure | Corpo · ⊕ | foglio ⊕ |
| `/aggiungi/mal_di_testa` | Mal di testa (tuo) | Corpo · ⊕ | foglio ⊕ |
| `/aggiungi/checkin` | Come stai | Mente · ⊕ | foglio ⊕ |
| `/aggiungi/journal` | Diario | Mente · ⊕ | foglio ⊕ |
| `/aggiungi/reading` | Lettura | Mente · ⊕ | foglio ⊕ |
| `/aggiungi/activity` | Attività (lavoro, studio) | Mente · ⊕ | foglio ⊕ |
| `/aggiungi/chore` | Faccenda | Mente · ⊕ | foglio ⊕ |
| `/aggiungi/spesa` | Spesa | Soldi · ⊕ | foglio ⊕ |
| `/palestra` | Palestra · scegli | Corpo · Diario | /corpo («Inizia» in cima) |
| `/palestra/:id` | Sessione in corso | Corpo · Diario | /corpo/sessione/:id |
| `/piano` | Piano | Oggi · Piano | /oggi/piano |
| `/piano/modelli` | Modelli | Oggi · Piano | /oggi/piano?vista=giornate |
| `/piano/modello/:id` | Giornata tipo | Oggi · Piano | /oggi/giornata/:id |
| `/piano/ciclo/:id` | Ciclo | Corpo · Piano | /corpo/ciclo/:id |
| `/piano/abitudine/nuova` | Abitudine nuova | Mente · Piano | /mente/abitudine/nuova |
| `/andamento` | Andamento | Oggi · Andamento | /oggi/andamento |
| `/andamento/peso` | Tracker · peso | Corpo · Andamento | /corpo/andamento/peso |
| `/andamento/passi` | Tracker · passi | Corpo · Andamento | /corpo/andamento/passi |
| `/andamento/sonno` | Tracker · sonno | Corpo · Andamento | /corpo/andamento/sonno |
| `/andamento/mal_di_testa` | Tracker · tuo | Corpo · Andamento | /corpo/andamento/mal_di_testa |
| `/andamento/acqua` | Tracker · acqua | Cibo · Andamento | /cibo/andamento/acqua |
| `/andamento/obiettivi` | Obiettivi | Oggi · Andamento | /oggi/andamento/obiettivi |
| `/andamento/obiettivi/nuovo` | Obiettivo nuovo | Oggi · Andamento | dall'Andamento dell'area |
| `/andamento/legami` | Legami | Mente · Andamento | /mente/andamento/legami |
| `/andamento/qualita` | Qualità dei dati | Oggi · Andamento | /oggi/andamento/qualita |
| `/andamento/come-valutiamo` | Come valutiamo | Oggi · Andamento | /oggi/andamento/come-valutiamo |
| `/andamento/soldi` | Soldi | Soldi · Andamento | /soldi/andamento |
| `/libreria` | Libreria | Oggi · Elenco | /oggi/elenco |
| `/libreria?vista=cibi` | Cibi | Cibo · Elenco | /cibo/elenco |
| `/libreria?vista=pasti` | Pasti salvati | Cibo · Elenco | /cibo/elenco?vista=pasti |
| `/libreria/cibo/:id` | Un cibo | Cibo · Elenco | /cibo/cibo/:id |
| `/libreria/cibo/:id/modifica` | Un cibo · modifica | Cibo · Elenco | sulla pagina del cibo (P2) |
| `/libreria/cibo/:id/prodotto` | Un cibo · prodotto | Cibo · Elenco | sulla pagina del cibo |
| `/libreria/cibo/:id/unisci` | Un cibo · unisci | Cibo · Elenco | foglio sulla pagina del cibo |
| `/libreria/cibo/nuovo` | Cibo nuovo | Cibo · Elenco | /cibo/cibo/nuovo |
| `/libreria/pasto/:id` | Un pasto salvato | Cibo · Elenco | /cibo/pasto/:id |
| `/libreria/pasto/:id/modifica` | Un pasto · modifica | Cibo · Elenco | sulla pagina del pasto (P2) |
| `/libreria/dispensa` | Dispensa | Cibo · Elenco | /cibo/elenco?vista=dispensa |
| `/libreria?vista=esercizi` | Esercizi | Corpo · Elenco | /corpo/elenco |
| `/libreria/esercizio/:id` | Un esercizio | Corpo · Elenco | /corpo/esercizio/:id |
| `/libreria/esercizio/:id/unisci` | Un esercizio · unisci | Corpo · Elenco | foglio sulla pagina dell'esercizio |
| `/libreria/esercizio/nuovo` | Esercizio nuovo | Corpo · Elenco | /corpo/esercizio/nuovo |
| `/libreria/tragitto` | Tragitti | Corpo · Elenco | /corpo/elenco?vista=tragitti |
| `/libreria/tragitto/nuovo` | Tragitto nuovo | Corpo · Elenco | /corpo/tragitto/nuovo |
| `/impostazioni` | Impostazioni | Profilo · — | /profilo (icona in alto) |
| `/impostazioni/tipi` | I tuoi tipi | Profilo · — | /profilo/tipi |
| `/impostazioni/cestino` | Cestino | Profilo · — | /profilo/cestino |
