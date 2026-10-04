/**
 * core/mind/repositories/checkins.ts — the day as it felt (ADR-0038), one
 * row per day, owner-filtered. Saving an empty check-in removes the row:
 * nothing said is the same as no row.
 */
import { and, asc, eq, gte, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import { dayCheckins } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import type { CheckinInput } from "../validation";

export type Checkin = {
  day: string;
  mood: number | null;
  energy: number | null;
  stress: number | null;
  note: string;
};

const view = (r: typeof dayCheckins.$inferSelect): Checkin => ({
  day: r.day,
  mood: r.mood,
  energy: r.energy,
  stress: r.stress,
  note: r.note,
});

export async function getCheckin(
  db: Db,
  owner: Owner,
  day: string,
): Promise<Checkin | null> {
  const [r] = await db
    .select()
    .from(dayCheckins)
    .where(and(ownedBy(dayCheckins, owner), eq(dayCheckins.day, day)));
  return r ? view(r) : null;
}

export async function listCheckins(
  db: Db,
  owner: Owner,
  from: string,
  to: string,
): Promise<Checkin[]> {
  const rows = await db
    .select()
    .from(dayCheckins)
    .where(
      and(
        ownedBy(dayCheckins, owner),
        gte(dayCheckins.day, from),
        lte(dayCheckins.day, to),
      ),
    )
    .orderBy(asc(dayCheckins.day));
  return rows.map(view);
}

export async function saveCheckin(
  db: Db,
  owner: Owner,
  input: CheckinInput,
): Promise<void> {
  const empty =
    input.mood === null && input.energy === null && input.stress === null && !input.note;
  if (empty) {
    await db
      .delete(dayCheckins)
      .where(and(ownedBy(dayCheckins, owner), eq(dayCheckins.day, input.day)));
    return;
  }
  const values = {
    mood: input.mood,
    energy: input.energy,
    stress: input.stress,
    note: input.note,
  };
  await db
    .insert(dayCheckins)
    .values({ userId: owner.id, day: input.day, ...values })
    .onConflictDoUpdate({ target: [dayCheckins.userId, dayCheckins.day], set: values });
}
