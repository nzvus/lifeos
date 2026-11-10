/**
 * core/plans/cycles-repo.ts — his cicli (MOD-31, MOD-36, ADR-0062): a catalog «cycle» (name;
 * archived = paused; `advance`, `onSkip`, `start` as values: made, renamed, archived through
 * `core/verbs` like any object) whose ordered steps live in `cycle_steps` / `cycle_step_items`.
 * A step holds a scheda (its key for E3's `cyclePlan`: a session of it counts) or nothing (a
 * rest). What each day holds stays derived (E3), never stored. Every query `ownedBy` the owner.
 * The old `templates` / `cycles_state` rows stay read-only (PL-72).
 */
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, cycleStepItems, cycleSteps } from "../db/schema";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { ownsItem, textValues } from "./items";

export type CycleStepRow = {
  id: string;
  position: number;
  label: string;
  /** The routines (and exercises) it holds; empty for a rest. */
  items: { id: string; name: string }[];
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

/** Every cycle with its steps, and the routines a step may hold: four queries. */
export async function readCycleBook(
  db: Db,
  owner: Owner,
): Promise<{ cycles: CycleRow[]; routines: { id: string; name: string }[] }> {
  const [cycles, routines] = await Promise.all([
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
            .map((i) => ({ id: i.itemId, name: i.name })),
        })),
    })),
    routines,
  };
}

/** What a new rest step is called (v1's slot label; a kept one keeps its own, «Rest» too). */
export const REST_LABEL = "Riposo";

/** A step as the Composer posts it: one kept (its id), a scheda's session, or a rest. */
export type StepRef = { step: string } | { item: string } | { rest: true };

/**
 * A ciclo's steps, in this order (PAT-62 with «+ Riposo», Q-16 (a)): kept steps keep their id,
 * label and items, new ones hold a scheda of his or nothing (a rest, «Riposo»), the others go.
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
    if (items.length) {
      const mine = await tx
        .select({ id: catalogItems.id })
        .from(catalogItems)
        .where(
          and(
            ownedBy(catalogItems, owner),
            inArray(catalogItems.id, items),
            eq(catalogItems.catalog, "routine"),
            isNull(catalogItems.deletedAt),
          ),
        );
      if (mine.length !== items.length) return "invalid";
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
        await tx
          .insert(cycleStepItems)
          .values({ userId: owner.id, stepId: st!.id, position: 0, itemId: o.item });
    }
    return "ok";
  });
}
