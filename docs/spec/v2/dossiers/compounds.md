# Dossier — Compounds: creatine and caffeine (FOOD-40)

Status: **draft 2026-11-03**, written by the agent (the developer: «siamo sicuri
che la creatina funzioni così?… e la caffeina? i caffè mostrano sempre 23.30
ottimo: è normale?»). §9 carries the agent's decisions.

Ledger: FOOD-40, FOOD-13, FOOD-18, FOOD-21, BODY-07, BODY-10, BODY-11, UI-01, UI-73, DATA-21 · ADR-0038, ADR-0039

## 1. Question

- **Creatine:** «are my muscles full, filling or emptying?», even on a day
  without it, and «what happens if I skip a few days?»
- **Caffeine:** «how much today, and will it touch my sleep?» It should be
  judged at the time he really goes to bed, and said only when it changes
  something.

## 2. Today

- `core/food/compounds.ts`: caffeine mg and creatine g per 100 of a food;
  `caffeineLeft` halves each dose every 5 h.
- `features/day/compounds.ts`: a coffee shows «Caffè ≈ 100 mg» and a pill
  «alle 23:30: ottimo» when no sleep is logged that evening (always, in
  practice: the night is logged the next morning). Creatine shows
  «integratore · 19 giorni su 28».
- `core/training/context.ts` `creatineDays`: days with a line **named**
  «creatin…» of ≥ 3 g in the 28 days. It counts the powder's grams, not the
  compound, and is read only on a day that has creatine.

**His data** (refined export 23 Oct):
- **Creatine:** 3,41 g on 19 days (5–24 Oct, only 17 Oct missing). On a skip
  day nothing is shown. The count of 28 moves by at most one a day, both
  while filling and after stopping: hence «sempre lo stesso avanzamento».
- **Caffeine:** 23 coffees of ≈ 100 mg (capsule 7,2 g × 1389 mg/100 g),
  mostly 07–09 local, some at 13–16.
- **Bedtime:** median 00:28 over 24 logged nights, not 23:30. A 100 mg
  morning coffee leaves ≈ 10 mg at midnight, so the pill is «ottimo» every
  time: true, and useless (UI-73: show nothing that serves no decision).

## 3. Evidence

- **Creatine stores fill in 3–4 weeks at 3 g/day, or in about 5–6 days at
  20 g/day, to the same level (≈ +20 % total muscle creatine). After stopping
  they are back to baseline in about 4 weeks.** Hultman et al., J Appl
  Physiol 1996;81:232–7, doi:10.1152/jappl.1996.81.1.232 (single study, the
  reference one).
- **Dose and washout:** 3–5 g/day, or 0,3 g/kg/day for 5–7 days then
  3–5 g; stores return to baseline in 4–6 weeks; early gain of ≈ 1–2 kg
  (water); timing (pre or post) does not matter much. Kreider et al., ISSN
  position stand, JISSN 2017;14:18, doi:10.1186/s12970-017-0173-z
  (position stand).
- **Taken with carbohydrate or protein, more is retained.** Green et al., Am J
  Physiol 1996;271:E821–6 (single study, weak) → mentioned, not scored.
- **Caffeine:** up to 400 mg/day and 200 mg at once is safe for healthy
  adults; around 100 mg close to bedtime can affect sleep in some people;
  half-life 2–8 h, about 4–5 on average. EFSA NDA 2015, EFSA Journal
  13(5):4102, doi:10.2903/j.efsa.2015.4102 (guideline).
- **How long before bed:** caffeine reduces total sleep by ≈ 45 min on
  average; a coffee (≈ 107 mg) should be taken ≥ 8,8 h before bed, a
  pre-workout dose (≈ 217 mg) ≥ 13,2 h before. Gardiner et al., Sleep Med Rev
  2023;69:101764, doi:10.1016/j.smrv.2023.101764 (meta-analysis). 400 mg even
  6 h before bed cut sleep by > 1 h: Drake et al., J Clin Sleep Med
  2013;9:1195, doi:10.5664/jcsm.3170 (single study).
- **People differ** (CYP1A2, habitual use, tolerance): a personal half-life
  (BODY-11) and his own sleep data (BODY-10, after 21 paired days) are better
  than any average (convention).

## 4. Data

- Nothing new is typed. Doses are logged lines with the food's compound
  (`caffeine` mg, `creatine` g per 100), so a mix or a pre-workout counts by
  its content, never by its name.
- **Bedtime:** the evening's sleep when logged; otherwise the median bedtime
  of the last 14 logged nights; otherwise 23:30, said as «di solito».
