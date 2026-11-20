/**
 * A meal's slots for the one `MealBox` (§132 c; his «yc» of §133 = (a), the plan wins): `lines`
 * (its cibi as rows), `limits` (every nutrient, the limits among them; drawn as today's
 * «Nutrienti»), `context` (where it comes from and his note, as words). The cost is level 2
 * (ATT-11): on its page, not in the box. Shared by the day, a pasto's page and the Elenco.
 */
import type { BoxDetails, BoxEntry, NutrientsData, PlanSlot } from "@lifeos/kit";
import { common } from "@/i18n/common";
import { planSlots } from "./slots";

export function mealSlots({
  data,
  rows,
  details,
  stepper = false,
}: {
  data: NutrientsData;
  /** Its cibi; the day's lines when the place has no richer rows. */
  rows?: BoxEntry[] | undefined;
  details?: BoxDetails | null | undefined;
  /** The place edits the porzioni itself (the day's − × +): no `servings` word then. */
  stepper?: boolean;
}): PlanSlot[] {
  const d = details ?? { stats: [], lines: [], foot: "" };
  const cibi =
    rows ??
    d.lines.map((l) => {
      // «50 g · 21 kcal · ≈ 0,14 €»: the amount is the row's value, the rest its second line,
      // as a pasto's cibo shows its marca there (one cibo drawn one way).
      const [amount = "", ...rest] = l.value.split(" · ");
      return {
        fam: "food",
        of: { kind: "ingredient" },
        title: l.label,
        value: amount,
        ...(rest.length > 0 ? { meta: rest.join(" · ") } : {}),
      };
    });
  const serving = d.stats.find((s) => s.label === common.slots["servings"]);
  const words = [
    ...d.stats
      .filter((s) => s !== serving && s.label !== common.doors.cost)
      .map((s) => s.label + " " + s.value),
    ...(d.foot ? [d.foot] : []),
  ];
  return planSlots("meal", {
    ...(cibi.length > 0 ? { lines: { rows: cibi } } : {}),
    limits: { nutrients: data },
    ...(serving && !stepper ? { servings: { word: serving.value } } : {}),
    ...(words.length > 0 ? { context: { words } } : {}),
  });
}

/** The cost a box no longer shows (ATT-11, level 2): for the page that holds the box. */
export const mealCost = (details?: BoxDetails | null) =>
  details?.stats.find((s) => s.label === common.doors.cost) ?? null;
