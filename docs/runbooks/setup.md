# Runbook: first-time setup (local, Neon, GitHub, healthchecks.io, Vercel)

Do these once, in order. Each step says how to check it worked. Items marked
**[verify]** depend on third-party dashboards that change; follow what the
dashboard shows if it differs.

## 0. Tools on your machine (Arch)

```bash
sudo pacman -S --needed nodejs npm python age postgresql
node --version   # must be >= 22.12
```

`postgresql` provides `psql`, `pg_dump` and `pg_restore` for drills; you don't
need to run a server permanently.

## 1. Install and run the tests (no database needed)

```bash
cd ~/Projects/lifeos
npm ci          # exact versions from package-lock.json
npm test        # PGlite: real Postgres in-process
npm run lint && npm run typecheck
```

Check: all tests pass, lint and typecheck print no errors.

## 2. Neon (the database) **[verify]**

1. Create a Neon project, region closest to you (e.g. Frankfurt). Postgres
   version: the default.
2. Copy two connection strings of the `main` (production) branch:
   the **pooled** one (host contains `-pooler`) for the app, the **direct** one
   for `pg_dump` and migrations.
3. Create a branch named `dev` for local development and copy its direct URL.
   If Neon offers an expiry date for the branch, choose none: an expiring
   `dev` branch deletes your local data and account without warning.

In every URL, replace `sslmode=require` with `sslmode=verify-full` (why:
`.env.example`). Tools built on libpq (`psql`, `pg_dump`) then need
`PGSSLROOTCERT=system` in their environment to find the trusted
certificates; the Node app doesn't.

## 3. Local development

```bash
cp .env.example .env
# edit .env: DATABASE_URL = the dev branch URL,
#            BETTER_AUTH_SECRET = output of `openssl rand -base64 32`,
#            ALLOW_SIGNUP=true (only until you have created your account)
npm run db:migrate   # applies drizzle/*.sql to the dev branch
npm run dev          # http://localhost:3000 -> sign up
```

Then set `ALLOW_SIGNUP=false` in `.env`.

## 4. Backup encryption key (age)

```bash
mkdir -p ~/.config/lifeos && age-keygen -o ~/.config/lifeos/backup-key.txt
grep 'public key' ~/.config/lifeos/backup-key.txt   # age1...: goes to GitHub
```

The **private** key file decrypts every backup. Store a copy in your password
manager and one offline. Lose it, and every backup is unreadable. It must
never be committed, uploaded to GitHub, or put in Syncthing unencrypted.

## 5. healthchecks.io (dead-man's switch, ADR-0004)

Create two checks, both with period **1 day** and grace **6 hours**:
`lifeos backup` and `lifeos app`. Copy each ping URL.

## 6. GitHub repository settings

Settings -> Secrets and variables -> Actions:

| Kind | Name | Value |
|---|---|---|
| secret | `DATABASE_URL_DIRECT` | Neon **direct** URL of `main` |
| secret | `HEALTHCHECKS_BACKUP_URL` | ping URL of `lifeos backup` |
| secret | `HEALTHCHECKS_APP_URL` | ping URL of `lifeos app` |
| variable | `AGE_RECIPIENT` | your `age1...` public key |
| variable | `APP_URL` | production URL, e.g. `https://lifeos.vercel.app` |

Settings -> Environments: create `production` (used by `migrate.yml`).

Settings -> Branches: protect `main`, require the status check `check`
(from `ci.yml`). Check: push a branch, open a pull request, the check runs.

## 7. First backup and first production migration

