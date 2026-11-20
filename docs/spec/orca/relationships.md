# orca — relationships (schema: README.md; rows from round 1, ADR-0064)

| ID | From | Relation | To | How many | Source |
|---|---|---|---|---|---|
| REL-01 | OBJ-01 | made of | OBJ-39 | 1..n | MOD-11 |
| REL-02 | OBJ-02 | made of | OBJ-39 | 1..n | FD-60 |
| REL-03 | OBJ-04 | made of | OBJ-39 | 1..n | builtins.ts |
| REL-04 | OBJ-25 | made of | OBJ-39 | 1..n | MOD-20 |
| REL-05 | OBJ-32 | made of | OBJ-39 | 0..n | PL-30 (none = rest) |
| REL-06 | OBJ-39 | refers to | OBJ-22 | 1 | MOD-11 (with a snapshot) |
| REL-07 | OBJ-39 | refers to | OBJ-23 | 0..1 | FD-01 |
| REL-08 | OBJ-39 | refers to | OBJ-24 | 0..1 | FD-03 |
| REL-09 | OBJ-22 | contains | OBJ-23 | 0..n | FD-01 (levels) |
| REL-10 | OBJ-23 | contains | OBJ-24 | 0..n | FD-01 (levels) |
| REL-11 | OBJ-24 | contains | OBJ-38 | 0..n | MOD-22 |
| REL-12 | OBJ-22 | made of | OBJ-40 | 1..n | FD-04 |
| REL-13 | OBJ-39 | made of | OBJ-40 | 1..n | FD-07 (snapshot) |
| REL-14 | OBJ-22 | refers to | OBJ-37 | 0..n | FD-94 |
| REL-15 | OBJ-01 | refers to | OBJ-25 | 0..1 | MOD-14 (logged from, or saved as) |
| REL-16 | OBJ-02 | refers to | OBJ-26 | 0..1 | FD-64 (his data: to a pasto salvato) |
| REL-17 | OBJ-26 | refers to | OBJ-22 | 1 | ADR-0060 (a flagged cibo) |
| REL-18 | OBJ-05 | made of | OBJ-06 | 1..n | TR-01 |
| REL-19 | OBJ-06 | made of | OBJ-07 | 0..n | TR-01, TR-05 (none = saltato) |
| REL-20 | OBJ-06 | refers to | OBJ-27 | 1 | TR-01 |
| REL-21 | OBJ-05 | refers to | OBJ-28 | 0..1 | MOD-14 |
| REL-22 | OBJ-28 | made of | OBJ-27 | 1..n | PAT-62 |
| REL-23 | OBJ-08 | refers to | OBJ-29 | 0..1 | BD-43 |
| REL-24 | OBJ-17 | refers to | OBJ-35 | 0..1 | builtins.ts |
| REL-25 | OBJ-16 | refers to | OBJ-36 | 0..1 | builtins.ts |
| REL-26 | OBJ-19 | refers to | OBJ-34 | 0..1 | DT-50 |
| REL-27 | OBJ-34 | contains | OBJ-34 | 0..n | DT-50 |
| REL-28 | OBJ-20 | refers to | OBJ-24 | 1..n | MOD-22 |
| REL-29 | OBJ-30 | refers to | OBJ-25 | 0..n | PL-02 (what repeats; a rotation in order) |
| REL-30 | OBJ-30 | refers to | OBJ-28 | 0..n | PL-02 |
| REL-31 | OBJ-30 | refers to | OBJ-33 | 0..n | PL-03 («abitudine») |
| REL-32 | OBJ-31 | made of | OBJ-32 | 1..n | PL-30 |
| REL-33 | OBJ-01 | derived from | OBJ-30 | 0..1 | PL-40 (a previsto a ritmo wrote) |
| REL-34 | OBJ-05 | derived from | OBJ-30 | 0..1 | PL-40 |
| REL-35 | OBJ-41 | made of | OBJ-42 | 1..n | MOD-43 |
| REL-36 | OBJ-42 | refers to | OBJ-60 | 1 | MOD-43 |
| REL-37 | OBJ-41 | derived from | OBJ-01 | 0..1 | FD-50 (a pasto's voto) |
| REL-38 | OBJ-66 | contains | OBJ-67 | 1..n | VIS-61 |
| REL-39 | OBJ-67 | contains | OBJ-01 | 0..n | MOD-60 |
| REL-40 | OBJ-66 | contains | OBJ-05 | 0..n | MOD-10 (every voce sits in a giorno) |
| REL-41 | OBJ-68 | contains | OBJ-66 | 1..n | DT-03 |
| REL-42 | OBJ-66 | refers to | OBJ-59 | 1 | FD-20 |
| REL-43 | OBJ-59 | derived from | OBJ-58 | 1..n | FD-20…22 |
| REL-44 | OBJ-58 | refers to | OBJ-60 | 0..1 | MOD-42 |
| REL-45 | OBJ-43 | derived from | OBJ-10 | 1..n | BD-01 (Kalman on weight and intake) |
| REL-46 | OBJ-44 | derived from | OBJ-10 | 1..n | BD-01 |
| REL-47 | OBJ-45 | derived from | OBJ-07 | 1..n | TR-21 |
| REL-48 | OBJ-63 | derived from | OBJ-07 | 1..n | TR-23 |
| REL-49 | OBJ-46 | derived from | OBJ-02 | 0..n | FD-61 |
| REL-50 | OBJ-47 | derived from | OBJ-02 | 0..n | FD-63 |
| REL-51 | OBJ-48 | derived from | OBJ-09 | 0..n | reframe §12 (and tragitti, sessioni) |
| REL-52 | OBJ-51 | derived from | OBJ-07 | 0..n | TR-25 |
| REL-53 | OBJ-52 | derived from | OBJ-38 | 0..n | FD-80 |
| REL-54 | OBJ-64 | refers to | OBJ-66 | 0..1 | MOD-44 (day_closed) |
| REL-55 | OBJ-71 | contains | OBJ-66 | 1 | reframe §3 |
| REL-56 | OBJ-73 | contains | OBJ-22 | 0..n | reframe §3 (le cose: every object) |
| REL-57 | OBJ-76 | refers to | OBJ-41 | 1..n | reframe §3 |
| REL-58 | OBJ-77 | contains | OBJ-05 | 1 | PAT-63 |
| REL-59 | OBJ-75 | contains | OBJ-58 | 0..n | ADR-0063 |
| REL-60 | OBJ-53 | derived from | OBJ-58 | 0..n | DT-13 |
| REL-61 | OBJ-41 | derived from | OBJ-12 | 0..1 | BD-53 (a sonno's voto) |
| REL-62 | OBJ-41 | derived from | OBJ-05 | 0..1 | TR-50 |
