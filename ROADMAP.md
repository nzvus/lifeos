# ROADMAP.md

> One file: future (top), present (middle), past (bottom). Completed sprints
> are compressed to a few lines by the `retro` skill — never deleted.

## Backlog (unordered, one line each)
- Training: heterogeneous exercises, sessions, sets, estimated burn (ADR-0005 first); importers for FitForge JSON and the PUSH/PULL text logs
- Gamification: daily/weekly/monthly roll-ups, surplus/cut, objectives
- UX/kit: one-click theme toggle, reusable widgets, smart search, lazy loading, gym timer
- Data ownership: import of the lifeos export format (round trip); FitForge daily logs as snapshots (ADR-0007); later AI review of goals
- Nutrition: "re-snapshot entry" if label fixes become common (ADR-0007 tripwire)
- Finance: accounts, manual entries, bank + PayPal export importers (dedupe, transfer matching), categories, monthly report — needs its own ADR on where financial data lives
- Receipts: photo/OCR -> reviewed line items -> products linked to ingredients; price history, purchase frequency (ADR-0007 option D likely)
- Day planner, tasks/habits, rewards + accountability rules over an event stream
- Notes bridge to the Obsidian vault (read/search, quick capture)
- Home bridge on a LAN device (old Motorola phone): Home Assistant control, Syncthing status — Vercel cannot reach the home network, so this needs its own ADR
- Drop `user_settings.target_*` (deprecated by ADR-0008) once profiles have run in production for a while
- UI: installable app (PWA) + offline logging at the gym; one-click theme toggle; charts of weight and intake over time
- Training cycle that picks the day profile automatically (ADR-0008 option C, with the training module)
- Activity-based targets: plan the day's activities (gym session: type, exercises, duration, rests; walks, runs; how sedentary the rest was) and derive energy/carb targets from them. Needs the training module (ADR-0005) and an explicit energy model (MET-style, always shown as estimates — PROJECT.md non-goal: no falsely precise burn numbers)
- Template meta-loop: reset `ai-native-starter` to a clean template; record what S00/S01 taught in its TEMPLATE-CHANGELOG

## Current sprint: S01 — Walking skeleton + nutrition v1, deployed and owned
- **Goal:** PROJECT.md v1 live on the free tier: sign in, ingredients, meals, daily log vs targets, export — with the ADR-0003/0004 durability pipeline actually running.
- **Built by the agent on 2026-09-29 at the developer's explicit request (one batch, not small slices), verified in a sandbox:** typecheck, lint, 31 tests, production build, HTTP smoke test on Postgres 16, one local restore drill.
  - [x] Scaffold: six `src/` directories, Tailwind `@theme` tokens, boundary lint rules — proven by planted violations (ADR-0002)
  - [x] Schema + first migration through generate -> review -> apply (ADR-0003)
  - [x] Better Auth, email+password, sign-up behind `ALLOW_SIGNUP` (ADR-0006)
  - [x] Ingredients, meals, daily log with snapshots, targets, settings, export
  - [x] Cross-user read test for every user-owned entity (ADR-0003/0006)
  - [x] CI workflow, `/api/health`, backup workflow + heartbeat, human-triggered migrate workflow (ADR-0004)
  - [x] Error-handling design (ARCHITECTURE.md "Errors")
  - [x] Forms tested in a real browser by the developer (2026-09-29)
  - [x] FitForge importer for ingredients + meals (`npm run import:fitforge`, dry run by default); verified on the real export: 32 ingredients, 13 meals, kcal identical to an independent calculation
- **Only the developer can do (docs/runbooks/setup.md):**
  - [ ] Review the diff and be able to explain it (CLAUDE.md process rule)
  - [ ] Accept or reject ADR-0007 (status is `proposed`)
  - [x] Neon project, GitHub secrets/variables, healthchecks.io checks, Vercel project (2026-09-29; live at lifeos-omega-seven.vercel.app)
  - [x] Branch protection on `main` requiring `check` (ruleset `protect-main`)
  - [x] First backup run, first `migrate production` run (2026-09-29)
  - [x] **The restore drill on a real backup, logged in docs/runbooks/restore-drill.md** (2026-09-29, pass)
  - [x] Production data: FitForge export + two supplements (diet document recipes) imported — 47 ingredients, 22 meals
- **Carried over from S00:** the "What I learned" sections of ADR-0001..0007 are still agent-drafted or empty; the developer rewrites them.
- **Review criteria:** CI green on GitHub ✓; `/api/health` 200 on production ✓; healthchecks.io green for 2 consecutive days (pending: first scheduled runs 2026-09-30 and 10-01); restore drill logged ✓; `python3 scripts/check.py` clean except the expected 0005 gap warning ✓.

