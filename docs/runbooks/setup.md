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
   - Previews are skipped unless a PR touches `drizzle/` or `src/core/db/`
     (`vercel.json` ignoreCommand → `scripts/vercel-ignore.sh`, ADR-0004
     update 2026-10-01). To get a preview for any other branch, name it
     `…-preview`.
3. Deploy. Check: `https://your-app.vercel.app/api/health` returns
   `{"status":"ok","database":"ok","commit":"(git sha)"}`.
4. Create your account: set `ALLOW_SIGNUP=true` in Production, redeploy, sign
   up, set it back to `false`, redeploy. Check: `/sign-up` now fails.

## 9. Restore drill

Follow [restore-drill.md](restore-drill.md) with the artifact from step 7. The
sprint's durability promise is not kept until this is done once and logged.
