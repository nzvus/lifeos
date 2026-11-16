/**
 * A pasto's cibi as rows (PAT-30 level 0; target.md B4): each the cibo's own row — its drawing,
 * its name, the amount as the value, its marca — that opens the cibo. Behind the «Cibi» door of
 * the meal box, on the pasto's page and in the Elenco.
 */
import { Box, F, List } from "@lifeos/kit";
import { food } from "@/i18n/food";
import type { MealPart } from "./library";

export function MealFoods({ parts }: { parts: readonly MealPart[] }) {
  return (
    <List label={food.meal.foods}>
      {parts.map((p, i) => (
        <Box
          key={i}
          density="row"
          rail={false}
          entry={{
            fam: "food",
            of: Object.keys(p.of).length > 0 ? p.of : { kind: "ingredient" },
            title: p.name,
            value: F.num(Number(p.quantity), p.unit),
            ...(p.brand ? { meta: p.brand } : {}),
            ...(p.href ? { href: p.href, hrefLabel: food.meal.openFood(p.name) } : {}),
          }}
        />
      ))}
    </List>
  );
}
