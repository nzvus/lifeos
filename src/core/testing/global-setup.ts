/**
 * core/testing/global-setup.ts — Vitest's global setup: migrates ONE empty
 * PGlite database with drizzle/*.sql and writes its data directory to a
 * temp file, once per `npm test`. Every test file then copies it
 * (test-db.ts createTestDb) instead of running the migrations again.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../db/schema";

export default async function setup() {
  const dir = mkdtempSync(join(tmpdir(), "lifeos-test-"));
  const file = join(dir, "template.tar");
  const client = new PGlite();
  await migrate(drizzle(client, { schema }), { migrationsFolder: "drizzle" });
  writeFileSync(
    file,
    Buffer.from(await (await client.dumpDataDir("none")).arrayBuffer()),
  );
  await client.close();
  process.env.LIFEOS_TEST_TEMPLATE = file;
  return () => rmSync(dir, { recursive: true, force: true });
}
