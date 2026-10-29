/**
 * features/day/meal-groups.ts — Oggi's meals of one role together, the
 * timeline first (interaction.md §6; the developer, 29 Oct: «continua a dare
 * priorità alle categorie piuttosto che alle timeline»): two or more meals
 * named by the same role become one group only when they are neighbours on
 * the timeline — at most 60 minutes from one to the next, with no other
 * kind of entry (a session, a sleep) and no meal of another role between.
 * A lunch at 12:30 and a lunch at 15:00 stay two rows. A single food logged
 * as a meal (coffee, creatine) does not break a run, nor joins it. The group
 * is read as one meal — its lines merged, each scaled by its servings (only
 * the eaten ones while others are still planned) — so its bars, its panel
 * and its score are the whole meal's; its entries stay rows inside. Pure.
 */
import type { DayItem } from "@/core/day";
import { MEAL_ROLE_WORDS } from "./words";

export type MealGroup = { role: string; items: DayItem[]; merged: DayItem };

const isRoleMeal = (i: DayItem, title: string) =>
  i.kind.key === "meal" &&
  !!i.subcategory &&
  MEAL_ROLE_WORDS[i.subcategory] === title &&
  i.status !== "skipped";

/** Neighbours: at most this many minutes from one entry of a group to the next. */
const NEAR_MIN = 60;

/** `titleOf`: each item's title as the timeline shows it. */
export function mealGroups(
  items: readonly DayItem[],
  titleOf: (i: DayItem) => string,
): MealGroup[] {
  const timed = [...items]
    .filter((i) => i.minute !== null)
    .sort((a, b) => a.minute! - b.minute!);
  const runs: [string, DayItem[]][] = [];
  let run: DayItem[] = [];
  const close = () => {
    if (run.length) runs.push([run[0]!.subcategory!, run]);
    run = [];
  };
  for (const i of timed) {
    if (isRoleMeal(i, titleOf(i))) {
      const last = run[run.length - 1];
      if (
        last &&
        (last.subcategory !== i.subcategory || i.minute! - last.minute! > NEAR_MIN)
      )
        close();
      run.push(i);
    } else if (i.kind.key !== "meal") close();
  }
  close();
  return runs
    .filter(([, xs]) => xs.length >= 2)
    .map(([role, xs]) => {
      const sorted = [...xs].sort((a, b) => (a.minute ?? 9999) - (b.minute ?? 9999));
      const first = sorted[0]!;
      // Some eaten, some still planned: the group is what is eaten; the planned rows wait inside.
      const eaten = sorted.filter((i) => i.status !== "planned");
      const counted = eaten.length ? eaten : sorted;
      const { servings: _s, ...values } = first.values;
      return {
        role,
        items: sorted,
        merged: {
          ...first,
          id: "group:" + role + ":" + first.id,
          status: eaten.length ? "done" : "planned",
          values,
          item: null,
          lines: counted.flatMap((i) => {
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
