/**
 * A pasto's cibi as rows (PAT-30 level 0; target.md B4): each the cibo's own row — its drawing,
 * its name, the amount as the value, its marca — that opens the cibo. Behind the «Cibi» door of
 * the meal box (its `lines` slot), on the pasto's page and in the Elenco.
 */
import { F, type BoxEntry } from "@lifeos/kit";
import { food } from "@/i18n/food";
import type { MealPart } from "./library";

export const partRows = (parts: readonly MealPart[]): BoxEntry[] =>
  parts.map((p) => ({
    fam: "food",
    of: Object.keys(p.of).length > 0 ? p.of : { kind: "ingredient" },
    title: p.name,
    value: F.num(Number(p.quantity), p.unit),
    ...(p.brand ? { meta: p.brand } : {}),
    ...(p.href ? { href: p.href, hrefLabel: food.meal.openFood(p.name) } : {}),
  }));
