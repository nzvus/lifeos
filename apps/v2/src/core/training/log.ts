/**
 * core/training/log.ts — an exercise's log for Libreria (V-07): its done
 * sessions, newest first, each with its work sets and best e1RM (E6, warm-ups
 * left out; an exercise with no work set that day is not a session).
 */
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { entries, trainingSets } from "../db/schema";
import { e1rm } from "../engines/training/sets";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export type LoggedSet = {
  reps: number | null;
  loadKg: string | null;
  rir: number | null;
};
export type ExerciseSession = { day: IsoDate; sets: LoggedSet[]; best: number | null };

/** Pure: the best e1RM of these sets, or null when none has reps and a load. */
export function bestE1rm(sets: readonly LoggedSet[]): number | null {
  let best: number | null = null;
  for (const s of sets) {
    const x =
      s.reps === null || s.loadKg === null ? null : e1rm(s.reps, Number(s.loadKg), s.rir);
    if (x !== null && (best === null || x > best)) best = x;
  }
  return best;
}

/** Each exercise's done sessions, newest first (all of them, or one exercise's). */
export async function readExerciseLog(
  db: Db,
  owner: Owner,
  exerciseId?: string,
): Promise<Map<string, ExerciseSession[]>> {
  const done = await db
    .select({ id: entries.id, itemId: entries.itemId, day: entries.day })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, "session_exercise"),
        eq(entries.status, "done"),
        isNull(entries.deletedAt),
        ...(exerciseId ? [eq(entries.itemId, exerciseId)] : []),
      ),
    )
    .orderBy(desc(entries.day), desc(entries.createdAt));
  const out = new Map<string, ExerciseSession[]>();
  if (done.length === 0) return out;
  const sets = await db
    .select({
      entryId: trainingSets.entryId,
      reps: trainingSets.reps,
      loadKg: trainingSets.loadKg,
      rir: trainingSets.rir,
      warmup: trainingSets.warmup,
    })
    .from(trainingSets)
    .where(
      and(
        ownedBy(trainingSets, owner),
        inArray(
          trainingSets.entryId,
          done.map((d) => d.id),
        ),
      ),
    )
    .orderBy(trainingSets.position);
  const by = new Map<string, LoggedSet[]>();
  for (const s of sets)
    if (!s.warmup)
      by.set(s.entryId, [
        ...(by.get(s.entryId) ?? []),
        { reps: s.reps, loadKg: s.loadKg, rir: s.rir },
      ]);
  for (const d of done) {
    const own = by.get(d.id) ?? [];
    // An exercise added to a session but never trained is not one of its sessions.
    if (!d.itemId || own.length === 0) continue;
    out.set(d.itemId, [
      ...(out.get(d.itemId) ?? []),
      { day: d.day, sets: own, best: bestE1rm(own) },
    ]);
  }
  return out;
}
