/**
 * features/day/meal-groups.ts — Oggi's meals of one role together (the
 * developer's pick, 2026-10-25): two or more meals named by the same role
 * (four entries of «Cena») become one group, read as one meal — its lines
 * merged, each scaled by its servings — so its bars, its panel and its
 * score are the whole dinner's; its entries stay rows of their own inside.
 * Coffee, creatine and other named things stay out (their title is not the
 * role's). Pure.
 */
import type { DayItem } from "@/core/day";
import { MEAL_ROLE_WORDS } from "./words";

export type MealGroup = { role: string; items: DayItem[]; merged: DayItem };

const isRoleMeal = (i: DayItem, title: string) =>
  i.kind.key === "meal" &&
  !!i.subcategory &&
  MEAL_ROLE_WORDS[i.subcategory] === title &&
  i.status !== "skipped";

/** `titleOf`: each item's title as the timeline shows it. */
export function mealGroups(
  items: readonly DayItem[],
  titleOf: (i: DayItem) => string,
): MealGroup[] {
  const by = new Map<string, DayItem[]>();
  for (const i of items)
    if (isRoleMeal(i, titleOf(i)))
      by.set(i.subcategory!, [...(by.get(i.subcategory!) ?? []), i]);
  return [...by]
    .filter(([, xs]) => xs.length >= 2)
    .map(([role, xs]) => {
      const sorted = [...xs].sort((a, b) => (a.minute ?? 9999) - (b.minute ?? 9999));
      const first = sorted[0]!;
      const { servings: _s, ...values } = first.values;
      return {
        role,
        items: sorted,
        merged: {
          ...first,
          id: "group:" + role,
          status: sorted.every((i) => i.status === "planned") ? "planned" : "done",
          values,
          item: null,
          lines: sorted.flatMap((i) => {
            const times =
              Number(
                typeof i.values["servings"] === "string" ? i.values["servings"] : "1",
              ) || 1;
            return i.lines.map((l) => ({
              ...l,
              id: i.id + ":" + l.id,
              quantity: String(Number(l.quantity) * times),
            }));
          }),
        },
      };
    });
}
