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
      s.reps === null || s.loadKg === null ? null : e1rm(s.reps, Number(s.loadKg));
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
        eq(trainingSets.done, true),
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

/**
 * An exercise's records (TR-23), from its confirmed working sets, all time, shown from its
 * 3rd session: «forza stimata» (best e1RM, TR-21), «carico massimo», and the most reps at his
 * usual load («record a 40 kg»: the load he used in the most sessions, the heavier on a tie);
 * with no load (corpo libero): the most reps. Each with its day. Null under 3 sessions.
 * Not yet: «circa» loads left out, the longest time for an exercise a tempo (the log does not
 * read them).
 */
export type ExerciseRecords = {
  e1rm: { kg: number; day: IsoDate } | null;
  load: { kg: number; reps: number; day: IsoDate } | null;
  repsAt: { kg: number | null; reps: number; day: IsoDate } | null;
};

export function recordsOf(sessions: readonly ExerciseSession[]): ExerciseRecords | null {
  if (sessions.length < 3) return null;
  const out: ExerciseRecords = { e1rm: null, load: null, repsAt: null };
  const usedOn = new Map<number, number>();
  // Oldest first, so the first day a record was set is the one shown.
  const old = [...sessions].sort((a, b) => a.day.localeCompare(b.day));
  for (const s of old) {
    if (s.best !== null && (out.e1rm === null || s.best > out.e1rm.kg))
      out.e1rm = { kg: s.best, day: s.day };
    const loads = new Set<number>();
    for (const x of s.sets) {
      if (x.loadKg === null || x.reps === null) continue;
      const kg = Number(x.loadKg);
      if (!(kg > 0)) continue;
      loads.add(kg);
      if (
        out.load === null ||
        kg > out.load.kg ||
        (kg === out.load.kg && x.reps > out.load.reps)
      )
        out.load = { kg, reps: x.reps, day: s.day };
    }
    for (const kg of loads) usedOn.set(kg, (usedOn.get(kg) ?? 0) + 1);
  }
  const usual = [...usedOn].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0] ?? null;
  for (const s of old)
    for (const x of s.sets) {
      if (x.reps === null) continue;
      const kg = x.loadKg === null ? null : Number(x.loadKg);
      if (usual === null ? kg !== null && kg > 0 : kg !== usual) continue;
      if (out.repsAt === null || x.reps > out.repsAt.reps)
        out.repsAt = { kg: usual, reps: x.reps, day: s.day };
    }
  return out;
}
