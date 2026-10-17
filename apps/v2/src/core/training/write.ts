/**
 * core/training/write.ts — gym mode's writes (V-05). A session in progress
 * is a `session` entry with its start and no end, status planned; its
 * exercises are `session_exercise` children in order; each set is saved the
 * moment it is ticked (a gym has a phone, not always a signal: nothing waits
 * for the end). Finishing marks the session and its exercises done, with
 * the end and the minutes. Every write is ownedBy the owner and checks the
 * entry it touches is the right kind, live and theirs.
 */
import { and, count, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogItems,
  catalogValues,
  entries,
  entryValues,
  trainingSets,
} from "../db/schema";
import type { GuideKey } from "../engines/training";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export type SetInput = {
  reps: string;
  loadKg: string;
  rir: string;
  durationS: string;
  warmup: boolean;
};
export type CheckedSet = {
  reps: number | null;
  loadKg: string | null;
  rir: number | null;
  durationS: number | null;
  warmup: boolean;
};
export type SetError = "reps" | "loadKg" | "rir" | "durationS" | "empty";

const INT = /^\d+$/;
const KG = /^\d+([.,]\d{1,2})?$/;

/** Pure: a typed set, or what is wrong with it. A set needs reps or a time. */
export function checkSet(
  s: SetInput,
): { ok: true; set: CheckedSet } | { ok: false; error: SetError } {
  const t = (x: string) => x.trim();
  const reps = t(s.reps);
  const kg = t(s.loadKg).replace(",", ".");
  const rir = t(s.rir);
  const dur = t(s.durationS);
  if (reps !== "" && (!INT.test(reps) || Number(reps) > 200))
    return { ok: false, error: "reps" };
  if (kg !== "" && (!KG.test(kg) || Number(kg) > 1000))
    return { ok: false, error: "loadKg" };
  if (rir !== "" && (!INT.test(rir) || Number(rir) > 10))
    return { ok: false, error: "rir" };
  if (dur !== "" && (!INT.test(dur) || Number(dur) > 36000))
    return { ok: false, error: "durationS" };
  if (reps === "" && dur === "") return { ok: false, error: "empty" };
  return {
    ok: true,
    set: {
      reps: reps === "" ? null : Number(reps),
      loadKg: kg === "" ? null : kg,
      rir: rir === "" ? null : Number(rir),
      durationS: dur === "" ? null : Number(dur),
      warmup: s.warmup,
    },
  };
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** A live entry of this owner and kind; its row, or null. */
async function liveEntry(db: Db | Tx, owner: Owner, id: string, kind: string) {
  const [row] = await db
    .select({
      id: entries.id,
      day: entries.day,
      parentId: entries.parentId,
      startAt: entries.startAt,
    })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.id, id),
        eq(entries.kind, kind),
        isNull(entries.deletedAt),
      ),
    );
  return row ?? null;
}

async function setValue(
  tx: Tx,
  owner: Owner,
  entryId: string,
  field: string,
  num: string,
) {
  await tx
    .insert(entryValues)
    .values({ userId: owner.id, entryId, field, num })
    .onConflictDoUpdate({
      target: [entryValues.entryId, entryValues.field],
      set: { num },
    });
}

/** Starts a session on `day` at `startAt` with these exercises in order; returns its id. */
export async function startSession(
  db: Db,
  owner: Owner,
  p: {
    day: IsoDate;
    startAt: Date;
    routineId: string | null;
    exerciseIds: readonly string[];
  },
): Promise<string> {
  return db.transaction(async (tx) => {
    const [s] = await tx
      .insert(entries)
      .values({
        userId: owner.id,
        kind: "session",
        day: p.day,
        status: "planned",
        startAt: p.startAt,
        itemId: p.routineId,
        source: "typed",
      })
      .returning({ id: entries.id });
    for (const [position, exerciseId] of p.exerciseIds.entries())
      await addChild(tx, owner, s!.id, p.day, exerciseId, position);
    return s!.id;
  });
}

async function addChild(
  tx: Tx,
  owner: Owner,
  sessionId: string,
  day: IsoDate,
  exerciseId: string,
  position: number,
) {
  const [x] = await tx
    .insert(entries)
    .values({
      userId: owner.id,
      kind: "session_exercise",
      day,
      status: "planned",
      parentId: sessionId,
      itemId: exerciseId,
      source: "typed",
    })
    .returning({ id: entries.id });
  await setValue(tx, owner, x!.id, "position", String(position));
  return x!.id;
}

