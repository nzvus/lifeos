# Runbook: replace an account's data with a lifeos export

Use it to restore an export, or to move a profile between databases (e.g.
the `dev` branch's data into production). It DELETES the account's current
nutrition data (ingredients, tags, meals, ratings, day types, day plans,
log, settings — theme and preferences included) and inserts the file's, in
one transaction. The login is kept.

1. **Backup first** (production): `gh workflow run backup.yml`, then
   `gh run watch` until `dump` is green. That artifact is the way back.
2. **Dry run** — prints "now" and "after" counts, writes nothing:
   `DATABASE_URL="$PROD_URL" npm run import:lifeos -- FILE --email EMAIL`
   (read `PROD_URL` with `read -rs PROD_URL`, alone on its line).
   Check the host printed on the first line.
3. **Replace** — both flags are required:
   `DATABASE_URL="$PROD_URL" npm run import:lifeos -- FILE --email EMAIL --apply --replace`
4. Check in the app, then `unset PROD_URL`.

The file is validated strictly first (decimals, price pairs, references);
an invalid file changes nothing. Log entries keep their snapshots
(ADR-0007): names and values of past entries stay as logged.
