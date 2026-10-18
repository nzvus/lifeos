/**
 * core/plans/cycles.ts — the person's cycles (V-08 Modelli): each with its
 * steps in order, a step being a rest or what it trains (its routines), and
 * which one is in use. One cycle in use at a time: choosing one sets the
 * others aside (they are kept, not deleted).
 */
import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import type { Db } from "../db/db";
import { catalogItems, cycleStepItems, cycleSteps, templates } from "../db/schema";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export type Cycle = {
  id: string;
  name: string;
  active: boolean;
  startDay: IsoDate | null;
  notes: string | null;
  steps: { position: number; label: string; items: string[] }[];
};

export async function readCycles(db: Db, owner: Owner): Promise<Cycle[]> {
  const cycles = await db
    .select()
    .from(templates)
    .where(
      and(
        ownedBy(templates, owner),
        eq(templates.scope, "cycle"),
        isNull(templates.deletedAt),
      ),
    );
  if (cycles.length === 0) return [];
  const steps = await db
    .select()
    .from(cycleSteps)
    .where(
      and(
        ownedBy(cycleSteps, owner),
        inArray(
          cycleSteps.cycleId,
          cycles.map((c) => c.id),
        ),
      ),
    )
    .orderBy(asc(cycleSteps.position));
  const items =
    steps.length === 0
      ? []
      : await db
          .select({
            stepId: cycleStepItems.stepId,
            position: cycleStepItems.position,
            name: catalogItems.name,
          })
          .from(cycleStepItems)
          .innerJoin(
            catalogItems,
            and(
              eq(catalogItems.id, cycleStepItems.itemId),
              eq(catalogItems.userId, cycleStepItems.userId),
            ),
          )
          .where(
            and(
              ownedBy(cycleStepItems, owner),
              inArray(
                cycleStepItems.stepId,
                steps.map((s) => s.id),
              ),
            ),
          )
          .orderBy(asc(cycleStepItems.position));
  return cycles
    .map((c) => {
      const t = (c.targets ?? {}) as Record<string, unknown>;
      return {
        id: c.id,
        name: c.name,
        active: c.active,
        startDay: c.startDay,
        notes: typeof t["notes"] === "string" ? t["notes"] : null,
        steps: steps
          .filter((s) => s.cycleId === c.id)
          .map((s) => ({
            position: s.position,
            label: s.label,
            items: items.filter((i) => i.stepId === s.id).map((i) => i.name),
          })),
      };
    })
    .sort(
      (a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "it"),
    );
}

/** Puts this cycle in use from `today` and the others aside; false if it is not one of the owner's. */
export async function useCycle(
  db: Db,
  owner: Owner,
  id: string,
  today: IsoDate,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const done = await tx
      .update(templates)
      .set({ active: true, startDay: today })
      .where(
        and(
          ownedBy(templates, owner),
          eq(templates.id, id),
          eq(templates.scope, "cycle"),
          isNull(templates.deletedAt),
        ),
      )
      .returning({ id: templates.id });
    if (done.length === 0) return false;
    await tx
      .update(templates)
      .set({ active: false })
      .where(
        and(
          ownedBy(templates, owner),
          eq(templates.scope, "cycle"),
          ne(templates.id, id),
        ),
      );
    return true;
  });
}
