/**
 * features/nutrition/nav/FoodNav.tsx — the Food tab's three views (design
 * review S2): Meals | Ingredients | Pantry, at the top of each. The pantry
 * was a button inside Ingredients and easy to miss.
 */
import { Carrot, Package, UtensilsCrossed } from "lucide-react";
import type { Messages } from "@/i18n";
import { SubNav } from "@/ui/SubNav";

export function FoodNav({
  current,
  t,
}: {
  current: "meals" | "ingredients" | "pantry";
  t: Pick<Messages, "nav" | "pantry">;
}) {
  return (
    <SubNav
      label={t.nav.food}
      current={current}
      items={[
        {
          key: "meals",
          href: "/meals",
          label: t.nav.meals,
          icon: <UtensilsCrossed size={16} aria-hidden="true" />,
        },
        {
          key: "ingredients",
          href: "/ingredients",
          label: t.nav.ingredients,
          icon: <Carrot size={16} aria-hidden="true" />,
        },
        {
          key: "pantry",
          href: "/pantry",
          label: t.pantry.title,
          icon: <Package size={16} aria-hidden="true" />,
        },
      ]}
    />
  );
}
