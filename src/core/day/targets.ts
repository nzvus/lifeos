/**
 * core/day/targets.ts — the food targets in force on a day
 * (dossiers/targets.md §5, decided 2026-10-24):
 *   1. the day's own fixed copy (`day_targets`, a Decision, MOD-44);
 *   2. else the week it falls in (`week_targets`, its 7 days from `day`):
 *      v1's accepted check-ins hold the numbers, with that day's shift
 *      (carbs take it, v1 ADR-0044); an automatic week (core/energy) holds
 *      E4's expenditure, the trend weight and the weight goal's deficit, and
 *      the food goals in force (Obiettivi: deficit, protein and fat per kg,
 *      core/goals `foodParams`; MOD-42, FD-20…22, PL-61) turn them into
 *      numbers (`dynamicTargets`);
 *   3. else none.
 * No day model lends targets any more (PL-61, change 2026-11-07-piano).
 * Maxima a decision does not hold come from its kcal (E5 `dayMaxima`).
 */
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { Db } from "../db/db";
import { decisions, settings } from "../db/schema";
import { addDays, type IsoDate } from "../engines/time";
import { dayMaxima, microTargets, type MicroTarget } from "../engines/targets";
import { ownedBy, type Owner } from "../identity/owner";
import { foodParams, inForce, readGoalRows, type FoodParams } from "../goals";

export type FoodTargets = {
  /** Which decision they come from: the day's own or the week's. */
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
  /** How they were made, for the words on the day: present for an automatic week's. */
  basis?: {
    /** E4's expenditure and the deficit. */
    expenditureKcal?: number;
    sigmaKcal?: number;
    deficitKcal?: number;
    /** «pace»: the weight goal's pace (FD-21); «goal»: the deficit goal; «none»: maintenance. */
    deficitFrom?: "pace" | "goal" | "none";
    ratePctWeek?: number | null;
    trendKg?: number;
    floored?: boolean;
    /**
     * What the priors said the same week cost (WeekEnergy.priors summed): the
     * learnt expenditure over it calibrates a single day (ledger BODY-30).
     */
    priorKcal?: number;
  };
};

/** The food goals' defaults when he has none: maintenance, v1's defaults. */
const DEFAULT_DYNAMIC = { deficitKcal: 0, proteinGPerKg: 1.8, fatGPerKg: 0.8 };
const FAT_MIN_SHARE = 0.25;
const FIBRE_PER_1000 = 14;
const FIBRE_MIN = 25;

/**
 * An automatic week's targets with the food goals (FD-20…22): kcal = E − deficit (the weight
 * goal's pace, else the deficit goal), never under the BMR; protein and fat per kg of the trend
 * weight, fat at least 25 % of kcal (v1 ADR-0025); carbs the rest; fibre 14 g per 1 000 kcal,
 * at least 25 g. Null for a week that is not automatic.
 */
export function dynamicTargets(
  params: FoodParams,
  week: { day: IsoDate; payload: Record<string, unknown> } | null,
): FoodTargets | null {
  const p = week?.payload;
  if (!week || !p || p["source"] !== "auto") return null;
  const E = num(p["expenditureKcal"]);
  const W = num(p["trendKg"]);
  const bmr = num(p["bmr"]);
  if (E === null || W === null || bmr === null) return null;
  const paceDeficit = num(p["deficitKcal"]);
  const deficit = paceDeficit ?? params.deficitKcal ?? DEFAULT_DYNAMIC.deficitKcal;
  const wanted = Math.round(E - deficit);
  const kcal = Math.max(Math.round(bmr), wanted);
  const protein = Math.round((params.proteinGPerKg ?? DEFAULT_DYNAMIC.proteinGPerKg) * W);
  const fat = Math.max(
    Math.round((params.fatGPerKg ?? DEFAULT_DYNAMIC.fatGPerKg) * W),
    Math.round((kcal * FAT_MIN_SHARE) / 9),
  );
  return {
    from: "week",
    since: week.day,
    kcal,
    protein,
    fat,
    carbs: Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4)),
    fibre: Math.max(FIBRE_MIN, Math.round((kcal / 1000) * FIBRE_PER_1000)),
    ...dayMaxima(kcal),
    basis: {
      expenditureKcal: E,
      sigmaKcal: num(p["sigmaKcal"]) ?? 0,
      deficitKcal: deficit,
      deficitFrom:
        paceDeficit !== null ? "pace" : params.deficitKcal !== null ? "goal" : "none",
      ratePctWeek: num(p["ratePctWeek"]),
      trendKg: W,
      floored: kcal > wanted,
      ...priorSum(p["priors"]),
    },
  };
}

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

