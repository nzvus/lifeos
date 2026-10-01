/**
 * scripts/tidy-training.ts — renames hand-numbered sessions ("PUSH 3") to
 * their routine's name and links them, and adds the outdoor run exercise and
 * routine if missing (core/import/training-tidy.ts). Safe to re-run.
 *
 *   npm run tidy:training -- --email you@example.com           (dry run: shows every change)
 *   npm run tidy:training -- --email you@example.com --apply
 *
 * The database is DATABASE_URL (from .env, or passed inline for production:
 * DATABASE_URL="$PROD_URL" npm run ...). The first line names the host.
 */
import "dotenv/config";
import { openDb } from "../src/core/db/client";
import { ownerByEmailForLocalScript } from "../src/core/identity/local-admin";
import { applyTidy, OUTDOOR_RUN, planTidy } from "../src/core/import/training-tidy";

function usage(message: string): never {
  console.error(`${message}\nusage: npm run tidy:training -- --email EMAIL [--apply]`);
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
  const plan = await planTidy(db, owner);
  console.log(
    apply
      ? `APPLYING to ${host}`
      : `DRY RUN on ${host} — nothing is written; add --apply`,
  );
  console.log("\nSessions:");
  for (const c of plan.sessions)
    console.log(
      `  ~ ${c.day}  ${c.from.padEnd(16)} ->  ${c.to}${c.from === c.to ? "  (link to routine)" : ""}`,
    );
  if (plan.sessions.length === 0) console.log("  nothing to rename");
  console.log("\nOutdoor run:");
  console.log(
    `  ${plan.createRunExercise ? "+ new" : "= exists"}  exercise ${OUTDOOR_RUN.exercise}`,
  );
  console.log(
    `  ${plan.createRunRoutine ? "+ new" : "= exists"}  routine ${OUTDOOR_RUN.routine}`,
  );
  if (apply) {
    await applyTidy(db, owner, plan);
    console.log("\nDone.");
  }
} finally {
  await close();
}
