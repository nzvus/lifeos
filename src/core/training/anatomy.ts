/**
 * core/training/anatomy.ts — the closed lists that describe what an exercise
 * trains (S07): muscle groups, grouped into six regions (one colour each in
 * every theme, --color-muscle-*), and movement patterns (one icon each).
 * Labels live in i18n/.
 *
 * An exercise stores its groups in order: the FIRST is the primary target,
 * the others are secondary. Weekly volume counts a set as 1 for the primary
 * group and 0.5 for each secondary one (the usual convention for "sets per
 * muscle group per week").
 *
 * `suggestAnatomy` guesses pattern and groups from a name ("Incline DB
 * press" -> horizontal press; chest, front delts, triceps). It is a starting
 * point the user can change, never applied over a choice already made.
 */
import { normalize } from "../shared/search";

export const MUSCLE_REGIONS = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "core",
  "legs",
] as const;
export type MuscleRegion = (typeof MUSCLE_REGIONS)[number];

/** Every muscle group and its region, in display order. */
export const MUSCLE_GROUP_REGION = {
  chest: "chest",
  lats: "back",
  upper_back: "back",
  lower_back: "back",
  front_delts: "shoulders",
  side_delts: "shoulders",
  rear_delts: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  abs: "core",
  obliques: "core",
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  adductors: "legs",
  calves: "legs",
} as const satisfies Record<string, MuscleRegion>;
export type MuscleGroup = keyof typeof MUSCLE_GROUP_REGION;
export const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_REGION) as MuscleGroup[];

export function isMuscleGroup(x: string): x is MuscleGroup {
  return Object.hasOwn(MUSCLE_GROUP_REGION, x);
}

/** The region of the primary group, or null (cardio, unclassified). */
export function regionOf(groups: readonly string[]): MuscleRegion | null {
  const first = groups[0];
  return first && isMuscleGroup(first) ? MUSCLE_GROUP_REGION[first] : null;
}

/** How much one set counts for each of the exercise's groups. */
export function setShares(groups: readonly string[]): [MuscleGroup, number][] {
  return groups
    .filter(isMuscleGroup)
    .map((g, i): [MuscleGroup, number] => [g, i === 0 ? 1 : 0.5]);
}

export const MOVEMENT_PATTERNS = [
  "horizontal_press",
  "vertical_press",
  "fly",
  "horizontal_pull",
  "vertical_pull",
  "rear_fly",
  "lateral_raise",
  "curl",
  "triceps_extension",
  "squat",
  "leg_press",
  "lunge",
  "hinge",
  "leg_curl",
  "leg_extension",
  "calf_raise",
  "crunch",
  "leg_raise",
  "plank",
  "run",
  "bike",
  "other",
] as const;
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

export function isMovementPattern(x: string): x is MovementPattern {
  return (MOVEMENT_PATTERNS as readonly string[]).includes(x);
}

type Rule = [RegExp, MovementPattern, MuscleGroup[]];

/**
 * First match wins, so the specific rules come first ("leg press" before
 * "press", "leg curl" before "curl", "row" before "chest press" so that a
 * chest-supported row stays a row). Names are matched without case or
 * accents; common misspellings ("peck", "extention") are accepted.
 */
const RULES: Rule[] = [
  [/treadmill|tapis|\brun|corsa/, "run", []],
  [/bike|cyclette|cycl/, "bike", []],
  [
    /reverse pe(c|ck)k? ?deck|rear delt|face ?pull|reverse fly/,
    "rear_fly",
    ["rear_delts", "upper_back"],
  ],
  [/pe(c|ck)k? ?(deck|back|fly)|\bfly|croci/, "fly", ["chest", "front_delts"]],
  [/(lateral|front) raise|alzate/, "lateral_raise", ["side_delts"]],
  [
    /pulldown|pull ?up|chin ?up|lat machine|trazioni/,
    "vertical_pull",
    ["lats", "biceps", "rear_delts"],
  ],
  [
    /\brow|rematore|pulley/,
    "horizontal_pull",
    ["upper_back", "lats", "rear_delts", "biceps"],
  ],
  [
    /tricep|pushdown|push ?down|skull|french|kickback|\bocte\b/,
    "triceps_extension",
    ["triceps"],
  ],
  [
    /shoulder press|overhead press|military|\blento\b|arnold/,
    "vertical_press",
    ["front_delts", "side_delts", "triceps"],
  ],
  [/(leg|femoral|hamstring)s? curl/, "leg_curl", ["hamstrings"]],
  [/curl/, "curl", ["biceps", "forearms"]],
  [/leg press|pressa/, "leg_press", ["quads", "glutes", "adductors"]],
  [/leg extension|leg ext\b/, "leg_extension", ["quads"]],
  [/split squat|lunge|affond|bulgar|step ?up/, "lunge", ["quads", "glutes", "adductors"]],
  [/squat|hack/, "squat", ["quads", "glutes", "adductors"]],
  [/hip thrust|glute bridge|ponte/, "hinge", ["glutes", "hamstrings"]],
  [
    /deadlift|stacco|\brdl\b|good morning|hyperext/,
    "hinge",
    ["hamstrings", "glutes", "lower_back"],
  ],
  [/calf|polpacc/, "calf_raise", ["calves"]],
  [/legs? raises?|knee raise|leg lift/, "leg_raise", ["abs", "obliques"]],
  [/crunch|abdominal|addominal|sit ?up|\babs?\b/, "crunch", ["abs"]],
  [/plank/, "plank", ["abs", "obliques"]],
  [/incline|inclinat/, "horizontal_press", ["chest", "front_delts", "triceps"]],
  [
    /bench|chest press|push ?up|piegamenti|\bdips?\b|press/,
    "horizontal_press",
    ["chest", "triceps", "front_delts"],
  ],
];

export function suggestAnatomy(name: string): {
  pattern: MovementPattern | null;
  muscleGroups: MuscleGroup[];
} {
  const n = normalize(name);
  for (const [re, pattern, muscleGroups] of RULES)
    if (re.test(n)) return { pattern, muscleGroups: [...muscleGroups] };
  return { pattern: null, muscleGroups: [] };
}
