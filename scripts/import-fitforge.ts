/**
 * scripts/import-fitforge.ts — import ingredients and meals from a FitForge
 * export into your lifeos account.
 *
 *   npm run import:fitforge -- private/fitforge-export.json --email you@example.com
 *   npm run import:fitforge -- private/fitforge-export.json --email you@example.com --apply
 *
 * Without --apply it is a DRY RUN: it prints what it would create and writes
 * nothing. The database is the one in DATABASE_URL (read from .env), so check
 * which one that is before --apply: the dev branch first, production later.
 *
 * All logic is in src/core/import/ (tested); this file only does input and
 * output: read the file, open the database, find the account, print.
 * Keep the export in private/ — it's gitignored, because it contains personal
 * data (email, birth date).
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { openDb } from "../src/core/db/client";
import { ownerByEmailForLocalScript } from "../src/core/identity/local-admin";
import { planFitForgeImport, type ImportIssue } from "../src/core/import/fitforge";
import { applyFitForgeImport } from "../src/core/import/fitforge-apply";

function usage(message: string): never {
  console.error(
    `${message}\nusage: npm run import:fitforge -- FILE --email EMAIL [--apply]`,
  );
  process.exit(2);
}

function describe(issue: ImportIssue): string {
  switch (issue.kind) {
    case "price_dropped":
      return `${issue.ingredient}: only half a price (price or package size missing) — imported without price`;
    case "invalid_ingredient":
      return `${issue.ingredient}: NOT imported, invalid ${JSON.stringify(issue.errors)}`;
    case "invalid_meal":
      return `${issue.meal}: meal NOT imported, invalid ${JSON.stringify(issue.errors)}`;
    case "meal_missing_ingredient":
      return `${issue.meal}: meal NOT imported, it uses "${issue.ingredient}" which isn't imported`;
  }
}

// Arguments: one FILE, "--email EMAIL", optional "--apply", in any order.
const args = process.argv.slice(2);
let file: string | undefined;
let email: string | undefined;
let apply = false;
for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;
  if (arg === "--apply") apply = true;
  else if (arg === "--email")
    email = args[++i]; // the value follows the flag
  else if (!file) file = arg;
  else usage(`unexpected argument: ${arg}`);
}
if (!file) usage("missing FILE");
if (!email) usage("missing --email");
if (!process.env.DATABASE_URL) usage("DATABASE_URL is not set (see .env.example)");

// Read and parse, turning "file missing" or "not JSON" into a one-line
// message instead of a stack trace.
let raw: unknown;
try {
  raw = JSON.parse(await readFile(file, "utf8"));
} catch (e) {
  usage(`cannot read ${file} as JSON: ${e instanceof Error ? e.message : String(e)}`);
}
const plan = planFitForgeImport(raw);
if (!plan.ok) usage(`${file} doesn't look like a FitForge export`);

/** The host part of the URL, for messages: never print the whole URL (it holds the password). */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname || "(no host in DATABASE_URL)";
  } catch {
    return "(DATABASE_URL is not a valid URL: was it copied whole?)";
  }
}
const database = hostOf(process.env.DATABASE_URL);

const { db, close } = openDb(process.env.DATABASE_URL);
try {
  let owner;
  try {
    owner = await ownerByEmailForLocalScript(db, email);
  } catch (e) {
    // The driver's own error (e.g. "connect ECONNREFUSED", "password
    // authentication failed") is in `cause`; it never contains the URL.
    const cause =
      e instanceof Error && e.cause instanceof Error ? e.cause.message : String(e);
    usage(`cannot query the database at ${database}: ${cause}`);
  }
  if (!owner) usage(`no account with email ${email} in this database`);

  console.log(
    apply
      ? `APPLYING to ${database}`
      : `DRY RUN on ${database} — nothing is written; add --apply to write`,
  );

  const report = await applyFitForgeImport(db, owner, plan.value, { apply });
  const verb = apply ? "created" : "would create";
  for (const [label, part] of [
    ["Ingredients", report.ingredients],
    ["Meals", report.meals],
  ] as const) {
    console.log(
      `\n${label}: ${part.created.length} ${verb}, ${part.existing.length} already present (left unchanged), ${part.failed.length} failed`,
    );
    for (const n of part.created) console.log(`  + ${n}`);
    for (const n of part.existing) console.log(`  = ${n}`);
    for (const f of part.failed) console.log(`  ! ${f.name} ${JSON.stringify(f.errors)}`);
  }
  if (plan.value.issues.length) {
    console.log("\nNotes:");
    for (const issue of plan.value.issues) console.log(`  ! ${describe(issue)}`);
  }
} finally {
  await close(); // end the connection pool, or the script never exits
}
