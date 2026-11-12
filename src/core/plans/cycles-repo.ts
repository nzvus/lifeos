/**
 * core/plans/cycles-repo.ts — his cicli (MOD-31, MOD-36, ADR-0062): a catalog «cycle» (name;
 * archived = paused; `advance`, `onSkip`, `start` as values: made, renamed, archived through
 * `core/verbs` like any object) whose ordered steps live in `cycle_steps` / `cycle_step_items`.
 * A step holds blocchi «nel ciclo» (Q-18 (a): their objects are its keys for E3's `cyclePlan`, a
 * session of the scheda counts) — older steps still hold the scheda itself — or nothing (a rest). What each day holds stays derived (E3), never stored. Every query `ownedBy` the owner.
 * The old `templates` / `cycles_state` rows are read only by the export, old files' loading
 * and merge until they are dropped (Q-23 (a)).
 */
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogItems,
  catalogParts,
  catalogValues,
  cycleStepItems,
  cycleSteps,
} from "../db/schema";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { ownsItem, textValues } from "./items";

export type CycleStepRow = {
  id: string;
  position: number;
  label: string;
  /** The blocchi «nel ciclo» it holds (`inCycle`, Q-18 (a)), or an older step's scheda; empty for a rest. */
  items: { id: string; name: string; inCycle: boolean }[];
};

export type CycleRow = {
  id: string;
  name: string;
  start: IsoDate | null;
  active: boolean;
  advance: "occurrence" | "date";
  onSkip: "lose" | "shift";
  steps: CycleStepRow[];
};

export type CycleHead = {
  id: string;
  name: string;
  start: IsoDate | null;
  /** Archived = paused: out of the Piano from today (PL-70). */
  active: boolean;
  advance: "occurrence" | "date";
  onSkip: "lose" | "shift";
};

/**
 * His cicli as the catalog holds them (MOD-36, ADR-0062): name, archived = paused, `advance` /
 * `onSkip` / `start` from values (defaults as the engine's). `live` leaves the archived out.
 */
export async function readCycles(
  db: Db,
  owner: Owner,
  { live = false }: { live?: boolean } = {},
): Promise<CycleHead[]> {
  const rows = await db
    .select({
      id: catalogItems.id,
      name: catalogItems.name,
      archivedAt: catalogItems.archivedAt,
    })
    .from(catalogItems)
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "cycle"),
        isNull(catalogItems.deletedAt),
        ...(live ? [isNull(catalogItems.archivedAt)] : []),
      ),
    )
    .orderBy(asc(catalogItems.name));
  if (rows.length === 0) return [];
  const v = await textValues(
    db,
    owner,
    rows.map((r) => r.id),
    ["advance", "onSkip", "start"],
  );
  return rows.map((r) => {
    const start = v(r.id, "start");
    return {
      id: r.id,
      name: r.name,
      start: start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : null,
      active: r.archivedAt === null,
      advance: v(r.id, "advance") === "date" ? "date" : "occurrence",
      onSkip: v(r.id, "onSkip") === "shift" ? "shift" : "lose",
    };
  });
}

/**
 * Every cycle with its steps, and what a step may hold: his schede and his blocchi «nel ciclo»
 * (Q-18 (a)), live. Six queries.
 */
