# Dossier — the day's targets: expenditure, goal, model

Status: **§9 decided by the agent on the developer's request** (2026-10-24,
«devi rispondere tu … con ricerche»); slice (a) built. Method:
`../method.md` (order item 4, energy expenditure). Spec: engines.md E4
(body state, expenditure prior E4a), E5 (targets, pace, week); concepts §5
(models); dossiers/day-templates.md §5 («a day's targets: the model's»).

## 1. Question
"How much should I eat today, and why that number?" The developer
(considerations.txt): «va rivisto meglio tutta la roba del dispendio
calorico, rendere più graduali e comprensibili le formule usate e non
sovrastimare nulla e nemmeno sottostimare, capire meglio in base a cosa si
hanno quelle macro». And on Oggi since 17 Oct: «obiettivi non ancora
calcolati in v2».

## 2. Today
- **v2 has no day targets since 17 Oct.** `core/day/targets.ts`
  (`targetsOn`) reads only decisions: a day's own `day_targets`, else the
  latest `week_targets` for 7 days. The only one is v1's check-in of 10 Oct
  (converted); nothing in v2 writes new ones.
- **The engines exist, unwired:** E4 `body/filter.ts` (`bodyState`, the
  Kalman filter: trend weight W, expenditure E(t), factors c, cT, k),
  E4a `expenditure/` (BMR, everyday, steps, training set by set), E5
  `targets/day.ts` (`dayTargets`), `pace.ts` (`planPace`, `deficitKcal`
  with ρ), `week.ts` (`weekContext`). No page or job calls any of them.
- **v1** (`src/core/day/resolve.ts`): an accepted weekly check-in for 7
  days; else, with a weight goal, `goalTargets` (ADR-0045) on the day's
  modelled expenditure; else the day type: fixed numbers, or «dynamic»
  (`dynamicTargets`: expenditure − deficit, protein and fat per kg, carbs
  the rest). The developer turned the weekly check-in off
  (`weeklyCheckIn: false`): v1 has been using the goal path.
- **Models in v2** (converted day types): Rec (dynamic: deficit 200 kcal,
  protein 2.2 g/kg, fat 0.8 g/kg; every weekday in the week layout), Rest,
  Run, Gym (fixed 2 000–2 200 kcal), «dwqadaqw» (test, to drop).
- **Audit, 23 Oct export** (scratchpad script, nothing sent):

| | value |
|---|---|
| days logged, closed complete | 25 of 25 (29 Sep–23 Oct) |
| intake | median 2 435, mean 2 639 kcal (1 480–5 121) |
| weigh-ins | 19; 7-day means 75.66 (10–16 Oct) → 76.32 kg (17–23) |
| goal | recomposition, 72.3 kg by 20 Dec, −0.49 %/week planned |
| v1 check-in 10 Oct | expenditure 2 778 kcal, factor 1.00, targets 2 778 kcal |
| steps | 300–15 000 a day, typed by hand |

  A rough balance: 2 639 kcal a day while gaining ≈ 0.35 kg in three
  weeks puts expenditure near **2 500–2 550 kcal**, under v1's 2 778 —
  the over-estimate the developer suspected.

## 3. Evidence
- **Expenditure from intake and weight change** beats any formula once
  2–3 weeks of data exist; a filter that weighs each day by how sure it is
  is the standard way (Hall 2008, *Int J Obes* 32:573; Thomas 2014 on
  dynamic energy balance — both already in E4) [model / single study].
- **Formulas for the prior:** Mifflin-St Jeor is the most accurate BMR
  equation for non-obese adults (±10 % for most) [meta-analysis: Frankenfield
  2005, *J Am Diet Assoc* 105:775]; activity multipliers are the least
  certain part (E4a) [convention].
- **Self-reported intake** under-reports by 10–45 % in most people; a
  person who weighs food closes much of that gap, so k (E4) is learnt only
  while estimates are a minority of the logged kcal [review: Westerterp
  2017].
- **Rate of loss** 0.5–1 % a week keeps lean mass better than faster
  (Helms 2014; Garthe 2011, both in E5) [position / RCT]; recomposition
  0.25–0.5 % [convention, E5].
- **Metabolic adaptation**: expenditure falls in a deficit beyond what
  the lost mass explains, ~5–15 % (Trexler 2014, *JISSN* 11:7) [review] —
  a reason to re-estimate from data, not from the starting formula.
- **Protein** 1.6–2.2 g/kg, higher in a deficit (Morton 2018; Helms 2014;
  ranges.md) [meta-analysis]. **Fat** ≥ 20 % kcal (EFSA) [guideline].

## 4. Data
| Datum | Where | Cost to read |
|---|---|---|
| Daily intake (kcal, and how sure: weighed / estimate / partial) | entries + lines, per day | the heavy part: ≈ 20 kB a day of line values |
| Weigh-ins with their clues | entries (weigh_in) | small |
| Steps, sessions (E4a priors) | entries | small |
| Sex, birth year, height | settings | one row |
| The goal and its pace | goals | one row |
| The day's model (fixed numbers or dynamic parameters) | templates + week layout (core/plans) | small, already read on Oggi |
| **New:** the daily energy state (W, E(t) ± σ, c, k, the day's targets and where they came from) | a `decisions` row per day, kind `energy_state` (no schema change) | one small row per view |

## 5. Model
Targets of a day, first that applies:
1. **The day's own decision** (`day_targets`: fixed by hand, or a model
   fixed for that day) — as today.
