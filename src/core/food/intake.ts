/**
 * core/food/intake.ts — what makes something an «assunzione» (FOOD-44,
 * ADR-0060, dossiers/objects.md §4–§5; his pick 3 Nov: as recommended): a
 * property of the item, not of the log. Stored when he set it; else proposed
 * when the food has no energy to speak of (≤ 4 kcal/100, the EU «energy-free»
 * line, Reg. 1924/2006) or carries caffeine or creatine. Its dose is what one
 * tap logs: the stored one, else the quantity of his last time. Pure.
 */
export const INTAKE_FIELDS = ["intake", "dose", "doseName"] as const;
/** Reg. (EC) 1924/2006 Annex, «energy-free»: ≤ 4 kcal per 100 ml. */
export const ENERGY_FREE_KCAL = 4;
/** Over this, logging it alone asks «ha calorie: è un pasto?» (EU «low energy», drinks). */
export const LOW_ENERGY_KCAL = 20;

export type IntakeOf = {
  /** What one tap logs, in the food's unit. */
  dose: string;
  /** How a dose is called («capsula»), when it has a name. */
  doseName: string | null;
  /** Set by him (true) or proposed by the rule (false). */
  chosen: boolean;
};

export function intakeOf(f: {
  per100: Readonly<Record<string, string>>;
  /** Its caffeine/creatine per 100, when any. */
  compounds?: Readonly<Record<string, string>>;
  /** Stored: "intake" (true/false), "dose", "doseName". */
  stored: Readonly<Record<string, string | boolean>>;
  lastQty: string | null;
}): IntakeOf | null {
  const set = f.stored["intake"];
  const kcal = f.per100["kcal"];
  const proposed =
    (kcal !== undefined && Number(kcal) <= ENERGY_FREE_KCAL) ||
    Number(f.compounds?.["caffeine"] ?? 0) > 0 ||
    Number(f.compounds?.["creatine"] ?? 0) > 0;
  if (set === false || (set !== true && !proposed)) return null;
  const dose =
    typeof f.stored["dose"] === "string" && Number(f.stored["dose"]) > 0
      ? String(Number(f.stored["dose"]))
      : f.lastQty && Number(f.lastQty) > 0
        ? String(Number(f.lastQty))
        : null;
  if (dose === null) return null;
  return {
    dose,
    doseName: typeof f.stored["doseName"] === "string" ? f.stored["doseName"] : null,
    chosen: set === true,
  };
}
