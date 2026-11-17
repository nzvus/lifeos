/**
 * What an esercizio is, as the registry declares it (MOD-01; target.md §7.4, his «ap yc» of
 * 17 Nov): its equipment, how its sides work, the muscles it can train, and the load step
 * that follows from them (TR-02). Pure.
 */
import { dumbbellStep, loadStep } from "./progression";

export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

/**
 * How its sides work (§7.4 q3): both together; one side at a time (each side its own set,
 * TR-13); both together with the load typed per side (the total is twice what he types).
 */
export const SIDES = ["both", "one_at_a_time", "per_side"] as const;
export type Sides = (typeof SIDES)[number];

/** The muscle groups an esercizio names, main first (TR-03, TR-25); his data uses these. */
export const MUSCLES = [
  "chest",
  "front_delts",
  "side_delts",
  "rear_delts",
  "triceps",
  "biceps",
  "forearms",
  "lats",
  "upper_back",
  "lower_back",
  "abs",
  "obliques",
  "quads",
  "hamstrings",
  "glutes",
  "adductors",
  "calves",
] as const;

/** Older values were saved in Italian («manubri»): one name per idea, read as the key. */
const EQUIPMENT_ALIASES: Record<string, Equipment> = {
  bilanciere: "barbell",
  manubri: "dumbbell",
  manubrio: "dumbbell",
  cavi: "cable",
  macchina: "machine",
  sbarra: "bodyweight",
  parallele: "bodyweight",
  "corpo libero": "bodyweight",
};

export function equipmentOf(v: string | null | undefined): Equipment | null {
  if (!v) return null;
  const k = v.trim().toLowerCase();
  return (EQUIPMENT as readonly string[]).includes(k)
    ? (k as Equipment)
    : (EQUIPMENT_ALIASES[k] ?? null);
}

/** The old yes/no `unilateral` read as sides, when `sides` is not set. */
export function sidesOf(sides: string | null | undefined, unilateral: boolean): Sides {
  return (SIDES as readonly string[]).includes(sides ?? "")
    ? (sides as Sides)
    : unilateral
      ? "one_at_a_time"
      : "both";
}

/**
 * One tap of load on the stored total (§7.4 q2): his own step for this exercise wins; else by
 * its equipment — dumbbells by the rack's pairs, a machine's stack 5 kg, cables 2,5 kg, a
 * barbell or anything else as TR-02 (2,5 kg from 20 kg, else 1 kg).
 */
export function stepFor(
  e: { equipment: Equipment | null; loadStepKg?: number | null | undefined },
  kg: number,
): number {
  if (e.loadStepKg && e.loadStepKg > 0) return e.loadStepKg;
  if (e.equipment === "dumbbell") return dumbbellStep(kg);
  if (e.equipment === "machine") return 5;
  if (e.equipment === "cable") return 2.5;
  return loadStep(kg);
}