/** Adds an exercise at the end of a live session; its entry id, or null. */
export async function addExercise(
  db: Db,
  owner: Owner,
  sessionId: string,
  exerciseId: string,
): Promise<string | null> {
  return db.transaction(async (tx) => {
    const s = await liveEntry(tx, owner, sessionId, "session");
    if (!s) return null;
    const [n] = await tx
      .select({ n: count() })
      .from(entries)
      .where(
        and(
          ownedBy(entries, owner),
          eq(entries.parentId, sessionId),
          isNull(entries.deletedAt),
        ),
      );
    return addChild(tx, owner, sessionId, s.day, exerciseId, n!.n);
  });
}

/** Saves a ticked set at its position (replacing what was there); false if not this owner's. */
export async function saveSet(
  db: Db,
  owner: Owner,
  exerciseEntryId: string,
  position: number,
  set: CheckedSet,
  at: Date,
): Promise<boolean> {
  const x = await liveEntry(db, owner, exerciseEntryId, "session_exercise");
  if (!x || position < 0 || position > 99) return false;
  const row = {
    reps: set.reps,
    loadKg: set.loadKg,
    loadEntry: "total" as const,
    rir: set.rir,
    durationS: set.durationS,
    warmup: set.warmup,
    endedAt: at,
    done: true,
  };
  await db
    .insert(trainingSets)
    .values({ userId: owner.id, entryId: exerciseEntryId, position, ...row })
    .onConflictDoUpdate({
      target: [trainingSets.entryId, trainingSets.position],
      set: row,
    });
  return true;
}

/** Takes a set out; false if there was none of this owner's. */
export async function removeSet(
  db: Db,
  owner: Owner,
  exerciseEntryId: string,
  position: number,
): Promise<boolean> {
  const gone = await db
    .delete(trainingSets)
    .where(
      and(
        ownedBy(trainingSets, owner),
        eq(trainingSets.entryId, exerciseEntryId),
        eq(trainingSets.position, position),
      ),
    )
    .returning({ id: trainingSets.id });
  return gone.length > 0;
}

/** Ends a live session at `endAt`: it and its exercises are done, with its minutes. */
export async function finishSession(
  db: Db,
  owner: Owner,
  sessionId: string,
  endAt: Date,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const s = await liveEntry(tx, owner, sessionId, "session");
    if (!s) return false;
    const start = s.startAt && s.startAt < endAt ? s.startAt : null;
    await tx
      .update(entries)
      .set({ status: "done", ...(start ? { endAt } : {}) })
      .where(and(ownedBy(entries, owner), eq(entries.id, sessionId)));
    await tx
      .update(entries)
      .set({ status: "done" })
      .where(
        and(
          ownedBy(entries, owner),
          eq(entries.parentId, sessionId),
          isNull(entries.deletedAt),
        ),
      );
    if (start)
      await setValue(
        tx,
        owner,
        sessionId,
        "durationMin",
        String(Math.round((endAt.getTime() - start.getTime()) / 60_000)),
      );
    return true;
  });
}

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight",
] as const;

/**
 * A new exercise (V-07): its name, unique among the owner's live exercises,
 * and what gym mode reads of it: the movement pattern (E6's guide), the
 * equipment, whether it is done one side at a time. "taken" if the name is.
 */
export async function createExercise(
  db: Db,
  owner: Owner,
  name: string,
  e: {
    pattern: GuideKey | null;
    equipment: (typeof EQUIPMENT)[number] | null;
    unilateral: boolean;
  },
): Promise<{ id: string } | "taken"> {
  return db.transaction(async (tx) => {
    const [twin] = await tx
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.catalog, "exercise"),
          isNull(catalogItems.deletedAt),
          sql`lower(${catalogItems.name}) = lower(${name})`,
        ),
      )
      .limit(1);
    if (twin) return "taken";
    const [row] = await tx
      .insert(catalogItems)
      .values({ userId: owner.id, catalog: "exercise", name })
      .returning({ id: catalogItems.id });
    const id = row!.id;
    await tx
      .insert(catalogValues)
      .values([
        ...(e.pattern
          ? [{ userId: owner.id, itemId: id, field: "pattern", text: e.pattern }]
          : []),
        ...(e.equipment
          ? [{ userId: owner.id, itemId: id, field: "equipment", text: e.equipment }]
          : []),
        { userId: owner.id, itemId: id, field: "unilateral", bool: e.unilateral },
      ]);
    return { id };
  });
}
