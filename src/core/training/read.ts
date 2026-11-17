/**
 * core/training/read.ts — what gym mode reads (V-05): the person's routines
 * with their exercises in order (catalog `routine` and its parts), how often
 * each was trained in the last 90 days; their exercises; and, per exercise,
 * the sets of its last two sessions done before a given one, for E6's
 * progression. All owned by the owner.
 */
import { and, desc, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogItems,
  catalogParts,
  catalogValues,
  entries,
  trainingSets,
} from "../db/schema";
import {
  equipmentOf,
  sidesOf,
  type Equipment,
  type LastSet,
  type Sides,
} from "../engines/training";
import { addDays, type IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { ALIASES } from "../catalog/merge";

export type ExerciseChoice = {
  id: string;
  name: string;
  pattern: string | null;
  /** Its equipment as a key (older Italian words read as their key, target.md §7.4). */
  equipment: Equipment | null;
  /** How its sides work; `unilateral` = one side at a time (TR-13), kept for its readers. */
  sides: Sides;
  unilateral: boolean;
  /** His own load step in kg, when set (TR-02); else `stepFor` uses the equipment. */
  loadStepKg: number | null;
  /** False: no warm-up sets proposed (TR-03). */
  warmup: boolean;
  /** Its own rest and setup delay in seconds, when set. */
  restS: number | null;
  setupS: number | null;
  /** The muscle groups it trains, the main one first (catalog `muscleGroups`). */
  muscles: string[];
  /** The catalog's kind: strength, bodyweight, cardio (null when not set). */
  kind: string | null;
  /** The names of exercises merged into it («Unisci»): the searches find it by them. */
  aliases: string[];
};

export type RoutineChoice = {
  id: string;
  name: string;
  uses: number;
  exercises: { exerciseId: string; name: string }[];
};

const USE_DAYS = 90;
const numOf = (n: string | null | undefined) =>
  n === null || n === undefined ? null : Number(n);

/** The owner's live exercises with what gym mode needs of them, by name. */
export async function readExercises(db: Db, owner: Owner): Promise<ExerciseChoice[]> {
  const items = await db
    .select({ id: catalogItems.id, name: catalogItems.name })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "exercise"),
        isNull(catalogItems.deletedAt),
        isNull(catalogItems.archivedAt),
      ),
    );
  if (items.length === 0) return [];
  const values = await db
    .select({
      itemId: catalogValues.itemId,
      field: catalogValues.field,
      text: catalogValues.text,
      bool: catalogValues.bool,
      num: catalogValues.num,
    })
    .from(catalogValues)
    .where(
      and(
        ownedBy(catalogValues, owner),
        inArray(
          catalogValues.itemId,
          items.map((i) => i.id),
        ),
        inArray(catalogValues.field, [
          "pattern",
          "equipment",
          "unilateral",
          "sides",
          "loadStepKg",
          "warmup",
          "restS",
          "setupS",
          "muscleGroups",
          "kind",
          ALIASES,
        ]),
      ),
    );
  const v = (id: string, f: string) =>
    values.find((x) => x.itemId === id && x.field === f);
  return items
    .map((i) => ({
      id: i.id,
      name: i.name,
      pattern: v(i.id, "pattern")?.text ?? null,
      equipment: equipmentOf(v(i.id, "equipment")?.text),
      ...((sides) => ({ sides, unilateral: sides === "one_at_a_time" }))(
        sidesOf(v(i.id, "sides")?.text, v(i.id, "unilateral")?.bool === true),
      ),
      loadStepKg: numOf(v(i.id, "loadStepKg")?.num),
      warmup: v(i.id, "warmup")?.bool !== false,
      restS: numOf(v(i.id, "restS")?.num),
      setupS: numOf(v(i.id, "setupS")?.num),
      muscles: (v(i.id, "muscleGroups")?.text ?? "")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      kind: v(i.id, "kind")?.text ?? null,
      // The names of exercises merged into it («Unisci»): the search finds it by them too.
      aliases: (v(i.id, ALIASES)?.text ?? "").split("\n").filter(Boolean),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "it"));
}

