/**
 * core/food/score.ts — the parts of E7's «Food and meal» model for a meal or
 * a food (dossiers/meal-score.md §4; the developer's answers: as
 * recommended, 2026-10-24). A meal is the sum of its lines.
 *   density  NRF-style, per 100 kcal: each qualifying nutrient present as a
 *            share of the person's daily reference, capped at 100 %; protein
 *            weighted by its quality (high 1, medium 0.8, low 0.6, unknown
 *            0.7: a stand-in for DIAAS). Part = min(1, mean ÷ (4 × 100 kcal's
 *            share of the day)): a food bringing four times its energy share
 *            of what you need counts as fully dense (14.4 % on 2 778 kcal).
 *   limits   free sugars, sodium, saturated and trans fat against WHO's
 *            daily limits (free sugars < 10 % of energy, sodium < 2 g, SFA
 *            < 10 %, trans < 1 %) shared by the meal's energy, but never less
 *            than 10 % of the day's limit — per 100 kcal alone, spinach's own
 *            sodium would fail it. 1 at or under its allowance, 0 at twice
 *            it; the part is the worst limit known.
 *   value    nutrients per €: left out (meal lines carry no price yet).
 *   fit      against its block (`blockFit`): the meals of that role on the
 *            day against the block's kcal and protein (day model's shares ×
 *            the day's targets); left out on a day without a model's block.
 * A nutrient counts only when the foods carrying it make ≥ 80 % of the
 * meal's energy; otherwise it is left out. Density needs at least 6 of its
 * 11 nutrients known, or a single one capped at 100 % would carry it (a
 * mayonnaise read without its micros scored like broccoli); a part with too
 * little is null and named by `score`. Under 5 kcal (a coffee) no score.
 * Sources: Drewnowski 2009 (NRF9.3); WHO 2015/2023; EFSA DRVs.
 */
import type { Micro } from "../engines/targets";
import { bandScore } from "../engines/judgements/model";
import { macroKinds } from "./kinds";
import { dayMicros } from "./micros";

export type ScoreLine = {
  quantity: string;
  values: Record<string, string>;
  estimates?: Record<string, string> | undefined;
};

/** The person's day: energy in kcal, protein and fibre in g, micros in their units (E5). */
export type DailyRefs = {
  kcal: number;
  protein: number;
  fibre: number;
  micros: Partial<Record<Micro, number>>;
};

export type FoodParts = {
  density: number | null;
  limits: number | null;
  value: null;
  fit: number | null;
  /** What made each part: nutrient → share of its reference (density), limit → ratio to its allowance. */
  detail: { density: Record<string, number>; limits: Record<string, number> };
};

const QUALITY: Record<string, number> = { high: 1, medium: 0.8, low: 0.6, none: 0.7 };
const DENSITY_MICROS: Micro[] = ["k", "ca", "fe", "mg", "vitA", "vitC", "vitD", "folate"];
/** EFSA's adequate intake of ALA, 0.5 % of a 2 000 kcal day, in g. */
const OMEGA3_REF_G = 1.1;
/** Fully dense: four times its energy share of the day's needs. */
const DENSE_TIMES = 4;
/** A meal's allowance is at least this share of the day's limit. */
const MIN_LIMIT_SHARE = 0.1;
const SODIUM_G_PER_DAY = 2;
const SODIUM_PER_SALT = 0.4;
const COVER = 0.8;
const MIN_DENSITY_NUTRIENTS = 6;
const MIN_KCAL = 5;

/**
 * How well a block's meals fit it (E7 «fit to its block»; the 15 % and the
 * 50 % are this engine's choices): kcal within ±15 % of the block's is 1,
 * falling to 0 at ±65 %; protein from 85 % of the block's up is 1 (more is
 * not a fault), 0 under 35 %. The part is their mean.
 */
export function blockFit(
  got: { kcal: number; protein: number },
  block: { kcal: number; protein: number },
): number | null {
  if (!(block.kcal > 0)) return null;
  const kcal = bandScore(
    got.kcal,
    { low: 0.85 * block.kcal, high: 1.15 * block.kcal },
    0.5 * block.kcal,
  );
  if (!(block.protein > 0)) return kcal;
  const protein = bandScore(
    got.protein,
    { low: 0.85 * block.protein },
    0.5 * block.protein,
  );
  return (kcal + protein) / 2;
}

