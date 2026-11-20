# orca — objects (schema: README.md; rows from round 1, ADR-0064)

| ID | Name | What it is | Form | Class | Key | Status | Source |
|---|---|---|---|---|---|---|---|
| OBJ-01 | pasto | a meal eaten or planned, with a role and its righe | voce | intake | meal | ✓ | FD-10, MOD-10; 315 in his data |
| OBJ-02 | assunzione | coffee, creatine, a pill: taken, no role, no voto | voce | intake | intake | ✓ | FD-60, FD-50; 78 |
| OBJ-03 | acqua | a drink of water, in ml | voce | intake | water | ✓ | FD-70…73; 74 |
| OBJ-04 | cucinato | a batch cooked, in portions | voce | exchange | batch | ◐ | builtins.ts; no spec ID; 4 |
| OBJ-05 | sessione | a gym visit, made of its esercizi | voce | activity | session | ✓ | TR-01; 45 |
| OBJ-06 | esercizio della sessione | one esercizio inside a sessione, with its serie | part | activity | session_exercise | ✓ | TR-01, TR-05; 318 |
| OBJ-07 | serie | reps, load, RIR, warm-up, side, time | part | activity | — | ✓ | TR-01, TR-04; 1013 |
| OBJ-08 | tragitto | a trip along a percorso | voce | activity | trip | ✓ | BD-43; 7 |
| OBJ-09 | passi | a day's steps, or a window's | voce | activity | steps | ✓ | BD-40…44, reframe §12; 43 |
| OBJ-10 | pesata | a weighing, with its conditions | voce | measurement | weigh_in | ✓ | BD-01…06; 34 |
| OBJ-11 | misure | body measures alone | voce | measurement | measurements | ◐ | BD-70; 0 (they ride on pesata) |
| OBJ-12 | sonno | a night, bed → wake, from its pieces | voce | state | sleep | ✓ | BD-50…57; 40 |
| OBJ-13 | riposo | a nap | voce | state | nap | ◐ | BD-54; 0 |
| OBJ-14 | come stai | mood, energy, stress at an instant | voce | measurement | checkin | ✓ | DT-51; 19 |
| OBJ-15 | diario | a note | voce | note | journal | ◐ | builtins.ts; 2 |
| OBJ-16 | attività | a span of work, study, leisure… | voce | activity | activity | ◐ | builtins.ts; 0 |
| OBJ-17 | lettura | a reading span of a libro | voce | activity | reading | ◐ | builtins.ts; 0 |
| OBJ-18 | faccenda | a chore done | voce | activity | chore | ◐ | builtins.ts; 0 |
| OBJ-19 | movimento di soldi | money in or out, signed | voce | exchange | movement | ◐ | DT-50; 2 |
| OBJ-20 | spesa | what a shopping trip brought in | voce | exchange | purchase | ◐ | MOD-22, product.md §4; 0 |
| OBJ-21 | scorta | a count of what is at home | voce | exchange | stock_count | ◐ | product.md §4; 0 |
| OBJ-22 | cibo | a food, its nutrients per 100 | object | intake | food | ✓ | FD-01…07; 144 |
| OBJ-23 | prodotto | a brand of a cibo (he says «marca») | object | intake | product | ✓ | FD-01, FD-02; 72 |
| OBJ-24 | formato | a package of a prodotto: size, barcode, price | object | intake | format | ✓ | FD-03; 74 |
| OBJ-25 | pasto salvato | a meal kept to log again, with variants | object | intake | recipe | ✓ | MOD-20, FD-53; 24 |
| OBJ-26 | assunzione salvata | a cibo flagged as taken, with its dose | object | intake | intake_item | ◐ | FD-64, ADR-0060; 0 flagged, his 52 point to pasti salvati |
| OBJ-27 | esercizio | a gym movement, with its facts and variants | object | activity | exercise | ✓ | TR-01…37, proposal §62; 70 |
| OBJ-28 | scheda | the esercizi of a sessione, a model | object | activity | routine | ✓ | product.md §3; 9 |
| OBJ-29 | percorso | a named route to repeat a tragitto | object | activity | route | ✓ | BD-43; 5 |
| OBJ-30 | ritmo | what repeats: a voce due, a time to hit, an amount to reach (stored as a blocco) | object | — | block | ◐ | product.md §3, target.md §6, MOD-30; 3 |
| OBJ-31 | ciclo | ritmi that advance step by step | object | — | cycle | ✓ | MOD-31, PL-30…33; 6 |
| OBJ-32 | giornata tipo | a step of a ciclo with its righe (rest = none) | part | — | — | ✓ | PL-30, delta MOD-30…32; 34 steps |
| OBJ-33 | tracker | a type of his own, ≤ 6 fields | object | — | tracker | ◐ | MOD-01, DT-52; 0 |
| OBJ-34 | categoria di spesa | a money category, nested | object | exchange | money_category | ✓ | DT-50; 51 |
| OBJ-35 | libro | what a lettura reads | object | activity | book | ○ | builtins.ts (ref only); 0 |
| OBJ-36 | progetto | what an attività is for | object | activity | project | ○ | builtins.ts (ref only); 0 |
| OBJ-37 | etichetta | a tag on a cibo: shop, frozen, lactose-free | object | — | — | ◐ | FD-94; 6, on 51 cibi |
| OBJ-38 | prezzo | a price seen: formato, shop, day, cents | part | exchange | — | ✓ | MOD-22, FD-81; 65 |
| OBJ-39 | riga | a cibo with a quantity, inside a pasto, assunzione, pasto salvato or giornata tipo | part | intake | — | ✓ | MOD-11, FD-07; 1938 |
| OBJ-40 | nutriente | kcal, a macro and its kinds, a limit, a micro | part | intake | — | ✓ | FD-04, FD-05, FD-40 |
| OBJ-41 | voto | a 0–100 judgement from its criteri | signal | — | — | ✓ | MOD-43, PAT-52, VIS-43 |
| OBJ-42 | criterio | one part of a voto: a measure, its fascia, a weight | part | — | — | ✓ | MOD-43, FD-51, TR-50 |
| OBJ-43 | energia | expenditure learnt, with the day's pieces | signal | — | — | ✓ | MOD-54, BD-20…24 |
| OBJ-44 | trend del peso | the weight line without water | signal | — | — | ✓ | BD-01 |
| OBJ-45 | progresso | an esercizio against its past: e1RM, trend | signal | — | — | ◐ | MOD-50, TR-20…24 |
| OBJ-46 | caffeina rimasta | caffeine left, halving every 5 h | signal | — | — | ◐ | FD-61, FD-62 |
| OBJ-47 | scorte di creatina | creatine stores, 0–100 % | signal | — | — | ✓ | FD-63 |
| OBJ-48 | finestre di movimento | windows moving · on one's feet · seated; sedentary time | signal | — | — | ○ | reframe §12, his 20 Nov |
| OBJ-49 | meteo | the weather of his city, live | signal | context | — | ✓ | BD-61, VIS-75 |
| OBJ-50 | luce del giorno | sun and moon, the sky bands | signal | context | — | ✓ | VIS-61 |
| OBJ-51 | volume per muscolo | working serie per muscle per week | signal | — | — | ✓ | TR-25 |
| OBJ-52 | costo | the € of a riga, a pasto, a day | signal | — | — | ✓ | FD-80…84 |
| OBJ-53 | serie di giorni | consecutive days meeting a target | signal | — | — | ◐ | DT-13, bars-study §19.1 |
| OBJ-54 | aderenza | previsto done out of previsto | signal | — | — | ◐ | PL-21, DT-02 |
| OBJ-55 | copertura | how much of a window has data; «non so» below it | signal | — | — | ◐ | MOD-41, PRD-23, FD-41 |
| OBJ-56 | consiglio | one sentence when off fascia or pace, fix in a tap | signal | — | — | ◐ | MOD-52, PRD-25 |
| OBJ-57 | contesto | one line beside a voce: «a digiuno», «pre-allenamento» | signal | — | — | ✓ | MOD-53, PAT-33 |
| OBJ-58 | obiettivo | a measure, a window, a bound or a date to reach | reference | — | — | ✓ | MOD-42; 9 |
| OBJ-59 | target del giorno | kcal and grams for the day, fixed per week | reference | — | — | ✓ | FD-20…24, BD-30 |
| OBJ-60 | fascia | a range with its source: da evitare · pessimo · ok · ottimo | reference | — | — | ✓ | FD-30, FD-31, VIS-52 |
| OBJ-61 | media della settimana | the 7-day mean a day is read against | reference | — | — | ✓ | FD-33, FD-36 |
| OBJ-62 | l'ultima volta | the past self: same esercizio, position, hour | reference | — | — | ◐ | MOD-50, TR-20 |
| OBJ-63 | record | the best ever of an esercizio | reference | — | — | ◐ | TR-23 |
| OBJ-64 | decisione | what formulas must not rewrite: a closed day, a frozen target, a skip | reference | — | — | ✓ | MOD-44; 61 |
| OBJ-65 | impostazioni | his body, day boundary, meal times, slack, past previsto | object | — | — | ✓ | DT-01, reframe §11; 1 |
| OBJ-66 | giorno | the logical day, 04:00 to 04:00, closed or open | frame | — | — | ✓ | DT-01, MOD-56; 59 days |
| OBJ-67 | parte del giorno | mattina · pomeriggio · sera · notte | frame | — | — | ✓ | VIS-61, MOD-60 |
| OBJ-68 | periodo | a week, a month, 7 · 30 · 90 days | frame | — | — | ✓ | DT-03, PAT-54, MOD-56 |
| OBJ-69 | il tempo | one timeline: window and position are actions | place | — | — | ○ | reframe §3, §14 |
| OBJ-70 | le cose | the catalog at frame own | place | — | — | ○ | reframe §3 |
| OBJ-71 | Oggi | il tempo, now, a day | place | — | — | ✓ | ADR-0063, design.md (current) |
| OBJ-72 | Piano | il tempo, the future (the rail's right side) | place | — | — | ◐ | PAT-97, reframe §14 |
| OBJ-73 | Elenco | le cose | place | — | — | ✓ | ADR-0063, design.md (current) |
| OBJ-74 | Andamento | il tempo, a week or more | place | — | — | ◐ | ADR-0063, reframe §3 |
| OBJ-75 | Obiettivi | il tempo with the obiettivi | place | — | — | ◐ | ADR-0063, reframe §3 |
| OBJ-76 | Come valutiamo | a voto opened all the way | place | — | — | ✓ | PAT-51, design.md (current) |
| OBJ-77 | Palestra | a sessione live, frame session | place | — | — | ✓ | PAT-63 |
| OBJ-78 | Aggiungi | ⊕ and its page | place | — | — | ✗ | his 20 Nov, proposal §112–§113 |
