/**
 * core/health.ts — "is the database reachable right now?" (DT-34).
 * Used by `app/api/health/route.ts`, which backup.yml's `app-health` calls daily:
 * «deployed» and «working» are different claims, only a real query proves the second.
 */
import { sql } from "drizzle-orm";
import type { Db } from "./db/db";

export async function checkDatabase(db: Promise<Db> | Db): Promise<boolean> {
  try {
    await (await db).execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
