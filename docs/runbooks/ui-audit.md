# UI audit (before a PR that changes the interface)

`scripts/ui-audit.mjs` opens every signed-in page at a phone's width with
the text scaled up (Android's large font), in the themes and modes you ask
for. It reports pages that scroll sideways and text that overlaps, and saves
a screenshot of each page. It found every overflow the developer saw on the
phone in the 2026-10-02 design review.

## Once

```sh
npx playwright install chromium   # the browser Playwright drives
```

The preview account (`agent-preview@example.invalid`) lives on the **dev**
database only. Create it once by signing up with `ALLOW_SIGNUP=true`.

## Each time

```sh
BETTER_AUTH_URL=http://localhost:3123 ALLOW_SIGNUP=true npx next dev -p 3123 &
npm run audit:ui                                   # Label, light, 360 px, text 120 %
AUDIT_THEMES=label,quaderno,sport,minimal,notte AUDIT_MODES=light,dark npm run audit:ui
```

- Exit code 1 means a page scrolled sideways or text overlapped. The lines
  printed say which page and which texts.
- Screenshots go to `audit-ui/<theme>-<mode>-<width>-<zoom>/` (git-ignored).
- The script switches the preview account's theme while it runs and puts
  Label back at the end.

Also open the changed screens in a phone emulation (Playwright
`devices["Pixel 7"]`). Pickers (time, date) and touch behave differently
there: the sleep form that never saved on a phone was found this way.
