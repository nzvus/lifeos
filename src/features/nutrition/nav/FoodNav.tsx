/**
 * features/nutrition/nav/FoodNav.tsx — the Food area's views (design
 * review S2; ADR-0038): Meals | Ingredients | Pantry | Trends (how the days
 * went, /profiles), at the top of each.
 */
import { Carrot, Package, TrendingUp, UtensilsCrossed } from "lucide-react";
import type { Messages } from "@/i18n";
import { SubNav } from "@/ui/SubNav";

export function FoodNav({
  current,
  t,
}: {
  current: "meals" | "ingredients" | "pantry" | "trends";
  t: Pick<Messages, "nav" | "pantry" | "progress">;
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
        {
          key: "trends",
          href: "/profiles",
          label: t.progress.trends,
          icon: <TrendingUp size={16} aria-hidden="true" />,
        },
      ]}
    />
  );
}