2. **The model of the day** (core/plans: the day's copy, else the week
   layout):
   - *fixed*: its numbers;
   - *dynamic*: kcal = E(t) − deficit, never under the BMR; deficit = the
     **goal's pace** when a weight goal is in force (E5 `planPace` →
     `deficitKcal` with ρ from E4), else the model's own deficit; protein
     and fat per kg of the trend weight W (fat ≥ 20 % kcal), carbs the
     rest, fibre 14 g/1 000 kcal; maxima as `dayMaxima`.
3. **No model:** the default model; none → no targets, said as such.

E(t) and W come from **one run of E4 per day**, not per view:
- the first open of a day computes `bodyState` over the last 56 days
  (intake per day with its certainty, weigh-ins, E4a priors), stores
  `energy_state` for that day, and every later view reads that row;
- an edit to a past day's food or a weigh-in marks the state stale
  (`updated_at` of the newest entry later than the row) → recomputed on
  the next open;
- the week's carry-over (E5 `weekContext`, ±30 %) adjusts the dynamic
  kcal by the days already eaten this week.

Aggregation: entry → day intake (± certainty) → E4 (W, E) → day targets
(model + goal) → the zones (ranges.md) and the day score read them.

Words on the day box: «2 150 kcal: dispendio stimato 2 520 ± 120 (ultimi
56 giorni) − 370 per il ritmo dell'obiettivo (−0,49 %/sett.) · modello
«Rec»» — every number traceable, as asked.

## 6. Experience
- **Oggi, «Il giorno»:** the meta line says where the targets come from
  (model, goal, the day's own); opening the kcal row shows the chain in
  words (above), the expenditure as a range, not a falsely precise number.
- **Andamento → Energia:** E(t) and W over time with their bands, the
  learnt factors with how sure they are (E4 already returns σ).
- **Piano:** each day's kcal from its model (fixed or dynamic).
- **Empty states:** under 14 days of data «stima dalla formula (pochi
  dati): si affina con le pesate»; no weigh-in in 7 days: the targets
  stand, the line says the trend is old.

## 7. Edge cases
A day not closed (E4's 60 % rule, ADR-0042); a missing week of logging
(filled from neighbours, less sure); illness or travel (the day's own
decision overrides); a scale change (implausible jumps, E4 weigh-in
rules); the goal reached (maintenance, E5 «reached»); a refeed day (the
model's shift, v1 ADR-0046); the first days with no history (prior only,
wider σ).

## 8. Acceptance tests
1. 24 Oct with only v1's 10 Oct decision: targets exist, from the model
   «Rec» and the goal, and the meta says so (today: none).
2. E4 on 29 Sep–23 Oct: E(t) on 23 Oct within 2 400–2 650 kcal (the
   rough balance in §2), under v1's 2 778.
3. Recomposition −0.49 %/week at W ≈ 76.3 kg: deficit = 0.37 kg/week ×
   ρ(loss)/7, ≈ 350–400 kcal; kcal never under the BMR (Mifflin: 1 797
   kcal for 23 y, 183 cm, 76.3 kg, male).
4. A day with the model Rest (fixed): 2 000 kcal, 150 g protein — its
   own numbers, the goal not applied.
5. Bytes: a second view of Oggi the same day reads one `energy_state`
   row for the targets, nothing else new; the first view's run reads
   ≤ 1.5 MB (local proxy, as #253–#256 measured).
6. Editing yesterday's dinner makes the next open recompute; the
   targets change by the edit's effect only.

## 9. Decisions (the developer asked the agent to decide, 2026-10-24)
1. **Estimated continuously, changed weekly**, no «accept»: the week's
   targets are made once, on the first open of a day in it, from E4 over
   the 56 days before its Monday, and stay for its 7 days. The scale swings
   1–2 kg a day with water, so daily targets would follow noise;
   MacroFactor works the same way (expenditure updated continuously,
   targets at the weekly check-in from the smoothed trend:
   https://help.macrofactorapp.com/en/articles/222-how-does-macrofactor-make-adjustments-for-a-weight-gain-or-weight-loss-goal).
   The week's carry-over (E5 `weekContext`) stays advice. «Ricalcola la
   settimana» makes an automatic week again (never a v1 check-in).
2. **The goal's pace sets the deficit** when a weight goal is in force (v1
   ADR-0045's order); the model keeps protein and fat per kg; a
   recomposition's deficit never over 500 kcal (Murphy & Koehler 2022,
   *Scand J Med Sci Sports*: energy deficits impair lean-mass gains, to
   none near 500 kcal a day) [meta-analysis].
3. **Stored as `week_targets`** with `source: "auto"`: a new decision kind
   would need a migration (the `decisions_kind_ck` constraint), and
   `targetsOn` already reads weeks. The daily estimate waits for slice (b).
4. **Order:** (a) pipeline + targets on Oggi (built), (b) Andamento →
   Energia, (c) Piano's kcal per day.

## 10. Built (slice a, 2026-10-24)
`core/energy` (`read.ts` narrow reads, `week.ts` E4 + pace, `ensure.ts`),
`core/day/targets.ts` (`modelTargets`; order: the day's own, a fixed model,
the week with the day's model), `core/plans` (the model's targets,
`readDayModel`), `expenditure/classes.ts` (pattern → class, cardio METs).
On the developer's data: E = 2 533 ± 224 kcal for the week of 19 Oct (§8,
2: within 2 400–2 650), W 75.83 kg, BMR 1 792, the goal's pace −0.5 %/week
→ deficit 322 kcal; «Rec» → 2 211 kcal, 167 g protein, 61 g fat, 249 g
carbs, 31 g fibre. One run reads ≈ 56 kB (217 meals, 19 weigh-ins, 26
sessions), once a week.