## Next sprint: S02 — Day types and targets (started early, 2026-09-29)
- **Goal:** targets per kind of day (gym / run / rest…), chosen on the day page, stable for past days.
- [x] ADR-0008 accepted (developer chose the recommended option B)
- [x] Migrations 0001 (tables) + 0002 (backfill "Standard" profile), rehearsed on real Postgres with old-schema data
- [x] Profiles page, day-type picker on the day page, export v2; 45 tests incl. cross-user and snapshot
- [x] Production migration via `migrate.yml`; real profiles created (Gym / Rest default / Run, 2026-09-30)
- [ ] Developer review

## Next sprint: S03 — Interface and usability (started 2026-09-29, night)
- **Goal:** faster, adapted to phone and desktop, smarter search and ordering, richer but minimal information.
- [x] Speed: functions in `fra1` next to the database; session cookie cache; loading skeleton; smaller pages (dictionary slices)
- [x] Layout: bottom tab bar on phones, two-column day view with sticky label on desktop, card/table lists
- [x] Smart search (accents/case-insensitive, all words, best match) and ordering by usage in the last 60 days
- [x] Searchable pickers in the log forms and the meal editor; ingredient and meal browsers with 6–7 sort orders
- [x] Richer info: energy split bar, all macros per entry, expandable entry contents, protein per 100 kcal, price per kg
- [x] "Repeat yesterday's meals" on an empty day (copies the logged snapshot, ADR-0007)
- [x] Sort direction ↑/↓ on every sort (natural direction by default, missing values always last)
- [x] Colours per nutrient everywhere; icons (lucide-react) in nav, buttons, nutrients, search, sorting
- [x] Day at a glance: energy ring (left / over) and coloured bars per macro and fibre with targets
- [x] Last 7 days charts (energy, protein) with target ticks, linked to each day; macro composition per ingredient
- [ ] Developer review on a real phone and a desktop browser (no browser was available to the agent: layout and keyboard behaviour are untested visually)

