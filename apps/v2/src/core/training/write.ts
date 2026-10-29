/**
 * core/training/write.ts — gym mode's writes (V-05). A session in progress
 * is a `session` entry with its start and no end, status planned; its
 * exercises are `session_exercise` children in order; each set is saved the
 * moment it is ticked (a gym has a phone, not always a signal: nothing waits
 * for the end). Finishing marks the session done, with the end and the
 * minutes; an exercise with sets is done, one without is skipped. A finished
 * session can be reopened: it is in progress again. Every write is ownedBy the owner and checks the
 * entry it touches is the right kind, live and theirs.
 * Auto mode saves its sets as assumed (`done` false: what was planned, not
 * yet said to be done); «Fine» confirms them. History reads only done sets.
 */
import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";
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
  /** The load typed is one dumbbell's: the stored load is twice it (03 T-10). */
  perDumbbell?: boolean;
};
export type CheckedSet = {
  reps: number | null;
  /** Always the total. */
  loadKg: string | null;
  loadEntry: "total" | "per_dumbbell";
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
      loadKg: kg === "" ? null : s.perDumbbell ? String(Number(kg) * 2) : kg,
      loadEntry: s.perDumbbell && kg !== "" ? "per_dumbbell" : "total",
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
      status: entries.status,
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
  opts: { startedAt?: Date | null; assumed?: boolean } = {},
): Promise<boolean> {
  const x = await liveEntry(db, owner, exerciseEntryId, "session_exercise");
  if (!x || position < 0 || position > 99) return false;
  // A start is kept only when it is before the end and within two hours of it.
  const startedAt =
    opts.startedAt &&
    opts.startedAt < at &&
    at.getTime() - opts.startedAt.getTime() < 2 * 3600_000
      ? opts.startedAt
      : null;
  const row = {
    reps: set.reps,
    loadKg: set.loadKg,
    loadEntry: set.loadEntry,
    rir: set.rir,
    durationS: set.durationS,
    warmup: set.warmup,
    startedAt,
    endedAt: at,
    done: opts.assumed !== true,
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

/** Confirms a session's assumed sets (auto mode's): they become done. Returns how many. */
export async function confirmSets(
  db: Db,
  owner: Owner,
  sessionId: string,
): Promise<number> {
  const s = await liveEntry(db, owner, sessionId, "session");
  if (!s) return 0;
  const children = await db
    .select({ id: entries.id })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.parentId, sessionId),
        isNull(entries.deletedAt),
      ),
    );
  if (children.length === 0) return 0;
  const done = await db
    .update(trainingSets)
    .set({ done: true })
    .where(
      and(
        ownedBy(trainingSets, owner),
        inArray(
          trainingSets.entryId,
          children.map((c) => c.id),
        ),
        eq(trainingSets.done, false),
      ),
    )
    .returning({ id: trainingSets.id });
  return done.length;
}

/** How ready the person feels at the start (1–5), on the session; null clears it. */
export async function setReadiness(
  db: Db,
  owner: Owner,
  sessionId: string,
  value: number | null,
): Promise<boolean> {
  const s = await liveEntry(db, owner, sessionId, "session");
  if (!s) return false;
  if (value === null) {
    await db
      .delete(entryValues)
      .where(
        and(
          ownedBy(entryValues, owner),
          eq(entryValues.entryId, sessionId),
          eq(entryValues.field, "readiness"),
        ),
      );
    return true;
  }
  if (!Number.isInteger(value) || value < 1 || value > 5) return false;
  await db.transaction((tx) =>
    setValue(tx, owner, sessionId, "readiness", String(value)),
  );
  return true;
}

/** An exercise's own rest and setup delay in seconds (null: learnt / the default). */
export async function saveExerciseSettings(
  db: Db,
  owner: Owner,
  exerciseId: string,
  settings: { restS: number | null; setupS: number | null },
): Promise<boolean> {
  const [item] = await db
    .select({ id: catalogItems.id })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.id, exerciseId),
        eq(catalogItems.catalog, "exercise"),
        isNull(catalogItems.deletedAt),
      ),
    );
  if (!item) return false;
  for (const [, v, max] of [
    ["restS", settings.restS, 600],
    ["setupS", settings.setupS, 60],
  ] as const) {
    if (v !== null && (!Number.isInteger(v) || v < 0 || v > max)) return false;
  }
  await db.transaction(async (tx) => {
    for (const [field, v] of [
      ["restS", settings.restS],
      ["setupS", settings.setupS],
    ] as const) {
      if (v === null)
        await tx
          .delete(catalogValues)
          .where(
            and(
              ownedBy(catalogValues, owner),
              eq(catalogValues.itemId, exerciseId),
              eq(catalogValues.field, field),
            ),
          );
      else
        await tx
          .insert(catalogValues)
          .values({ userId: owner.id, itemId: exerciseId, field, num: String(v) })
          .onConflictDoUpdate({
            target: [catalogValues.itemId, catalogValues.field],
            set: { num: String(v), source: "typed", confidence: "1" },
          });
    }
  });
  return true;
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
    // An exercise with no set was not done: skipped, so «last time» never points at it.
    const hasSets = sql`exists (select 1 from ${trainingSets} where ${trainingSets.entryId} = ${entries.id})`;
    await tx
      .update(entries)
      .set({ status: sql`case when ${hasSets} then 'done' else 'skipped' end` })
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

/** «Riprendi»: a finished session is in progress again — no end, no minutes, its exercises open. */
export async function reopenSession(
  db: Db,
  owner: Owner,
  sessionId: string,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const s = await liveEntry(tx, owner, sessionId, "session");
    if (!s || s.status !== "done") return false;
    await tx
      .update(entries)
      .set({ status: "planned", endAt: null })
      .where(and(ownedBy(entries, owner), eq(entries.id, sessionId)));
    await tx
      .update(entries)
      .set({ status: "planned" })
      .where(
        and(
          ownedBy(entries, owner),
          eq(entries.parentId, sessionId),
          isNull(entries.deletedAt),
        ),
      );
    await tx
      .delete(entryValues)
      .where(
        and(
          ownedBy(entryValues, owner),
          eq(entryValues.entryId, sessionId),
          eq(entryValues.field, "durationMin"),
        ),
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