/** Pure: the targets on `day` from the decisions on it or before it and the food goals. */
export function targetsOn(
  rows: readonly TargetDecision[],
  day: IsoDate,
  params: FoodParams = foodParams([]),
): FoodTargets | null {
  const own = rows.find((r) => r.kind === "day_targets" && r.day === day);
  // A day's own numbers win (an old «Cambia la giornata» row holds no numbers: the week's).
  const fixed = own ? fromPayload("day", own) : null;
  if (fixed) return fixed;
  const week = rows
    .filter((r) => r.kind === "week_targets" && r.day <= day)
    .sort((a, b) => (a.day < b.day ? 1 : -1))[0];
  const inForce = week && day <= addDays(week.day, 6) ? week : null;
  if (!inForce) return null;
  if (inForce.payload["source"] === "auto") return dynamicTargets(params, inForce);
  return weekPayload(inForce, day);
}

function weekPayload(week: TargetDecision, day: IsoDate): FoodTargets | null {
  const shifts = Array.isArray(week.payload["shifts"])
    ? (week.payload["shifts"] as { day?: unknown; shiftKcal?: unknown }[])
    : [];
  const shift = num(shifts.find((s) => s.day === day)?.shiftKcal) ?? 0;
  return fromPayload("week", week, shift);
}

/** The owner's targets on `day`: two small queries on `decisions` and his goals. */
export async function readDayTargets(
  db: Db,
  owner: Owner,
  day: IsoDate,
): Promise<FoodTargets | null> {
  const [own, week, goals] = await Promise.all([
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
    readGoalRows(db, owner),
  ]);
  return targetsOn(
    [...own, ...week] as TargetDecision[],
    day,
    foodParams(inForce(goals, day)),
  );
}

/**
 * The person's micronutrient targets on `day` (E5, EFSA, adults): from the
 * sex and the birth year in their settings; none while either is missing.
 * The age is the day's year minus the birth year (only the year is kept).
 */
export async function readMicroTargets(
  db: Db,
  owner: Owner,
  day: IsoDate,
): Promise<MicroTarget[] | null> {
  const [s] = await db
    .select({ sex: settings.sex, birthYear: settings.birthYear })
    .from(settings)
    .where(ownedBy(settings, owner));
  if (!s?.sex || !s.birthYear) return null;
  const age = Number(day.slice(0, 4)) - s.birthYear;
  return age >= 18 ? microTargets({ sex: s.sex, age }) : null;
}

/** The owner's targets on each day of a range, from two queries. */
export async function readRangeTargets(
  db: Db,
  owner: Owner,
  from: IsoDate,
  to: IsoDate,
): Promise<Map<IsoDate, FoodTargets | null>> {
  const goals = readGoalRows(db, owner);
  const rows = await db
    .select({ kind: decisions.kind, day: decisions.day, payload: decisions.payload })
    .from(decisions)
    .where(
      and(
        ownedBy(decisions, owner),
        inArray(decisions.kind, ["day_targets", "week_targets"]),
        lte(decisions.day, to),
        gte(decisions.day, addDays(from, -6)),
      ),
    );
  const all = await goals;
  const out = new Map<IsoDate, FoodTargets | null>();
  for (let d = from; d <= to; d = addDays(d, 1))
    out.set(d, targetsOn(rows as TargetDecision[], d, foodParams(inForce(all, d))));
  return out;
}

/** The week's priors summed (bmr + everyday + steps + training + tef), when the decision has them. */
function priorSum(v: unknown): { priorKcal?: number } {
  if (!v || typeof v !== "object") return {};
  const parts = ["bmr", "everyday", "steps", "training", "tef"].map(
    (k) => (v as Record<string, unknown>)[k],
  );
  if (!parts.every((x) => typeof x === "number" && Number.isFinite(x))) return {};
  const sum = (parts as number[]).reduce((a, b) => a + b, 0);
  return sum > 0 ? { priorKcal: Math.round(sum) } : {};
}
