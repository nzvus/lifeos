/**
 * Loads an export of the v2 app («lifeos-v2-export», core/account/export.ts)
 * into a LOCAL account, replacing what it has (core/convert/load.ts
 * `replaceFile`, one transaction). For looking at the developer's real days
 * on the local app (the visual study's boards): local PGlite only, never a
 * shared database. Stop the dev server first: a PGlite folder has one owner.
 *
 *   npx tsx --env-file-if-exists=.env.local scripts/load-v2-export.ts <export.json> --email <account email>
 */
import { readFileSync } from "node:fs";
import { V2_FORMAT, V2_VERSION, type V2File } from "../src/core/convert/file";
import { replaceFile } from "../src/core/convert/load";
import { createLocalDb } from "../src/core/db/client";
import { ownerByEmailForLocalScript } from "../src/core/identity/local-admin";

const [file, flag, email] = process.argv.slice(2);
if (!file || flag !== "--email" || !email) {
  console.error("usage: load-v2-export <export.json> --email <account email>");
  process.exit(2);
}
if (process.env.DATABASE_URL || !process.env.V2_PGLITE_DIR) {
  console.error(
    "local only: unset DATABASE_URL and set V2_PGLITE_DIR (apps/v2/.env.local)",
  );
  process.exit(2);
}
const raw = JSON.parse(readFileSync(file, "utf8")) as {
  format: string;
  exportedAt: string;
  tables: V2File["tables"];
};
if (raw.format !== "lifeos-v2-export") {
  console.error(`not a v2 export: format ${raw.format}`);
  process.exit(2);
}
const db = await createLocalDb(process.env.V2_PGLITE_DIR);
const owner = await ownerByEmailForLocalScript(db, email);
if (!owner) {
  console.error("no account with that email: create it in the app first");
  process.exit(1);
}
const v2 = {
  format: V2_FORMAT,
  version: V2_VERSION,
  exportedAt: raw.exportedAt,
  account: null,
  tables: raw.tables,
  report: {
    from: { format: raw.format, version: 1, exportedAt: raw.exportedAt, refined: false },
    counts: {},
    dropped: [],
    estimates: 0,
    notes: [],
  },
} as unknown as V2File;
await replaceFile(db as never, v2, owner.id);
const rows = Object.values(raw.tables).reduce((a, t) => a + t.length, 0);
console.log(`loaded ${rows} rows into ${email}`);
process.exit(0);
