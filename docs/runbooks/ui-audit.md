# UI audit (before a PR that changes the interface)

The steps are the `verify` skill (`.claude/skills/verify/SKILL.md`): photos of each changed
screen and box, dark, at 390, 360 and 320 px, looked at one by one. The tools it uses:

## Once

```sh
npx playwright install chromium   # the browser Playwright drives
```

The preview account (`agent-preview@example.invalid` / `preview-password-123`) lives in the
local PGlite folder only. Create it once by signing up with `ALLOW_SIGNUP=true`.

## Each time

```sh
BETTER_AUTH_URL=http://localhost:3200 npx next dev -p 3200 &
node scripts/ui-check.mjs --crawl --width 390   # targets, one primary, long lists, overflow
node scripts/ui-check.mjs --crawl --width 320
node scripts/kit-shots.mjs <outdir>             # the /kit pieces, and boxes that overflow
```

- `ui-check.mjs` compares with `scripts/ui-baseline.json`; a new failure is fixed, never
  added to the baseline. `--list` names targets under 44 px.
- Pickers (time, date) and touch behave differently in a phone emulation (Playwright
  `devices["iPhone 13"]`): open the changed forms there too.

## The kit gallery photographed (PAT-94)

`e2e/kit.spec.ts` photographs every kit piece in the `/kit` gallery (each section, each
sheet open, the ObjectPage at `/kit/oggetto`), dark, at 390 and 320 px, and compares with
`e2e/kit.spec.ts-snapshots/`. It builds the app for production on a fresh PGlite folder
(`KIT_GALLERY=true` lets that build serve the gallery), so it needs no database and no
secret. Stop any `next dev` first: both use `.next`.

```sh
npm run shots           # compare; a failure writes the diff in test-results/
npm run shots:update    # after a wanted change: rewrite, then LOOK at each image
```

CI runs the same command as the `kit-shots` job of `.github/workflows/ci.yml` (`check` needs
it); on a failure the diffs are in its `kit-shots` artifact.
