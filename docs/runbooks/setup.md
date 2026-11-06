# Runbook: setup (local, Neon, GitHub, healthchecks.io, Vercel)

What exists and how to rebuild it. Each step says how to check it worked. Items marked
**[verify]** depend on third-party dashboards that change; follow what the dashboard shows.
v1 was retired on 6 Nov 2026 (§11); its setup is in git history.

## 0. Tools on your machine (Arch)

```bash
sudo pacman -S --needed nodejs npm python age postgresql
node --version   # must be >= 22.12
```

`postgresql` provides `psql`, `pg_dump` and `pg_restore` for drills; no server needed.

## 1. Install and run the tests (no database needed)

```bash
cd ~/Projects/lifeos
npm ci          # exact versions from package-lock.json
npm test        # PGlite: real Postgres in-process, the real migrations
npm run lint && npm run typecheck
npm run shots   # the kit photos (PAT-94); stop any `next dev` first
```

## 2. Neon (the database) **[verify]**

Project `lifeos` — **never delete it**. Branch `v2` (child of `production`) holds the app's
database `lifeos_v2`. Branch `production` holds v1's old database `neondb`, idle (§11);
Neon will not delete it while `v2` is its child, and an unused branch moves no data.

Connect → branch `v2`, database `lifeos_v2`: the **pooled** URL (host with `-pooler`) is for
Vercel, the **direct** one for migrations, backups and loading. In every URL replace
`sslmode=require` with `sslmode=verify-full`; libpq tools (`psql`, `pg_dump`) then need
`PGSSLROOTCERT=system`, the Node app does not.

## 3. Local development

The app runs without a database server: PGlite in a folder, migrated on start.

1. `cp .env.example .env.local`, put a secret in `BETTER_AUTH_SECRET`
   (`openssl rand -base64 32`), set `ALLOW_SIGNUP=true`.
2. `npm run dev` → http://localhost:3200/sign-up: create your account. Stop the server
   (a PGlite folder has one user at a time).
3. `npm run load:export -- <export.json> --email <your email>` (reads `.env.local`). Check:
   it prints the rows loaded and what it did not carry, and why.
4. `npm run dev` again; Oggi shows your days. Set `ALLOW_SIGNUP=false`. To start over,
   delete `.pglite/`.

## 4. Backup encryption key (age)

```bash
mkdir -p ~/.config/lifeos && age-keygen -o ~/.config/lifeos/backup-key.txt
grep 'public key' ~/.config/lifeos/backup-key.txt   # age1...: goes to GitHub
```

The **private** key decrypts every backup: a copy in the password manager and one offline.
Never committed, uploaded, or in Syncthing unencrypted.

## 5. healthchecks.io (dead-man's switch, DT-34)

Two checks, period **1 day**, grace **6 hours**: `lifeos backup` (pinged by `backup.yml`'s
`dump` after a stored dump) and `lifeos app` (pinged by `app-health` after `/api/health`
answers 200, i.e. the database ran a query).

## 6. GitHub repository settings

| Where | Name | Value |
|---|---|---|
| environment `v2`, secret | `DATABASE_URL_DIRECT` | Neon **direct** URL of `lifeos_v2` |
| repository secret | `HEALTHCHECKS_BACKUP_URL` | ping URL of `lifeos backup` |
| repository secret | `HEALTHCHECKS_APP_URL` | ping URL of `lifeos app` |
| repository variable | `AGE_RECIPIENT` | your `age1...` public key |
| repository variable | `APP_URL` | `https://lifeos-8ezd.vercel.app` |

Environment `v2` has no protection rule: the daily backup must run unattended.
Branches: `main` protected, status check `check` (from `ci.yml`) required.

## 7. Vercel **[verify]**

Project `lifeos-v2`, Root Directory empty (the repository root), Next.js detected;
`vercel.json` sets the region and the ignore step (`scripts/vercel-ignore.sh`: production
when the app changed, previews only for `drizzle/`, `src/core/db/` or a `*-preview` branch).

- Production: `DATABASE_URL` (pooled URL), `BETTER_AUTH_SECRET`, `ALLOW_SIGNUP=false`.
- Preview: its own `BETTER_AUTH_SECRET` only; no database, so a preview builds and serves
  the sign-in page but cannot sign in.
- New account: `ALLOW_SIGNUP=true`, Redeploy, sign up, back to `false`, Redeploy.

Check: `https://lifeos-8ezd.vercel.app/api/health` returns
`{"status":"ok","database":"ok","commit":"<sha>"}`.

## 8. Migrations

Schema change → `npm run db:generate` → read the SQL in `drizzle/` → commit → push → Actions
→ `migrate-v2` → Run workflow on the PR branch → type `migrate v2` (backup first, kept 90
days; then migrate; then the PR's migration gate re-runs). Check the data, then merge.

## 9. Restore drill

Follow [restore-drill.md](restore-drill.md) with an artifact `db-backup-v2-…` of `backup`.

## 10. Loading data

- **A whole file into an empty account, or replacing it:** `DATABASE_URL='<direct URL>'
  npm run load:export -- <export.json> --email <email> [--replace]`. `--replace` takes out
  everything the account has (not the account) and loads the file in one transaction.
- **A v1 export, adding only what is missing:** the app → Profilo → I tuoi dati → «Porta i
  dati da v1»: shows what would come in, then «Aggiungi»; never changes what is there.
- **v1 gym sessions only:** `npm run import:sessions -- <export.json> --email <email>
  --since <day>` (dry run; `--write` to load).

## 11. v1 retired (6 Nov 2026, DT-42)

Done: the last v1 export (`LIFEOS/exports/v1/lifeos-export-2026-11-06.json`) verified
against v2's; the Vercel project `lifeos` deleted; v1's code removed and v2 moved to the root.

Left, by hand, once the PR of change `2026-11-06-retire-v1` is merged:
1. Repository variable `APP_URL` = `https://lifeos-8ezd.vercel.app` (the agent sets it).
2. Repository secret `DATABASE_URL_DIRECT` (v1's) deleted: Settings → Secrets → Actions.
3. v1's tables dropped: Neon console → branch `production` → SQL Editor, database
   `neondb` → paste [retire-v1.sql](retire-v1.sql). It first refuses to run on any database
   holding the app's tables, then shows the row counts, then drops v1's schema in one
   transaction. Never on branch `v2`'s `lifeos_v2`.
