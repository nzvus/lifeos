/**
 * core/energy/ensure.ts — a week's automatic targets, made on the first
 * open of a day in it, this week's or a past one's from the data before it
 * (dossiers/targets.md §9: estimated continuously, changed weekly, no
 * «accept»). When Monday has no `week_targets`, E4 runs over the
 * 56 days before it and the result is stored as that week's decision; every
 * later open reads the one row. «Ricalcola» drops an automatic week and makes
 * it again (a past day edited, a weigh-in added late). A v1 check-in, or a
 * day the person fixed, is never replaced.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/db";
import { decisions } from "../db/schema";
import type { GoalKind } from "../engines/targets";
import { addDays, isoWeekday, type DayClock, type IsoDate } from "../engines/time";
import { readDayTargets, type FoodTargets } from "../day/targets";
import { readGoals } from "../goals/read";
import { readDayModel } from "../plans/read";
import { ownedBy, type Owner } from "../identity/owner";
import { readEnergyRows } from "./read";
import { WINDOW_DAYS, weekEnergy, type WeekEnergy, type WeekGoal } from "./week";

const GOAL_KINDS: readonly GoalKind[] = ["lose", "gain", "recomp", "maintain"];

export const mondayOf = (day: IsoDate) => addDays(day, 1 - isoWeekday(day));

async function weekRow(db: Db, owner: Owner, monday: IsoDate) {
  const [row] = await db
    .select({ payload: decisions.payload })
    .from(decisions)
    .where(
      and(
        ownedBy(decisions, owner),
        eq(decisions.kind, "week_targets"),
        eq(decisions.day, monday),
        eq(decisions.key, ""),
      ),
    );
  return row ?? null;
}

/** The weight goal in force on Monday, as E5's pace reads it; null without one. */
async function weekGoal(db: Db, owner: Owner, monday: IsoDate): Promise<WeekGoal | null> {
  const g = (await readGoals(db, owner, monday)).find(
    (x) => x.source === "weight" && x.target === "reach" && x.value !== null,
  );
  if (!g) return null;
  const kind = g.metric["goalKind"];
  return {
    kind: GOAL_KINDS.includes(kind as GoalKind) ? (kind as GoalKind) : "lose",
    targetKg: g.value,
    targetDay: g.by,
  };
}

/** Makes the automatic decision of `day`'s week when it is missing; returns what is stored, or null. */
export async function ensureWeekTargets(
  db: Db,
  owner: Owner,
  day: IsoDate,
  clock: DayClock,
): Promise<WeekEnergy | Record<string, unknown> | null> {
  const monday = mondayOf(day);
  const existing = await weekRow(db, owner, monday);
  if (existing) return existing.payload as Record<string, unknown>;
  const to = addDays(monday, -1);
  const from = addDays(monday, -WINDOW_DAYS);
  const [rows, goal] = await Promise.all([
    readEnergyRows(db, owner, from, to),
    weekGoal(db, owner, monday),
  ]);
  const energy = weekEnergy(rows, { from, to, today: monday, clock, goal });
  if (!energy) return null;
  await db
    .insert(decisions)
    .values({
      userId: owner.id,
      kind: "week_targets",
      day: monday,
      key: "",
      payload: energy,
    })
    .onConflictDoNothing();
  return energy;
}

/** Drops this week's automatic decision (never a v1 check-in) and makes it again. */
export async function recomputeWeekTargets(
  db: Db,
  owner: Owner,
  today: IsoDate,
  clock: DayClock,
): Promise<WeekEnergy | Record<string, unknown> | null> {
  const monday = mondayOf(today);
  const existing = await weekRow(db, owner, monday);
  if (existing && (existing.payload as Record<string, unknown>)["source"] !== "auto")
    return existing.payload as Record<string, unknown>;
  if (existing)
    await db
      .delete(decisions)
      .where(
        and(
          ownedBy(decisions, owner),
          eq(decisions.kind, "week_targets"),
          eq(decisions.day, monday),
          eq(decisions.key, ""),
        ),
      );
  return ensureWeekTargets(db, owner, today, clock);
}

/**
 * A day's targets on a page that is not Oggi (the meal composer, an entry's
 * page): its week made first when missing, then the day's model and the
 * decisions, as Oggi reads them.
 */
export async function readTargetsFor(
  db: Db,
  owner: Owner,
  day: IsoDate,
  today: IsoDate,
  clock: DayClock,
): Promise<FoodTargets | null> {
  const [, model] = await Promise.all([
    day <= today ? ensureWeekTargets(db, owner, day, clock) : null,
    readDayModel(db, owner, day),
  ]);
  return readDayTargets(db, owner, day, model);
}
