/**
 * core/nutrition/quality-summary.ts — what a meal (or a day) is made of, by
 * the ADR-0012 attributes of its lines, computed on read, never stored:
 *
 *   nova     share of ENERGY from each NOVA level, plus "unknown"
 *   origin   share of PROTEIN from plant / animal / mixed, plus "unknown"
 *   fiber    grams of fibre by type: a line's fibre split evenly among its
 *            types; fibre from lines without a type is "unknown"
 *
 * Unclassified lines are counted as unknown, never guessed. Shares are
 * whole percent of the total (0 when the total is 0). Exact (big.js).
 */
import { Big } from "../shared/decimal";
import type { NutrientValues } from "./nutrients";
import {
  FIBER_TYPES,
  NOVA_LEVELS,
  ORIGINS,
  type FiberType,
  type Quality,
} from "./quality";

export type QualityLine = { quantity: string; per100: NutrientValues; quality: Quality };

export type QualitySummary = {
  nova: Record<"1" | "2" | "3" | "4" | "unknown", number>;
  origin: Record<"plant" | "animal" | "mixed" | "unknown", number>;
  /** Grams (exact strings) by fibre type, and the untyped rest. */
  fiber: Record<FiberType | "unknown", string>;
};

const pct = (part: Big, total: Big) =>
  total.eq(0) ? 0 : part.div(total).times(100).round(0, Big.roundHalfUp).toNumber();

/** The summary of some lines, each scaled by `factor` (servings). */
export function qualitySummary(
  lines: readonly QualityLine[],
  factor = "1",
): QualitySummary {
  const f = new Big(factor);
  const amount = (l: QualityLine, k: "kcal" | "protein" | "fiber") =>
    new Big(l.per100[k]).times(l.quantity).div(100).times(f);

  const kcalBy = new Map<string, Big>();
  const proteinBy = new Map<string, Big>();
  const fiberBy = new Map<string, Big>();
  const add = (m: Map<string, Big>, k: string, v: Big) =>
    m.set(k, (m.get(k) ?? new Big(0)).plus(v));
  let kcal = new Big(0);
  let protein = new Big(0);

  for (const l of lines) {
    const k = amount(l, "kcal");
    const p = amount(l, "protein");
    const fi = amount(l, "fiber");
    kcal = kcal.plus(k);
    protein = protein.plus(p);
    add(kcalBy, l.quality.nova === null ? "unknown" : String(l.quality.nova), k);
    add(proteinBy, l.quality.origin ?? "unknown", p);
    const types = l.quality.fiberTypes;
    if (types.length === 0) add(fiberBy, "unknown", fi);
    else for (const t of types) add(fiberBy, t, fi.div(types.length));
  }

  const nova = {
    unknown: pct(kcalBy.get("unknown") ?? new Big(0), kcal),
  } as QualitySummary["nova"];
  for (const n of NOVA_LEVELS)
    nova[String(n) as "1"] = pct(kcalBy.get(String(n)) ?? new Big(0), kcal);
  const origin = {
    unknown: pct(proteinBy.get("unknown") ?? new Big(0), protein),
  } as QualitySummary["origin"];
  for (const o of ORIGINS) origin[o] = pct(proteinBy.get(o) ?? new Big(0), protein);
  const fiber = {
    unknown: (fiberBy.get("unknown") ?? new Big(0)).toString(),
  } as QualitySummary["fiber"];
  for (const t of FIBER_TYPES) fiber[t] = (fiberBy.get(t) ?? new Big(0)).toString();
  return { nova, origin, fiber };
}

/**
 * A meal's free tags: the union of its ingredients' tags, by name,
 * alphabetical (ADR-0012: tags "add up" into meals, descriptively).
 */
export function mealTags<T extends { name: string }>(
  ingredientIds: readonly string[],
  tagsByIngredient: ReadonlyMap<string, readonly T[]>,
): T[] {
  const byName = new Map<string, T>();
  for (const id of ingredientIds)
    for (const tag of tagsByIngredient.get(id) ?? []) byName.set(tag.name, tag);
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The summary of what was EATEN on a day (ADR-0009): lines × servings.
 * `withPlanned`: also the planned entries — where the day ends if the plan
 * is followed.
 */
export function eatenQuality(
  entries: readonly {
    status: "planned" | "eaten";
    /** Planned but left out of the plan's total. */
    leftOut?: boolean;
    servings: string;
    lines: readonly QualityLine[];
  }[],
  withPlanned = false,
): QualitySummary {
  return qualitySummary(
    entries
      .filter((e) => e.status === "eaten" || (withPlanned && !e.leftOut))
      .flatMap((e) =>
        e.lines.map((l) => ({
          ...l,
          quantity: new Big(l.quantity).times(e.servings).toString(),
        })),
      ),
  );
}
