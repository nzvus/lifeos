/**
 * Loads a v1 export into v2 for an existing account (migration.md: the
 * converter, then the loader in one transaction). For a first load only:
 * it stops if the account already has entries.
 *
 *   npm run load:export -w apps/v2 -- <export.json> --email <account email>
 *
 * The database is the one apps/v2/.env.local names (DATABASE_URL or
 * V2_PGLITE_DIR). With PGlite, stop the dev server first: a folder has one
 * owner at a time.
 */
import { readFileSync } from "node:fs";
import { count, eq } from "drizzle-orm";
import { convert } from "../src/core/convert/convert";
import type { V1Export } from "../src/core/convert/context";
import { loadFile } from "../src/core/convert/load";
import { createDb, createLocalDb } from "../src/core/db/client";
import { entries } from "../src/core/db/schema";
import { ownerByEmailForLocalScript } from "../src/core/identity/local-admin";

const [file, flag, email] = process.argv.slice(2);
if (!file || flag !== "--email" || !email) {
  console.error("usage: load-export <export.json> --email <account email>");
  process.exit(2);
}
const db = process.env.DATABASE_URL
  ? createDb(process.env.DATABASE_URL)
  : process.env.V2_PGLITE_DIR
    ? await createLocalDb(process.env.V2_PGLITE_DIR)
    : null;
if (!db) {
  console.error("set DATABASE_URL or V2_PGLITE_DIR (apps/v2/.env.local)");
  process.exit(2);
}
const owner = await ownerByEmailForLocalScript(db, email);
if (!owner) {
  console.error("no account with that email: create it in the app first");
  process.exit(1);
}
const [has] = await db
  .select({ n: count() })
  .from(entries)
  .where(eq(entries.userId, owner.id));
if (has!.n > 0) {
  console.error(
    `the account already has ${has!.n} entries: this script only does a first load`,
  );
  process.exit(1);
}
const v2 = convert(JSON.parse(readFileSync(file, "utf8")) as V1Export, new Date());
await loadFile(db as never, v2, owner.id);
const rows = Object.values(v2.tables).reduce((a, t) => a + t.length, 0);
console.log(`loaded ${rows} rows`);
for (const d of v2.report.dropped)
  console.log(`  not carried: ${d.table} (${d.rows}): ${d.why}`);
process.exit(0);