1. Actions -> `backup` -> Run workflow. Check: green, an artifact
   `db-backup-...` exists, `lifeos backup` on healthchecks.io turns green.
   (The `app-health` job fails until step 8 is done; that's expected.)
2. Actions -> `migrate` -> Run workflow -> type `migrate production`.
   Check: the last step lists migration `0000_init`.

## 8. Vercel **[verify]**

1. Import the GitHub repo. Framework: Next.js.
   Build Command: `node scripts/vercel-build.mjs`.
2. Environment variables:
   - Production: `DATABASE_URL` (Neon **pooled** `main`), `BETTER_AUTH_SECRET`
     (a new one), `ALLOW_SIGNUP=false`.
   - Preview: install the Neon integration so each preview gets its own
     branch and `DATABASE_URL`; add a separate `BETTER_AUTH_SECRET`. After
     checking that preview deployments really get a branch URL, add
     `PREVIEW_DB_IS_BRANCH=true` **in the Preview scope only**.
   - Assistant (ADR-0018, optional): `ASSISTANT_KEY_SECRET` in Production and
     Preview, 32+ random characters (`openssl rand -base64 32`). Changing it
     makes stored OpenRouter keys unreadable (users paste them again).
   - Previews are skipped unless a PR touches `drizzle/` or `src/core/db/`
     (`vercel.json` ignoreCommand → `scripts/vercel-ignore.sh`, ADR-0004
     update 2026-10-01). To get a preview for any other branch, name it
     `…-preview`.
3. Deploy. Check: `https://your-app.vercel.app/api/health` returns
   `{"status":"ok","database":"ok","commit":"(git sha)"}`.
4. Create your account: set `ALLOW_SIGNUP=true` in Production, redeploy, sign
   up, set it back to `false`, redeploy. Check: `/sign-up` now fails.
5. Invite friends (ADR-0034): in Production set `ALLOW_SIGNUP=true`,
   `SIGNUP_INVITES=true` (the default) and `ADMIN_EMAILS=<your email>`, then
   redeploy. Settings → Invitations creates a link that works once, for 14
   days. Check: `/sign-up` with no code or a used one says the invitation is
   not valid. Every new account starts from the starter pack.

## 9. Restore drill

Follow [restore-drill.md](restore-drill.md) with the artifact from step 7. The
sprint's durability promise is not kept until this is done once and logged.

## 10. lifeos v2 on your machine (ADR-0056)

v2 runs without a database server: PGlite in a folder, migrated on start.
1. `cp apps/v2/.env.example apps/v2/.env.local`, put a secret in
   `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), set `ALLOW_SIGNUP=true`.
2. `npm run dev -w apps/v2` → http://localhost:3200/sign-up: create your
   account. Stop the server (a PGlite folder has one user at a time).
3. `npm run load:export -w apps/v2 -- <export.json> --email <your email>`
   (it reads `apps/v2/.env.local`). Check: it prints the rows loaded and what it
   did not carry, and why.
4. `npm run dev -w apps/v2` again; Oggi shows your days. Set
   `ALLOW_SIGNUP=false`. To start over, delete `apps/v2/.pglite`.

### v2 online (the developer, once; order matters)
1. **Neon: an empty database for v2.** Neon console → project lifeos →
   Branches → New branch `v2` (parent `production`, **schema only**, no
   auto-delete: v1's tables come along empty in its `neondb`, unused). In branch `v2` → Databases → New
   database `lifeos_v2`, owner `neondb_owner`. v2 uses only `lifeos_v2`:
   it is empty, so v2's `user`, `session`… never meet v1's. Connect →
   database `lifeos_v2`: copy the **pooled** URL (host with `-pooler`, for
   Vercel) and the **direct** one (no `-pooler`, for migrations and loading).
   In both, replace `sslmode=require` with `sslmode=verify-full` (§2).
2. **GitHub: the migration job.** Settings → Environments → New
   environment `v2` → secret `DATABASE_URL_DIRECT` = the direct URL; if
   `AGE_RECIPIENT` is a variable of the `production` environment rather
   than of the repository, add it to `v2` too (same public key). Then add
   the workflow (the agent's token cannot):
   `cp docs/runbooks/workflows/migrate-v2.yml .github/workflows/` → commit
   → push to `main`. Actions → migrate-v2 → Run workflow → `migrate v2`.
   Check: the last step lists migrations 0000 and 0001.
3. **Vercel: the project.** Add New → Project → import `nzvus/lifeos` →
   name `lifeos-v2` → Root Directory `apps/v2` (Next.js is detected;
   `apps/v2/vercel.json` sets the region, `npm ci` at the root, and the
   ignore step). Environment variables (Production):
   `DATABASE_URL` = the pooled URL; `BETTER_AUTH_SECRET` = a NEW one
   (`openssl rand -base64 32`, not v1's); `ALLOW_SIGNUP` = `true`.
   Deploy. Check: `https://lifeos-v2….vercel.app/sign-in` opens.
4. **Your account.** On the phone, `/sign-up`; then set `ALLOW_SIGNUP` =
   `false` and Redeploy. Check: `/sign-up` is a 404.
5. **Your data.** On your machine, with the direct URL:
   `cd apps/v2 && DATABASE_URL='<direct URL>' npm run load:export --
   <refined export.json> --email <the email you signed up with>`.
   Check: "loaded … rows"; `/oggi/2026-10-15` on the phone shows the day.
   What you logged in v1 after the refined export (16 Oct, 22:32) is not
   in it: add today's meals again in v2 (⊕ → Pasto; saved meals make it
   quick).
