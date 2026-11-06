# Fold — TRAIN-* ledger lines → the new spec (phase 2b, 2026-11-06)

Every `TRAIN-nn` line of `docs/spec/v2/ledger.md` (37) and where it now lives:
`domains/training.md` (TR-nn), `model.md` (MOD), `patterns.md` (PAT), `product.md` (PRD),
«not now (xNN)», «superseded by …» or «dropped (reason)». A line split across several
destinations lists each part. Verdicts n06, n07, c02, c09, x08, x10 are his decisions
(PROD-40, `needs.md`). Audit status from `ledger-B.md`.

| Ledger | Audit | Destination |
|---|---|---|
| TRAIN-01 | built | TR-40 (activity voce, fields, cardio bout in a gym session) · TR-41 (ACSM / Compendium by RPE) · TR-42 (pace at same RPE on same tragitto) · TR-43 (RPE × min, spike > 1,5×) · PAT-63 («Inizia adesso» timer) · watch import: TR-61 not now |
| TRAIN-02 | partial | MOD-20 / PAT-18 (unisci, aliases kept); the Run→Corsa merges were data repair, done |
| TRAIN-03 | partial | MOD-12 + TR-17 (presunte until confirmed) · TR-32 (RIR last set, optional; size bands) · TR-26 + TR-33 (readiness 1–5 typed, as context and hint) · TR-10/TR-11 (rests from habit, adaptive +30 s) |
| TRAIN-04 | built | TR-24 (6-week trend, restart > 21 d, TE, words, %/mese) · TR-25 (tonnage = work) · expected reps and order effect shown: dropped (n06, TR-60) |
| TRAIN-05 | built | TR-37 (duration from medians) · TR-13 (one side: setup only, rest − other side, ≥ 30 s) · TR-31 (learnt drop) · TR-33 (short night / readiness ≤ 2) · warm-up rests 30/45/60: superseded by TR-12 (his median, se §5.1) |
| TRAIN-06 | built | TR-25 (volume per muscle per week) · TR-50 (session voto) · MOD-40 (aggregations as metrics) · density and «6-week block deload» levels: dropped (TR-60, x08) |
| TRAIN-07 | built | TR-22 (set row in words) · TR-10 (rest with its source) + PAT-51 · TR-24 / PAT-55 («servono 3 sessioni») · PAT-30 + PAT-53 (exercise page trend) · TR-26 (context row) · «+1 rispetto al previsto»: superseded by MOD-50 / TR-22 (vs the comparable) |
| TRAIN-08 | partial | TR-03 (generated warm-ups, approach set) · TR-14 (supersets) · TR-35 (order proposals, «Macchina occupata» = «Fai dopo») · TR-34 (Cosa aggiungere) · TR-05 + PAT-22 («Salva nella scheda») · TR-37 («finisci alle 8:05») |
| TRAIN-09 | partial | TR-07 (gym timer states) · PAT-63 (states, saved instants, resume) |
| TRAIN-10 | partial | PAT-63 (timer capture) · PAT-62 (composer, sticky primary) · PAT-21/PAT-74 («Serie salvata · Annulla») · PAT-23/PAT-20 (Elimina only in «⋯») · TR-35 («Poi» actions) · TR-16 (Wake Lock, beep, vibration) · «no NavBar in running mode»: open, see note 1 · offline queue: PAT-72 |
| TRAIN-11 | partial | TR-36 (incoherence checks) · TR-24 (trend; order regressor dropped, n06) · TR-10/TR-11 (learnt, adapted rests) · TR-17 + MOD-12 (auto sets assumed) · TR-37 · TR-02 (rack pairs) · TR-50 (score at the proposed load) · deload: not now (x08, TR-61) |
| TRAIN-12 | future (built ahead) | TR-16 (auto mode, 3-2-1 cue not built) · TR-32 (RIR once, last set) · PAT-63 |
| TRAIN-13 | future (built ahead) | TR-15 (start = Go + delay) |
| TRAIN-14 | future | TR-10 (role defaults with sources) · TR-06 (planned stored, actual derived) · between sides 0–15 s: superseded by TR-13 (≤ 10 s) · warm-up rests by ramp: superseded by TR-12 |
| TRAIN-15 | future | TR-21 (e1RM, **without** RIR: superseded the RIR formula, n06) · MOD-53 + TR-26 (context beside, «not fudged») · per-person model after 8–12 weeks: dropped (n06 lab precision, TR-60) |
| TRAIN-16 | future | TR-25 (weekly volume band, Pelland) · TR-33 (readiness lowers the session) · TR-36 (incoherence flags) · order effect learnt: dropped (n06, TR-60) |
| TRAIN-17 | future | TR-06 (times as a chain; unknown = gap) · PRD-22 |
| TRAIN-18 | future | not now (x08): readiness from recovery signals, recovery-driven deload (TR-61) |
| TRAIN-19 | built | TR-02 (loads as lifted, stored total) · TR-36 (≥ 60 % jump → «per manubrio o totale?») |
| TRAIN-20 | future | MOD-30 / MOD-33 (the ciclo's blocco fills the day with time and duration from the blocco) |
| TRAIN-21 | partial | TR-32 (RIR 0–4+, bands, «too hard» gate) · RIR on every set: superseded by TRAIN-03 → TR-32 (last set only, never a progress driver, n06) |
| TRAIN-22 | built | MOD-31 (ciclo of steps, skip = shift or lose; a different scheda counts against its matching step) |
| TRAIN-23 | not built | superseded by MOD-31 / MOD-33 (skip, move a blocco); «Scambia con…» and drag on future days: dropped until a `changes/` proposal with use asks (MOD-32, PRD-02) |
| TRAIN-24 | partial | MOD-30 (a blocco holds objects) · MOD-31 («Salta» consumes the step) · MOD-01 (a scheda's colour and icon declared once in the registry) |
| TRAIN-25 | partial | catalog fields of esercizio (MOD-01 fields: aliases, muscles, cues, mistakes, warm-up, rep range) · TR-30 (guides, double progression) · TR-21 (Epley) · PRD-26 (sources shown; «not medical advice») |
| TRAIN-26 | partial | PAT-63 (one timed screen) · TR-13 (one side timed) · TR-18 (long breaks flagged) · TR-06 (active minutes) |
| TRAIN-27 | built | TR-01 (sets by exercise kind) · TR-02 (load total + text + «circa») · MOD-20 (explicit merge) · MOD-10 (previsto/fatto) · MOD-51 (scheda prefills from last time) · TR-41 / MOD-54 (burn as a range) |
| TRAIN-28 | partial | MOD-12 (estimate, confidence 0,6) · PAT-60 (unknown → stima) · MOD-54 (planned sessions at usual length as energy input) |
| TRAIN-29 | built | TR-30 (proposal from the last two sessions) · TR-04 (warm-ups not counted) · TR-02 (dumbbells stored total) · TR-10 · TR-32 |
| TRAIN-30 | built | TR-24 · TR-10 · TR-37 · TR-15 · TR-16 · TR-26/TR-33 (readiness) · TR-37 (minutes left) · expected reps: dropped (n06, TR-60) |
| TRAIN-31 | future (part built) | TR-02 (rack pairs) · TR-13 (one side on the set's clock) · TR-50 (session voto) · TR-26 + MOD-53 («Prima:» context) |
| TRAIN-32 | built | TR-16 (auto toggle) · TR-15 (setup delay when not automatic) · TR-13 / TR-12 (rests between sides and in warm-ups, editable) |
| TRAIN-33 | partial | MOD-50 + TR-20 (comparable: same exercise, first / not first, similar load) · TR-22/TR-24 · «% using rests, other exercises, order, context»: superseded by c02 / MOD-53 (context beside, not inside) |
| TRAIN-34 | partial | MOD-51 (usual time, not 17:30) · MOD-13 + PAT-15 («Fatto» = now) · MOD-33 (move the blocco) · TR-06 |
| TRAIN-35 | built | PRD-27 (no AI) |
| TRAIN-36 | built | PAT-51 (each value says what it is, «Perché?») · PAT-23/PAT-20 (Elimina in «⋯»; resolves the FOOD-38 idiom clash) · TR-50 + MOD-43 (voto on the session box) · «forza stimata · +2 %»: superseded by MOD-50 / TR-22 (TR-60) · visual round: PRD-18 (patterns, phase 3) |
| TRAIN-37 | built | product.md §3 glossary (tragitto = where, attività = what happened) · TR-40 · MOD-14 (a trip → tragitto) |

**Counts:** 37 lines, 37 placed, none without destination. With a domain rule: 29 (TR-01…TR-50);
not now: 1 (TRAIN-18 → TR-61, x08); only horizontal: 7 (MOD: TRAIN-02, 20, 22, 23, 24, 28;
PRD: TRAIN-35). Lines with a part superseded or dropped: 13 (TRAIN-04, 05, 06, 07, 11, 14,
15, 16, 21, 23, 30, 33, 36).

**Notes**
1. TRAIN-10 «no NavBar in running mode» vs PAT-01 (the layout always holds NavBar): not
   decided by the horizontal spec. Proposal: PAT-63 timer may hide NavBar while running — a
   pattern question for him (PRD-51), not a domain rule.
2. Decided by the agent inside the approved spec (PRD-51): position class = first / not
   first, trend fitted only on the usual class (TR-20, TR-24); e1RM without RIR (TR-21); record
   types and «from the 3rd session» (TR-23); session voto progression against the comparable
   (TR-50). Each follows n06 / MOD-50; he can overturn them in one line.
