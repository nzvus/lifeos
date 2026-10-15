# ROADMAP.md

> One file: future (top), present (middle), past (bottom). Completed sprints
> are compressed to a few lines by the `retro` skill — never deleted.
> This is the ONE plan (2026-10-15). The developer's raw feedback goes to
> `Projects-artifacts/LIFEOS/considerations.txt` (Syncthing); the agent folds
> it in here. The refactor plan, handoff, audit and feedback files of
> 2026-10-09…11 were folded in and deleted; their sources are in
> `docs/spec/sources.md`.

## Now: lifeos v2 (ADR-0053, decided 2026-10-15)
The developer: "un'app completa per tracciare tutto il mio quotidiano… temporalmente
intelligente… astrarre e unificare al massimo". The v1 spec (`docs/spec/01–08`)
describes today's app and its issues; the v2 target is `docs/spec/v2/`: one
timeline engine (kinds, entries, catalogs, templates, goals, metrics,
judgements, decisions), a hybrid schema, a parallel app, design boards first.
v1 gets fixes only; its open requests (gym auto mode, rests, coherent advice,
compact rows, filters, meal roles, day templates, micronutrients, food identity,
scanning) are placed in the v2 spec.
1. **Target approval**: ADR-0053, `docs/spec/v2/*`, the design system and the
   "lifeos v2" boards (links in `docs/spec/v2/README.md`). The developer
   comments on the boards; the agent iterates.
2. **Workspace**: `apps/v1` (moved), `apps/v2`, `packages/kit`; Vercel project
   and Neon branch for v2.
3. **Engines** test-first (time, metrics, planning, body state, targets,
   training, judgements, correlations, data quality).
4. **v2 schema + converter + parity** on the developer's export in PGlite.
5. **Slices**: day timeline + generic kinds → food → training → body and mind
   → habits, activities, goals → money and pantry → review. Each slice checked
   on the phone against the developer's data.
6. **Switch** when every v1 screen id is covered and parity is green.
In parallel on v1: ADR-0052 B (merge) and C (CSV), if still wanted before v2.

## Open items owned by the developer
- **PRs to review and be able to explain** (CLAUDE.md rule 6, deferred): #126–#186; pick 3 to walk through.
- **Habits the learnt expenditure needs (ADR-0041/0042):** weigh in every morning; close each day.
- **Data fix (2026-10-15):** load `Projects-artifacts/LIFEOS/lifeos-export-2026-10-15-incline-db-press-x2.json` with Settings → Replace (24 Incline db press sets ×2), before logging more; say whether the lateral raises' 10 kg is per dumbbell.
- **Assistant:** off unless `ASSISTANT_ENABLED=true` ("no AI for now", 2026-10-09).
- **Security:** rotate the production DB password pasted on 2026-09-30, unless already done.
- **Decisions:** ADR-0007 still `proposed`; "What I learned" missing in most ADRs; a retro for s71–s102 never run.

## Backlog (v1 era; each item now lives in docs/spec/v2 or is dropped there)
- Back-test of the learnt expenditure on the developer's export (refactor plan Phase 2)
- Training: deload suggestion, one rest field (planned; actual derived) — ADR-0049 leftovers
- Code: routes ≤ ~150 lines, logic in `core/`; drop `user_settings.target_*` (deprecated by ADR-0008)
- Sleep import from Health Connect / Apple Health, if a native shell or an export becomes available (ADR-0031 tripwire)
- Offline logging at the gym (ADR-0019 tripwire)
- Movement extras: stairs, bike commuting
- Finance: accounts and balances, bank/PayPal importers, monthly report
- Day planner, tasks/habits, rewards over an event stream (the timeline already shows every logged kind)
- Notes bridge to the Obsidian vault; home bridge on a LAN device — needs its own ADR
- Assistant: more tools, streaming — only when it is turned back on
- Template meta-loop: reset `ai-native-starter`; record what this project taught in its TEMPLATE-CHANGELOG

## Done
<!-- retro skill appends compressed entries here, newest first -->