- **Body weight** (for the creatine store's size): the trend weight of
  targets, else the last weigh-in, else 75 kg.

## 5. Model

```
creatine  E_max   = 0,35 g/kg × weight        (≈ 25 g for 70 kg: the ≈ +20 % Hultman measured)
          S_0     = 0  (unsupplemented baseline);  S in 0–1, «quanto sono piene»
          each day S_t = min(1, S_{t-1} × (1 − k) + r × dose_t ÷ E_max)
          k = 0,06 / day   (back to ≈ 10 % in ≈ 5 weeks: washout 4–6 weeks)
          r = 0,5          (half of a dose retained while filling)
          → 3,4 g/day: 66 % at 14 d, 83 % at 21 d, 93 % at 28 d; 20 g/day: full in ≈ 3 d
          → stopping when full: 54 % after 10 d, 18 % after 28 d
caffeine  left(t) = Σ dose × ½^(h / half-life), half-life 5 h (BODY-11: 3/5/7 later)
          at bedtime (§4); judged: < 50 mg good, 50–100 fair, > 100 bad (EFSA)
          last coffee = bedtime − 9 h (Gardiner: 8,8 h for ≈ 107 mg)
          day total vs 400 mg; one dose vs 200 mg
```

The day is read over the 60 days before it (one narrow query of compound
lines), so the store's history has time to settle. Engines: a pure
`core/food/creatine.ts` (stores by day) and `caffeineLeft` with a bedtime
argument; `core/training/context.ts` reads both, so a session says the level
it was done at (FOOD-21).

## 6. Experience

- **Creatine, every day** (also without a dose): a row in «Il giorno» under
  the nutrients, «Creatina · scorte ≈ 83 % · in aumento», or «· in calo da
  3 giorni» when skipped. A logged dose's row says «3,4 g · scorte ≈ 83 %».
  Shown only once creatine has ever been logged.
- **Caffeine:** the coffee row stays «Caffè ≈ 100 mg». The pill shows only
  when it matters: when the day's caffeine at bedtime is fair or bad
  («a letto ≈ 60 mg: ok»), when a coffee is after the «last coffee» time
  («dopo le 15:30: tocca il sonno»), or when the day passes 400 mg or a
  dose passes 200 mg. Otherwise nothing: no more «23:30 ottimo» on every
  coffee.
- **The bedtime is said as his:** «a letto (di solito 00:30)».
- Andamento later (BODY-10): caffeine after 14:00 → his sleep, with n.

## 7. Edge cases

- First weeks of creatine: weight up 1–2 kg of water. The weight trend
  (E4) should not read it as fat; a note on the weigh-ins of the first 21
  days of a start («creatina: acqua nei muscoli»). Slice c.
- Creatine taken late at night counts on its logical day (E1), like any line.
- A loading phase (20 g/day): the store fills in days; the same formula.
- Decaf, tea, cola, pre-workout: by their compound value. A food without
  caffeine data has none (no guess from the name).
- No sleep ever logged: «di solito» falls back to 23:30, said.

## 8. Acceptance tests (his days)

1. 5→24 Oct, 3,41 g/day with 17 Oct skipped, 72 kg: stores ≈ 59 % on 16 Oct,
   ≈ 56 % on 17 Oct («in calo»), ≈ 59 % on 18 Oct, ≈ 76 % on 24 Oct.
2. After 24 Oct with no creatine: ≈ 41 % on 3 Nov, «in calo da 10 giorni».
3. 20 Oct, coffee at 05:51 UTC (100 mg), median bedtime 00:28: ≈ 10 mg at bed
   → no pill.
4. A 100 mg coffee at 16:00 with bed at 00:28: ≈ 31 mg left at bed (good),
   but after «last coffee 15:28» → pill «dopo le 15:30: tocca il sonno».
5. Five coffees in a day (500 mg): pill «oggi ≈ 500 mg: oltre 400».

## 9. Questions (decided by the agent; his to overturn)

1. **Show the creatine store on days without a dose?** Yes, once he has ever
   taken it: that is when «what if I skip» matters.
2. **Model constants** (k 0,06, r 0,5, 0,35 g/kg) fitted to Hultman and ISSN,
   shown as «≈», not personal. Cheap to change.
3. **Caffeine pill only when it matters.** Yes (UI-73). The coffee's mg stays.
4. **Last-coffee time** = bedtime − 9 h, for every coffee. A pre-workout
   dose (> 150 mg) uses 13 h.

## 10. Slices

a. `core/food/creatine.ts` + tests 8.1–8.2; the store in «Il giorno» and on
   the dose's row; compound-based, not name-based; context.ts reads it.
b. Bedtime from the median of 14 nights; the caffeine pill only when it
   matters (8.3–8.5); day total vs 400 mg.
c. Creatine's water note on the weigh-ins; caffeine and sleep in Andamento
   (BODY-10).
