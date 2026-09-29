/**
 * core/health.ts — "is the database reachable right now?"
 *
 * Used by src/app/api/health/route.ts, which healthchecks.io polls
 * (ADR-0004: "deployed" and "working" are different claims; only a real query
 * proves the second).
 */
import { sql } from "drizzle-orm";
import type { Db } from "./db/client";

export async function checkDatabase(db: Db): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