export async function readCycleBook(
  db: Db,
  owner: Owner,
): Promise<{
  cycles: CycleRow[];
  routines: { id: string; name: string }[];
  blocks: { id: string; name: string }[];
}> {
  const [cycles, routines, blocks] = await Promise.all([
    readCycles(db, owner),
    db
      .select({ id: catalogItems.id, name: catalogItems.name })
      .from(catalogItems)
      .where(
        and(
          ownedBy(catalogItems, owner),
          eq(catalogItems.catalog, "routine"),
          isNull(catalogItems.deletedAt),
          isNull(catalogItems.archivedAt),
        ),
      )
      .orderBy(asc(catalogItems.name)),
    inCycleRows(db, owner, { live: true }),
  ]);
  const ids = cycles.map((c) => c.id);
  const steps = ids.length
    ? await db
        .select({
          id: cycleSteps.id,
          cycleId: cycleSteps.cycleId,
          position: cycleSteps.position,
          label: cycleSteps.label,
        })
        .from(cycleSteps)
        .where(and(ownedBy(cycleSteps, owner), inArray(cycleSteps.cycleId, ids)))
    : [];
  const items = steps.length
    ? await db
        .select({
          stepId: cycleStepItems.stepId,
          position: cycleStepItems.position,
          itemId: cycleStepItems.itemId,
          name: catalogItems.name,
        })
        .from(cycleStepItems)
        .innerJoin(catalogItems, eq(catalogItems.id, cycleStepItems.itemId))
        .where(
          and(
            ownedBy(cycleStepItems, owner),
            inArray(
              cycleStepItems.stepId,
              steps.map((s) => s.id),
            ),
          ),
        )
    : [];
  const inCycle = await inCycleBlocks(
    db,
    owner,
    items.map((i) => i.itemId),
  );
  return {
    cycles: cycles.map((c) => ({
      id: c.id,
      name: c.name,
      start: c.start,
      active: c.active,
      advance: c.advance,
      onSkip: c.onSkip,
      steps: steps
        .filter((s) => s.cycleId === c.id)
        .sort((a, b) => a.position - b.position)
        .map((s) => ({
          id: s.id,
          position: s.position,
          label: s.label,
          items: items
            .filter((i) => i.stepId === s.id)
            .sort((a, b) => a.position - b.position)
            .map((i) => ({ id: i.itemId, name: i.name, inCycle: inCycle.has(i.itemId) })),
        })),
    })),
    routines,
    blocks,
  };
}

/** What a new rest step is called (v1's slot label; a kept one keeps its own, «Rest» too). */
export const REST_LABEL = "Riposo";

/** A step as the Composer posts it: one kept (its id), a scheda or a blocco «nel ciclo», or a rest. */
export type StepRef = { step: string } | { item: string } | { rest: true };

/** The value of a blocco planned only by its ciclo's step (PL-30, Q-18 (a)). */
export const IN_CYCLE = JSON.stringify({ type: "inCycle" });

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** His blocchi «nel ciclo» (Q-18 (a)) by name, deleted ones left out: among `ids`, or the live ones. */
function inCycleRows(
  db: Db | Tx,
  owner: Owner,
  by: { ids: readonly string[] } | { live: true },
) {
  return db
    .select({ id: catalogItems.id, name: catalogItems.name })
    .from(catalogItems)
    .innerJoin(
      catalogValues,
      and(
        eq(catalogValues.itemId, catalogItems.id),
        eq(catalogValues.userId, catalogItems.userId),
        eq(catalogValues.field, "recurrence"),
      ),
    )
    .where(
      and(
        ownedBy(catalogItems, owner),
        eq(catalogItems.catalog, "block"),
        isNull(catalogItems.deletedAt),
        eq(catalogValues.text, IN_CYCLE),
        "ids" in by
          ? inArray(catalogItems.id, [...by.ids])
          : isNull(catalogItems.archivedAt),
      ),
    )
    .orderBy(asc(catalogItems.name));
}

/** Which of these ids are his blocchi «nel ciclo» (Q-18 (a)), deleted ones left out. */
export async function inCycleBlocks(
  db: Db | Tx,
  owner: Owner,
  ids: readonly string[],
): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  return new Set((await inCycleRows(db, owner, { ids })).map((r) => r.id));
}

/**
 * The blocco «nel ciclo» that holds this scheda alone (Q-18 (a)): his live one, else a new one
 * named as the scheda, in Corpo, with no time of its own (PL-12 places it). A name his other
 * blocchi have takes « (ciclo)» (*decided by the agent*: blocchi names stay unique, PAT-24).
 */
