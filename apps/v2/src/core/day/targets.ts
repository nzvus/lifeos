/**
 * core/day/targets.ts — the food targets in force on a day, from the
 * decisions that froze them (migration.md: v1's `day_plans` and
 * `week_checkins`), with v1's precedence:
 *   1. the day's own fixed copy (`day_targets`);
 *   2. else the accepted week it falls in (`week_targets`, its 7 days from
 *      `day`), with that day's shift: carbs take it (v1 ADR-0044);
 *   3. else none: the live targets (E5 on E4's expenditure) come with the
 *      body slice.
 * Maxima a decision does not hold come from its kcal (E5 `dayMaxima`).
 */
import { and, desc, eq, lte } from "drizzle-orm";
import type { Db } from "../db/db";
import { decisions } from "../db/schema";
import { addDays, type IsoDate } from "../engines/time";
import { dayMaxima } from "../engines/targets";
import { ownedBy, type Owner } from "../identity/owner";

export type FoodTargets = {
  /** Which decision they come from. */
  from: "day" | "week";
  /** The decision's day: the day itself, or the week's first day. */
  since: IsoDate;
  kcal: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fibre: number | null;
  sugars: number;
  saturatedFat: number;
  salt: number;
};

export type TargetDecision = {
  kind: "day_targets" | "week_targets";
  day: IsoDate;
  payload: Record<string, unknown>;
};

const num = (v: unknown): number | null =>
  (typeof v === "string" && v !== "") || typeof v === "number" ? Number(v) : null;

function fromPayload(
  from: FoodTargets["from"],
  { day: since, payload: p }: TargetDecision,
  shift = 0,
): FoodTargets | null {
  const base = num(p["kcal"]);
  if (base === null) return null;
  const kcal = base + shift;
  const carbs = num(p["carbs"]);
  const maxima = dayMaxima(kcal);
  return {
    from,
    since,
    kcal,
    protein: num(p["protein"]),
    carbs: carbs === null ? null : Math.max(0, carbs + Math.round(shift / 4)),
    fat: num(p["fat"]),
    fibre: num(p["fibre"]),
    sugars: num(p["sugars"]) ?? maxima.sugars,
    saturatedFat: num(p["saturatedFat"]) ?? maxima.saturatedFat,
    salt: num(p["salt"]) ?? maxima.salt,
  };
}

/** Pure: the targets on `day` from the decisions on it or before it. */
export function targetsOn(
  rows: readonly TargetDecision[],
  day: IsoDate,
): FoodTargets | null {
  const own = rows.find((r) => r.kind === "day_targets" && r.day === day);
  if (own) return fromPayload("day", own);
  const week = rows
    .filter((r) => r.kind === "week_targets" && r.day <= day)
    .sort((a, b) => (a.day < b.day ? 1 : -1))[0];
  if (!week || day > addDays(week.day, 6)) return null;
  const shifts = Array.isArray(week.payload["shifts"])
    ? (week.payload["shifts"] as { day?: unknown; shiftKcal?: unknown }[])
    : [];
  const shift = num(shifts.find((s) => s.day === day)?.shiftKcal) ?? 0;
  return fromPayload("week", week, shift);
}

/** The owner's targets on `day`: two small queries on `decisions`. */
export async function readDayTargets(
  db: Db,
  owner: Owner,
  day: IsoDate,
): Promise<FoodTargets | null> {
  const [own, week] = await Promise.all([
    db
      .select({ kind: decisions.kind, day: decisions.day, payload: decisions.payload })
      .from(decisions)
      .where(
        and(
          ownedBy(decisions, owner),
          eq(decisions.kind, "day_targets"),
          eq(decisions.day, day),
        ),
      ),
    db
      .select({ kind: decisions.kind, day: decisions.day, payload: decisions.payload })
      .from(decisions)
      .where(
        and(
          ownedBy(decisions, owner),
          eq(decisions.kind, "week_targets"),
          lte(decisions.day, day),
        ),
      )
      .orderBy(desc(decisions.day))
      .limit(1),
  ]);
  return targetsOn([...own, ...week] as TargetDecision[], day);
}
