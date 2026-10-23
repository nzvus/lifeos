/**
 * core/training/history.ts — what E6's trend, drop, rests and timing read
 * (dossiers/training.md §5): per exercise, its done sessions of the last
 * 120 days, oldest first, each with its sets (times and sides included),
 * its place in the session and the hard sets done before it for the same
 * muscles; and those sessions' exercises in order, for the person's timing.
 * Leaves out the session being trained. Owned by the owner.
 */
import { and, eq, gte, inArray, isNull, ne } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogValues, entries, entryValues, trainingSets } from "../db/schema";
import type { TimedSet } from "../engines/training";
import { addDays, type IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export const HISTORY_DAYS = 120;

export type HistorySet = {
  reps: number | null;
  loadKg: string | null;
  rir: number | null;
  warmup: boolean;
  side: "left" | "right" | null;
  durationS: number | null;
  startedAt: number | null;
  endedAt: number | null;
};

export type HistorySession = {
  day: IsoDate;
  sessionId: string;
  /** Hard (working) sets done before it in the session for the same muscles. */
  before: number;
  sets: HistorySet[];
};

export type TrainingHistory = {
  /** By exercise, oldest first. */
  byExercise: Map<string, HistorySession[]>;
  /** Each session's exercises in order, each its sets in order: the person's timing. */
  sessions: TimedSet[][][];
};

type Row = {
  id: string;
  parentId: string;
  itemId: string;
  day: IsoDate;
  position: number;
};

/** Pure: the hard sets before each exercise entry, for muscles it shares with the earlier ones. */
export function hardSetsBefore(
  rows: readonly Row[],
  workSets: ReadonlyMap<string, number>,
  muscles: ReadonlyMap<string, readonly string[]>,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of rows) {
    const mine = muscles.get(r.itemId) ?? [];
    let n = 0;
    for (const o of rows)
      if (
        o.parentId === r.parentId &&
        o.position < r.position &&
        (muscles.get(o.itemId) ?? []).some((m) => mine.includes(m))
      )
        n += workSets.get(o.id) ?? 0;
    out.set(r.id, n);
  }
  return out;
}

export async function readTrainingHistory(
  db: Db,
  owner: Owner,
  exerciseIds: readonly string[],
  except: string,
  today: IsoDate,
): Promise<TrainingHistory> {
  const empty: TrainingHistory = { byExercise: new Map(), sessions: [] };
  if (exerciseIds.length === 0) return empty;
  const since = addDays(today, -HISTORY_DAYS);
  const mine = await db
    .select({ parentId: entries.parentId })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, "session_exercise"),
        eq(entries.status, "done"),
        isNull(entries.deletedAt),
        inArray(entries.itemId, [...new Set(exerciseIds)]),
        ne(entries.parentId, except),
        gte(entries.day, since),
      ),
    );
  const sessionIds = [...new Set(mine.flatMap((m) => (m.parentId ? [m.parentId] : [])))];
  if (sessionIds.length === 0) return empty;
  const children = await db
    .select({
      id: entries.id,
      parentId: entries.parentId,
      itemId: entries.itemId,
      day: entries.day,
      createdAt: entries.createdAt,
    })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, "session_exercise"),
        isNull(entries.deletedAt),
        inArray(entries.parentId, sessionIds),
      ),
    );
  const childIds = children.map((c) => c.id);
  const [positions, sets, groups] = await Promise.all([
    db
      .select({ entryId: entryValues.entryId, num: entryValues.num })
      .from(entryValues)
      .where(
        and(
          ownedBy(entryValues, owner),
          inArray(entryValues.entryId, childIds),
          eq(entryValues.field, "position"),
        ),
      ),
    db
      .select()
      .from(trainingSets)
      .where(
        and(
          ownedBy(trainingSets, owner),
          inArray(trainingSets.entryId, childIds),
          eq(trainingSets.done, true),
        ),
      )
      .orderBy(trainingSets.position),
    db
      .select({ itemId: catalogValues.itemId, text: catalogValues.text })
      .from(catalogValues)
      .where(
        and(
          ownedBy(catalogValues, owner),
          inArray(catalogValues.itemId, [
            ...new Set(children.flatMap((c) => (c.itemId ? [c.itemId] : []))),
          ]),
          eq(catalogValues.field, "muscleGroups"),
        ),
      ),
  ]);
  const pos = new Map(positions.map((p) => [p.entryId, Number(p.num ?? 0)]));
  // Without a stored place, the order they were added in.
  const rows: Row[] = children
    .flatMap((c) =>
      c.parentId && c.itemId ? [{ ...c, parentId: c.parentId, itemId: c.itemId }] : [],
    )
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((c, i) => ({
      id: c.id,
      parentId: c.parentId,
      itemId: c.itemId,
      day: c.day,
      position: pos.get(c.id) ?? 1000 + i,
    }));
  const setsOf = new Map<string, HistorySet[]>();
  for (const s of sets)
    setsOf.set(s.entryId, [
      ...(setsOf.get(s.entryId) ?? []),
      {
        reps: s.reps,
        loadKg: s.loadKg,
        rir: s.rir,
        warmup: s.warmup,
        side: s.side ?? null,
        durationS: s.durationS,
        startedAt: s.startedAt?.getTime() ?? null,
        endedAt: s.endedAt?.getTime() ?? null,
      },
    ]);
  const work = new Map(
    rows.map((r) => [r.id, (setsOf.get(r.id) ?? []).filter((s) => !s.warmup).length]),
  );
  const muscles = new Map(
    groups.map((g) => [
      g.itemId,
      (g.text ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    ]),
  );
  const before = hardSetsBefore(rows, work, muscles);
  const byExercise = new Map<string, HistorySession[]>();
  const wanted = new Set(exerciseIds);
  for (const r of [...rows].sort((a, b) => a.day.localeCompare(b.day))) {
    const own = setsOf.get(r.id) ?? [];
    if (!wanted.has(r.itemId) || own.length === 0) continue;
    byExercise.set(r.itemId, [
      ...(byExercise.get(r.itemId) ?? []),
      { day: r.day, sessionId: r.parentId, before: before.get(r.id) ?? 0, sets: own },
    ]);
  }
  const sessions = sessionIds.map((sid) =>
    rows
      .filter((r) => r.parentId === sid)
      .sort((a, b) => a.position - b.position)
      .map((r) => setsOf.get(r.id) ?? []),
  );
  return { byExercise, sessions };
}
