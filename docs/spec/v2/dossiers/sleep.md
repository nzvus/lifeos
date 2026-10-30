# Dossier — sleep: a broken night, naps, feeling rested

Status: **decided 2026-10-30 by the agent at the developer's request** («fai come ritieni meglio, adesso io vado, quindi non ti fermare»): §9 as recommended — G = 2 h, continuity scored (35/35/10/20), naps counted in the 24-h duration. The developer reviews after. Ledger: BODY-29 (the request), BODY-07, **Built 30 Oct** (phone check on the preview account: the sheet line, one night with its awake time in Oggi and Andamento): periods and continuity (`core/engines/sleep/periods.ts`, `sleep.ts`, registry sleep v2), every reader through `sleepOfDay`/`nightOf` (`features/day/score.ts`), sleep and nap pieces read together (`readSpans`, `SLEEP_KINDS`), the sheet placing a wake not after now and saying the night (`placeByEnd`, `nightWords`). Not yet: nap words (§5.6), the day chip on each time, Oggi's bar with the gap drawn, typed awakenings.
BODY-08, BODY-24, DATA-06, PROD-04, PROD-14. Method: `../method.md`.

## 1. Question
The developer, 30 Oct: «quando dormo, poi mi sveglio e poi ridormo, accumulo ore di sonno, non so
come funziona, anche poi con i pisolini, nel sentirsi riposati… dovremmo fare ricerca anche su
quello e implementare coerentemente». So: when a night comes in pieces, how many hours did I sleep,
how broken was it, do naps count, and did I rest?

## 2. Today
- **Logging** (v2): one «Sonno» sheet; each save is one `sleep` entry (bed, wake, quality 1–5),
  placed on the day of its wake (`core/kinds/builtins.ts:225`, anchor `end`). `asNap`
  (`app/(app)/aggiungi/[kind]/nap.ts`) stores a sleep **under 3 h between 08:00 and 21:00** as a
  `nap` with no quality (capture.md §9.2).
- **Reading — the bug.** `nightOf` (`features/day/score.ts:185`) takes the **first** done sleep of
  the day. Every reader goes through it: the day's sleep score, the weigh-in's «hours slept», Oggi's
  night, the Andamento tracker, «Come valutiamo». So:
  1. sleep 23:30→03:00 and again 03:50→07:02 → the day counts **3 h 30**, the second piece is lost;
  2. `readSpans` (`core/goals/read.ts:132`) gives each piece to the regularity part as a night of
     its own: the «usual» bed and wake are averaged over pieces, and a 03:50 bedtime looks like a
     3-hour shift;
  3. falling asleep again after 08:00 for under 3 h becomes a `nap`, counted nowhere in the night;
  4. naps are counted nowhere at all (no reader of `nap` besides the timeline).
- **Which day — the second bug** (the developer, 30 Oct: «anche quando registri il sonno, non è
  molto chiaro il giorno eccetera. insomma un po un casino»). The sheet asks two clock times, «A
  letto» and «Sveglia», on the page's day; `readEntryForm` (`features/day/entry-form.ts:128`) moves a
  time before the day boundary (04:00) to the night **after**, and only then turns a reversed span
  back by a day. Traced: from Oggi 30 Oct, 23:30→07:02 is right (29 23:30 → 30 07:02); but
  23:30→03:00 becomes **30 23:30 → 31 03:00** and 00:30→03:00 **31 00:30 → 03:00** (tomorrow night);
  from 03:30 the page is still the 29th, so the same piece is right if logged at once and wrong if
  logged after 04:00. The pieces of one night land on different days, and the sheet never shows a
  date, so nothing tells the person.
- **Bedtime and wake** for water and Oggi's countdown (`score.ts:318`, `oggi/page.tsx:269`) pick the
  first sleep starting after 18:00 / ending before 18:00 — same first-piece problem.
- **The developer's data** (v2 export of 29 Oct, `audit-sleep.py`): 30 nights 29 Sep → 29 Oct, one
  piece each (v1 allowed one sleep a day; v2 nights are still logged whole), 1 nap (deleted). Mean
  7.0 h, 14 of 24 nights under 7 h, range 4.8–9.7 h; bedtimes 22:45–01:45, wakes 05:17–09:20;
  quality said on 25 of 30. No broken night is in the data yet: this was found when the developer
  logged the first one (30 Oct), so the tests below rebuild it.
