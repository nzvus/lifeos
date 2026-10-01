/**
 * core/energy/energy.ts — how much energy a day costs (ADR-0014, model B),
 * part by part, every figure a low–high range (PROJECT.md: no falsely
 * precise burn numbers). Pure: the repository gathers the day's facts.
 *
 *   BMR        Mifflin-St Jeor from sex, age, height and the day's weight
 *   baseline   BMR × the declared everyday level (it includes the BMR),
 *              × the user's accepted calibration (ADR-0020, default 1)
 *   walking    minutes (or steps ÷ 100) at 3.0–3.8 MET, net of resting
 *   training   each session's burn range, net of resting for its duration
 *   digestion  the thermic effect: the sum ÷ 0.9 − the sum (≈10 %)
 *
 * Training is counted twice over: what was DONE, and done + PLANNED ("with
 * the plan"). Targets of a dynamic day follow the plan: you eat for the
 * day you are going to have.
 */
import type { BurnRange } from "../training/analysis";

export type Range = { low: number; high: number };
export const LEVELS = ["sitting", "mixed", "on_feet"] as const;
export type ActivityLevel = (typeof LEVELS)[number];
export type Sex = "male" | "female";

/** Everyday activity factors (BMR × factor), by declared level. */
export const LEVEL_FACTOR: Record<ActivityLevel, [number, number]> = {
  sitting: [1.15, 1.25],
  mixed: [1.3, 1.45],
  on_feet: [1.5, 1.65],
};
const WALK_MET: [number, number] = [3.0, 3.8];
const TEF = 0.9; // expenditure ÷ 0.9: ≈10 % for digesting

export type Body = {
  sex: Sex | null;
  birthYear: number | null;
  heightCm: number | null;
  /** The weight on that day (latest measurement up to it), kg. */
  weightKg: string | null;
  /** ADR-0020: the accepted factor on the baseline; 1 (none) if absent. */
  correction?: number;
};

export type DayFacts = {
  /** "YYYY-MM-DD": its year gives the age. */
  day: string;
  level: ActivityLevel;
  walkingMin: number | null;
  steps: number | null;
  sessions: readonly {
    status: "planned" | "done";
    burn: BurnRange | null;
    durationMin: number | null;
  }[];
};

export type Energy = {
  bmr: number;
  baseline: Range;
  walking: Range;
  training: { done: Range; planned: Range };
  digestion: { done: Range; withPlan: Range };
  total: { done: Range; withPlan: Range };
};

/** What is missing for an estimate, if anything (never guessed). */
export type MissingBody = ("sex" | "birthYear" | "heightCm" | "weight")[];

export function missingBody(b: Body): MissingBody {
  const out: MissingBody = [];
  if (!b.sex) out.push("sex");
  if (!b.birthYear) out.push("birthYear");
  if (!b.heightCm) out.push("heightCm");
  if (!b.weightKg) out.push("weight");
  return out;
}

const r = (low: number, high: number): Range => ({
  low: Math.round(low),
  high: Math.round(high),
});
const add = (...xs: Range[]): Range =>
  r(
    xs.reduce((a, x) => a + x.low, 0),
    xs.reduce((a, x) => a + x.high, 0),
  );

/** Mifflin-St Jeor, kcal/day. */
export function bmrOf(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return Math.round(
    10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161),
  );
}

/** The day's energy, or null when body data is missing (see missingBody). */
export function dayEnergy(body: Body, facts: DayFacts): Energy | null {
  if (missingBody(body).length) return null;
  const kg = Number(body.weightKg);
  const age = Number(facts.day.slice(0, 4)) - body.birthYear!;
  const bmr = bmrOf(body.sex!, kg, body.heightCm!, age);
  const [fLo, fHi] = LEVEL_FACTOR[facts.level];
  const c = body.correction ?? 1;
  const baseline = r(bmr * fLo * c, bmr * fHi * c);

  // Steps ÷ 100 ≈ minutes of walking; the larger of the two if both given.
  const minutes = Math.max(facts.walkingMin ?? 0, (facts.steps ?? 0) / 100);
  const walking = r(
    (WALK_MET[0] - 1) * kg * (minutes / 60),
    (WALK_MET[1] - 1) * kg * (minutes / 60),
  );

  // Net of resting: one MET for the session's duration is already in the baseline.
  const net = (s: DayFacts["sessions"][number]): Range => {
    if (!s.burn) return r(0, 0);
    const rest = kg * ((s.durationMin ?? 0) / 60);
    return r(Math.max(0, s.burn.low - rest), Math.max(0, s.burn.high - rest));
  };
  const done = add(
    r(0, 0),
    ...facts.sessions.filter((s) => s.status === "done").map(net),
  );
  const planned = add(
    r(0, 0),
    ...facts.sessions.filter((s) => s.status === "planned").map(net),
  );

  const sumDone = add(baseline, walking, done);
  const sumPlan = add(sumDone, planned);
  const withTef = (x: Range) => r(x.low / TEF, x.high / TEF);
  const totalDone = withTef(sumDone);
  const totalPlan = withTef(sumPlan);
  return {
    bmr,
    baseline,
    walking,
    training: { done, planned },
    digestion: {
      done: r(totalDone.low - sumDone.low, totalDone.high - sumDone.high),
      withPlan: r(totalPlan.low - sumPlan.low, totalPlan.high - sumPlan.high),
    },
    total: { done: totalDone, withPlan: totalPlan },
  };
}

export type DynamicParams = {
  /** kcal/day below expenditure; negative = a surplus (muscle gain). */
  deficitKcal: number;
  proteinGPerKg: string;
  fatGPerKg: string;
};

/**
 * Targets of a dynamic day (ADR-0014): energy = the midpoint of what the
 * day costs WITH THE PLAN − the deficit; protein and fat per kg of the
 * day's weight; carbs the rest; fibre 14 g per 1000 kcal. Sugars,
 * saturated fat and salt stay empty: the automatic maxima apply.
 */
export function dynamicTargets(
  energy: Energy,
  weightKg: string,
  p: DynamicParams,
): { kcal: number; protein: number; fat: number; carbs: number; fiber: number } {
  const kg = Number(weightKg);
  const mid = (energy.total.withPlan.low + energy.total.withPlan.high) / 2;
  const kcal = Math.max(1200, Math.round(mid - p.deficitKcal));
  const protein = Math.round(Number(p.proteinGPerKg) * kg);
  const fat = Math.round(Number(p.fatGPerKg) * kg);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, fat, carbs, fiber: Math.round((kcal / 1000) * 14) };
}

/** Goal presets (the day type editor fills the three fields from one). */
export const GOAL_PRESETS = {
  gain: { deficitKcal: -250, proteinGPerKg: "1.8", fatGPerKg: "0.9" },
  recomp: { deficitKcal: 200, proteinGPerKg: "2.2", fatGPerKg: "0.8" },
  cut: { deficitKcal: 500, proteinGPerKg: "2.2", fatGPerKg: "0.8" },
} as const satisfies Record<string, DynamicParams>;
export type Goal = keyof typeof GOAL_PRESETS;
