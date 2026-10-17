/**
 * core/goals/write.ts — a new goal (V-09 editor): the person gives what,
 * the value and, for the weight, the date; the app derives the rest
 * (memory: ask the inputs, derive the numbers). A goal changes from a day
 * on: the new one starts today and the old one of the same metric stays in
 * the history (`inForce` reads the latest).
 */
import type { Db } from "../db/db";
import { goals } from "../db/schema";
import type { IsoDate } from "../engines/time";
import type { Owner } from "../identity/owner";

export const GOAL_KINDS = ["weight", "steps", "study"] as const;
export type GoalKind = (typeof GOAL_KINDS)[number];
export type GoalInput = { kind: string; value: string; by: string; weekdays: string };
export type GoalError = "kind" | "value" | "by";

const LIMITS: Record<GoalKind, [number, number]> = {
  weight: [30, 250],
  steps: [500, 50000],
  study: [0.5, 80],
};

/** Pure: the typed goal, or what is wrong; the weight's date must be after today. */
export function checkGoal(
  g: GoalInput,
  today: IsoDate,
):
  | { ok: true; kind: GoalKind; value: string; by: IsoDate | null; weekdays: boolean }
  | { ok: false; at: Partial<Record<GoalError, true>> } {
  const kind = GOAL_KINDS.find((k) => k === g.kind);
  if (!kind) return { ok: false, at: { kind: true } };
  const at: Partial<Record<GoalError, true>> = {};
  const raw = g.value.trim().replace(",", ".");
  const [lo, hi] = LIMITS[kind];
  if (!/^\d+(\.\d{1,2})?$/.test(raw) || Number(raw) < lo || Number(raw) > hi)
    at.value = true;
  const by = g.by.trim();
  if (kind === "weight" && by !== "" && (!/^\d{4}-\d{2}-\d{2}$/.test(by) || by <= today))
    at.by = true;
  if (Object.keys(at).length > 0) return { ok: false, at };
  return {
    ok: true,
    kind,
    value: raw,
    by: kind === "weight" && by !== "" ? by : null,
    weekdays: kind === "steps" && g.weekdays === "yes",
  };
}

export async function createGoal(
  db: Db,
  owner: Owner,
  g: { kind: GoalKind; value: string; by: IsoDate | null; weekdays: boolean },
  today: IsoDate,
): Promise<string> {
  const metric =
    g.kind === "weight"
      ? { source: "weight" }
      : g.kind === "steps"
        ? {
            source: "steps",
            what: "passi",
            unit: "passi",
            per: "day",
            days: g.weekdays ? "weekdays" : null,
          }
        : { source: "study", what: "studio", unit: "h", per: "week", days: null };
  const [row] = await db
    .insert(goals)
    .values({
      userId: owner.id,
      metric,
      target: g.kind === "weight" ? "reach" : "at_least",
      value: g.value,
      byDate: g.by,
      sinceDay: today,
    })
    .returning({ id: goals.id });
  return row!.id;
}