/** The owner's live routines, most trained first, each with its exercises in order. */
export async function readRoutines(
  db: Db,
  owner: Owner,
  today: IsoDate,
  exercises: readonly ExerciseChoice[],
): Promise<RoutineChoice[]> {
  const routines = await db
    .select({ id: catalogItems.id, name: catalogItems.name })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "routine"),
        isNull(catalogItems.deletedAt),
        isNull(catalogItems.archivedAt),
      ),
    );
  if (routines.length === 0) return [];
  const ids = routines.map((r) => r.id);
  const [parts, uses] = await Promise.all([
    db
      .select({
        itemId: catalogParts.itemId,
        position: catalogParts.position,
        partItemId: catalogParts.partItemId,
      })
      .from(catalogParts)
      .where(and(ownedBy(catalogParts, owner), inArray(catalogParts.itemId, ids))),
    db
      .select({ itemId: entries.itemId, n: sql<number>`count(*)::int` })
      .from(entries)
      .where(
        and(
          ownedBy(entries, owner),
          eq(entries.kind, "session"),
          eq(entries.status, "done"),
          isNull(entries.deletedAt),
          inArray(entries.itemId, ids),
          gte(entries.day, addDays(today, -USE_DAYS)),
        ),
      )
      .groupBy(entries.itemId),
  ]);
  const name = new Map(exercises.map((e) => [e.id, e.name]));
  const used = new Map(uses.flatMap((u) => (u.itemId ? [[u.itemId, u.n] as const] : [])));
  return routines
    .map((r) => ({
      id: r.id,
      name: r.name,
      uses: used.get(r.id) ?? 0,
      exercises: parts
        .filter((p) => p.itemId === r.id && name.has(p.partItemId))
        .sort((a, b) => a.position - b.position)
        .map((p) => ({ exerciseId: p.partItemId, name: name.get(p.partItemId)! })),
    }))
    .filter((r) => r.exercises.length > 0)
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name, "it"));
}

export type History = { last: LastSet[]; before: LastSet[]; lastDay: IsoDate };

/**
 * Per exercise, the sets of its last two done sessions, leaving out the
 * session being trained: the progression's input.
 */
export async function readHistory(
  db: Db,
  owner: Owner,
  exerciseIds: readonly string[],
  except: string,
): Promise<Map<string, History>> {
  const out = new Map<string, History>();
  if (exerciseIds.length === 0) return out;
  const done = await db
    .select({ id: entries.id, itemId: entries.itemId, day: entries.day })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.kind, "session_exercise"),
        eq(entries.status, "done"),
        isNull(entries.deletedAt),
        inArray(entries.itemId, [...new Set(exerciseIds)]),
        ne(entries.parentId, except),
      ),
    )
    .orderBy(desc(entries.day), desc(entries.createdAt));
  const pick = new Map<string, { id: string; day: IsoDate }[]>();
  for (const d of done) {
    if (!d.itemId) continue;
    const got = pick.get(d.itemId) ?? [];
    if (got.length < 2) pick.set(d.itemId, [...got, { id: d.id, day: d.day }]);
  }
  const ids = [...pick.values()].flat().map((x) => x.id);
  if (ids.length === 0) return out;
  const sets = await db
    .select()
    .from(trainingSets)
    .where(
      and(
        ownedBy(trainingSets, owner),
        inArray(trainingSets.entryId, ids),
        eq(trainingSets.done, true),
      ),
    )
    .orderBy(trainingSets.position);
  const of = (entryId: string): LastSet[] =>
    sets
      .filter((s) => s.entryId === entryId)
      .map((s) => ({
        reps: s.reps,
        loadKg: s.loadKg,
        durationS: s.durationS,
        warmup: s.warmup,
        rir: s.rir,
      }));
  for (const [exercise, [last, before]] of pick)
    out.set(exercise, {
      last: of(last!.id),
      before: before ? of(before.id) : [],
      lastDay: last!.day,
    });
  return out;
}
