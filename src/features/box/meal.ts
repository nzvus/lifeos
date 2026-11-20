/**
 * A meal's slots for the one `MealBox` beyond its bars (PAT-102, §139–§141): its cibi (ATT-06) and
 * nutrients (ATT-07) are the bars and the mode's panel now; what is left is the context (where it
 * comes from and his note, as words) and the porzioni where no stepper says them. The cost is
 * level 2 (ATT-11): on its page, not in the box. Shared by the day, a pasto's page and the Elenco.
 */
import type { BoxDetails, PlanSlot } from "@lifeos/kit";
import { common } from "@/i18n/common";
import { planSlots } from "./slots";

export function mealSlots({
  details,
  stepper = false,
}: {
  details?: BoxDetails | null | undefined;
  /** The place edits the porzioni itself (the day's − × +): no `servings` word then. */
  stepper?: boolean;
}): PlanSlot[] {
  const d = details ?? { stats: [], lines: [], foot: "" };
  const serving = d.stats.find((s) => s.label === common.slots["servings"]);
  const words = [
    ...d.stats
      .filter((s) => s !== serving && s.label !== common.doors.cost)
      .map((s) => s.label + " " + s.value),
    ...(d.foot ? [d.foot] : []),
  ];
  return planSlots("meal", {
    ...(serving && !stepper ? { servings: { word: serving.value } } : {}),
    ...(words.length > 0 ? { context: { words } } : {}),
  });
}

/** The box's words (PAT-81): its two levels, the day and the meal (§143). */
export const MEAL_WORDS = { day: common.levels.day, meal: common.levels.meal };

/** The cost a box no longer shows (ATT-11, level 2): for the page that holds the box. */
export const mealCost = (details?: BoxDetails | null) =>
  details?.stats.find((s) => s.label === common.doors.cost) ?? null;