6. **Training logged in v1 meanwhile** (until gym mode is in v2; decided
   2026-10-17). Export from v1 (Settings → Export), then:
   `cd apps/v2 && DATABASE_URL='<direct URL>' npm run import:sessions --
   <new export.json> --email <email> --since 2026-10-17` — a dry run: it
   lists the sessions, sets and new exercises it would load. Add `--write`
   to load them. Running it again loads nothing twice.
7. **Everything again from a newer v1 export** (when you logged only in v1
   since the last load; 2026-10-23). Refine it first (`boards-tools/refine.py`
   with the approved corrections, as for 16 Oct), then:
   `cd apps/v2 && DATABASE_URL='<direct URL>' npm run load:export --
   <refined export.json> --email <email> --replace` — it takes out
   everything your account has in v2 (not the account) and loads the file,
   in one transaction: if the load fails, nothing changes. Anything typed
   only in v2 since the last load is lost: use it only when there is none.
8. **What you logged in v1 since, from the app** (2026-10-25, no command):
   v2 → Impostazioni → I tuoi dati → «Porta i dati da v1», pick the v1
   export (plain, not refined). It shows what would come in, then
   «Aggiungi». It adds an entry only where v2 has nothing of its kind on
   that day, and never changes or removes anything in v2; running it again
   adds nothing twice. It replaces steps 6–7 when v2 has entries of its own.

From then on, a migration reaches `lifeos_v2` only through migrate-v2.
v2 has no Preview variables yet: a preview (a PR touching v2's schema, or a
`*-preview` branch) builds but has no database. The per-PR rehearsal branch,
as v1's, comes with v2's next migration.

## 11. Only v2: retiring v1 (decided 2026-10-25, in stages)

1. **Today.** v2 → Impostazioni → «Porta i dati da v1» with the newest v1
   export (§10 step 8). From then on log only in v2; leave v1 unopened.
2. **Install v2 on the phone.** Open v2 in the browser, signed in. Android
   (Chrome): ⋮ → «Installa app» / «Aggiungi a schermata Home». iPhone
   (Safari): Condividi → «Aggiungi alla schermata Home». It opens on Oggi,
   without the browser's bars. Remove v1's icon from the home screen.
3. **v2's backup, on or after 1 Nov** (Neon's transfer resets then).
   Settings → Secrets and variables → Actions → New repository secret
   `V2_DATABASE_URL_DIRECT` = v2's **direct** URL (§10 step 1). Then
   `gh workflow enable backup.yml` and Actions → backup → Run workflow.
   Check: the run has an artifact `db-backup-v2-…`. Restore drill as §9,
   with v2's dump.
4. **After one or two weeks with nothing missing in v2.** One last v1
   export (Settings → Export) kept off the laptop too (the encrypted
   dumps expire after 30 days). Then, in this order:
   - Vercel → the v1 project → Settings → Advanced → Delete Project. If
     its domain was the one you use, add it to `lifeos-v2` first
     (Settings → Domains).
   - Neon: **never delete the project**, v2 lives in it. Neon will not
     delete `production` (v1) either while `v2`, its child, exists; an
     unused branch moves no data, so it stays idle. To free its storage,
     drop v1's tables there (the agent's PR prepares the SQL).
   - healthchecks.io: point the "app" check at v2 or delete it.
   - The agent's PR: v1's code out of the repository, v2 to the root,
     the backup's `dump` job and v1's secrets removed, `dump-v2` with the
     heartbeat.
