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
- UI: offline logging at the gym (ADR-0019 tripwire; the app is already installable); one-click theme toggle; charts of weight and intake over time
- Training cycle that picks the day profile automatically (ADR-0008 option C, with the training module)
- Activity-based targets: plan the day's activities (gym session: type, exercises, duration, rests; walks, runs; how sedentary the rest was) and derive energy/carb targets from them. Needs the training module (ADR-0005) and an explicit energy model (MET-style, always shown as estimates — PROJECT.md non-goal: no falsely precise burn numbers)
- Template meta-loop: reset `ai-native-starter` to a clean template; record what S00/S01 taught in its TEMPLATE-CHANGELOG

## Open items owned by the developer (from the 2026-09-30 handoff)
- **Security:** the production DB password was pasted into a chat on 2026-09-30. Rotate `neondb_owner` on the production branch, update GitHub `DATABASE_URL_DIRECT` and Vercel `DATABASE_URL`, redeploy, run `backup` — unless already done.
- Data confirmations: receipt "SALSA DI POMODORO CI" 0,89 € (cherry tomato, a separate product?); "CIOCC. FONDENTE" 0,85 € (70 % or 50 %?); "CREMA DI ARACHIDI" 2,09 € → 100 % peanut butter?; package weights of protein mozzarella (100 g) and cod fillets (1 kg).
- ADR-0007 still `proposed`: accept or reject; "What I learned" in the ADRs (agent-drafted or empty).
- `gh auth refresh -s workflow`, so the trash purge job (branch `s18g-purge-workflow`) can be pushed.

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
- [x] Design pass: superseded by the full design pass below (buttons, badges, rhythm, themes); ui/StatTiles is the centred-number widget
- [x] Muscle groups: closed list of 17 in 6 regions, one colour per region in every theme; movement pattern per exercise (migration 0010); suggestion from the name (the 21 real names tested); chips in the editor and list; `classify:exercises` for existing ones
- [x] Movement-pattern icons (own SVG set, one per pattern, in the region colour)
- [x] Training page as progress: week (sessions, working sets, kg, kcal vs the week before; sets per muscle group over the 10–20 band, browsable by week), routines (runs, kg per run, change, sparkline), exercises (e1RM, change in 4 weeks, sparkline), compact session cards (icons by region, sets on tap); ui/StatTiles = the centred-number widget
- [x] Live session mode (`/training/<id>/live`): a routine tile starts it now at its latest version; big ✓ and −/+ steppers prefilled from last time; rest timer (vibrates); saved whole 0.7 s after each edit (`sets.done`, migration 0011); finish keeps only done sets and sets the duration; per-set change vs last time with ↺ restore; add, move, remove exercises; unsaved edits kept in the browser and restored on reload
- [x] Targets: macros per day as grouped bars (side by side, macro colours); training per day (tonnage, burn) next to intake (b22a7a4)
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
- [x] Trash page under Settings (core/trash): restore, or delete for good after an inline confirmation; things still used elsewhere are refused
- [ ] Purge after 30 days in the daily workflow

## Training logged like food (ADR-0016, 2026-10-01)
- [x] ADR-0016 accepted (delegated: option A); migration 0013
- [x] Day page "Add training": Routine / Exercise / Estimate tabs; estimated sessions (intensity, kcal, muscle groups; burn as a range) on the day, the Training page and in the week's numbers; their own editor

