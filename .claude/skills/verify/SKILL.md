---
name: verify
description: Check a lifeos v2 UI change on the phone before the PR - photos of every changed screen and kit piece at 390/360/320 px in dark, overflow per box, targets and one primary with ui-check. Use before pushing any UI change, or when the user says "verify" or asks to see the screens.
---

# Verify (PAT-92, PAT-80, PRD-12, PRD-14)

«Done» only after looking at the result, never from a green run (CLAUDE.md).

1. Start v2 in the background: `cd apps/v2 && BETTER_AUTH_URL=http://localhost:3200 npx next
   dev -p 3200` (stop it with TaskStop, then check `ps` for children; never pkill). Preview
   account: `agent-preview@example.invalid` / `preview-password-123` (dev database only).
2. Kit pieces: open `/kit` (the gallery, PAT-94); every new or changed piece has an entry.
3. Photos, dark, at 390, 360 and 320 px: the changed screens and an element crop of each changed
   box (memory «photograph every piece»: crops found defects full pages hid). Save them in the
   scratchpad and LOOK at each one: overflow inside a box, cut text, targets, contrast.
4. `node scripts/ui-check.mjs --crawl --width 390` and again with `--width 320`; `--list` names
   targets under 44 px. A new failure is fixed, not added to `scripts/ui-baseline.json`.
5. In the PR: what was photographed, what to look at first, and the photos' path if he asked.
