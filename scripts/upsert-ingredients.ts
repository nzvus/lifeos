/**
 * scripts/upsert-ingredients.ts — create or update ingredients BY NAME from a
 * "lifeos-ingredients" file (new label values, receipt prices), leaving
 * everything else as it is (core/import/ingredients-upsert.ts).
 *
 *   npm run upsert:ingredients -- FILE --email you@example.com           (dry run: shows every change)
 *   npm run upsert:ingredients -- FILE --email you@example.com --apply
 *
 * The database is DATABASE_URL (from .env, or passed inline for production:
 * DATABASE_URL="$PROD_URL" npm run ...). The first line names the host.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { openDb } from "../src/core/db/client";
import { ownerByEmailForLocalScript } from "../src/core/identity/local-admin";
import {
  applyUpsert,
  parseUpsertFile,
  planUpsert,
} from "../src/core/import/ingredients-upsert";

function usage(message: string): never {
  console.error(
    `${message}\nusage: npm run upsert:ingredients -- FILE --email EMAIL [--apply]`,
  );
  process.exit(2);
}

let file: string | undefined;
let email: string | undefined;
let apply = false;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;
  if (arg === "--apply") apply = true;
  else if (arg === "--email") email = args[++i];
  else if (!file) file = arg;
  else usage(`unexpected argument: ${arg}`);
}
if (!file) usage("missing FILE");
if (!email) usage("missing --email");
if (!process.env.DATABASE_URL) usage("DATABASE_URL is not set (see .env.example)");

let raw: unknown;
try {
  raw = JSON.parse(await readFile(file, "utf8"));
} catch (e) {
  usage(`cannot read ${file} as JSON: ${e instanceof Error ? e.message : String(e)}`);
}
const parsed = parseUpsertFile(raw);
if (!parsed.ok) {
  for (const p of "problems" in parsed ? parsed.problems : []) console.error(`  ! ${p}`);
  usage(`${file} is not a valid lifeos-ingredients file`);
}

let host = "(invalid DATABASE_URL)";
try {
  host = new URL(process.env.DATABASE_URL).hostname;
} catch {}

const { db, close } = openDb(process.env.DATABASE_URL);
try {
  const owner = await ownerByEmailForLocalScript(db, email);
  if (!owner) usage(`no account with email ${email} in this database`);
  const plan = await planUpsert(db, owner, parsed.value);
  console.log(
    apply
      ? `APPLYING to ${host}`
      : `DRY RUN on ${host} — nothing is written; add --apply`,
  );
  for (const p of plan) {
    if (p.action === "create") console.log(`\n+ NEW     ${p.row.name}`);
    else if (p.action === "same") console.log(`\n= SAME    ${p.row.name}`);
    else {
      console.log(`\n~ UPDATE  ${p.row.name}`);
      for (const c of p.changes)
        console.log(
          `    ${c.field.padEnd(18)} ${c.from.slice(0, 40)}  ->  ${c.to.slice(0, 60)}`,
        );
    }
  }
  if (apply) {
    const failed = await applyUpsert(db, owner, plan);
    for (const f of failed) console.log(`  ! ${f.name}: ${JSON.stringify(f.errors)}`);
    console.log(failed.length ? "\nDone with errors (see above)." : "\nDone.");
  }
} finally {
  await close();
}