## Day page: compact and honest about the plan (requested 2026-10-01)
- **Goal:** the day fits on a phone screen, and every planned item says in numbers where the day would end.
- [x] Collapsible sections (ui/Collapsible, remembered on the device): Add training, Add to the day (closed by default), each moment (open; closed shows its macro strip, summed exactly — core entriesTotals)
- [x] Day entries look like the meal cards: cost, NOVA bar, protein origin, fibre types, tags, rating (from the entry's snapshot lines)
- [x] Planned in numbers: every bar, the cost, the day quality and the training burn say where the day ends with the plan (core dayBurn, eatenQuality withPlanned)

## Design pass: one look, three real themes (requested 2026-10-01)
- **Goal:** every page uses the same parts with the same spacing; the three themes differ in more than colour. Audit on phone and desktop screenshots, all themes.
- [x] One button (ui/button.ts: primary / secondary / subtle / quiet / danger, md 44 px / sm 36 px), text links, ui/Badge; every hand-styled button replaced; header icons (settings, sign out)
- [x] Rhythm: every section has its icon (required by ui/Section) and an optional subtitle; rows breathe (py-3, header row centred on the 44 px action), no rule under the last row; planned rows dashed with a muted title, never translucent
- [x] Rows and forms: day entries and measurements use the "⋯" of every row (update with current values · delete with Undo; ui/TrashButton removed); every edit form's first fields in a "General" card, no card inside a card
- [x] Day page and desktop: one navigation row (‹ day 📅 ›, the week strip without its own arrows, no "Go to" row); wide screens: numbers left, food and training right; cards lay out by their own width (container queries)
- [x] Themes with an identity (heading, icon chip, button/badge radius and header tokens): Label = framed boxes, heavy rule under every heading, the day as a nutrition-facts table (new THEME_SLOTS variant); Orto = pills, tinted icon discs, no rules, rounder cards; Cruscotto = uppercase captions, thin frames, tiles; the tab bar fits five labels in every theme
- [x] Second pass: dark mode checked in all themes; cost on one line ("at least 0,72 €" + small "some prices are missing"); "auto" as a badge in the table's target column; the day's date never wraps; live session exercises as light tiles; sign-in in a card; "Default" as ui/Badge; live clock hydration bug fixed
- [x] Developer's verdict: Label stays, with rounded corners and rings + bars; Orto and Cruscotto replaced by four themes built on Label: Quaderno (ivory, blue ink, serif headings), Sport (black/white, lime), Minimal (no frames, shadows), Notte (night blue, amber headings); per-theme components (THEME_SLOTS) removed until a theme needs one
- [ ] Developer review of the four new themes on the phone

## Next sprint: S11 — The day as a plan, honest energy, smarter targets (requested 2026-10-01)
- **Goal:** plan and start training from the day like food; energy and targets that make sense for the developer's real data; a day score about zones, not reaching numbers.
- [x] Energy formulas on screen; selects show the saved value without a reload (#105)
- [x] Day page: plan a routine / exercise / estimate at a time, start it now in gym mode, or write it as done; "Start" on planned sessions; one "When" block (ui/Segmented) for food and training; planned sessions without a duration get one from their sets, so the energy counts them
- [x] Goal shown plainly: maintenance added; goal tiles + "deficit / surplus of N kcal a day" in the editor; the day says "Recomposition: 3504 kcal = energy with the plan 3704 − 200"
- [x] Alignment: form pages (settings, editors, trash, live) centred like their action bar; the dynamic day type's fields aligned
- [ ] Energy check against the developer's export (tmp/, never committed)
- [x] ADR-0023 macro bands (core/nutrition/bands.ts): floor / good zone / ceiling per kg, training load and goal; bars shade the zone and say which zone; day score by zone; dynamic carbs stop at the top of their good zone (the energy target with them)
- [ ] ADR-0022 edit a day's food entry as a local copy (grams, swaps)
- [ ] ADR-0024 training programs as an ordered cycle (migration-only PR first), derived plan on the day and the targets page
- [ ] Assistant: the whole picture each turn (recent detail + older aggregates), answers in terms of the user's own meals and routines; a better chat UI

## Next sprint: S09 — Energy needs and the dynamic day (ADR-0014, requested again 2026-10-01)
- **Goal:** know my energy need at every level (BMR, everyday activity, walking, training, digestion), what comes in and goes out, done and planned; a dynamic day type whose macros follow the plan and the goal (muscle gain, fat loss, or both).
- [x] Body data in Settings (sex, birth year, height; weight from measurements)
- [x] core/energy (ADR-0014 model B, ranges; training done and planned) + the day's movement on the day page
- [x] Dynamic day types with goal presets (gain / recomposition / cut): deficit or surplus, protein and fat per kg; targets from the energy with the plan
- [x] Energy section: every part, spent so far and with the plan, intake and balance (both)
- [x] Calibration (ADR-0020): migration 0016 (#103); 28 days of weigh-ins (least-squares trend) and intake vs the model → a proposed factor on everyday activity (0.80–1.20), accepted or reset on today's Energy section; the assistant reads it for the weekly review
- [x] ADR-0021: the model counted digestion, everyday steps and gym rests twice (≈+18 % on a gym day); fixed
- [ ] Developer review on the phone

## Next sprint: S10 — The assistant (ADR-0018, requested 2026-10-01)
- **Goal:** an assistant that does what the app can do when asked (ingredients from labels, meals, imports, planned days, sessions from notes, tags, ratings) and gives advice; photos/JSON/TXT attachments, text extracted on the phone by default.
- [x] ADR-0018 accepted (A, A, A, A): key on the server, encrypted; mixed autonomy with Undo; text from photos by default; history in the database
- [x] Migration 0015 (#101): encrypted key + model, conversations, messages
- [x] Core: AES-GCM key, conversations, tools (find ingredients/meals/exercises, day, recent days, pantry; create ingredient/meal, log food/estimate, reminders; gym notes import and move to trash with confirmation), the agent's turn; tested with a fake model
- [x] Settings → Assistant (key write-only, last 4 shown, model); /assistant chat with Undo per change, Confirm / Leave it, attachments (photo text read on the phone, or the photo; JSON/TXT/CSV/MD); conversations in the trash and export v8
- [x] Barcode → Open Food Facts: camera (BarcodeDetector) or typed digits prefill a new ingredient; the assistant's `lookup_barcode` (fetch injected from `app/_server`)
- [x] Installable app (ADR-0019): manifest + icons, service worker (offline page, hashed static files; never user data), production only
- [ ] Developer: set ASSISTANT_KEY_SECRET on Vercel, paste the OpenRouter key, try it on the phone
- [ ] More tools as needed (products and purchases, routines, exercises, ratings, tags, day types, batches), advice prompts, streaming

## Next sprint: S08 — Pantry, household and batches (requested 2026-10-01)
- **Goal:** know what is at home and what to do about it: food, any household product, and cooked portions.
- [x] ADR-0017 accepted (A, A, A): products of any kind (unit g/ml/pieces, ingredient optional); batches make portions, a log entry from a batch takes a portion; reminders derived + by hand
- [x] Training in the JSON export, version 6 (exercises, routines with items, sessions with exercises and sets, measurements, day activity; live records only); the lifeos importer accepts v6 and restores nutrition only
- [x] Schema: migration 0014 (#98, migration-only PR)
- [x] Core: products, purchases, counts, derived stock with days left, shopping list; batches (cook N portions, log a portion); reminders by hand and derived; all in the trash and the purge; export v7
- [x] /pantry page and product editor (reached from Ingredients)
- [x] Day page: today's reminders (derived + due) on top of the food column; "Portion" tab in Add to the day (batches with portions left, preview per portion)
- [ ] Developer review on the phone

## Done
<!-- retro skill appends compressed entries here, newest first -->

### S00 — Foundational decisions (2026-07-23 → 2026-09-29)
Shipped: ADR-0001..0004 + 0006 accepted; 0005 deferred to training by design | Retro (2026-09-29): comprehension questions skipped at the developer's choice; Q07 — the decisions hold for v1, and a home server/bridge for domotics, Syncthing and finance is planned later; Q08 — from now on the agent writes code and the developer reviews each diff and can explain it before committing | Lesson: not recorded — Q09 was not answered, and it must be in the developer's words | Carried over: "What I learned" sections.
