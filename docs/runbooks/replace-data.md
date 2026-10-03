# Runbook: replace an account's data with a lifeos export

Use it to restore an export, or to move a profile between databases (e.g.
the `dev` branch's data into production). It DELETES the account's current
nutrition data (ingredients, tags, meals, ratings, day types — dynamic ones
with their parameters — day plans, log, settings — theme, preferences and the
body data sex / birth year / height / energy correction included) and inserts
the file's, in one transaction. The login is kept.

**Not restored:** `training` (exercises, routines, programs, sessions, weigh-ins,
sleep, movement), `pantry` and `assistant`. If the account has pantry products
linked to ingredients, the replace stops on `products_ingredient_fk` and writes
nothing: empty that account's pantry first (or leave it to the developer).

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
