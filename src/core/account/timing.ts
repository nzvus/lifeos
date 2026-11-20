/**
 * core/account/timing.ts — the two timing settings (reframe §11, his 20 Nov): the slack that
 * still counts as «adesso», and what a past previsto becomes. Kept in `settings.prefs.timing`,
 * so they need no column; read with defaults (`timingOf`).
 */
import { sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { settings } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { timingOf, type Timing } from "../entries/timing";

export async function readTiming(db: Db, owner: Owner): Promise<Timing> {
  const [row] = await db
    .select({ prefs: settings.prefs })
    .from(settings)
    .where(ownedBy(settings, owner));
  return timingOf(row?.prefs);
}

/** Sets both, leaving the other prefs as they are; values out of range fall back to defaults. */
export async function saveTiming(db: Db, owner: Owner, t: Timing): Promise<Timing> {
  const clean = timingOf({ timing: t });
  await db
    .insert(settings)
    .values({ userId: owner.id, prefs: { timing: clean } })
    .onConflictDoUpdate({
      target: settings.userId,
      set: {
        prefs: sql`jsonb_set(coalesce(${settings.prefs}, '{}'::jsonb), '{timing}', ${JSON.stringify(clean)}::jsonb)`,
      },
    });
  return clean;
}
