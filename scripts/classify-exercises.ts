/**
 * scripts/classify-exercises.ts — fills in the movement pattern and muscle
 * groups of exercises that have none, from their names
 * (core/import/exercises-classify.ts). Choices already made are kept.
 *
 *   npm run classify:exercises -- --email you@example.com           (dry run: shows every change)
 *   npm run classify:exercises -- --email you@example.com --apply
 *
 * The database is DATABASE_URL (from .env, or passed inline for production:
 * DATABASE_URL="$PROD_URL" npm run ...). The first line names the host.
 */
import "dotenv/config";
import { openDb } from "../src/core/db/client";
import { ownerByEmailForLocalScript } from "../src/core/identity/local-admin";
import {
  applyClassification,
  planClassification,
} from "../src/core/import/exercises-classify";

function usage(message: string): never {
  console.error(
    `${message}\nusage: npm run classify:exercises -- --email EMAIL [--apply]`,
  );
  process.exit(2);
}

let email: string | undefined;
let apply = false;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;
  if (arg === "--apply") apply = true;
  else if (arg === "--email") email = args[++i];
  else usage(`unexpected argument: ${arg}`);
}
if (!email) usage("missing --email");
if (!process.env.DATABASE_URL) usage("DATABASE_URL is not set (see .env.example)");

let host = "(invalid DATABASE_URL)";
try {
  host = new URL(process.env.DATABASE_URL).hostname;
} catch {}

const { db, close } = openDb(process.env.DATABASE_URL);
try {
  const owner = await ownerByEmailForLocalScript(db, email);
  if (!owner) usage(`no account with email ${email} in this database`);
  const { changes, unknown } = await planClassification(db, owner);
  console.log(
    apply
      ? `APPLYING to ${host}`
      : `DRY RUN on ${host} — nothing is written; add --apply`,
  );
  for (const c of changes) {
    console.log(`\n~ ${c.name}`);
    if (c.pattern)
      console.log(`    pattern        ${c.pattern.from ?? "-"}  ->  ${c.pattern.to}`);
    if (c.muscleGroups)
      console.log(
        `    muscle groups  ${c.muscleGroups.from.join(", ") || "-"}  ->  ${c.muscleGroups.to.join(", ")}`,
      );
  }
  if (unknown.length)
    console.log(`\n? no suggestion (set them in the app): ${unknown.join(", ")}`);
  if (changes.length === 0) console.log("\nNothing to classify.");
  if (apply)
    console.log(`\nDone: ${await applyClassification(db, owner, changes)} exercises.`);
} finally {
  await close();
}