async function inCycleBlockOf(
  tx: Tx,
  owner: Owner,
  routine: { id: string; name: string },
): Promise<string> {
  const live = await inCycleRows(tx, owner, { live: true });
  const parts = live.length
    ? await tx
        .select({ itemId: catalogParts.itemId, partItemId: catalogParts.partItemId })
        .from(catalogParts)
        .where(
          and(
            ownedBy(catalogParts, owner),
            inArray(
              catalogParts.itemId,
              live.map((b) => b.id),
            ),
          ),
        )
    : [];
  const alone = live.find((b) => {
    const held = parts.filter((x) => x.itemId === b.id);
    return held.length === 1 && held[0]!.partItemId === routine.id;
  });
  if (alone) return alone.id;
  const names = new Set(
    (
      await tx
        .select({ name: catalogItems.name })
        .from(catalogItems)
        .where(
          and(
            ownedBy(catalogItems, owner),
            eq(catalogItems.catalog, "block"),
            isNull(catalogItems.deletedAt),
          ),
        )
    ).map((r) => r.name.toLowerCase()),
  );
  let name = routine.name;
  for (let k = 1; names.has(name.toLowerCase()); k++)
    name = routine.name + (k === 1 ? " (ciclo)" : ` (ciclo ${k})`);
  const [row] = await tx
    .insert(catalogItems)
    .values({ userId: owner.id, catalog: "block", name })
    .returning({ id: catalogItems.id });
  await tx.insert(catalogValues).values([
    { userId: owner.id, itemId: row!.id, field: "area", text: "Corpo" },
    { userId: owner.id, itemId: row!.id, field: "recurrence", text: IN_CYCLE },
  ]);
  await tx
    .insert(catalogParts)
    .values({ userId: owner.id, itemId: row!.id, position: 0, partItemId: routine.id });
  return row!.id;
}

/**
 * A ciclo's steps, in this order (PAT-62 with «+ Riposo», Q-16 (a)): kept steps keep their id,
 * label and items, new ones hold a blocco «nel ciclo» of his — a scheda picked becomes one
 * (Q-18 (a)) — or nothing (a rest, «Riposo»), the others go.
 * Positions are numbered from 0 again; days changed by hand (`cycle_override`) keep their
 * number. «gone»: not his ciclo; «invalid»: a step or a scheda that is not his.
 */
export async function setCycleSteps(
  db: Db,
  owner: Owner,
  cycleId: string,
  order: readonly StepRef[],
): Promise<"ok" | "gone" | "invalid"> {
  return db.transaction(async (tx) => {
    if (!(await ownsItem(tx, owner, cycleId, "cycle"))) return "gone";
    const have = await tx
      .select({ id: cycleSteps.id })
      .from(cycleSteps)
      .where(and(ownedBy(cycleSteps, owner), eq(cycleSteps.cycleId, cycleId)));
    const haveIds = new Set(have.map((x) => x.id));
    const kept = order.flatMap((o) => ("step" in o ? [o.step] : []));
    if (kept.some((id) => !haveIds.has(id)) || new Set(kept).size !== kept.length)
      return "invalid";
    const items = [...new Set(order.flatMap((o) => ("item" in o ? [o.item] : [])))];
    // What each posted item is held as: a blocco «nel ciclo» as it is, a scheda by its blocco.
    const asBlock = new Map<string, string>();
    if (items.length) {
      const blocks = await inCycleBlocks(tx, owner, items);
      const schede = await tx
        .select({ id: catalogItems.id, name: catalogItems.name })
        .from(catalogItems)
        .where(
          and(
            ownedBy(catalogItems, owner),
            inArray(catalogItems.id, items),
            eq(catalogItems.catalog, "routine"),
            isNull(catalogItems.deletedAt),
          ),
        );
      if (blocks.size + schede.length !== items.length) return "invalid";
      for (const id of blocks) asBlock.set(id, id);
      for (const r of schede) asBlock.set(r.id, await inCycleBlockOf(tx, owner, r));
    }
    const gone = have.filter((x) => !kept.includes(x.id)).map((x) => x.id);
    if (gone.length)
      await tx
        .delete(cycleSteps)
        .where(and(ownedBy(cycleSteps, owner), inArray(cycleSteps.id, gone)));
    // Out of the way first: (cycle, position) is unique.
    if (kept.length)
      await tx
        .update(cycleSteps)
        .set({ position: sql`${cycleSteps.position} + 100000` })
        .where(and(ownedBy(cycleSteps, owner), inArray(cycleSteps.id, kept)));
    for (const [position, o] of order.entries()) {
      if ("step" in o) {
        await tx
          .update(cycleSteps)
          .set({ position })
          .where(and(ownedBy(cycleSteps, owner), eq(cycleSteps.id, o.step)));
        continue;
      }
      const [st] = await tx
        .insert(cycleSteps)
        .values({
          userId: owner.id,
          cycleId,
          position,
          label: "rest" in o ? REST_LABEL : "",
        })
        .returning({ id: cycleSteps.id });
      if ("item" in o)
        await tx.insert(cycleStepItems).values({
          userId: owner.id,
          stepId: st!.id,
          position: 0,
          itemId: asBlock.get(o.item)!,
        });
    }
    return "ok";
  });
}
