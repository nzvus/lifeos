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

## A page that needs a migration not yet on the dev database

Previews are behind Vercel Authentication, and the dev database gets a
migration only through its PR's branch. To render such a page locally,
serve a throwaway PGlite with every migration and point the app at it:

```js
// pgserve.mjs — in a scratch folder with @electric-sql/pglite@0.5.8,
// @electric-sql/pglite-socket@0.2.11 and drizzle-orm@0.45.3 installed
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
const db = new PGlite();
await migrate(drizzle(db), { migrationsFolder: "<repo>/drizzle" });
// The app's pool opens several connections: let the server multiplex them.
await new PGLiteSocketServer({ db, port: 5433, host: "127.0.0.1", maxConnections: 12 }).start();
```

```sh
npx next build
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable" \
  BETTER_AUTH_URL=http://localhost:3124 ALLOW_SIGNUP=true SIGNUP_INVITES=false \
  npx next start -p 3124
```

Sign up a throwaway user (the invite field is required by the form: type
anything; the server ignores it with `SIGNUP_INVITES=false`). Everything
is in memory and disappears with the server.
