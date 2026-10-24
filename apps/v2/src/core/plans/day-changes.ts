/**
 * core/plans/day-changes.ts — changing one day only (dossiers/
 * day-templates.md §5 «Cambia la giornata», slice c):
 *   model  the day takes another day model: a `day_targets` decision naming
 *          it without numbers (the model's targets then apply, core/day);
 *          null goes back to the week's model. A v1 fixed copy with
 *          numbers is replaced: its numbers belonged to the old choice.
 *   skip   a cycle's step skipped that day (`cycle_skip`, keyed by the
 *          cycle): E3 loses it or shifts it, by the cycle's rule.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { decisions, templates } from "../db/schema";
import type { IsoDate } from "../engines/time";
import { ownedBy, type Owner } from "../identity/owner";

export async function setDayModel(
  db: Db,
  owner: Owner,
  day: IsoDate,
  modelId: string | null,
): Promise<boolean> {
  const where = and(
    ownedBy(decisions, owner),
    eq(decisions.kind, "day_targets"),
    eq(decisions.day, day),
    eq(decisions.key, ""),
  );
  if (modelId === null) {
    await db.delete(decisions).where(where);
    return true;
  }
  const [m] = await db
    .select({ name: templates.name })
    .from(templates)
    .where(
      and(
        ownedBy(templates, owner),
        eq(templates.id, modelId),
        eq(templates.scope, "day"),
      ),
    );
  if (!m) return false;
  const payload = { profileId: modelId, profileName: m.name };
  await db
    .insert(decisions)
    .values({ userId: owner.id, kind: "day_targets", day, key: "", payload })
    .onConflictDoUpdate({
      target: [decisions.userId, decisions.kind, decisions.day, decisions.key],
      set: { payload },
    });
  return true;
}

export async function setCycleSkip(
  db: Db,
  owner: Owner,
  day: IsoDate,
  cycleId: string,
  skipped: boolean,
): Promise<boolean> {
  const [c] = await db
    .select({ id: templates.id })
    .from(templates)
    .where(
      and(
        ownedBy(templates, owner),
        eq(templates.id, cycleId),
        eq(templates.scope, "cycle"),
      ),
    );
  if (!c) return false;
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
  const [c] = await db
    .select({ id: templates.id })
    .from(templates)
    .where(
      and(
        ownedBy(templates, owner),
        eq(templates.id, cycleId),
        eq(templates.scope, "cycle"),
      ),
    );
  if (!c) return false;
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
