/**
 * A type's slots for the kit's `PlanBox` (Deliver ③, proposal §132; PAT-30, VIS-102): the place
 * gives only data, by slot key, in the shape of the slot's instrument; this orders them by the
 * type's plan (`boxPlan`, level 1), labels them from i18n by key, leaves out what has no data
 * (PRD-22) and refuses a shape that is not the instrument's — a type never draws its own box.
 */
import type { ChartData, NutrientsData, PlanSlot } from "@lifeos/kit";
import { boxPlan, instrumentOf, type Instrument } from "@/core/engines/view";
import { common } from "@/i18n/common";

export type SlotData =
  | { word: string }
  | { words: string[] }
  | { trend: ChartData; value: string; caption?: string }
  | { nutrients: NutrientsData; value?: string };
export type Supplied = Partial<Record<string, SlotData>>;

/** The instruments each shape may draw (VIS-102): names may also list a composition's members. */
const SHAPE_OF: Record<string, Instrument[]> = {
  word: ["word"],
  words: ["word", "parts"],
  trend: ["line"],
  nutrients: ["parts"],
};
const shape = (d: SlotData) => Object.keys(d).find((k) => k in SHAPE_OF) ?? "?";

export function planSlots(type: string, supplied: Supplied): PlanSlot[] {
  const open = boxPlan(type).open;
  for (const k of Object.keys(supplied))
    if (!open.some((x) => x.key === k))
      throw new Error(`box: «${k}» is not a level-1 slot of ${type}`);
  return open.flatMap((x) => {
    const d = supplied[x.key];
    if (!d) return [];
    const want = instrumentOf(x);
    if (!SHAPE_OF[shape(d)]?.includes(want))
      throw new Error(`box: ${type}.${x.key} is drawn as ${want}, not as ${shape(d)}`);
    return [{ key: x.key, label: common.slots[x.key] ?? x.key, ...d } as PlanSlot];
  });
}

/** The slot keys of a type's open level a place has not supplied: what its box still lacks. */
export function missingSlots(type: string, supplied: Supplied): string[] {
  return boxPlan(type)
    .open.filter((x) => x.key !== "score" && !supplied[x.key])
    .map((x) => x.key);
}
