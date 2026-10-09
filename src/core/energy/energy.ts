/**
 * core/energy/energy.ts — how much energy a day costs (ADR-0014, model B),
 * part by part, every figure a low–high range (PROJECT.md: no falsely
 * precise burn numbers). Pure: the repository gathers the day's facts.
 *
 *   BMR        Mifflin-St Jeor from sex, age, height and the day's weight
 *   baseline   BMR × the declared everyday level (it includes the BMR),
 *              × the user's accepted calibration (ADR-0020, default 1)
 *   steps      ADR-0032: the day type includes its usual steps (5,000 /
 *              7,500 / 10,000); the real steps (minus a done run's) or a
 *              walk's minutes correct the day up or down from them, at
 *              one cost per step: 100 steps a minute, 3.0–3.8 MET, net of
 *              resting
 *   training   each session's burn range, net of resting for its duration
 *
 * No separate digestion term (ADR-0021): activity factors are measured
 * total expenditure ÷ BMR, so they already contain it.
 *
 * Training is counted twice over: what was DONE, and done + PLANNED ("with
 * the plan"). Targets of a dynamic day follow the plan: you eat for the
 * day you are going to have.
 */
import type { BurnBasis, BurnRange } from "../training/analysis";

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
/** Steps a day at each level already includes (Tudor-Locke's bands). */
export const LEVEL_STEPS: Record<ActivityLevel, number> = {
  sitting: 5000,
  mixed: 7500,
  on_feet: 10000,
};

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
  /** ADR-0032: steps the device counted inside the day's done cardio (a run). */
  sessionSteps?: number;
  sessions: readonly {
    status: "planned" | "done";
    burn: BurnRange | null;
    durationMin: number | null;
    /** What the burn came from, for the formula on screen. */
    basis?: BurnBasis;
    name?: string;
  }[];
};

/** Every input of the estimate, so the page can show each formula. */
export type EnergyInputs = {
  sex: Sex;
  age: number;
  kg: number;
  heightCm: number;
  level: ActivityLevel;
  factor: [number, number];
  correction: number;
  walk: {
    /** ADR-0032: what the movement came from. */
    source: "steps" | "walk" | "level";
    declaredMin: number;
    steps: number;
    /** Steps inside done cardio sessions, taken out. */
    sessionSteps: number;
    levelSteps: number;
    minutes: number;
    met: [number, number];
    /** Filled in from the other sources (estimates for the form). */
    estimatedSteps: number | null;
  };
  sessions: {
    name: string;
    status: "planned" | "done";
    durationMin: number;
    burn: BurnRange | null;
    rest: number;
    net: Range;
    basis: BurnBasis | null;
  }[];
};

