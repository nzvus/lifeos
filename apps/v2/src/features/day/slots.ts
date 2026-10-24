/**
 * features/day/slots.ts — a day's meal blocks as targets (dossiers/
 * day-templates.md §5, acceptance 5): the day's model gives each meal role a
 * share of kcal and protein; × the day's targets that is the block's own
 * numbers (E5 `slotTargets`' rule, carbs and fat by the kcal share). A meal's thin
 * bars measure against its block, and the block's meals together give the
 * score's «adatto al blocco» (core/food `blockFit`). Pure.
 */
import type { DayItem, FoodTargets } from "@/core/day";
import { blockFit } from "@/core/food/score";
import { lineTotals } from "@/core/food/totals";
import type { ResolvedBlock } from "@/core/plans";

/** Role → the block's targets, shaped as the day's (the bars read them alike). */
export function daySlots(
  blocks: readonly ResolvedBlock[],
  day: FoodTargets | null,
): Map<string, FoodTargets> {
  const out = new Map<string, FoodTargets>();
  if (!day) return out;
  for (const b of blocks) {
    const role = String(b.defaults?.["role"] ?? "");
    const k = b.shares?.kcal;
    if (b.kind !== "meal" || !role || k === undefined || out.has(role)) continue;
    // E5 `slotTargets`' rule: protein by its own share (the kcal one when unset), the rest by kcal.
    const p = b.shares!.protein ?? k;
    const s = {
      kcal: Math.round(day.kcal * k),
      protein: Math.round((day.protein ?? 0) * p),
      carbs: Math.round((day.carbs ?? 0) * k),
      fat: Math.round((day.fat ?? 0) * k),
    };
    out.set(role, {
      ...day,
      kcal: s.kcal,
      protein: day.protein === null ? null : s.protein,
      carbs: day.carbs === null ? null : s.carbs,
      fat: day.fat === null ? null : s.fat,
      fibre: day.fibre === null ? null : Math.round(day.fibre * k),
      sugars: day.sugars * k,
      saturatedFat: day.saturatedFat * k,
      salt: day.salt * k,
    });
  }
  return out;
}

const servingsOf = (i: DayItem) =>
  typeof i.values["servings"] === "string" ? i.values["servings"] : null;

/**
 * Each block's fit: its role's meals on the day (eaten, and planned ones
 * still in the plan) against its kcal and protein. Role → 0–1.
 */
export function slotFits(
  items: readonly DayItem[],
  slots: ReadonlyMap<string, FoodTargets>,
): Map<string, number> {
  const got = new Map<string, { kcal: number; protein: number }>();
  for (const i of items) {
    if (i.kind.key !== "meal" || !i.subcategory || !slots.has(i.subcategory)) continue;
    if (
      i.status === "skipped" ||
      (i.status === "planned" && i.values["leftOut"] === true)
    )
      continue;
    const t = lineTotals(i.lines, servingsOf(i));
    const g = got.get(i.subcategory) ?? { kcal: 0, protein: 0 };
    got.set(i.subcategory, {
      kcal: g.kcal + Number(t["kcal"] ?? 0),
      protein: g.protein + Number(t["protein"] ?? 0),
    });
  }
  const out = new Map<string, number>();
  for (const [role, g] of got) {
    const s = slots.get(role)!;
    const f = blockFit(g, { kcal: s.kcal, protein: s.protein ?? 0 });
    if (f !== null) out.set(role, f);
  }
  return out;
}
