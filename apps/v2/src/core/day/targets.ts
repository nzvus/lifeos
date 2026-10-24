/**
 * core/day/targets.ts — the food targets in force on a day
 * (dossiers/targets.md §5, decided 2026-10-24):
 *   1. the day's own fixed copy (`day_targets`);
 *   2. else the day's model when it is fixed: its numbers;
 *   3. else the week it falls in (`week_targets`, its 7 days from `day`):
 *      v1's accepted check-ins hold the numbers, with that day's shift
 *      (carbs take it, v1 ADR-0044); an automatic week (core/energy) holds
 *      E4's expenditure, the trend weight and the goal's deficit, and the
 *      day's dynamic model turns them into numbers (`modelTargets`);
 *   4. else none.
 * Maxima a decision does not hold come from its kcal (E5 `dayMaxima`).
 */
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { Db } from "../db/db";
import { decisions, settings } from "../db/schema";
import { addDays, type IsoDate } from "../engines/time";
import { dayMaxima, microTargets, type MicroTarget } from "../engines/targets";
import { ownedBy, type Owner } from "../identity/owner";

export type FoodTargets = {
  /** Which decision they come from: the day's own, the week's, or the day's fixed model. */
  from: "day" | "week" | "model";
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
  /** How they were made, for the words on the day: present for a model's or an automatic week's. */
  basis?: {
    model: string | null;
    /** An automatic week's E4 and goal; absent for a fixed model. */
    expenditureKcal?: number;
    sigmaKcal?: number;
    deficitKcal?: number;
    deficitFrom?: "goal" | "model";
    ratePctWeek?: number | null;
    trendKg?: number;
    floored?: boolean;
  };
};

/** The day's model as targets read it: its name and its targets (templates.targets). */
export type DayModel = { name: string; targets: Record<string, unknown> | null };

/** A dynamic model's parameters when the day has none: maintenance, v1's defaults. */
const DEFAULT_DYNAMIC = { deficitKcal: 0, proteinGPerKg: 1.8, fatGPerKg: 0.8 };
const FAT_MIN_SHARE = 0.25;
const FIBRE_PER_1000 = 14;
const FIBRE_MIN = 25;

/**
 * A model's targets: a fixed one's numbers; a dynamic one's from an automatic
 * week — kcal = E − deficit (the goal's, else the model's), never under the
 * BMR; protein and fat per kg of the trend weight, fat at least 25 % of kcal
 * (v1 ADR-0025); carbs the rest; fibre 14 g per 1 000 kcal, at least 25 g.
 */
export function modelTargets(
  model: DayModel | null,
  week: { day: IsoDate; payload: Record<string, unknown> } | null,
): FoodTargets | null {
  const t = model?.targets ?? null;
  if (t && t["mode"] === "fixed" && num(t["kcal"]) !== null) {
    const kcal = num(t["kcal"])!;
    const maxima = dayMaxima(kcal);
    return {
      from: "model",
      since: week?.day ?? "",
      kcal,
      protein: num(t["protein"]),
      carbs: num(t["carbs"]),
      fat: num(t["fat"]),
      fibre: num(t["fibre"]),
      sugars: num(t["sugars"]) ?? maxima.sugars,
      saturatedFat: num(t["saturatedFat"]) ?? maxima.saturatedFat,
      salt: num(t["salt"]) ?? maxima.salt,
      basis: { model: model!.name },
    };
  }
  const p = week?.payload;
  if (!week || !p || p["source"] !== "auto") return null;
  const E = num(p["expenditureKcal"]);
  const W = num(p["trendKg"]);
  const bmr = num(p["bmr"]);
  if (E === null || W === null || bmr === null) return null;
  const own = t && t["mode"] === "dynamic" ? t : null;
  const goalDeficit = num(p["deficitKcal"]);
  const deficit = goalDeficit ?? num(own?.["deficitKcal"]) ?? DEFAULT_DYNAMIC.deficitKcal;
  const wanted = Math.round(E - deficit);
  const kcal = Math.max(Math.round(bmr), wanted);
  const protein = Math.round(
    (num(own?.["proteinGPerKg"]) ?? DEFAULT_DYNAMIC.proteinGPerKg) * W,
  );
  const fat = Math.max(
    Math.round((num(own?.["fatGPerKg"]) ?? DEFAULT_DYNAMIC.fatGPerKg) * W),
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
      model: model?.name ?? null,
      expenditureKcal: E,
      sigmaKcal: num(p["sigmaKcal"]) ?? 0,
      deficitKcal: deficit,
      deficitFrom: goalDeficit !== null ? "goal" : "model",
      ratePctWeek: num(p["ratePctWeek"]),
      trendKg: W,
      floored: kcal > wanted,
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

/** Pure: the targets on `day` from the decisions on it or before it and the day's model. */
export function targetsOn(
  rows: readonly TargetDecision[],
  day: IsoDate,
  model: DayModel | null = null,
): FoodTargets | null {
  const own = rows.find((r) => r.kind === "day_targets" && r.day === day);
  if (own) return fromPayload("day", own);
  const week = rows
    .filter((r) => r.kind === "week_targets" && r.day <= day)
    .sort((a, b) => (a.day < b.day ? 1 : -1))[0];
  const inForce = week && day <= addDays(week.day, 6) ? week : null;
  if (model?.targets?.["mode"] === "fixed") return modelTargets(model, inForce);
  if (!inForce) return null;
  if (inForce.payload["source"] === "auto") return modelTargets(model, inForce);
  return weekPayload(inForce, day);
}

function weekPayload(week: TargetDecision, day: IsoDate): FoodTargets | null {
  const shifts = Array.isArray(week.payload["shifts"])
    ? (week.payload["shifts"] as { day?: unknown; shiftKcal?: unknown }[])
    : [];
  const shift = num(shifts.find((s) => s.day === day)?.shiftKcal) ?? 0;
  return fromPayload("week", week, shift);
}

/** The owner's targets on `day`: two small queries on `decisions`; `model` the day's (core/plans). */
export async function readDayTargets(
  db: Db,
  owner: Owner,
  day: IsoDate,
  model: DayModel | null = null,
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
  return targetsOn([...own, ...week] as TargetDecision[], day, model);
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
  const out = new Map<IsoDate, FoodTargets | null>();
  for (let d = from; d <= to; d = addDays(d, 1))
    out.set(d, targetsOn(rows as TargetDecision[], d));
  return out;
}