## Next sprint: S04 — Richer logging and food knowledge (started 2026-09-30)
- [x] lifeos export importer, "replace" mode (one transaction, backup-first runbook); round-trip test
- [x] Ingredient and meal names/notes revised (approval table), numbers untouched
- [x] "Update with current values" on log entries (ADR-0007 tripwire: prices added after logging)
- [x] MacroStrip: one colour-coded macro display everywhere; pickers also search notes
- [x] One day panel (concentric rings + bars for all 8 nutrients) replaces ring + label; target kinds (min / max / target) with graded colours; auto maxima for sugars (EU RI), saturated fat and salt (WHO)
- [x] Ingredient upsert by name (`upsert:ingredients`, field-level dry run): 4 labels photographed, prices from 2 Lidl receipts
- [x] Planned / eaten checkbox with time (tick = now, editable; user's time zone), estimated meals, planned drawn translucent in rings and bars; "repeat yesterday" makes plans (ADR-0009, migration 0003)
- [x] ADR-0012 accepted (tags C + ratings A): typed NOVA/origin/fibre types (snapshotted) + free tags; meal ratings per factor; migration 0007
- [x] Tags and ratings in the app: ingredient editor + badges, meal quality summary (NOVA energy, protein origin, fibre types, tags), rating factors + stars + notes; export v5
- [x] Day quality score 0–100 with its breakdown (targets 40, processing 35, fibre variety 25; missing parts re-weighted) and fibre eaten by type

## Next sprint: S05 — Themes and design pass (started 2026-09-30)
- **Goal:** user-selectable themes that may replace components (ADR-0010), light/dark/system and auto/desktop/phone per device, then a design pass on the default `label` theme.
- [x] ADR-0010 accepted (developer chose option B)
- [x] Shape tokens in `design/` (rules, control radius, density); `data-theme` → `data-mode`
- [x] Layout variants: `sm:/md:/lg:` redefined with `@custom-variant` to obey `data-layout` (no rewrite or lint rule needed)
- [x] Mode + layout cookies and settings UI ("desktop" also widens the phone viewport to 1200 px)
- [x] Phone screenshots (2026-09-30)
- [x] Design pass on `label`: ~~bugs (€ €/kg, ring centre, kcal decimals)~~ → ~~one list-row layout (ui/ListItem) for ingredients/meals/entries~~ → ~~type scale (5 tokens + lint)~~ → ~~day panel and week chart legends~~ → ~~details drawer (quiet buttons, per-line kcal)~~ → ~~small UX (auto-apply day type, labels)~~
- [x] Unified "add to day": one search over meals + ingredients + "estimated meal", then only the fields that fit (`AddToDay`)
- [x] Two more themes as tokens: `orto` (warm, soft) and `cruscotto` (dense, monospace); `user_settings.theme` (migration 0004) + picker; contract test
- [x] Unify repeated UI (PageHeader, Section, ListToolbar, FoodDetails, MacroStrip values, MacroPreview; core display/browse/pickerSearch)
- [x] Richer macro bar (sugars, saturated, fibre); one card grid for ingredients and meals
- [x] Live previews: meal serving while composing; ingredient label + effect on every meal using it (% per macro)
- [x] History: day page gets a week strip + date jump; Targets shows trends for every nutrient over 7 / 30 / 90 days, scrollable back in time, with averages
- [x] Analysis on Targets: adherence per nutrient, averages per day type, eating times (first/last, window, energy by part of day), unconfirmed plans
- [x] Themes really different: surfaces as tokens (orto: soft cards with shadows; cruscotto: boxed dense rows), day panel as tiles in cruscotto (`THEME_SLOTS`). The ADR-0010 `themes/` layer was not needed: one slot, chosen by a table in core
- [x] ADR-0011 accepted (option C): meal category as a hint, moment on each entry; migration 0005
- [x] Moments in the app: prefilled moment on add, category in the meal editor, day grouped by moment with subtotals, meals filter; export v4 + import keep them
- [x] Preferences (migration 0006): automatic limits on/off, moment hours, default trends period and list sort
- [x] Production data classified (2026-09-30): NOVA, origin, fibre types and shop/frozen/lactose-free tags on the 52 ingredients, categories on the meals (lifeos replace import, backup first); the 15 entries logged before stay "not classified" (ADR-0012)
- [x] Two production incidents, both fixed the same day and guarded: PR #22 merged before its migration (5 min of 500s → CI migration gate); settings page crash from an inline function passed to a client component (#44)
- [ ] Developer review on phone and desktop of everything above (themes, lists, add-to-day, trends, moments, quality); retro to close S01–S05

## Next sprint: S06 — Training (started 2026-09-30)
- **Goal:** log and plan training sessions from real data (PUSH/PULL logs, FitForge), see progression (tonnage, estimated 1RM, records), burn as an estimated range.
- [x] ADR-0005 accepted (delegated: typed sets, exercises as identities, planned/done sessions + routines, MET range + body measurements); migration 0008
- [x] Core: validation per kind, repositories (exercises + merge, sessions, routines, measurements), analysis (tonnage matching the hand-made PUSH 1 = 4 722 kg, e1RM, records), burn range (ACSM + Compendium)
- [x] Importers: FitForge sessions/presets/body metrics; PUSH/PULL text logs (`npm run import:training`, dry run, idempotent, aliases, day overrides); the parser reproduces every hand-made tonnage in the diet plan
- [x] UI: Training tab (recent sessions with tonnage, duration and burn range; start from a routine), session editor (fields per kind, last time shown, "add set" copies the row), sessions on the day page
- [x] UI: exercises (records, e1RM progression chart, history, edit, merge duplicates, delete when unused), routines editor, body weight entry
- [x] Real history imported into production (2026-10-01): 21 exercises, 14 sessions, 4 routines; bare-rep lines keep the load above, the dry run validates sets (#54)

## Next sprint: S07 — Training you can use at the gym, and a design pass (started 2026-10-01)
- **Goal:** training as progress (routines, exercises, muscle groups, overall stats) and a fast live logger; the whole app with calmer spacing and widgets that use their full width; Targets with grouped macro bars and training data.
- [x] ADR-0013 accepted (delegated: products → ingredients, stock derived from purchases − eaten ± counts); implementation after S07
- [ ] Design pass: spacing/size/rule tokens per theme revisited; one `Stat`/widget convention (label ↔ value spread across the width, centred numbers in tiles); applied to day panel, cards, sections
- [x] Muscle groups: closed list of 17 in 6 regions, one colour per region in every theme; movement pattern per exercise (migration 0010); suggestion from the name (the 21 real names tested); chips in the editor and list; `classify:exercises` for existing ones
- [x] Movement-pattern icons (own SVG set, one per pattern, in the region colour)
- [x] Training page as progress: week (sessions, working sets, kg, kcal vs the week before; sets per muscle group over the 10–20 band, browsable by week), routines (runs, kg per run, change, sparkline), exercises (e1RM, change in 4 weeks, sparkline), compact session cards (icons by region, sets on tap); ui/StatTiles = the centred-number widget
- [x] Live session mode (`/training/<id>/live`): a routine tile starts it now at its latest version; big ✓ and −/+ steppers prefilled from last time; rest timer (vibrates); saved whole 0.7 s after each edit (`sets.done`, migration 0011); finish keeps only done sets and sets the duration; per-set change vs last time with ↺ restore; add, move, remove exercises; unsaved edits kept in the browser and restored on reload
- [ ] Targets: macros per day as grouped bars (side by side, macro colours); training per day (tonnage, burn) next to intake
- [ ] Developer review on phone of everything above

## Next sprint: S07b — One edit model and the visual refactoring (ADR-0015, started 2026-10-01)
- **Goal:** every page navigates, saves, cancels, deletes and restores the same way; nothing is lost by one wrong tap.
- [x] ADR-0015 accepted (developer chose B); trash migration 0012
- [x] Kit (ActionBar, Menu, Toast with Undo, useDraft, `?from=`) on the meal editor, checked on phone screenshots; meals go to the trash
- [x] Ingredients: same model (useEditFlow + useFormValues for uncontrolled forms); trash refused while a live meal uses it; restoring a meal brings its ingredients back
- [x] Exercises and routines (ui/useEditableForm, TrashMenu for detail pages); an exercise with history still says "merge instead"
- [x] Sessions (editor and estimates): ⋯ to the trash with Undo, pinned bar, drafts; from the day page everything returns to the day
- [x] Day types: ⋯ make default / delete (the default is refused), pinned bar, drafts, Undo
- [x] Log entries and measurements: the row's bin moves to the trash with Undo (ui/TrashButton); trashed entries leave totals, history, usage and burn weight
- [ ] Developer review on the phone
- [x] Meals and ingredients lists: the whole row opens (ui/ListItem `href`), "⋯" duplicates / deletes with Undo
- [x] Training lists (sessions, exercises, routines): same rows; "⋯" new session from an exercise or routine, delete with Undo
- [ ] Trash page under Settings; purge after 30 days in the daily workflow

## Training logged like food (ADR-0016, 2026-10-01)
- [x] ADR-0016 accepted (delegated: option A); migration 0013
- [x] Day page "Add training": Routine / Exercise / Estimate tabs; estimated sessions (intensity, kcal, muscle groups; burn as a range) on the day, the Training page and in the week's numbers; their own editor

## Day page: compact and honest about the plan (requested 2026-10-01)
- **Goal:** the day fits on a phone screen, and every planned item says in numbers where the day would end.
- [x] Collapsible sections (ui/Collapsible, remembered on the device): Add training, Add to the day (closed by default), each moment (open; closed shows its macro strip, summed exactly — core entriesTotals)
- [ ] Day entries look like the meal and ingredient rows: NOVA bar, tags, the same meta
- [ ] Planned in numbers: macros, cost, day quality and training burn show "now → with planned"

## Next sprint: S08 — Pantry, household and batches (requested 2026-10-01)
- **Goal:** know what is at home and what to do about it: food, any household product, and cooked portions.
- [ ] ADR revising ADR-0013 (options, then the developer decides). Open questions:
  - products not linked to an ingredient (detergent, toiletries…), counted in pieces;
  - batch cooking as an event that uses ingredients from stock and makes N portions of a meal; logging that meal uses a portion;
  - reminders: derived ("2 portions left → cook again"; "runs out in 3 days → buy") vs set by hand, and where they show up (day page, shopping list).
- [ ] Training in the JSON export (exercises, sessions, routines, measurements); next export version
- [ ] Schema (migration PR first), then purchases + counts, stock and "runs out in", shopping list, batches, reminders

## Done
<!-- retro skill appends compressed entries here, newest first -->

### S00 — Foundational decisions (2026-07-23 → 2026-09-29)
Shipped: ADR-0001..0004 + 0006 accepted; 0005 deferred to training by design | Retro (2026-09-29): comprehension questions skipped at the developer's choice; Q07 — the decisions hold for v1, and a home server/bridge for domotics, Syncthing and finance is planned later; Q08 — from now on the agent writes code and the developer reviews each diff and can explain it before committing | Lesson: not recorded — Q09 was not answered, and it must be in the developer's words | Carried over: "What I learned" sections.
