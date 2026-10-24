/**
 * core/plans/cycles-repo.ts — reading and writing cycles for Piano's
 * «Ciclo» editor (dossiers/day-templates.md slice c; the board
 * CycleEditor). A cycle is a template of scope `cycle` with its rules in
 * `cycles_state` and its ordered steps; a step holds a routine (its key for
 * E3's `cyclePlan`: a session of that routine counts for it) or nothing (a
 * rest). What each day holds stays derived (E3), never stored. Every query
 * `ownedBy` the owner.
 */
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "../db/db";
import {
  catalogItems,
  cycleStepItems,
  cycleSteps,
  cyclesState,
  templates,
} from "../db/schema";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

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

/** Every cycle with its steps, and the routines a step may hold: four queries. */
export async function readCycleBook(
  db: Db,
  owner: Owner,
): Promise<{ cycles: CycleRow[]; routines: { id: string; name: string }[] }> {
  const [cycles, routines] = await Promise.all([
    db
      .select({
        id: templates.id,
        name: templates.name,
        start: templates.startDay,
        active: templates.active,
        advance: cyclesState.advance,
        onSkip: cyclesState.onSkip,
      })
      .from(templates)
      .leftJoin(cyclesState, eq(cyclesState.cycleId, templates.id))
      .where(
        and(
          ownedBy(templates, owner),
          eq(templates.scope, "cycle"),
          isNull(templates.deletedAt),
        ),
      )
      .orderBy(asc(templates.name)),
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
      advance: c.advance ?? "occurrence",
      onSkip: c.onSkip ?? "lose",
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

const ownedCycle = (owner: Owner, id: string) =>
  and(ownedBy(templates, owner), eq(templates.id, id), eq(templates.scope, "cycle"));

/** A new cycle, starting `start`, by occurrence, a skipped step lost (v1's programs); its id. */
export async function createCycle(
  db: Db,
  owner: Owner,
  name: string,
  start: IsoDate,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [c] = await tx
      .insert(templates)
      .values({ userId: owner.id, scope: "cycle", name, startDay: start })
      .returning({ id: templates.id });
    await tx.insert(cyclesState).values({ userId: owner.id, cycleId: c!.id });
    return c!.id;
  });
}

/** Its name, start, rules and whether it plans. False for an unknown cycle. */
export async function saveCycle(
  db: Db,
  owner: Owner,
  id: string,
  c: {
    name: string;
    start: IsoDate;
    active: boolean;
    advance: "occurrence" | "date";
    onSkip: "lose" | "shift";
  },
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .update(templates)
      .set({ name: c.name, startDay: c.start, active: c.active })
      .where(ownedCycle(owner, id))
      .returning({ id: templates.id });
    if (rows.length === 0) return false;
    await tx
      .insert(cyclesState)
      .values({ userId: owner.id, cycleId: id, advance: c.advance, onSkip: c.onSkip })
      .onConflictDoUpdate({
        target: cyclesState.cycleId,
        set: { advance: c.advance, onSkip: c.onSkip },
      });
    return true;
  });
}

async function stepsOf(tx: Pick<Db, "select">, owner: Owner, cycleId: string) {
  return tx
    .select({ id: cycleSteps.id, position: cycleSteps.position })
    .from(cycleSteps)
    .where(and(ownedBy(cycleSteps, owner), eq(cycleSteps.cycleId, cycleId)))
    .orderBy(asc(cycleSteps.position));
}

/** A step at the end: a routine's session, or a rest (null). False when the cycle or routine is not the owner's. */
export async function addStep(
  db: Db,
  owner: Owner,
  cycleId: string,
  routineId: string | null,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [c] = await tx
      .select({ id: templates.id })
      .from(templates)
      .where(ownedCycle(owner, cycleId));
    if (!c) return false;
    let label = "Riposo";
    if (routineId !== null) {
      const [r] = await tx
        .select({ name: catalogItems.name })
        .from(catalogItems)
        .where(
          and(
            ownedBy(catalogItems, owner),
            eq(catalogItems.id, routineId),
            eq(catalogItems.catalog, "routine"),
          ),
        );
      if (!r) return false;
      label = "";
    }
    const steps = await stepsOf(tx, owner, cycleId);
    const [s] = await tx
      .insert(cycleSteps)
      .values({
        userId: owner.id,
        cycleId,
        position: steps.reduce((a, x) => Math.max(a, x.position + 1), 0),
        label,
      })
      .returning({ id: cycleSteps.id });
    if (routineId !== null)
      await tx
        .insert(cycleStepItems)
        .values({ userId: owner.id, stepId: s!.id, position: 0, itemId: routineId });
    return true;
  });
}

/**
 * A step one place earlier (-1) or later (+1), or out (0): the others keep
 * their order, numbered from 0 again. Days already changed by hand to a
 * position (`cycle_override`) keep the number, so the step there may differ.
 */
export async function moveStep(
  db: Db,
  owner: Owner,
  cycleId: string,
  stepId: string,
  by: -1 | 0 | 1,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [c] = await tx
      .select({ id: templates.id })
      .from(templates)
      .where(ownedCycle(owner, cycleId));
    if (!c) return false;
    const steps = await stepsOf(tx, owner, cycleId);
    const at = steps.findIndex((s) => s.id === stepId);
    if (at < 0) return false;
    const order = steps.map((s) => s.id);
    if (by === 0) {
      order.splice(at, 1);
      await tx
        .delete(cycleSteps)
        .where(and(ownedBy(cycleSteps, owner), eq(cycleSteps.id, stepId)));
    } else {
      const to = at + by;
      if (to < 0 || to >= order.length) return true;
      [order[at], order[to]] = [order[to]!, order[at]!];
    }
    // Positions are unique per cycle: first out of the way, then in their new order.
    const at0 = steps.reduce((a, x) => Math.max(a, x.position + 1), 0) + order.length;
    for (const pass of [at0, 0])
      for (const [i, id] of order.entries())
        await tx
          .update(cycleSteps)
          .set({ position: pass + i })
          .where(and(ownedBy(cycleSteps, owner), eq(cycleSteps.id, id)));
    return true;
  });
}
