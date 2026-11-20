# orca — attributes (schema: README.md; rows from round 1, ADR-0064)

| ID | Object | Attribute | Field | Reading | Question | Instrument | Level | References | Data | Source |
|---|---|---|---|---|---|---|---|---|---|---|
| ATT-01 | OBJ-01 | ruolo (colazione · pranzo · spuntino · cena) | meal.role | category | name | word | 0 | — | ✓ | FD-10; 285/315 (silhouette, VIS-41) |
| ATT-02 | OBJ-01 | ora | — | time | rhythm | rail | 0 | — | ✓ | MOD-10; 306/315 |
| ATT-03 | OBJ-01 | kcal | — | amount | reach | bar | 0 | target | ✓ | FD-20, bars-study §22.1 |
| ATT-04 | OBJ-01 | macro (proteine · carboidrati · grassi · fibre) | — | amount | reach | bar | 0 | target | ✓ | VIS-50, bars-study §22.1 |
| ATT-05 | OBJ-01 | voto | — | score | verdict | skyline | 0 | fascia | ✓ | FD-50…54, VIS-43 |
| ATT-06 | OBJ-01 | righe | — | composition | composition | parts | 1 | — | ✓ | MOD-11; 1111 righe |
| ATT-07 | OBJ-01 | limiti (zuccheri liberi · saturi · sale) | — | amount | reach | bar | 1 | mean | ✓ | FD-33, FD-36 |
| ATT-08 | OBJ-01 | porzioni | meal.servings | amount | name | word | 1 | — | ✓ | FD-93; 200/315 |
| ATT-09 | OBJ-01 | stima | meal.estimated | presence | name | word | 0 | — | ✓ | VIS-23; 27 true |
| ATT-10 | OBJ-01 | contesto | — | category | name | word | 1 | — | ✓ | MOD-53, PAT-33 |
| ATT-11 | OBJ-01 | costo | — | amount | source | rows | 2 | — | ◐ | FD-80…84 (prices on 65 formati) |
| ATT-12 | OBJ-01 | da dove (cibi per macro) | — | composition | source | rows | 2 | — | ✓ | bars-study §22.1 |
| ATT-13 | OBJ-02 | dose | — | amount | reach | bar | 0 | fascia | ✓ | FD-60, FD-62 (caffeine ≤ 200 per dose) |
| ATT-14 | OBJ-02 | presa | — | done | yes/no | cells | 0 | goal | ◐ | bars-study §22.5 (not wired to his logs) |
| ATT-15 | OBJ-03 | ml | water.ml | amount | reach | bar | 0 | target | ✓ | FD-70…73; 74 |
| ATT-16 | OBJ-03 | ora | — | time | rhythm | rail | 0 | — | ✓ | bars-study §22.6 |
| ATT-17 | OBJ-05 | durata | session.durationMin | time | rhythm | rail | 0 | — | ✓ | TR-01; 45 |
| ATT-18 | OBJ-05 | voto | — | score | verdict | skyline | 0 | fascia | ✓ | TR-50 |
| ATT-19 | OBJ-05 | esercizi | — | composition | composition | parts | 1 | — | ✓ | TR-01; 318 |
| ATT-20 | OBJ-05 | prontezza | — | rating | name | word | 1 | — | ◐ | TR-33; 3 (field not in the registry) |
| ATT-21 | OBJ-07 | carico × ripetizioni (e1RM) | — | amount | reach | bar | 1 | past self | ✓ | TR-21, bars-study §22.9; 1378 loads |
| ATT-22 | OBJ-07 | riscaldamento | — | category | name | word | 1 | — | ✓ | TR-04; 110 |
| ATT-23 | OBJ-07 | RIR | — | rating | name | word | 1 | — | ◐ | TR-01; 86/1013 |
| ATT-24 | OBJ-07 | riposo prima | — | time | rhythm | rail | 1 | — | ◐ | bars-study §22.9; 624 starts |
| ATT-25 | OBJ-09 | passi | steps.steps | amount | reach | bar | 0 | target | ✓ | BD-40; 43 |
| ATT-26 | OBJ-09 | in piedi (ore) | steps.onFeetH | time | reach | bar | 1 | target | ○ | BD-42, reframe §12; 1 |
| ATT-27 | OBJ-10 | peso | weigh_in.weightKg | amount | trend | line | 0 | goal | ✓ | BD-01; 34 |
| ATT-28 | OBJ-10 | condizioni (a digiuno · dopo il bagno · dopo l'allenamento) | weigh_in.fasted | presence | name | word | 1 | — | ✓ | BD-02; 33 |
| ATT-29 | OBJ-10 | vita (cm) | weigh_in.waistCm | amount | trend | line | 1 | — | ✓ | BD-70; 31 |
| ATT-30 | OBJ-12 | notte (letto → sveglia) | — | time | rhythm | rail | 0 | — | ✓ | BD-50; 40 |
| ATT-31 | OBJ-12 | ore | — | time | reach | bar | 0 | target | ✓ | bars-study §22.7 |
| ATT-32 | OBJ-12 | regolarità | — | time | spread | band | 1 | mean | ✓ | BD-55, `engines/sleep` |
| ATT-33 | OBJ-12 | qualità | sleep.quality | rating | name | word | 1 | — | ✓ | BD-53; 36 |
| ATT-34 | OBJ-14 | umore · energia · stress | checkin.mood | rating | trend | line | 0 | mean | ✓ | DT-51 (own 28-day baseline); 19 |
| ATT-35 | OBJ-22 | nutrienti per 100 | — | amount | composition | parts | 1 | fascia | ✓ | FD-04; 144 |
| ATT-36 | OBJ-22 | voto per 100 kcal | — | score | verdict | skyline | 0 | fascia | ✓ | FD-50 |
| ATT-37 | OBJ-22 | gruppo | — | category | name | word | 0 | — | ◐ | VIS-31 (icon); 105/144 |
| ATT-38 | OBJ-22 | NOVA | food.nova | rating | name | word | 1 | — | ✓ | FD-91; 122 |
| ATT-39 | OBJ-22 | usato in | — | composition | source | rows | 2 | — | ✓ | PAT-30 |
| ATT-40 | OBJ-24 | prezzo al kg | — | amount | trend | line | 1 | — | ◐ | FD-81; 65 prices |
| ATT-41 | OBJ-25 | righe | — | composition | composition | parts | 1 | — | ✓ | MOD-20; 200 |
| ATT-42 | OBJ-25 | voto | — | score | verdict | skyline | 0 | fascia | ✓ | FD-53 |
| ATT-43 | OBJ-27 | e1RM | — | amount | trend | line | 1 | record | ◐ | TR-24 |
| ATT-44 | OBJ-27 | fatti (movimento · attrezzo · lati · muscoli) | exercise.pattern | category | name | word | 1 | — | ✓ | proposal §62; 70 |
| ATT-45 | OBJ-28 | esercizi | — | composition | composition | parts | 1 | — | ✓ | PAT-62; 60 |
| ATT-46 | OBJ-30 | ogni quanto | — | category | rhythm | cells | 0 | — | ✓ | PL-20; 3 |
| ATT-47 | OBJ-31 | passo di oggi | — | category | rhythm | cells | 0 | — | ✓ | PL-33; 34 steps |
| ATT-48 | OBJ-47 | scorte | — | amount | stock | tank | 0 | fascia | ◐ | FD-63 (words today) |
| ATT-49 | OBJ-46 | caffeina rimasta | — | amount | rhythm | rail | 1 | fascia | ○ | FD-61, FD-62 (a pill today) |
| ATT-50 | OBJ-43 | energia del giorno | — | amount | composition | parts | 1 | — | ✓ | MOD-54, BD-20…24 |
| ATT-51 | OBJ-58 | vai a (kg/sett.) | — | amount | reach | bar | 0 | goal | ✓ | MOD-42, bars-study §22.11; 9 |
| ATT-52 | OBJ-58 | data raggiunta | — | time | prediction | fan | 1 | goal | ✓ | bars-study §22.8 |
| ATT-53 | OBJ-66 | energia e macro del giorno | — | amount | reach | bar | 0 | target | ✓ | bars-study §22.13 |
| ATT-54 | OBJ-66 | il giorno ancora in corso | — | amount | prediction | fan | 0 | target | ◐ | FD-34 |
| ATT-55 | OBJ-66 | voci | — | composition | rhythm | rail | 0 | — | ✓ | VIS-60 |
| ATT-56 | OBJ-66 | voto | — | score | verdict | skyline | 0 | fascia | ✓ | MOD-43 |
| ATT-57 | OBJ-66 | micro (n su m) | — | amount | reach | cells | 1 | fascia | ◐ | FD-40, FD-41, bars-study §22.3 |
| ATT-58 | OBJ-66 | tempo vuoto | — | time | rhythm | rail | 0 | — | ✓ | VIS-62 |
| ATT-59 | OBJ-51 | serie per muscolo | — | amount | composition | parts | 1 | fascia | ✓ | TR-25 |
| ATT-60 | OBJ-49 | meteo | — | category | name | word | 0 | — | ✓ | VIS-75 |
