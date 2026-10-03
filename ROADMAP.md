# ROADMAP.md

> One file: future (top), present (middle), past (bottom). Completed sprints
> are compressed to a few lines by the `retro` skill — never deleted.

## Backlog (unordered, one line each)
- Movement extras: stairs/floors, bike commuting, hours on one's feet at work (ADR-0030 left them out)
- Sleep import from Health Connect / Apple Health, if a native shell or an export becomes available (ADR-0031 tripwire)
- Offline logging at the gym (ADR-0019 tripwire; the app is already installable)
- Assistant: more tools (products and purchases, routines, exercises, ratings, tags, day types, batches), advice prompts, streaming
- Exercise guides: specific guides for common lifts beyond the pattern ones, if the pattern ones prove too general (ADR-0028 tripwire)
- Training cycle that picks the day type automatically (ADR-0008 option C)
- Gamification: weekly/monthly roll-ups, objectives
- Data ownership: FitForge daily logs as snapshots (ADR-0007); "re-snapshot entry" if label fixes become common
- Drop `user_settings.target_*` (deprecated by ADR-0008) once profiles have run in production for a while
- Finance: accounts, entries, bank/PayPal importers, categories, monthly report — needs its own ADR on where financial data lives
- Receipts: photo/OCR → line items → products linked to ingredients; price history
- Day planner, tasks/habits, rewards over an event stream
- Notes bridge to the Obsidian vault; home bridge on a LAN device (Home Assistant, Syncthing) — needs its own ADR
- Template meta-loop: reset `ai-native-starter` to a clean template; record what S00–S12 taught in its TEMPLATE-CHANGELOG

## Open items owned by the developer
- **#141 (has a migration, data only):** `gh workflow run migrate.yml --ref s60-dynamic-days -f confirm="migrate production"`, then merge. Until it runs, 2026-10-03 has no targets (no energy bar, empty rings).
- **Check on the phone after #140:** do Today's tabs and the food's −/+ and tick feel instant? The numbers (30–80 ms tabs, ~50 ms edits) are from a local build, not Vercel.
- **PRs to review and be able to explain** (CLAUDE.md rule 6, deferred): #126–#141.
- **Use it for real, every day:** weigh-ins with the tags, steps or walk, sleep, food, the real training program (Training → Programs). Calibration, dynamic targets and the trends need two to four weeks of it.
- **Assistant:** `ASSISTANT_KEY_SECRET` on Vercel (if not done), the OpenRouter key in Settings, a first try on the phone — never tested with a real key.
- **Security:** rotate the production DB password pasted into a chat on 2026-09-30 (`neondb_owner`; GitHub `DATABASE_URL_DIRECT`, Vercel `DATABASE_URL`; redeploy; run `backup`) — unless already done.
- **Decisions:** ADR-0007 is still `proposed` (accept or reject). "What I learned", in your words, is missing in ADR-0005 and 0010–0031 (0001–0004, 0006–0009 have agent drafts to rewrite).
- **Review on the phone** of what was built since S01: most sprints closed with this box open (see Done).
- Data confirmations from 2026-09-30: "SALSA DI POMODORO CI" 0,89 € (a separate product?); "CIOCC. FONDENTE" 0,85 € (70 % or 50 %?); "CREMA DI ARACHIDI" 2,09 € (100 % peanut butter?); package weights of protein mozzarella (100 g) and cod fillets (1 kg).

## Next sprint: S13 — draft, to discuss (not started)
- **Goal (proposal):** live with the app for two weeks and let the data correct it — the first real calibration, targets checked against the scale, the guides and the program against real sessions; fix what daily use breaks, before adding features.

## Done
<!-- retro skill appends compressed entries here, newest first -->

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
