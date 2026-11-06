# Fold — FOOD and HOME ledger lines → the new spec

Phase 2b, 6 Nov 2026. Every `FOOD-*` and `HOME-*` line of `docs/spec/v2/ledger.md` (62) with
where it now lives: `FD-nn` (`docs/spec/domains/food.md`), `MOD-`/`PAT-`/`PRD-` (horizontal
spec), «not now (xNN)» (his phase 1 answers, `needs.md` §4, product.md §4), «superseded by …»
or «dropped (reason)». Status = the ledger's own mark (D decided · F future · v2 built in v2).

| Ledger ID | Status | Now lives in |
|---|---|---|
| FOOD-01 | D | FD-50, FD-51, FD-52, FD-53; weights adjustable → not now (x10) |
| FOOD-02 | D | FD-30, FD-31, FD-33, FD-35, FD-40, FD-62; its creatine «days of 28» superseded by FD-63 |
| FOOD-03 | D | FD-64, FD-10; «ora della spunta / ora fissa» → MOD-13, MOD-30 |
| FOOD-04 | D | PAT-60, MOD-51 |
| FOOD-05 | D | FD-64; timeline marks → MOD-53, PAT-32 |
| FOOD-06 | D | FD-04 |
| FOOD-07 | D | FD-05 |
| FOOD-08 | F | FD-04, FD-40 |
| FOOD-09 | F | MOD-60, FD-12, FD-51 (timing part); duplicate of FOOD-34 |
| FOOD-10 | F | FD-51, FD-54, MOD-43 (voti never mixed) |
| FOOD-11 | F | FD-05 (fibre by type), FD-31 / FD-36 (inulin ≤ 10 g); a band growing with habit → not now (PRD-02: no data) |
| FOOD-12 | F | not now (x09) |
| FOOD-13 | F | FD-60, FD-61, FD-63; on the timeline → MOD-53 |
| FOOD-14 | F | FD-53 («Pasti adatti» by voto), MOD-51; ratings and tags → not now (PRD-02: no ratings in v2 data) |
| FOOD-15 | F | MOD-12, FD-04 |
| FOOD-16 | F | MOD-14, PAT-22 |
| FOOD-17 | D | FD-01, FD-81, MOD-22 |
| FOOD-18 | D | FD-60, FD-61, FD-62, FD-63 |
| FOOD-19 | D | superseded by MOD-60 and FD-10 (c03; CONTRA-07 closed) |
| FOOD-20 | D | MOD-11, FD-93 |
| FOOD-21 | D | FD-61, FD-63; personal half-lives stay with BODY-11 |
| FOOD-22 | D | MOD-10, MOD-13, FD-92 (estimate as one 100 g line); «Copia ieri» → MOD-51 |
| FOOD-23 | D | FD-10 |
| FOOD-24 | D | FD-04 (NOVA shown, not scored), FD-05 (fibre types); origin, free tags, ratings → not now (PRD-02: no data) |
| FOOD-25 | D | superseded by FOOD-41 → FD-06 |
| FOOD-26 | D | MOD-11, FD-07 (ADR-0007) |
| FOOD-27 | v2 | PAT-62, FD-93, FD-10 |
| FOOD-28 | v2 | FD-05 |
| FOOD-29 | v2 | FD-40, FD-41 |
| FOOD-30 | F | FD-40, FD-41 (micros judged only above coverage, n11); macros by origin/absorption → not now (x07) |
| FOOD-31 | v2 | FD-93, PAT-31; «Salva anche come pasto» → MOD-14, PAT-22 |
| FOOD-32 | v2 | FD-92, MOD-14, PAT-60 |
| FOOD-33 | D | MOD-20, PAT-16 |
| FOOD-34 | F | MOD-60, FD-12, FD-13 (n04, c03) |
| FOOD-35 | D | FD-11 |
| FOOD-36 | F | FD-13 (energy per time band = a metric window, MOD-40) |
| FOOD-37 | F | superseded by PAT-13, PAT-31, FD-93 |
| FOOD-38 | F | PAT-31 (quanto, ↺, «⋯»); its «no ⋯» superseded by PAT-23/PAT-31 |
| FOOD-39 | F | PAT-64, FD-90, FD-91; receipt and label-photo reading → not now (x01, c10) |
| FOOD-40 | D | FD-61, FD-62, FD-63 |
| FOOD-41 | v2 | FD-06, FD-92 |
| FOOD-42 | v2 | PAT-62, PAT-11, MOD-20 |
| FOOD-43 | v2 | PAT-64, FD-90 |
| FOOD-44 | v2 | FD-64, FD-73, MOD-01 (capture «quick») |
| FOOD-45 | v2 | FD-02 (preferred product); the weighted mean across brands → not now (x06, c08) |
| FOOD-46 | v2 | MOD-20, MOD-21, PAT-17, PAT-18, PAT-43 (ADR-0060) |
| FOOD-47 | v2 | PAT-31, FD-93 |
| FOOD-48 | v2 | FD-90 (OFF prefill, brand), FD-03 and FD-81 (formats = price per kg); formats in meals, mean over brands → not now (x06) |
| HOME-01 | D | not now (x03); its price part → FD-81 |
| HOME-02 | D | FD-01, FD-81, MOD-22; receipt line → not now (x01) |
| HOME-03 | F | PAT-64, FD-90 |
| HOME-04 | F | not now (x03) |
| HOME-05 | F | not now (x01) |
| HOME-06 | F | FD-91 (field by field, OFF first via FD-90); the photo crop → not now (x01, c10, PRD-27) |
| HOME-07 | F | MOD-20, PAT-18 |
| HOME-08 | F | not now (x02) |
| HOME-09 | D | MOD-22, MOD §8 «Money» (→ a future `domains/money.md`); receipt lines and aliases → not now (x01) |
| HOME-10 | D | not now (x03); «latest price feeds snapshots» → FD-07, FD-81 |
| HOME-11 | D | not now (x03: batches belong to the pantry that plans) |
| HOME-12 | F | superseded by HOME-04/05/06/08 → not now (x01, x02, x03) and FD-91 |
| HOME-13 | F | not now (x02) |
| HOME-14 | D | FD-80, FD-81, FD-82, FD-83, FD-84 |

Counts: 62 lines, every one with a destination. By main (first) destination: FD 31 · MOD/PAT 19 ·
not now 8 · superseded 4 (FOOD-19, FOOD-25, FOOD-37, HOME-12). Lines split between a rule and a
«not now» part: 12.
