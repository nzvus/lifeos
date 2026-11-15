/** A ciclo of his in the catalog (MOD-36), archived ones too (a past day may be changed). */
const ownsCycle = (db: Db, owner: Owner, id: string) => ownsItem(db, owner, id, "cycle");

/**
 * core/plans/day-changes.ts — changing one day only (PL-32, PL-43; the day models' «Cambia la
 * giornata» went with them, PL-61):
 *   skip   a cycle's step skipped that day (`cycle_skip`, keyed by the
 *          cycle): E3 loses it or shifts it, by the cycle's rule.
 *   step   another step that day, or a rest (`cycle_override` `position`).
 *   time   one line of the step that day at another time (`cycle_override` `at`).
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
 * rest, undefined to give the day back to the cycle. The same row may hold the
 * day's time (`setCycleTime`): each is kept when the other changes.
 */
export async function setCycleOverride(
  db: Db,
  owner: Owner,
  day: IsoDate,
  cycleId: string,
  position: number | null | undefined,
): Promise<boolean> {
  if (!(await ownsCycle(db, owner, cycleId))) return false;
  await mergeOverride(db, owner, day, cycleId, (p) => {
    const { position: _old, ...rest } = p;
    return position === undefined ? rest : { ...rest, position };
  });
  return true;
}

/**
 * «Sposta questa volta» (PL-43, proposal §36): one line of the ciclo's step that day at `atMin`
 * (a minute of the logical day); a line «N min prima di» it moves with it, the step's other
 * lines stay. `line` is the line's blocco id, or "step" for a step that holds its scheda
 * directly. null gives the line back its own time. Stored in the day's `cycle_override` row as
 * `at: { [line]: minute }`.
 */
export async function setCycleTime(
  db: Db,
  owner: Owner,
  day: IsoDate,
  cycleId: string,
  line: string,
  atMin: number | null,
): Promise<boolean> {
  if (!(await ownsCycle(db, owner, cycleId))) return false;
  if (atMin !== null && !(Number.isInteger(atMin) && atMin >= 0 && atMin < 48 * 60))
    return false;
  await mergeOverride(db, owner, day, cycleId, (p) => {
    const { at: old, ...rest } = p;
    const at = { ...((old as Record<string, number> | undefined) ?? {}) };
    if (atMin === null) delete at[line];
    else at[line] = atMin;
    return Object.keys(at).length === 0 ? rest : { ...rest, at };
  });
  return true;
}

/** Read the day's override row, change its payload, write it back; an empty one is removed. */
async function mergeOverride(
  db: Db,
  owner: Owner,
  day: IsoDate,
  cycleId: string,
  change: (p: Record<string, unknown>) => Record<string, unknown>,
): Promise<void> {
  const where = and(
    ownedBy(decisions, owner),
    eq(decisions.kind, "cycle_override"),
    eq(decisions.day, day),
    eq(decisions.key, cycleId),
  );
  const [row] = await db
    .select({ payload: decisions.payload })
    .from(decisions)
    .where(where);
  const payload = change({ ...((row?.payload as Record<string, unknown> | null) ?? {}) });
  if (Object.keys(payload).length === 0) {
    await db.delete(decisions).where(where);
    return;
  }
  await db
    .insert(decisions)
    .values({ userId: owner.id, kind: "cycle_override", day, key: cycleId, payload })
    .onConflictDoUpdate({
      target: [decisions.userId, decisions.kind, decisions.day, decisions.key],
      set: { payload },
    });
}
