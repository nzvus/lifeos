/**
 * core/nutrition/repositories/closures.ts — closing a day (ADR-0042): "what
 * I logged is what I ate" (complete) or "something is missing" (partial).
 * One row per day, owner-filtered; clearing removes the row (not closed).
 */
import { and, eq, gte, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import { dayClosures, type ClosureState } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";

export async function setDayClosure(
  db: Db,
  owner: Owner,
  day: string,
  state: ClosureState | null,
): Promise<void> {
  if (state === null) {
    await db
      .delete(dayClosures)
      .where(and(ownedBy(dayClosures, owner), eq(dayClosures.day, day)));
    return;
  }
  await db
    .insert(dayClosures)
    .values({ userId: owner.id, day, state })
    .onConflictDoUpdate({
      target: [dayClosures.userId, dayClosures.day],
      set: { state },
    });
}

/** Closed days of [from, to], by day. */
export async function listClosures(
  db: Db,
  owner: Owner,
  from: string,
  to: string,
): Promise<Map<string, ClosureState>> {
  const rows = await db
    .select({ day: dayClosures.day, state: dayClosures.state })
    .from(dayClosures)
    .where(
      and(
        ownedBy(dayClosures, owner),
        gte(dayClosures.day, from),
        lte(dayClosures.day, to),
      ),
    );
  return new Map(rows.map((r) => [r.day, r.state]));
}
