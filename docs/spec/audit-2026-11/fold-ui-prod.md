# Fold — every UI, PROD and CONTRA ledger line to its home in the new spec (phase 2b)

Ledger: PROD-37, PROD-40, PROD-44. Every line of `docs/spec/v2/ledger.md` with ID `UI-*`, `PROD-*` or
`CONTRA-*` (103 + 45 + 8 = 156) → where it now lives: `PRD-` (product.md), `MOD-` (model.md), `PAT-`
(patterns.md), `VIS-` (visual.md), «not now (xNN)» (product.md §4), «superseded by …», «dropped
(reason)», «process → CLAUDE.md». Phase-1 answers: `n`, `c`, `x` in `needs.md`. «Open» = a question
for him, not decided here.

## PROD
| ID | Destination | Note |
|---|---|---|
| PROD-01 | PRD-18, PRD-42 | a screen is a composition; «built» only with a test citing the ID |
| PROD-02 | MOD-10, MOD-11, MOD-22, MOD-44 | settings theme/density: VIS-01 |
| PROD-03 | MOD-01 | his own tracker = a registry row, one area (ADR-0059) |
| PROD-04 | MOD-01, PRD-02 | built-in types as registry entries; hunger: not now (x09) |
| PROD-05 | MOD-30, MOD-42 | habit = blocco of a tracker (PROD-45) |
| PROD-06 | MOD-01, PRD-03 | |
| PROD-07 | MOD-10, MOD-13 | |
| PROD-08 | MOD-01 | |
| PROD-09 | MOD-12 | |
| PROD-10 | MOD-20 | project/place/person/book catalogs: dropped (no data, PRD-02) |
| PROD-11 | MOD-40 | |
| PROD-12 | MOD-42 | |
| PROD-13 | MOD-43 | adjustable weights: not now (x10) |
| PROD-14 | MOD-60 | |
| PROD-15 | MOD-44 | |
| PROD-16 | MOD-01, MOD-10, MOD-20 | |
| PROD-17 | MOD-50…55, model §8 | |
| PROD-18 | PRD-18, PAT-30, PAT-32, PAT-03 | Review → Andamento tab; correlations MOD-55 |
| PROD-19 | process → CLAUDE.md (Layout; ADR-0056, ADR-0057) | architecture, not a spec rule |
| PROD-20 | PRD-01 | multi-user: not now (x12) |
| PROD-21 | MOD-11, PRD-22 | invariants stay in PROJECT.md §3 |
| PROD-22 | process → CLAUDE.md (Stack) | native shell: future change (MOD-54) |
| PROD-23 | MOD-54, MOD-12 | |
| PROD-24 | PRD-27 | c10 |
| PROD-25 | PRD-53 | c12: rule of three |
| PROD-26 | process → CLAUDE.md (Role) | |
| PROD-27 | process → CLAUDE.md; feedback → PRD-43 | `changes/inbox.md` replaces `considerations*.txt` |
| PROD-28 | superseded by PRD-40, PRD-41 | `domains/<area>.md` + `changes/` replace dossiers |
| PROD-29 | PRD-26 | |
| PROD-30 | process → CLAUDE.md (Tests and deploys) | |
| PROD-31 | process → CLAUDE.md; PRD-52 | |
| PROD-32 | process → CLAUDE.md («Done» only after checking) | |
| PROD-33 | process → CLAUDE.md | |
| PROD-34 | superseded by PRD-41…43 | the ledger is archived at the end of phase 2b |
| PROD-35 | process → CLAUDE.md (Process rules) | phase 0 done |
| PROD-36 | PRD-03, MOD-01, PAT-24 | |
| PROD-37 | PRD-40, PRD-41 | migrate v2, no v3 |
| PROD-38 | PRD-42, patterns §9 | |
| PROD-39 | PRD-50…53 | operational copy in CLAUDE.md |
| PROD-40 | product.md §4 (x01–x15); n/c IDs cited in every spec file | |
| PROD-41 | PRD-25, MOD-50…52 | |
| PROD-42 | PRD-25, MOD-53, MOD-60 | |
| PROD-43 | PRD-53, patterns §9 | |
| PROD-44 | product/model/patterns status; ADR-0061 | |
| PROD-45 | product §3 (abitudine), MOD-42 | |