- **v1**: `sleep_logs` one row per day (ADR-0031): the problem could not occur and could not be logged.

## 3. Evidence
| Claim | Source | Strength |
|---|---|---|
| Adults 18–64 need 7–9 h (already used) | Hirshkowitz 2015, NSF, doi:10.1016/j.sleh.2014.12.010 | guideline |
| Total sleep time (TST) = the sleep period minus wake after sleep onset (WASO) and latency; efficiency = TST / time in bed | standard PSG/actigraphy definitions, e.g. [sleepfoundation.org/sleep-studies/wakefulness-after-sleep-onset](https://www.sleepfoundation.org/sleep-studies/wakefulness-after-sleep-onset) | convention |
| Good continuity: WASO ≤ 20 min, ≤ 1 awakening > 5 min, efficiency ≥ 85 %, latency ≤ 30 min; no consensus on naps as part of quality | Ohayon 2017, NSF quality report, doi:10.1016/j.sleh.2016.11.006 ([abstract](https://escholarship.org/uc/item/qt9xc5x5h2)) | consensus (Delphi on 277 studies) |
| Performance tracks **total sleep in 24 h**; split sleep restores alertness about as well as consolidated sleep of the same total | Jackson, Banks, Belenky 2014, Chronobiol Int; Lo, Chee et al. 2019, Sleep (adolescents; split better on vigilance, worse on glucose) | single studies, agree |
| Children's guidance counts naps in the 24-h total; for adults no guideline says how | AAP/AASM paediatric consensus; nothing equivalent found for adults | guideline (children) / gap |
| Brief naps (5–15 min) help at once for 1–3 h; early afternoon is the best time; ~30 min naps bring grogginess | Lovato & Lack 2010, [PMID 21075238](https://pubmed.ncbi.nlm.nih.gov/21075238/); Brooks & Lack 2006, Sleep (10 min best of 0/5/10/20/30) | review + single study |
| Sleep inertia lasts 5–35 min, worse waking from deep sleep and after sleep loss | Hilditch & McHill 2019, [PMC6710480](https://pmc.ncbi.nlm.nih.gov/articles/PMC6710480) | review |
| Naps ≥ 60 min go with higher CVD risk (RR 1.82) and mortality; J-shape, < 30 min neutral | Yamada 2015, [PMC4667384](https://pmc.ncbi.nlm.nih.gov/articles/PMC4667384); Sun 2022 umbrella review rates it weak/suggestive | meta-analyses, observational |
| Regularity predicts outcomes better than duration (already used); SRI is defined on the 24-h sleep/wake state, so every piece and nap is in it by construction | Phillips 2017 (SRI); Windred 2024 | single studies, large |
| A wake bout inside a night: actigraphy uses 10–20 min of continuous wake; no standard for how long a gap ends the night | Samson 2016 Sleep Health (20 min best vs diaries); trial protocols (10 min) | convention, disagree |

Disagreement left open: how long you may stay up before «the night» is over. Research scores by
minutes of wake inside a fixed window; a hand log only knows the gaps the person typed.

## 4. Data
- **Collect nothing new.** A piece stays one `sleep` entry: bed, wake, quality (L0). Its kind
  (`sleep` / `nap`) is the person's or `asNap`'s word, never trusted for counting: the reader
  rebuilds periods from the times of every sleep and nap (L1).
- **Awakenings** (kinds.md ✚): typed only when the night is logged in one piece («mi sono svegliato
  2 volte, ~20 min»): count + minutes awake, optional. Two pieces already say it.
- **Quality** on the night (the last piece's quality, or the mean of the pieces that have one); a nap
  gets none, as today.
- Imported sleep (Health Connect, BODY-28) would bring its own pieces; the same reader joins them.

## 5. Model (E7 sleep, L1 per night; no schema change, everything on read)
Pieces `p = (start, end)` of kind sleep or nap, done, not deleted.
0. **Instants, not the page.** On today's page the sheet reads «Sveglia» as the **latest** instant
   at that clock time not after now, within (D−1 04:00, D+1 04:00] (from Oggi 30 at 09:00, 03:00 is
   30 03:00, never 31); on a past day's page, the page's own date; a planned sleep is not bounded
   by now. «A letto» is the latest instant before it (span < 24 h). The sheet shows the result as
   dates. The `day` stored stays the page's, but readers group by instants: every reader loads
   sleep and nap pieces from D−8 to D+1 and keeps the periods whose final wake falls on D.
   (Built: `features/day/entry-form.ts` `placeByEnd`, `nightWords`.)
1. **Union first:** overlapping pieces merge (a double entry 23:00–07:00 twice is 8 h, not 16).
2. **Period:** consecutive pieces join while the gap `next.start − prev.end ≤ G`, **G = 2 h**
   (recommendation; §9 Q1). A period: `bed` = first start, `wake` = last end,
   `TST = Σ piece durations`, `span = wake − bed`, `WASO = span − TST`, `awakenings = gaps`
   (+ the typed ones of a one-piece night).
3. **Main sleep of day D:** the longest-TST period whose wake falls on the **calendar date** D (a
   night woken at 03:00 belongs to the day it ends on, not to the logical day before; decided by
   the agent while building). It is «la notte». Every other period ending in D is a **nap**, whatever its kind. So a
   stored `nap` within 2 h of the night joins the night (the morning re-sleep), and a long day-time
   `sleep` stays a nap.
4. **24-h sleep** of D = main TST + naps' TST (Jackson 2014: the 24-h total drives performance).
5. **Score parts** (registry E7 «sleep», weights movable within ranges):
   - `duration` = bandScore(24-h sleep h, 7–9, tolerance 2) — today it reads the first piece only;
   - `regularity` = today's formula on the **main sleep's** bed and wake vs the 7 main sleeps before
     (one point per night, never per piece); SRI when the state series exists (BODY-07);
   - `continuity` **new** (§9 Q2) = bandScore(WASO min, ≤ 20, tolerance 40): 1 at ≤ 20 min, 0 at
     ≥ 60 (Ohayon 2017: ≤ 20 good, > 50 poor); null for a one-piece night with nothing typed — a
     missing number is not a perfect night;
   - `feel` = quality and the morning check-in's energy, as today.
   Weights were 40 / 40 / 20; now (registry v2, 30 Oct) duration 35, regularity 35 (locked ≥ 30),
   continuity 10, feel 20. Built: `core/engines/sleep/periods.ts`, `sleep.ts`, `features/day/score.ts`.
6. **Naps are described, not scored** (observational, weak evidence): per nap its length and time,
   with a word: ≤ 30 min before 16:00 «breve, buon orario»; 30–60 min «possibile intontimento al
   risveglio» (Brooks 2006, Hilditch 2019); ≥ 60 min «lungo» with the evidence's caveat; ending
   after 17:00 «tardi: può spostare l'ora di dormire» (convention). Correlation later (BODY-10):
   naps → that night's bedtime and quality, after n ≥ 21.
7. **Readers changed to the period**: weigh-in «hours slept» (= main TST), water's wake and bed,
   Oggi's countdown bed (= the evening's first piece of the period starting after 18:00), the
   tracker's bars (24-h sleep, naps stacked lighter), averages and «sotto le 7 h» (24-h sleep),
   correlations (main sleep).

Tree: piece (L0) → period (L1: TST, WASO, awakenings) → day (main sleep, naps, 24-h sleep, score
parts) → week/period (mean 24-h sleep, nights under 7 h, regularity, naps per week) → recovery
(BODY-08) and training readiness (DATA-21).

## 6. Experience
- **Oggi, the sleep box:** «6 h 42 dormite · a letto 23:30–07:02 · sveglio 50 min (1 volta)»; the
  pieces as one bar with the gap drawn hollow; naps under it, «+ 20 min pisolino 14:10». The score
  says which part is low («notte spezzata: 50 min sveglio»).
- **The sheet says the dates.** Under the two times a live line: «Notte tra giovedì 29 e venerdì
  30 · 3 h 30» (built). Not yet: a day chip on each time that taps to the day before or after, for
  the rare case the guess is wrong (today: open the night from its day's page). Defaults: «Sveglia» = now rounded to
  5 min (or the last piece's wake for a second piece), «A letto» = the usual bedtime.
- **Logging a second piece:** ⊕ Sonno, as today. On save, when it joins a night: «Aggiunto alla
  notte: in tutto 6 h 42, sveglio 50 min» with Annulla. No new question, no toggle.
- **Andamento · Sonno:** bars of 24-h sleep, the night solid, naps lighter on top; a dot for nights
  with WASO > 20 min; head pills «N sotto le 7 h», «N notti spezzate», «pisolini: N, media M min».
- Empty: as today. One piece: no continuity line («una notte intera, nessun risveglio segnato»).

## 7. Edge cases
- Pieces typed out of order or edited later: periods are rebuilt on read, nothing stored.
- Overlap / duplicate pieces: union (step 1); flagged as a likely double (DATA-02 «duplicates»).
- A piece over 14 h or reversed: excluded from sums and flagged (DATA-02), as the converter does.
- Night across the day boundary (wake before 04:00) belongs to the day before, as now.
- DST nights: durations from instants, never from clock minutes.
- Shift work / a day-time main sleep: «main» is the longest period, not the one at night.
- Illness, travel: no special case; regularity already tolerates one-off nights (7-night mean).

## 8. Acceptance tests (from the developer's nights; Europe/Rome)
1. 28 Oct, one piece 23:30→07:02, quality 4 → TST 7 h 32, WASO 0, continuity null, duration 1;
   same as today.
2. 27 Oct rebuilt broken: 23:30→03:00 + 03:50→07:02 → one period: bed 23:30, wake 07:02, TST
   6 h 42, WASO 50, 1 awakening; duration bandScore(6.7) ≈ 0.85; continuity 0.25; regularity reads
   one night 23:30/07:02. **Today: 3 h 30, bed 03:50 in regularity.**
3. Morning re-sleep: 00:12→05:17 + 06:15→08:00 (saved as `nap` by `asNap`? no: starts before 08:00;
   variant 06:20→08:40 is saved as `nap`) → joins the night either way: wake 08:00 (08:40), TST 6 h 50 (7 h 25).
4. 20 Oct 00:12→05:17, then 08:30→10:00 (gap 3 h 13 > G) → night TST 5 h 05, a 90-min nap «lungo»,
   24-h sleep 6 h 35.
5. 29 Oct 00:37→07:12 + nap 14:00→14:20 → night 6 h 35, nap «breve, buon orario», 24-h sleep 6 h 55,
   duration on 6.92 h.
6. Duplicate 23:00→07:00 twice → TST 8 h, flagged double.
7. Weigh-in on test 2's morning reads 6.7 h slept, not 3.5 h (`readWeighIn` sleptHours).
8. Tracker over 27–29 Oct with test 2 → mean of 24-h sleep, test 2 counted once, one «notte spezzata».
9. The sheet from Oggi 30 Oct at 09:00: 23:30→03:00 → 29 23:30 → 30 03:00 (today: 30→31); 00:30→
   03:00 → 30 00:30 → 03:00; 23:30→07:02 unchanged; the line reads «Notte tra giovedì 29 e venerdì 30».
10. The same pieces logged at 03:30 (page = 29) and at 07:10 (page = 30) → one period on day 30;
   from Oggi 30 at 09:00 a wake typed 10:00 (bed 02:00) lands on 29 10:00 and the line says «Giovedì 29 · 8 h».

## 9. Questions for the developer
1. **G, the gap that still belongs to the night:** 1 h, **2 h (recommended)** or 3 h? With 2 h a
   wake at 05:17 and a re-sleep at 06:15 is one night; a re-sleep after 3 h is a nap.
2. **Continuity in the score** (weights 35/35/10/20)? Recommended: yes — it is what makes a broken
   night count as worse than a whole one with the same hours (Ohayon 2017). Otherwise it is shown,
   not scored.
3. **Naps in the duration:** count the 24-h sleep (recommended, Jackson 2014) or the night only?
   Counting them means a short night plus a long nap scores as a full night on duration; the nap
   itself is still described with its caveat.
