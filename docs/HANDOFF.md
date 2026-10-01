# Handoff — lifeos, 2026-09-30

Read this, then `CLAUDE.md`, `ROADMAP.md`, `ARCHITECTURE.md`. Chat with the
developer in Italian; files, code and commits in English (CLAUDE.md).

## Where things are

- Repo `nzvus/lifeos` (private), `main` protected (ruleset `protect-main`:
  PR + green `check` required). Live: https://lifeos-omega-seven.vercel.app
  (Vercel Hobby, functions pinned to `fra1`). Neon project `lifeos`, branches
  `production` (endpoint `ep-dark-breeze…`) and `dev` (`ep-late-star…`, used by
  the local `.env`). Postgres 18.
- Merged: S01 (skeleton, durability pipeline), S02 (day profiles, ADR-0008),
  S03/S03b (responsive UI, search, charts, icons), S04a (lifeos import/replace,
  entry refresh, MacroStrip), S04b (day panel, target kinds, auto limits),
  S04c (ingredient upsert).
- **Delivered, status unknown — check first:** `s04d-planned-eaten-estimates.patch`
  (ADR-0009, migration 0003). Procedure: apply on a branch, `npm run
  db:migrate` on dev, then `gh workflow run migrate.yml --ref <branch> -f
  confirm="migrate production"` BEFORE merging (additive migration), expect 4
  applied migrations, then PR + merge.
- Production data: the developer's profile (47+3 ingredients, 10 meals, day
  types Gym / Rest (default) / Run), imported on 2026-09-30.

## Open items owned by the developer

1. **SECURITY:** the production DB password was pasted into the chat on
   2026-09-30. Rotate `neondb_owner` on the production branch, then update the
   GitHub secret `DATABASE_URL_DIRECT` (direct URL, `sslmode=verify-full`) and
   Vercel `DATABASE_URL` (pooled URL), redeploy, run the `backup` workflow.
   Confirm this happened before anything else.
2. Data confirmations: receipt line "SALSA DI POMODORO CI" 0,89 € (cherry
   tomato — a different product from "Salsa di pomodoro datterino"?); "CIOCC.
   FONDENTE" 0,85 € (70 % or 50 %?); "CREMA DI ARACHIDI" 2,09 € assigned to the
   100 % peanut butter; package weights of the protein mozzarella (100 g now)
   and cod fillets (1 kg now).
3. Accept/reject ADR-0007 (still "proposed"); write "What I learned" in
   ADR-0001..0009; S00 lesson (Q09).
4. S01 close-out: healthchecks.io green on 2026-09-30 and 10-01.

## Requested next (2026-09-30), not started

- ADR-0010: tags with icons on ingredients (processing level NOVA 1–4,
  animal/plant, organic, shop/online, fibre types with the gut bacteria they
  are associated with — descriptive, not a promise), stacking into meals;
  ratings on meals by user-defined factors + notes.
- Day quality score. Decide what it measures: target adherence only (possible
  now) vs also food quality (needs ADR-0011 tags). Show the breakdown, never a
  black box.
- Better macro bars: include fibre; carbs split into sugars / other; fat into
  saturated / unsaturated; fibre by type (needs tags).
- Meal categories (breakfast/snack, lunch, dinner): decide meal attribute vs
  moment of the day on log entries (the latter lets the day view group by
  moment; default from the meal's category and the time).
- Unified "add to day" widget: one search over meals, single ingredients and
  "estimated meal", then the fields that fit the choice.
- Edit pages with live preview: macro graphics update while typing; for an
  ingredient, show the effect on every meal containing it, with % change per
  macro.
- Theme system (architecture ADR): user-selectable themes that change tokens
  beyond colour (radius, borders, density, type scale, chart style); a
  separate light/dark/system setting valid for every theme; a separate
  layout setting (auto / desktop / phone) selectable on any device.
- Design pass on the current theme: consistent spacing and type scale,
  widget sizes, usability. **Get screenshots (phone + desktop) first**: the
  agent has never seen the UI rendered.

## Decisions taken by the developer (2026-09-30, end of session)

- **Day quality score:** NOT now. Build it together with ADR-0010 tags, so it
  covers both target adherence and food quality (processing level, fibre
  variety), with a visible breakdown.
- **Themes:** themes may use **completely different components**, not only
  different design values. Implication to make explicit in the ADR: every
  themeable component costs one implementation per theme. Propose first a
  *theme contract* — which slots a theme may replace (e.g. day panel, macro
  bars/rings, nav, cards, buttons, forms), with a default implementation for
  every slot so a theme overrides only what it wants — plus the separate
  light/dark/system setting and the auto/desktop/phone layout setting.
  Present 2–3 options and STOP for the developer's decision (CLAUDE.md rule 1).
- **Tooling:** continue in **Claude Code inside the repo** (this handoff).

## Suggested order for the next session

1. Ask whether the DB password was rotated (open item 1). If not, do it first.
2. Check s04d: is migration 0003 applied in production and the PR merged?
3. ADR for the theme contract (options, stop, decide).
4. Ask for screenshots (phone + desktop) and do the design pass on the
   current theme within the chosen contract.
5. Unified "add to day" widget; meal categories + moment of the day (ADR).
6. Live previews on edit pages (ingredient -> affected meals, % per macro).
7. ADR-0010 tags + ratings, then fibre-type bars and the day quality score.

## Working agreements and pitfalls learned

- Agent writes, developer reviews and commits (CLAUDE.md rule 6). One branch
  + one commit message per change (PR #7 mixed two patches under one message).
- zsh: no `#` comments in command blocks (not interactive_comments).
- Secrets: `read -rs VAR` ALONE on its line; paste only when the cursor waits.
  Check the target with `echo ${${VAR#*@}%%/*}` (host only) before writing.
  Never paste URLs/secrets into chat.
- Additive migrations: migrate production from the branch BEFORE merging.
- After `gh pr create`, CI starts a few seconds later: `sleep 20` before
  `gh pr checks --watch`, or enable auto-merge.
- `ARCHITECTURE.md` is at 148/150 lines: compress before adding.
- ESLint enforces layers (ADR-0002), no literal colours/arbitrary Tailwind
  values/JSX text outside `design/` and `i18n/`; run `npm run lint`,
  `npm run typecheck`, `npm test`, `python3 scripts/check.py` before a PR.
