/**
 * An activity done (dossiers/activity.md §4–§5): a run, a ride, a row, logged
 * after the fact — when it ended, how long, how far, how hard. It is a
 * finished `session` of one cardio exercise with one set holding the
 * duration, the distance and the speed, so E3 counts it as cardio and the
 * trend reads it like any session. The check is pure; the write is one
 * transaction.
 */
import type { Db } from "../db/db";
import { entries, entryValues, trainingSets } from "../db/schema";
import type { IsoDate } from "../engines/time";
import type { Owner } from "../identity/owner";

export type ActivityInput = { minutes: string; km: string; rpe: string };
export type ActivityError = "minutes" | "km" | "rpe";
export type CheckedActivity = { minutes: number; km: number | null; rpe: number | null };

const decimal = (s: string) => {
  const t = s.trim().replace(",", ".");
  return t === "" ? null : /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
};

/** Minutes 1–600 (whole), km 0–300 (optional, comma or point), effort 0–10 (optional). */
export function checkActivity(
  i: ActivityInput,
): { ok: true; activity: CheckedActivity } | { ok: false; errors: ActivityError[] } {
  const errors: ActivityError[] = [];
  const minutes = Number(i.minutes.trim());
  if (!/^\d+$/.test(i.minutes.trim()) || minutes < 1 || minutes > 600)
    errors.push("minutes");
  const km = decimal(i.km);
  if (km !== null && !(km >= 0 && km <= 300)) errors.push("km");
  const rpe = decimal(i.rpe);
  if (rpe !== null && !(Number.isInteger(rpe) && rpe >= 0 && rpe <= 10))
    errors.push("rpe");
  return errors.length
    ? { ok: false, errors }
    : { ok: true, activity: { minutes, km: km || null, rpe } };
}

/** Pace in seconds per km, or null without a distance. */
export function paceSPerKm(a: CheckedActivity): number | null {
  return a.km ? Math.round((a.minutes * 60) / a.km) : null;
}

/** Writes the activity as a finished session ending at `end`; returns its id. */
export async function logActivity(
  db: Db,
  owner: Owner,
  p: {
    day: IsoDate;
    exerciseId: string;
    /** Its name, the session's title on Oggi («Corsa»). */
    label: string;
    end: Date;
    activity: CheckedActivity;
  },
): Promise<string> {
  const { minutes, km, rpe } = p.activity;
  const start = new Date(p.end.getTime() - minutes * 60_000);
  return db.transaction(async (tx) => {
    const base = {
      userId: owner.id,
      day: p.day,
      status: "done" as const,
      source: "typed" as const,
    };
    const [s] = await tx
      .insert(entries)
      .values({ ...base, kind: "session", startAt: start, endAt: p.end })
      .returning({ id: entries.id });
    const [x] = await tx
      .insert(entries)
      .values({
        ...base,
        kind: "session_exercise",
        parentId: s!.id,
        itemId: p.exerciseId,
      })
      .returning({ id: entries.id });
    const values = [
      { entryId: s!.id, field: "durationMin", num: String(minutes) },
      { entryId: x!.id, field: "position", num: "0" },
      ...(rpe !== null ? [{ entryId: s!.id, field: "rpe", num: String(rpe) }] : []),
    ];
    await tx
      .insert(entryValues)
      .values([
        ...values.map((v) => ({ userId: owner.id, ...v })),
        { userId: owner.id, entryId: s!.id, field: "label", text: p.label },
      ]);
    await tx.insert(trainingSets).values({
      userId: owner.id,
      entryId: x!.id,
      position: 0,
      durationS: minutes * 60,
      distanceM: km !== null ? String(Math.round(km * 1000)) : null,
      speedKmh:
        km !== null ? String(Math.round((km / (minutes / 60)) * 100) / 100) : null,
      startedAt: start,
      endedAt: p.end,
      done: true,
    });
    return s!.id;
  });
}
