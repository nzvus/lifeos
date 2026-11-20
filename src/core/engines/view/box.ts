/**
 * The Box's plan (Deliver ③; PAT-30, VIS-40, `round-1.md` D1): what one card of a thing shows at
 * each level, for every voce, object and the obiettivo, read from `docs/spec/orca/attributes.md`
 * (its Level column) and kept equal to it by `box.test.ts`. Level 0 is the closed head (after the
 * icon and the name, which every Box has), level 1 the Box open in place, level 2 its page. Each
 * slot names the instrument that draws it (MOD-58, VIS-102). Pure; the values come from the place
 * that holds the data, the drawing from the kit.
 *
 * A type with no rows in the table (no data of his yet, PRD-02) has an empty plan: icon and name
 * closed, its fields as rows when open (PAT-30, PAT-13).
 */
import { INSTRUMENT_OF, type Instrument } from "./readings";
import type { Question } from "../../kinds";
import type { Level } from "./view";

export type BoxSlot = {
  /** Its row in `orca/attributes.md`. */
  att: string;
  /** The code's name for it: the field's key, or the computed value's. */
  key: string;
  level: Level;
  question: Question;
  /** Set only when many members turn the question's instrument into cells (VIS-102). */
  cells?: true;
  /** The registry field it is, `type.field`; none when computed. */
  field?: string;
};

/** The key the obiettivo's plan goes by: it has no registry type (OBJ-58, a reference). */
export const GOAL = "goal";

type Row = [
  att: string,
  key: string,
  level: Level,
  question: Question,
  extra?: "cells" | string,
];
const s = (rows: Row[]): BoxSlot[] =>
  rows.map(([att, key, level, question, extra]) => ({
    att,
    key,
    level,
    question,
    ...(extra === "cells" ? { cells: true as const } : extra ? { field: extra } : {}),
  }));

/** By registry key (`eslint/type-keys.json`), in the table's order. */
export const BOX_PLAN: Record<string, BoxSlot[]> = {
  meal: s([
    ["ATT-01", "role", 0, "name", "meal.role"],
    ["ATT-02", "time", 0, "rhythm"],
    ["ATT-03", "kcal", 0, "reach"],
    ["ATT-04", "macros", 0, "reach"],
    ["ATT-05", "score", 0, "verdict"],
    ["ATT-06", "lines", 1, "composition"],
    ["ATT-07", "limits", 1, "reach"],
    ["ATT-08", "servings", 1, "name", "meal.servings"],
    ["ATT-09", "estimated", 0, "name", "meal.estimated"],
    ["ATT-10", "context", 1, "name"],
    ["ATT-11", "cost", 2, "source"],
    ["ATT-12", "sources", 2, "source"],
  ]),
  intake: s([
    ["ATT-13", "dose", 0, "reach"],
    ["ATT-14", "taken", 0, "yes/no"],
  ]),
  water: s([
    ["ATT-15", "ml", 0, "reach", "water.ml"],
    ["ATT-16", "time", 0, "rhythm"],
  ]),
  session: s([
    ["ATT-17", "durationMin", 0, "rhythm", "session.durationMin"],
    ["ATT-18", "score", 0, "verdict"],
    ["ATT-19", "exercises", 1, "composition"],
    ["ATT-20", "readiness", 1, "name"],
  ]),
  steps: s([
    ["ATT-25", "steps", 0, "reach", "steps.steps"],
    ["ATT-26", "onFeetH", 1, "reach", "steps.onFeetH"],
  ]),
  weigh_in: s([
    ["ATT-27", "weightKg", 0, "trend", "weigh_in.weightKg"],
    ["ATT-28", "conditions", 1, "name", "weigh_in.fasted"],
    ["ATT-29", "waistCm", 1, "trend", "weigh_in.waistCm"],
  ]),
  sleep: s([
    ["ATT-30", "night", 0, "rhythm"],
    ["ATT-31", "hours", 0, "reach"],
    ["ATT-32", "regularity", 1, "spread"],
    ["ATT-33", "quality", 1, "name", "sleep.quality"],
  ]),
  checkin: s([["ATT-34", "mood", 0, "trend", "checkin.mood"]]),
  food: s([
    ["ATT-61", "kcal100", 0, "reach"],
    ["ATT-35", "nutrients", 1, "composition"],
    ["ATT-36", "score", 0, "verdict"],
    ["ATT-37", "group", 0, "name"],
    ["ATT-38", "nova", 1, "name", "food.nova"],
    ["ATT-39", "usedIn", 2, "source"],
  ]),
  format: s([["ATT-40", "pricePerKg", 1, "trend"]]),
  recipe: s([
    ["ATT-62", "kcal", 0, "reach"],
    ["ATT-41", "lines", 1, "composition"],
    ["ATT-42", "score", 0, "verdict"],
  ]),
  exercise: s([
    ["ATT-43", "e1rm", 1, "trend"],
    ["ATT-44", "facts", 1, "name", "exercise.pattern"],
  ]),
  routine: s([["ATT-45", "exercises", 1, "composition"]]),
  block: s([["ATT-46", "every", 0, "rhythm", "cells"]]),
  cycle: s([["ATT-47", "today", 0, "rhythm", "cells"]]),
  [GOAL]: s([
    ["ATT-51", "pace", 0, "reach"],
    ["ATT-52", "reachedOn", 1, "prediction"],
  ]),
};

/** The plan of a type, split by level; an unknown type gets the empty plan. */
export function boxPlan(key: string): {
  head: BoxSlot[];
  open: BoxSlot[];
  page: BoxSlot[];
} {
  const all = BOX_PLAN[key] ?? [];
  return {
    head: all.filter((x) => x.level === 0),
    open: all.filter((x) => x.level === 1),
    page: all.filter((x) => x.level === 2),
  };
}

/** The instrument that draws a slot (VIS-102): its question's, or cells for many members. */
export function instrumentOf(x: BoxSlot): Instrument {
  return x.cells ? "cells" : INSTRUMENT_OF[x.question];
}
