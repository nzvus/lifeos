# ROADMAP.md

> One file: future (top), present (middle), past (bottom). Completed sprints
> are compressed to a few lines by the `retro` skill — never deleted.

## Backlog (unordered, one line each)
- Training: heterogeneous exercises, sessions, sets, estimated burn (ADR-0005 first); importers for FitForge JSON and the PUSH/PULL text logs
- Gamification: daily/weekly/monthly roll-ups, surplus/cut, objectives
- UX/kit: one-click theme toggle, reusable widgets, smart search, lazy loading, gym timer
- Data ownership: import of the lifeos export format (round trip); later AI review of goals
- Nutrition: live totals preview in the meal editor; "re-snapshot entry" if label fixes become common (ADR-0007 tripwire)
- Finance: accounts, manual entries, bank + PayPal export importers (dedupe, transfer matching), categories, monthly report — needs its own ADR on where financial data lives
- Receipts: photo/OCR -> reviewed line items -> products linked to ingredients; price history, purchase frequency (ADR-0007 option D likely)
- Day planner, tasks/habits, rewards + accountability rules over an event stream
- Notes bridge to the Obsidian vault (read/search, quick capture)
- Home bridge on a LAN device (old Motorola phone): Home Assistant control, Syncthing status — Vercel cannot reach the home network, so this needs its own ADR
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
- **Only the developer can do (docs/runbooks/setup.md):**
  - [ ] Review the diff and be able to explain it (CLAUDE.md process rule)
  - [ ] Accept or reject ADR-0007 (status is `proposed`)
  - [ ] Neon project, GitHub secrets/variables, healthchecks.io checks, Vercel project
  - [ ] Branch protection on `main` requiring `check`
  - [ ] First backup run, first `migrate production` run
  - [ ] **The restore drill on a real backup, logged in docs/runbooks/restore-drill.md** — cannot slip: it is the primary invariant
- **Carried over from S00:** the "What I learned" sections of ADR-0001..0007 are still agent-drafted or empty; the developer rewrites them.
- **Review criteria:** CI green on GitHub; `/api/health` 200 on production; healthchecks.io green for 2 consecutive days; restore drill logged; `python3 scripts/check.py` clean except the expected 0005 gap warning.

## Done
<!-- retro skill appends compressed entries here, newest first -->

### S00 — Foundational decisions (2026-07-23 → 2026-09-29)
Shipped: ADR-0001..0004 + 0006 accepted; 0005 deferred to training by design | Retro (2026-09-29): comprehension questions skipped at the developer's choice; Q07 — the decisions hold for v1, and a home server/bridge for domotics, Syncthing and finance is planned later; Q08 — from now on the agent writes code and the developer reviews each diff and can explain it before committing | Lesson: not recorded — Q09 was not answered, and it must be in the developer's words | Carried over: "What I learned" sections.