export type Energy = {
  bmr: number;
  baseline: Range;
  walking: Range;
  training: { done: Range; planned: Range };
  total: { done: Range; withPlan: Range };
  inputs: EnergyInputs;
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

/** Steps a minute of walking (the conversion between steps and minutes). */
export const STEPS_PER_MIN = 100;

/**
 * A day's balance this close to the wanted one (kcal) counts as on target,
 * for colouring only: the estimates are ranges wider than this.
 */
export const ON_TARGET_KCAL = 150;

/**
 * ADR-0032: the day type (sitting / mixed / on my feet) is the rest of the
 * day and always sets the everyday factor, its usual steps included; the
 * real steps — minus a run's — correct it up or down from those usual
 * steps, at one cost per step. Without steps, the walk's minutes stand for
 * their steps on top of the usual ones; with neither, the day type alone.
 * `minutes` is that difference in walking minutes (negative = fewer steps
 * than usual).
 */
export function movementOf(
  facts: Pick<DayFacts, "level" | "walkingMin" | "steps" | "sessionSteps">,
): {
  source: "steps" | "walk" | "level";
  level: ActivityLevel;
  factor: [number, number];
  minutes: number;
  sessionSteps: number;
  estimatedSteps: number | null;
} {
  const usual = LEVEL_STEPS[facts.level];
  const factor = LEVEL_FACTOR[facts.level];
  if (facts.steps !== null && facts.steps > 0) {
    const sessionSteps = Math.min(facts.steps, Math.round(facts.sessionSteps ?? 0));
    const steps = facts.steps - sessionSteps;
    return {
      source: "steps",
      level: facts.level,
      factor,
      minutes: (steps - usual) / STEPS_PER_MIN,
      sessionSteps,
      estimatedSteps: null,
    };
  }
  const walk = facts.walkingMin ?? 0;
  return {
    source: walk > 0 ? "walk" : "level",
    level: facts.level,
    factor,
    minutes: walk,
    sessionSteps: 0,
    // What the day type and the walk imply, for the form's placeholder.
    estimatedSteps: usual + walk * STEPS_PER_MIN,
  };
}

/** The day's energy, or null when body data is missing (see missingBody). */
export function dayEnergy(body: Body, facts: DayFacts): Energy | null {
  if (missingBody(body).length) return null;
  const kg = Number(body.weightKg);
  const age = Number(facts.day.slice(0, 4)) - body.birthYear!;
  const bmr = bmrOf(body.sex!, kg, body.heightCm!, age);
  const move = movementOf(facts);
  const [fLo, fHi] = move.factor;
  const c = body.correction ?? 1;
  const baseline = r(bmr * fLo * c, bmr * fHi * c);
  const minutes = move.minutes;
  // The same cost per step both ways: fewer steps than usual lower the day.
  const a = (WALK_MET[0] - 1) * kg * (minutes / 60);
  const b = (WALK_MET[1] - 1) * kg * (minutes / 60);
  const walking = r(Math.min(a, b), Math.max(a, b));

  // Net of resting: one MET for the session's duration is already in the baseline.
  const restOf = (s: DayFacts["sessions"][number]) => kg * ((s.durationMin ?? 0) / 60);
  const net = (s: DayFacts["sessions"][number]): Range => {
    if (!s.burn) return r(0, 0);
    const rest = restOf(s);
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

  const totalDone = add(baseline, walking, done);
  return {
    bmr,
    baseline,
    walking,
    training: { done, planned },
    total: { done: totalDone, withPlan: add(totalDone, planned) },
    inputs: {
      sex: body.sex!,
      age,
      kg,
      heightCm: body.heightCm!,
      level: move.level,
      factor: [fLo, fHi],
      correction: c,
      walk: {
        source: move.source,
        declaredMin: facts.walkingMin ?? 0,
        steps: facts.steps ?? 0,
        sessionSteps: move.sessionSteps,
        levelSteps: LEVEL_STEPS[move.level],
        minutes: Math.round(minutes),
        met: WALK_MET,
        estimatedSteps: move.estimatedSteps,
      },
      sessions: facts.sessions.map((s) => ({
        name: s.name ?? "",
        status: s.status,
        durationMin: s.durationMin ?? 0,
        burn: s.burn,
        rest: Math.round(restOf(s)),
        net: net(s),
        basis: s.basis ?? null,
      })),
    },
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
 * day costs WITH THE PLAN − the deficit (never under 1,200); protein and
 * fat per kg of the day's weight, fat never under 25 % of the energy (below
 * 20 % is under the health minimum, AMDR; ADR-0025); carbs the rest
 * (ADR-0040: no cap — energy above the training band is carbs, not fat);
 * fibre 14 g per 1000 kcal. Sugars, saturated fat and salt stay empty: the
 * automatic maxima apply.
 */
export function dynamicTargets(
  energy: Energy,
  weightKg: string,
  p: DynamicParams,
): {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
} {
  const kg = Number(weightKg);
  const mid = (energy.total.withPlan.low + energy.total.withPlan.high) / 2;
  const kcal = Math.max(1200, Math.round(mid - p.deficitKcal));
  const protein = Math.round(Number(p.proteinGPerKg) * kg);
  const fat = Math.max(
    Math.round(Number(p.fatGPerKg) * kg),
    Math.round((kcal * 0.25) / 9),
  );
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, fat, carbs, fiber: Math.round((kcal / 1000) * 14) };
}

/** Goal presets (the day type editor fills the three fields from one). */
export const GOAL_PRESETS = {
  maintain: { deficitKcal: 0, proteinGPerKg: "1.8", fatGPerKg: "0.8" },
  gain: { deficitKcal: -250, proteinGPerKg: "1.8", fatGPerKg: "0.9" },
  recomp: { deficitKcal: 200, proteinGPerKg: "2.2", fatGPerKg: "0.8" },
  cut: { deficitKcal: 500, proteinGPerKg: "2.2", fatGPerKg: "0.8" },
} as const satisfies Record<string, DynamicParams>;
export type Goal = keyof typeof GOAL_PRESETS;

/** The preset these parameters match, or null when edited by hand. */
export function goalOf(p: {
  deficitKcal: number;
  proteinGPerKg: string;
  fatGPerKg: string;
}): Goal | null {
  const found = (Object.keys(GOAL_PRESETS) as Goal[]).find((g) => {
    const x = GOAL_PRESETS[g];
    return (
      x.deficitKcal === p.deficitKcal &&
      Number(x.proteinGPerKg) === Number(p.proteinGPerKg) &&
      Number(x.fatGPerKg) === Number(p.fatGPerKg)
    );
  });
  return found ?? null;
}
