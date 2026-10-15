/**
 * scripts/import-lifeos.ts — REPLACE all of an account's data with a lifeos
 * export file, any version (ADR-0052; the same core as Settings → Replace).
 *
 *   npm run import:lifeos -- FILE --email you@example.com                     (dry run)
 *   npm run import:lifeos -- FILE --email you@example.com --apply --replace   (writes)
 *
 * Destructive: the account's current data is deleted and replaced, in one
 * transaction (core/import/replace.ts). Both --apply and --replace are
 * required to write, so a copy-paste of the dry run can't do it by accident.
 * Before replacing production, run the `backup` workflow (docs/runbooks).
 * The account itself (login, password, sessions) is not touched, nor are its
 * language and assistant key.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { openDb } from "../src/core/db/client";
import { ownerByEmailForLocalScript } from "../src/core/identity/local-admin";
import { planReplace, readExport, replaceAll } from "../src/core/import/replace";

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
const parsed = readExport(raw);
if (!parsed.ok) {
  console.error(`${file} is not a valid lifeos export:`);
  for (const p of parsed.problems) console.error(`  ! ${JSON.stringify(p)}`);
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

  const plan = await planReplace(db, owner, parsed.file);
  console.log(
    apply
      ? `REPLACING data of ${email} on ${host}`
      : `DRY RUN on ${host} — nothing is written`,
  );
  console.log(`file: version ${plan.version}, exported ${plan.exportedAt ?? "?"}`);
  console.log(`\n${"".padEnd(26)}${"now".padStart(6)}${"after".padStart(8)}`);
  for (const r of plan.replaced)
    console.log(
      `${r.table.padEnd(26)}${String(r.now).padStart(6)}${String(r.after).padStart(8)}`,
    );
  for (const r of plan.lost)
    console.log(
      `${r.table.padEnd(26)}${String(r.now).padStart(6)}${"0".padStart(8)}  LOST: not in this older file`,
    );
  if (plan.kept.length)
    console.log(`\nkept as they are (not in this file): ${plan.kept.join(", ")}`);
  if (plan.dropped.length)
    console.log(`ignored (old fields): ${plan.dropped.join(", ")}`);
  if (apply) {
    const done = await replaceAll(db, owner, parsed.file);
    if (!done.ok) {
      console.error(`\nNothing written: ${JSON.stringify(done.problems)}`);
      process.exitCode = 1;
    } else console.log("\nDone: one transaction, all or nothing.");
  } else {
    console.log("\nTo write: add --apply --replace (after taking a backup).");
  }
} finally {
  await close();
}