### Refactor phases 4 and 6, the movement model, the Today review — s89–s102 (2026-10-10 → 10-11, no retro yet)
Shipped: reps left per set and progression gated by them, readiness and volume notes (#171–#172, ADR-0049, migration 0035); Today as one page and one timeline of slots, entries, sessions and the day's events, entries edited in place, slot suggestions, one nutrient bar, score row (#173–#178, #180, ADR-0050); steps count from zero and the level is time on your feet, on the trend weight (#179, #182, ADR-0051); set times that survive a misclick (#181); week navigation and a month calendar (#182). Phases 0–3 of the 2026-10-09 plan were done before (see below) | Decisions: ADR-0049 A×4, ADR-0050 A; ADR-0051 delegated | Lesson: #178–#181 shipped in a hurry were sent back ("non volevo un lavoro così frettoloso"): check every touched surface on the phone against the developer's data | Carried over: retro; the spec.


### Refactor, phases 2b–3 and the audit — s77–s88 (2026-10-10, no retro yet)
Shipped: the goal and the weekly check-in (#157–#158, ADR-0043), export of calibration factors (#159), day programs with slots, shift and new moments (#161–#163, ADR-0044), the goal as kind + target + day with planned pace (ADR-0045), an audit on the developer's data with five display fixes (#164), the goal as the one source and recomposition with a target (#165, ADR-0046), "This week" (#166, ADR-0047), the check-in made optional (#167, ADR-0048). Migrations 0031–0034, 570 tests | Decisions: ADR-0044 A×4 ("procedi"); the rest delegated ("fai tutto quello che ritieni meglio") | Lesson: features shipped faster than the developer could try them, and layering a goal on day types without retiring the old fields made the app look broken ("forse va rifatto tutto da capo"). An audit on the developer's own data showed the engine right and the concepts overlapping. Explain a feature in one plain sentence before shipping it, and retire what it replaces in the same PR | Carried over: retro; second audit on a fresh export; "What I learned" for ADR-0040–0048.

### Refactor, phases 0–2a — s71–s75 (2026-10-09, no retro yet)
Shipped: Phase 0 — snacks placed by their time, Lidl receipts (quantity under the item, no discount summary, shop from the chain), barcode in every browser (ZXing ponyfill, HD, check digit), implausible weigh-ins confirmed and all but ignored, assistant behind `ASSISTANT_ENABLED`, an export uploaded as a pack explained, a hydration bug on /ingredients/new (#151); Phase 1 — one day engine `core/day` for every screen, carbs take the rest, Trends shows dynamic days' targets (#152, ADR-0040); Phase 2a — expenditure learnt from the whole log and scale (#153, ADR-0041), closed days and a learnt factor on estimates (#154, ADR-0042, migration 0030). 505 tests | Decisions: plan D1–D5 accepted ("procediamo"), D7 and the details delegated | Lesson: simulation with a known truth chose the estimator — 14-day Kalman windows wasted the data (±0.065 after 12 weeks) and "estimates are less sure" alone changed nothing; a learnt bias did. A push after a merge happened again (#154 → #155): check the PR state in its own call | Carried over: retro; the developer's review on the phone; "What I learned" for ADR-0040–0042.

### After the S11–S12 retro — slices s45–s60 (2026-10-02 → 10-03, no retro yet)
Shipped: steps at one cost per step (ADR-0032); a "+" in every section, adding only from it; where things live — sub-tabs everywhere, Today in Summary · Food · Training (ADR-0033); 24-hour times, energy as spending / eaten / verdict; the assistant shown at work; packs — a starter for every new account, import from Settings — and sign-up by one-use invitation (ADR-0034); tabs by moment: the Plan tab (the month as a calendar), Training as a library, program days as lists with skip (ADR-0035); speed — Today's views switched in the browser, food edits optimistic with "The day with the plan" live, one parallel round of queries; the dynamic-day fix and migration 0024 (#141). PRs #126–#141, migrations 0022–0024, 438 tests | Decisions: ADR-0032–0035 (0035 delegated) | Lesson: the developer's export loaded into the preview account found in minutes what a day of screenshots on test data hid — the first-food copy without a dynamic type's mode (no targets: no energy bar, empty rings) and an importer that silently dropped the same fields; the round-trip test now seeds them | Carried over: retro for these slices; developer review on the phone; "What I learned".

### S11–S12 — The day as a plan, design review, body and sleep (2026-10-01 → 10-02, retro 2026-10-02)
Shipped: day page as a plan (plan / start / record training, goal line with the balance wanted / with the plan / so far, NutrientRow "colour = state", macro bands); training programs as a cycle with per-day overrides; gym mode fixes (clock, rest, warm-ups) and exercise guides with double-progression targets; smarter weigh-ins (context, trend, BMI); movement from the most measured source; sleep; the whole design review — 360 px at 120 % text in every theme, tabs by task (Today · Training · Food · Progress · Assistant), the "+" and sheets, autosaving settings, compact lists, delete with confirmation. PRs #105–#125, ~400 tests | Decisions: ADR-0021–0031; design choices S1–S7 delegated to the agent | Lesson: real use found what tests missed — the gym clock that never started, sets planned as already done, sleep that a phone's time picker never saved, a client constant rendered as a function; each is now a test, a lint rule or a note in the agent's memory. The phone emulation and the 360 px / 120 % audit caught every overflow the developer saw | Carried over: developer review on the phone, "What I learned", the movement extras and sleep import (backlog).

### S08–S10 — Pantry, energy, assistant (2026-10-01, retro 2026-10-02)
Shipped: pantry (products of any kind, purchases, counts, derived stock, shopping list, batches as portions, reminders); energy model with ranges (BMR, everyday level, walking, training done and planned) and calibration from the weight trend; dynamic day types (gain / recomposition / cut); the assistant (encrypted key on the server, tools with Undo, attachments, barcode → Open Food Facts); installable PWA. Migrations 0014–0016 | Decisions: ADR-0014, 0017–0020 (0021 corrected the model's double counting the next day) | Lesson: a column on an existing table broke production until migrated (#103) — new tables first, and the migration gate now checks a real `migrate.yml` run, not a label | Carried over: the assistant never tried with a real key; developer review.

### S06–S07b — Training and one edit model (2026-09-30 → 10-01, retro 2026-10-02)
Shipped: exercises, typed sets, sessions planned/done, routines, burn as a range; importers that reproduced every hand-made tonnage; muscle groups and movement patterns with icons; Training as progress; live gym mode; one edit model everywhere (drafts, pinned bar, Undo, trash with a 30-day purge); training logged from the day like food. Migrations 0008–0013 | Decisions: ADR-0005, 0013, 0015, 0016 | Lesson: Vercel's 100 deploys a day ran out twice — slices are grouped into fewer PRs, previews only for schema changes | Carried over: developer review on the phone.

### S01–S05 — Walking skeleton, nutrition, day types, interface, themes (2026-09-29 → 09-30, retro 2026-10-02)
Shipped: v1 live on the free tier (auth, ingredients, meals, daily log with snapshots, export, CI, backups, restore drill passed); day types with targets stable for past days; phone/desktop layouts, smart search and sorting; planned vs eaten, estimated meals, moments, tags, ratings, day-quality score; themes as tokens, light/dark/system; trends and analysis on 7/30/90 days; FitForge and lifeos importers. Migrations 0001–0007 | Decisions: ADR-0006–0012 | Lesson: two same-day production incidents — a PR merged before its migration (#22), and an inline function passed to a client component (#44); both now guarded (CI gate; render pages locally before a UI PR) | Carried over: ADR-0007 still proposed; the developer's review of S01–S05 on the phone, never done; review-and-explain-each-diff (CLAUDE.md rule 6) suspended at the developer's choice since 2026-09-30.

### S00 — Foundational decisions (2026-07-23 → 2026-09-29)
Shipped: ADR-0001..0004 + 0006 accepted; 0005 deferred to training by design | Retro (2026-09-29): comprehension questions skipped at the developer's choice; Q07 — the decisions hold for v1, and a home server/bridge for domotics, Syncthing and finance is planned later; Q08 — from now on the agent writes code and the developer reviews each diff and can explain it before committing | Lesson: not recorded — Q09 was not answered, and it must be in the developer's words | Carried over: "What I learned" sections.