## UI
| ID | Destination | Note |
|---|---|---|
| UI-01 | PAT-12, PAT-32, VIS-50, MOD-53 | caffeine at bedtime = context line |
| UI-02 | VIS-50, VIS-52, VIS-61 | «densità» → its «Perché?» (PAT-51) |
| UI-03 | VIS-43, VIS-50, VIS-52, VIS-63, VIS-75 | criteria → MOD-43 (domains/cibo); gym A → PAT-63 |
| UI-04 | superseded by PAT-60, PRD-13 | one-tap ⊕ with Annulla; water under the week (UI-91) |
| UI-05 | VIS-33, VIS-40, VIS-50, MOD-53 | pills that say something = context line |
| UI-06 | VIS-01…90, PAT-*, PRD-10…19 | the register is folded: S/D/L/V/T → VIS, C → PAT, P → PRD |
| UI-07 | PAT-41 | |
| UI-08 | PAT-41 | ranking «di solito a quest'ora» |
| UI-09 | PAT-42 | |
| UI-10 | PAT-41, PAT-42 | filters as chips |
| UI-11 | PAT-40, PAT-43, PAT-54, VIS-11 | period vocabulary in `F` |
| UI-12 | patterns §9 | |
| UI-13 | VIS-30 | |
| UI-14 | VIS-33 | |
| UI-15 | VIS-22, VIS-23, VIS-33 | Find's icon chips: PAT-41 + VIS-30 |
| UI-16 | VIS-31 | |
| UI-17 | VIS-32, VIS-80 | sticky cross-fade superseded by UI-79 |
| UI-18 | VIS-04 | L2 framed vs unframed settled by UI-78 |
| UI-19 | VIS-02, VIS-05, VIS-10 | |
| UI-20 | superseded by UI-83 → VIS-41 | status-as-shape kept in VIS-22 |
| UI-21 | VIS-85, PRD-14 | |
| UI-22 | VIS-85 | |
| UI-23 | VIS-51 | |
| UI-24 | VIS-86, PAT-61 | |
| UI-25 | PAT-80, VIS-02 | |
| UI-26 | PRD-18, PRD-53 | |
| UI-27 | MOD-01, VIS-03, VIS-41 | |
| UI-28 | VIS-90 | |
| UI-29 | patterns (Kit column), VIS-40, VIS-50, VIS-63 | |
| UI-30 | VIS-33, VIS-40, product §3 | «routine» not a word → «scheda» |
| UI-31 | VIS-50 | |
| UI-32 | VIS-52 | |
| UI-33 | VIS-40, VIS-85 | |
| UI-34 | superseded by patterns §9 (Playwright shots, `/kit`) | boards frozen |
| UI-35 | PRD-10…18, patterns §9 | |
| UI-36 | PAT-30 | |
| UI-37 | PRD-11, PAT-13, PAT-14 | c11 |
| UI-38 | PAT-19, PAT-20, MOD-20 | |
| UI-39 | PAT-20, PAT-21, PAT-73 | |
| UI-40 | PAT-10…23, PAT-74 | |
| UI-41 | PAT-40, PAT-41, PAT-42 | |
| UI-42 | PRD-13, VIS-61 | Piano day actions → MOD-31/33 (phase 4 change) |
| UI-43 | patterns §9 (ui-check in CI) | |
| UI-44 | VIS-11, PAT-50 | |
| UI-45 | product §3 | «modello» → «blocco», «routine» → «scheda» |
| UI-46 | PAT-81 | |
| UI-47 | VIS-20, VIS-21, MOD-43 | |
| UI-48 | VIS-23 | |
| UI-49 | PAT-70…74 | |
| UI-50 | VIS-50, VIS-32, VIS-90, VIS-60, VIS-41, VIS-42, VIS-43, VIS-75 | water need line → MOD-53 |
| UI-51 | superseded by PRD-16, PAT-03 (map D) | V-16 sliders: not now (x10) |
| UI-52 | PAT-31, PAT-32, MOD-11, VIS-60 | |
| UI-53 | superseded by PRD-16, PAT-03 | areas filter the day; Oggi = all |
| UI-54 | superseded by PRD-16, VIS-70 | Day detail → Andamento; recovery score: not now (x08) |
| UI-55 | VIS-50 | |
| UI-56 | PAT-03 (Andamento), PAT-53 | correlations: MOD-55 |
| UI-57 | PAT-30, PAT-32 | |
| UI-58 | MOD-02, PRD-18 | |
| UI-59 | PAT-04, PAT-21, PAT-51, VIS-03, VIS-05, VIS-22 | |
| UI-60 | superseded by PRD-16 (ADR-0059) | |
| UI-61 | PRD-10…18, PAT-12, PAT-30, MOD-20 | |
| UI-62 | PRD-16 | duplicate of UI-60/UI-90 |
| UI-63 | PAT-04, PAT-10 | |
| UI-64 | VIS-51 (full width); density: not now (x14) | ⓘ legend superseded by PAT-51 |
| UI-65 | VIS-52 | |
| UI-66 | not now (x14) | VIS-01 |
| UI-67 | superseded by PRD-11 (c11) | |
| UI-68 | VIS-50 | |
| UI-69 | PRD-19 (c01) | |
| UI-70 | VIS-05, VIS-01, PAT-20 | export stays as built (Profilo) |
| UI-71 | PAT-15, PAT-20, PAT-21 | swipe = shortcut of Elimina (agent) |
| UI-72 | PAT-63 (saved instants, resume) | full offline: not now — only as a change (PRD-41) |
| UI-73 | PRD-20, PRD-19 | gaps: MOD-53/60 (caffeine), x11 (weather), x08 (readiness) |
| UI-74 | VIS-01, PRD-28 | |
| UI-75 | VIS-43 | |
| UI-76 | VIS-63 | |
| UI-77 | VIS-60, VIS-61, VIS-62 | |
| UI-78 | VIS-04 | |
| UI-79 | VIS-32, VIS-41, VIS-42, VIS-80 | |
| UI-80 | VIS-70, VIS-75 | open: 3 levels vs PRD-19 |
| UI-81 | VIS-32, VIS-33 | |
| UI-82 | VIS-33, VIS-70 | |
| UI-83 | VIS-32, VIS-41, VIS-42 | |
| UI-84 | VIS-40, PAT-80 | |
| UI-85 | settled: PRD-13 (water, UI-91), MOD-54 (session and step kcal) | the «?» closes |
| UI-86 | VIS-70 | |
| UI-87 | VIS-63, PAT-54 | |
| UI-88 | superseded by patterns §9 | `/kit` stays as a tool |
| UI-89 | VIS-05, VIS-10, VIS-11, VIS-43, VIS-61 | open: 36 px exceptions vs PRD-12 |
| UI-90 | PRD-16, PAT-01, PAT-03, PRD-14, VIS-30 | |
| UI-91 | PRD-13 | screen order, not a visual rule |
| UI-92 | PAT-10 | |
| UI-93 | MOD-51, PRD-13, VIS-63 | |
| UI-94 | superseded by PRD-16, PAT-04 | step 5 mostly built |
| UI-95 | PAT-03, PAT-04 | one route per family replaces per-object routes |
| UI-96 | PAT-04, PAT-13 | `/modifica` pages go |
| UI-97 | PRD-16, PAT-02 | Profilo outside the five areas, as built |
| UI-98 | VIS-63, PAT-54 | |
| UI-99 | VIS-75 | |
| UI-100 | PAT-40 | |
| UI-101 | PAT-12, PAT-53 | |
| UI-102 | VIS-43, PAT-52 | |
| UI-103 | settled by PRD-50 | no per-screen visual rounds; tracker charts = PAT-30 «Andamento» + PAT-53 |

## CONTRA
| ID | Settled by | Now |
|---|---|---|
| CONTRA-01 | UI-78 | VIS-04 |
| CONTRA-02 | UI-77, c13 | VIS-60 |
| CONTRA-03 | UI-79 | VIS-41, VIS-42, VIS-80 |
| CONTRA-04 | «scheda» (3 Nov) | product §3 |
| CONTRA-05 | c11 | PRD-11 (PAT-13, PAT-14) |
| CONTRA-06 | PAT-61 + MOD-60 | the meal's role is a `choice` field of the generated form, prefilled from the time; four short options → segmented (VIS-85), never chips |
| CONTRA-07 | c03 | MOD-60 |
| CONTRA-08 | ADR-0059 | PRD-16 |

## Open for him
- PRD-19 «two levels at most» vs three levels on weather and week (UI-80, UI-76; VIS-70).
- PRD-12 «never under 44 px» vs 36 px inside a 44 px row and 36 × 46 calendar cells (UI-89; VIS-05).
