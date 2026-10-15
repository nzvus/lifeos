# Runbook: replace an account's data with a lifeos export

Use it to restore an export, or to move a profile between databases (e.g.
the `dev` branch's data into production). It DELETES all of the account's
data and inserts the file's, in one transaction (ADR-0052,
`core/import/replace.ts` — the same core as Settings → Replace). The login,
the email, the language and the assistant's key are kept.

Any export version works:
- **21 and later:** every table, the trash included.
- **1–20:** only the areas that version had are replaced; the others are
  kept. Tables that hang off a replaced one and are missing from the file
  are **lost**; for a version-20 file that means caffeine/creatine amounts
  and a program's moved days. The dry run names them.
- Those versions left the trash out, but live rows still pointed into it.
  Those links are cleared, or the row goes when the database would delete
  it with its parent, and the dry run lists each repair.

1. **Backup first** (production): `gh workflow run backup.yml`, then
   `gh run watch` until `dump` is green. That artifact is the way back.
2. **Dry run**: prints per table "now" and "after", what is lost, kept and
   repaired; writes nothing:
   `DATABASE_URL="$PROD_URL" npm run import:lifeos -- FILE --email EMAIL`
   (read `PROD_URL` with `read -rs PROD_URL`, alone on its line).
   Check the host printed on the first line.
3. **Replace**: both flags are required:
   `DATABASE_URL="$PROD_URL" npm run import:lifeos -- FILE --email EMAIL --apply --replace`
4. Check in the app, then `unset PROD_URL`.

The file is validated whole first: tables and columns known, decimals
exact (no silent rounding), every reference inside the file. An invalid
file changes nothing, and so does a row that breaks a database rule: the
transaction rolls back and names the rule. Log entries keep their snapshots
(ADR-0007): names and values of past entries stay as logged.
