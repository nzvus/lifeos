/**
 * Brings into v2 the training logged in v1 after v2 was loaded (the cutover
 * decided 2026-10-17: gym in v1 until gym mode is in v2). From a newer v1
 * export: the sessions from --since on that v2 does not have, with their
 * exercises and sets, and the exercises and routines v2's catalog lacks.
 * Dry run by default: it prints what it would load; --write loads it, in
 * one transaction. Running it twice loads nothing the second time.
 *
 *   npm run import:sessions -w apps/v2 -- <export.json> --email <email> --since 2026-10-17 [--write]
 */
import { readFileSync } from "node:fs";
import { convert } from "../src/core/convert/convert";
import type { V1Export } from "../src/core/convert/context";
import { loadFile } from "../src/core/convert/load";
import { existingIds, sessionsSince } from "../src/core/convert/sessions";
import { createDb, createLocalDb } from "../src/core/db/client";
import { ownerByEmailForLocalScript } from "../src/core/identity/local-admin";

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const file = args[0];
const email = opt("--email");
const since = opt("--since");
const write = args.includes("--write");
if (!file || !email || !since || !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
  console.error(
    "usage: import-sessions <export.json> --email <email> --since YYYY-MM-DD [--write]",
  );
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
  console.error("no account with that email");
  process.exit(1);
}
const v2 = convert(JSON.parse(readFileSync(file, "utf8")) as V1Export, new Date());
const only = sessionsSince(v2, since, await existingIds(db as never, owner.id));
const sessions = only.tables.entries.filter((e) => e.kind === "session");
console.log(
  `${sessions.length} sessions from ${since}: ` +
    sessions.map((s) => s.day).join(", ") +
    `; ${only.tables.training_sets.length} sets; new in the catalog: ` +
    (only.tables.catalog_items.map((i) => `${i.catalog} «${i.name}»`).join(", ") ||
      "none"),
);
if (!write) {
  console.log("dry run: nothing written (add --write to load them)");
  process.exit(0);
}
await loadFile(db as never, only, owner.id);
console.log("loaded");
process.exit(0);
