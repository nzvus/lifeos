/** A ciclo of his in the catalog (MOD-36), archived ones too (a past day may be changed). */
const ownsCycle = (db: Db, owner: Owner, id: string) => ownsItem(db, owner, id, "cycle");

/**
 * core/plans/day-changes.ts — changing one day only (PL-32, PL-43; the day models' «Cambia la
 * giornata» went with them, PL-61):
 *   skip   a cycle's step skipped that day (`cycle_skip`, keyed by the
 *          cycle): E3 loses it or shifts it, by the cycle's rule.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { decisions } from "../db/schema";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";
import { ownsItem } from "./items";

export async function setCycleSkip(
  db: Db,
  owner: Owner,
  day: IsoDate,
  cycleId: string,
  skipped: boolean,
): Promise<boolean> {
  if (!(await ownsCycle(db, owner, cycleId))) return false;
  if (!skipped) {
    await db
      .delete(decisions)
      .where(
        and(
          ownedBy(decisions, owner),
          eq(decisions.kind, "cycle_skip"),
          eq(decisions.day, day),
          eq(decisions.key, cycleId),
        ),
      );
    return true;
  }
  await db
    .insert(decisions)
    .values({ userId: owner.id, kind: "cycle_skip", day, key: cycleId })
    .onConflictDoNothing();
  return true;
}

/**
 * A cycle's step changed by hand on one day (`cycle_override`, the board
 * Plan's «Passo del ciclo» and «Riposo»): a step's position, null for a
 * rest; `undefined` takes the change away. E3 places the override first and
 * moves the rest of the cycle around it.
 */
export async function setCycleOverride(
  db: Db,
  owner: Owner,
  day: IsoDate,
  cycleId: string,
  position: number | null | undefined,
): Promise<boolean> {
  if (!(await ownsCycle(db, owner, cycleId))) return false;
  const where = and(
    ownedBy(decisions, owner),
    eq(decisions.kind, "cycle_override"),
    eq(decisions.day, day),
    eq(decisions.key, cycleId),
  );
  if (position === undefined) {
    await db.delete(decisions).where(where);
    return true;
  }
  const payload = { position };
  await db
    .insert(decisions)
    .values({ userId: owner.id, kind: "cycle_override", day, key: cycleId, payload })
    .onConflictDoUpdate({
      target: [decisions.userId, decisions.kind, decisions.day, decisions.key],
      set: { payload },
    });
  return true;
}
