/**
 * core/training/repositories/sleep.ts — nights of sleep (ADR-0031), one per
 * wake-up day: set (replace), clear, read one or a range.
 *
 * Tested in: sleep.test.ts.
 */
import { and, asc, eq, gte, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import { sleepLogs } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { fail, ok, type Result } from "../../shared/result";
import { nightInstants, sleepHours } from "../sleep";
import type { SleepInput } from "../validation";

export type Night = {
  day: string;
  bedAt: Date;
  wakeAt: Date;
  hours: number;
  quality: number | null;
  notes: string;
};

const toNight = (r: typeof sleepLogs.$inferSelect): Night => ({
  day: r.day,
  bedAt: r.bedAt,
  wakeAt: r.wakeAt,
  hours: sleepHours(r.bedAt, r.wakeAt),
  quality: r.quality,
  notes: r.notes,
});

/** The night that ended on `day` (times in the user's zone), replacing any. */
export async function setSleep(
  db: Db,
  owner: Owner,
  input: SleepInput,
  timeZone: string,
): Promise<Result<Night>> {
  const { bedAt, wakeAt } = nightInstants(input.day, input.bed!, input.wake!, timeZone);
  if (wakeAt <= bedAt) return fail({ wake: "invalid_time" });
  const values = { bedAt, wakeAt, quality: input.quality, notes: input.notes };
  const [row] = await db
    .insert(sleepLogs)
    .values({ userId: owner.id, day: input.day, ...values })
    .onConflictDoUpdate({ target: [sleepLogs.userId, sleepLogs.day], set: values })
    .returning();
  return ok(toNight(row!));
}

export async function clearSleep(db: Db, owner: Owner, day: string): Promise<void> {
  await db
    .delete(sleepLogs)
    .where(and(ownedBy(sleepLogs, owner), eq(sleepLogs.day, day)));
}

export async function listSleep(
  db: Db,
  owner: Owner,
  from: string,
  to: string,
): Promise<Night[]> {
  const rows = await db
    .select()
    .from(sleepLogs)
    .where(
      and(ownedBy(sleepLogs, owner), gte(sleepLogs.day, from), lte(sleepLogs.day, to)),
    )
    .orderBy(asc(sleepLogs.day));
  return rows.map(toNight);
}
