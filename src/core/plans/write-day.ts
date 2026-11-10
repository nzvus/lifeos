/**
 * core/plans/write-day.ts — the Piano written into today (PL-40, MOD-33; Q-17 (a), change
 * 2026-11-07-piano): on the first read of a day as today, each blocco that falls on it and the
 * day does not cover yet becomes a previsto voce carrying its `block_id` (source «template»):
 * a pasto as a meal with the pasto's foods and the blocco's servings, a scheda as a planned
 * session, a type as a voce of that type with its defaults (an activity's category), at the
 * time `dayBlocks` gives it. Never twice: a blocco with a voce on the day — even trashed («Togli»)
 * — is not written again (the unique index on day + blocco holds it too). What cannot be written
 * (a tragitto, a saved estimate, a type whose required fields have no default, a ciclo's step
 * until its blocchi exist, Q-18) stays a computed row. Days to come and past days are never
 * written (PL-41, DT-03).
 */
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import { entries, entryValues } from "../db/schema";
import { readUserKinds } from "../day";
import { dayMinute } from "../day/timeline";
import type { DayClock, IsoDate } from "../engines/time";
import { checkEntry, createEntry, type CheckedEntry } from "../entries";
import { readFoodChoices, readRecipeChoices } from "../food/catalog";
import { checkMealLines } from "../food/meal";
import { ownedBy, type Owner } from "../identity/owner";
import { kindRegistry, type Kind } from "../kinds";
import { typeOfItem } from "../kinds/catalog";
import { dayBlocks, readPlanInput, type PlanVoce, type PlannedBlock } from "./day-blocks";

const UNIQUE_VIOLATION = "23505";

/** The day's live top-level voci as the Piano reads them (written ones with their blocco). */
async function readDayVoci(
  db: Db,
  owner: Owner,
  day: IsoDate,
  clock: DayClock,
): Promise<PlanVoce[]> {
  const rows = await db
    .select({
      id: entries.id,
      kind: entries.kind,
      itemId: entries.itemId,
      startAt: entries.startAt,
      status: entries.status,
      blockId: entries.blockId,
    })
    .from(entries)
    .where(
      and(
        ownedBy(entries, owner),
        eq(entries.day, day),
        isNull(entries.parentId),
        isNull(entries.deletedAt),
      ),
    );
  return rows.map((r) => ({
    id: r.id,
    day,
    kind: r.kind,
    itemId: r.itemId,
    category: null,
    minute: r.startAt ? dayMinute(r.startAt, day, clock) : null,
    status: r.status,
    blockId: r.blockId,
  }));
}

/** The previsti written today (how many); 0 when nothing was due or all is covered. */
export async function writeDayPlan(
  db: Db,
  owner: Owner,
  day: IsoDate,
  clock: DayClock,
): Promise<number> {
  const [voci, input] = await Promise.all([
    readDayVoci(db, owner, day, clock),
    readPlanInput(db, owner, day, clock),
  ]);
  // An activity voce of today with its category covers a blocco of that category: read them.
  const withCategory = await categories(db, owner, voci);
  const planned = dayBlocks({
    day,
    blocks: input.blocks,
    kindOf: (id) => input.items.get(id)?.kind ?? null,
    live: new Set([...input.items].flatMap(([id, it]) => (it.live ? [id] : []))),
    voci: withCategory,
    written: input.written,
    history: input.history,
  }).filter((p) => p.block !== null);
  if (planned.length === 0) return 0;
  const registry = kindRegistry(await readUserKinds(db, owner));
  // How an object's voce is made, from its catalog type (MOD-14 `savedFrom`): a pasto's with
  // its lines, a scheda's as a plain session; another object (a tragitto) is not written.
  const madeOf = (itemId: string) => {
    const it = input.items.get(itemId);
    return it ? (typeOfItem(it.catalog)?.savedFrom?.parts ?? null) : null;
  };
  const needsFood = planned.some((p) => p.itemId && madeOf(p.itemId) === "lines");
  const choices = needsFood ? await readFoodChoices(db, owner, day) : [];
  const recipes = needsFood ? await readRecipeChoices(db, owner, day, choices) : [];
  const byKey = new Map(choices.map((c) => [c.key, c]));
  let n = 0;
  for (const p of planned) {
    const e = voceOf(p, registry.get(p.kind), clock, day, madeOf, (id) => {
      const r = recipes.find((x) => x.recipeId === id);
      if (!r || r.estimate || r.parts.length === 0) return null;
      const c = checkMealLines(r.parts, byKey);
      return c.ok ? c.lines : null;
    });
    if (!e) continue;
    try {
      await createEntry(db, owner, { ...e, blockId: p.block!.id });
      n++;
    } catch (err) {
      // Another tab wrote it first: never twice (PL-40).
      if ((err as { code?: string }).code !== UNIQUE_VIOLATION) throw err;
    }
  }
  return n;
}

/** What one planned blocco is written as, or null when it cannot be a voce by itself. */
function voceOf(
  p: PlannedBlock,
  kind: Kind,
  clock: DayClock,
  day: IsoDate,
  madeOf: (itemId: string) => "lines" | "children" | null,
  linesOf: (recipeId: string) => CheckedEntry["lines"] | null,
): CheckedEntry | null {
  const b = p.block!;
  const made = p.itemId ? madeOf(p.itemId) : null;
  // A blocco of an object makes a voce of that object's kind; one with no such voce (a
  // tragitto) is not written by itself.
  if (p.itemId && made === null) return null;
  const lines = p.itemId && made === "lines" ? linesOf(p.itemId) : undefined;
  if (lines === null) return null;
  const quantity = b.items.find((i) => i.itemId === p.itemId)?.quantity ?? null;
  const values: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(b.defaults).filter(
        (x): x is [string, string] => typeof x[1] === "string",
      ),
    ),
    ...(lines && quantity ? { servings: String(Number(quantity)) } : {}),
  };
  const checked = checkEntry(
    kind,
    {
      day,
      status: "planned",
      startMin: p.minute,
      endMin: p.minute !== null && b.durationMin ? p.minute + b.durationMin : null,
      values,
      note: "",
    },
    clock,
  );
  if (!checked.ok) return null;
  return {
    ...checked.entry,
    ...(lines ? { lines } : {}),
    ...(p.itemId ? { itemId: p.itemId } : {}),
  };
}

/** The voci's activity categories (one narrow read), for a type blocco with a category. */
async function categories(
  db: Db,
  owner: Owner,
  voci: readonly PlanVoce[],
): Promise<PlanVoce[]> {
  if (voci.length === 0) return [];
  const rows = await db
    .select({ entryId: entryValues.entryId, text: entryValues.text })
    .from(entryValues)
    .where(
      and(
        ownedBy(entryValues, owner),
        eq(entryValues.field, "category"),
        isNotNull(entryValues.text),
        inArray(
          entryValues.entryId,
          voci.map((v) => v.id),
        ),
      ),
    );
  const of = new Map(rows.map((r) => [r.entryId, r.text]));
  return voci.map((v) => ({ ...v, category: of.get(v.id) ?? null }));
}
