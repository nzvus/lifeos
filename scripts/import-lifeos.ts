/**
 * scripts/import-lifeos.ts — REPLACE an account's nutrition data with a
 * lifeos export file (ingredients, meals, day types, day plans, log, settings).
 *
 *   npm run import:lifeos -- FILE --email you@example.com                     (dry run)
 *   npm run import:lifeos -- FILE --email you@example.com --apply --replace   (writes)
 *
 * Destructive: the account's current data is deleted and replaced, in one
 * transaction (core/import/lifeos-apply.ts). Both --apply and --replace are
 * required to write, so a copy-paste of the dry run can't do it by accident.
 * Before replacing production, run the `backup` workflow (docs/runbooks).
 * The account itself (login, password, sessions) is not touched.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { openDb } from "../src/core/db/client";
import { ownerByEmailForLocalScript } from "../src/core/identity/local-admin";
import { parseLifeosExport } from "../src/core/import/lifeos";
import { countOwned, replaceWithExport } from "../src/core/import/lifeos-apply";

function usage(message: string): never {
  console.error(
    `${message}\nusage: npm run import:lifeos -- FILE --email EMAIL [--apply --replace]`,
  );
  process.exit(2);
}

let file: string | undefined;
let email: string | undefined;
let apply = false;
let replace = false;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;
  if (arg === "--apply") apply = true;
  else if (arg === "--replace") replace = true;
  else if (arg === "--email") email = args[++i];
  else if (!file) file = arg;
  else usage(`unexpected argument: ${arg}`);
}
if (!file) usage("missing FILE");
if (!email) usage("missing --email");
if (apply !== replace)
  usage("to write, pass BOTH --apply and --replace (this deletes the current data)");
if (!process.env.DATABASE_URL) usage("DATABASE_URL is not set (see .env.example)");

let raw: unknown;
try {
  raw = JSON.parse(await readFile(file, "utf8"));
} catch (e) {
  usage(`cannot read ${file} as JSON: ${e instanceof Error ? e.message : String(e)}`);
}
const parsed = parseLifeosExport(raw);
if (!parsed.ok) {
  console.error(`${file} is not a valid lifeos export:`);
  for (const p of "problems" in parsed ? parsed.problems : []) console.error(`  ! ${p}`);
  process.exit(2);
}

let host = "(invalid DATABASE_URL)";
try {
  host = new URL(process.env.DATABASE_URL).hostname;
} catch {}

const { db, close } = openDb(process.env.DATABASE_URL);
try {
  const owner = await ownerByEmailForLocalScript(db, email).catch((e: unknown) =>
    usage(
      `cannot query the database at ${host}: ${e instanceof Error && e.cause instanceof Error ? e.cause.message : String(e)}`,
    ),
  );
  if (!owner) usage(`no account with email ${email} in this database`);

  const before = await countOwned(db, owner);
  const d = parsed.value;
  const after = {
    ingredients: d.ingredients.length,
    meals: d.meals.length,
    dayProfiles: d.dayProfiles.length,
    dayPlans: d.dayPlans.length,
    logEntries: d.log.length,
  };
  console.log(
    apply
      ? `REPLACING data of ${email} on ${host}`
      : `DRY RUN on ${host} — nothing is written`,
  );
  console.log(`\n${"".padEnd(14)}${"now".padStart(6)}${"after".padStart(8)}`);
  for (const k of Object.keys(after) as (keyof typeof after)[]) {
    console.log(
      `${k.padEnd(14)}${String(before[k]).padStart(6)}${String(after[k]).padStart(8)}`,
    );
  }
  if (apply) {
    await replaceWithExport(db, owner, d);
    console.log("\nDone: one transaction, all or nothing.");
  } else {
    console.log("\nTo write: add --apply --replace (after taking a backup).");
  }
} finally {
  await close();
}