/** The parts as `score()` takes them (E7). */
export const partsOf = (p: FoodParts) => ({
  density: p.density,
  limits: p.limits,
  value: p.value,
  fit: p.fit,
});

export function foodParts(
  lines: readonly ScoreLine[],
  servings: string | null,
  refs: DailyRefs,
): FoodParts | null {
  const times = Number(servings ?? "1");
  const own = lines.map((l) => ({
    quantity: l.quantity,
    values: l.values,
    ...(l.estimates ? { estimates: l.estimates } : {}),
  }));
  const amount = (l: ScoreLine, field: string) =>
    (Number(l.values[field] ?? 0) * Number(l.quantity) * times) / 100;
  const kcalOf = (l: ScoreLine) => amount(l, "kcal");
  const kcal = lines.reduce((a, l) => a + kcalOf(l), 0);
  if (!(kcal >= MIN_KCAL)) return null;
  const per100 = 100 / kcal;
  const total = (field: string) => lines.reduce((a, l) => a + amount(l, field), 0);
  // Whether the foods carrying a value make enough of the meal's energy to count it.
  const covered = (has: (l: ScoreLine) => boolean) =>
    lines.reduce((a, l) => a + (has(l) ? kcalOf(l) : 0), 0) / kcal >= COVER;
  const kinds = macroKinds(own, servings);
  const day = refs.kcal > 0 ? refs.kcal : 2000;
  const fullDensity = DENSE_TIMES * (100 / day);

  const density: Record<string, number> = {};
  const share = (v: number, ref: number) => Math.min(1, (v * per100) / ref);
  const protein = Object.entries(kinds.protein).reduce(
    (a, [k, g]) => a + g * (QUALITY[k] ?? QUALITY["none"]!),
    0,
  );
  if (refs.protein > 0 && covered((l) => l.values["protein"] !== undefined))
    density["protein"] = share(protein, refs.protein);
  if (refs.fibre > 0 && covered((l) => l.values["fibre"] !== undefined))
    density["fibre"] = share(total("fibre"), refs.fibre);
  const micros = dayMicros([{ servings, lines: own }]);
  for (const m of DENSITY_MICROS) {
    const ref = refs.micros[m];
    if (ref && covered((l) => l.estimates?.[m] !== undefined))
      density[m] = share(micros[m] ?? 0, ref);
  }
  if (covered((l) => l.estimates?.["fat_n3"] !== undefined || amount(l, "fat") === 0))
    density["omega3"] = share(kinds.fat["n3"] ?? 0, OMEGA3_REF_G);
  const ds = Object.values(density);

  const allowance = Math.max(MIN_LIMIT_SHARE, kcal / day);
  const daily = {
    freeSugars: (0.1 * day) / 4,
    sodium: SODIUM_G_PER_DAY,
    saturated: (0.1 * day) / 9,
    trans: (0.01 * day) / 9,
  };
  const limits: Record<string, number> = {};
  const ratio = (g: number, key: keyof typeof daily) => g / (daily[key] * allowance);
  if (covered((l) => l.values["salt"] !== undefined))
    limits["sodium"] = ratio(total("salt") * SODIUM_PER_SALT, "sodium");
  if (covered((l) => l.values["saturatedFat"] !== undefined))
    limits["saturated"] = ratio(total("saturatedFat"), "saturated");
  if (
    covered((l) => l.estimates?.["carbs_free"] !== undefined || amount(l, "carbs") === 0)
  )
    limits["freeSugars"] = ratio(kinds.carbs["free"] ?? 0, "freeSugars");
  if (covered((l) => l.estimates?.["fat_trans"] !== undefined || amount(l, "fat") === 0))
    limits["trans"] = ratio(kinds.fat["trans"] ?? 0, "trans");
  const ls = Object.values(limits).map((r) => (r <= 1 ? 1 : r >= 2 ? 0 : 2 - r));

  return {
    density:
      ds.length >= MIN_DENSITY_NUTRIENTS
        ? Math.min(1, ds.reduce((a, b) => a + b, 0) / ds.length / fullDensity)
        : null,
    limits: ls.length ? Math.min(...ls) : null,
    value: null,
    fit: null,
    detail: { density, limits },
  };
}
