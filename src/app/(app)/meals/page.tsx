/**
 * app/(app)/meals/page.tsx — URL /meals: meals with per-serving totals,
 * instant search (also by ingredient) and smart ordering.
 */
import { requireContext } from "@/app/_server/owner";
import { PageHeader } from "@/ui/PageHeader";
import { FoodNav } from "@/features/nutrition/nav/FoodNav";
import { getDb } from "@/app/_server/runtime";
import { listMeals } from "@/core/nutrition/repositories/meals";
import { getUsage, USAGE_WINDOW_DAYS } from "@/core/nutrition/repositories/usage";
import { addDays, todayIn } from "@/core/shared/dates";
import { deleteMealAction, restoreMealAction } from "./actions";
import { MealBrowser } from "@/features/nutrition/meals/MealBrowser";

export default async function MealsPage() {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const [meals, usage] = await Promise.all([
    listMeals(db, owner),
    getUsage(db, owner, addDays(todayIn(settings.timezone), -USAGE_WINDOW_DAYS)),
  ]);
  return (
    <>
      <FoodNav current="meals" t={t} />
      <PageHeader title={t.meals.title} />
      <MealBrowser
        meals={meals}
        usage={usage.meals}
        locale={settings.locale}
        initialSort={{
          sort: settings.preferences.listSort,
          per: settings.preferences.listPer,
        }}
        t={{
          meals: t.meals,
          nutrients: t.nutrients,
          search: t.search,
          macro: t.macro,
          moments: t.moments,
          label: t.label,
          quality: t.quality,
          ratings: t.ratings,
          mealQuality: t.mealQuality,
          actions: t.actions,
        }}
        trash={deleteMealAction}
        restore={restoreMealAction}
      />
    </>
  );
}
