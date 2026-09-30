/**
 * app/(app)/meals/page.tsx — URL /meals: meals with per-serving totals,
 * instant search (also by ingredient) and smart ordering.
 */
import { requireContext } from "@/app/_server/owner";
import { PageHeader } from "@/ui/PageHeader";
import { getDb } from "@/app/_server/runtime";
import { mealTags } from "@/core/nutrition/quality-summary";
import { tagsByIngredient } from "@/core/nutrition/repositories/ingredients";
import { listMeals } from "@/core/nutrition/repositories/meals";
import { averageScores, ratingsByMeal } from "@/core/nutrition/repositories/ratings";
import { getUsage, USAGE_WINDOW_DAYS } from "@/core/nutrition/repositories/usage";
import { addDays, todayIn } from "@/core/shared/dates";
import { MealBrowser } from "@/features/nutrition/meals/MealBrowser";

export default async function MealsPage() {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const [meals, usage, ratings, tagMap] = await Promise.all([
    listMeals(db, owner),
    getUsage(db, owner, addDays(todayIn(settings.timezone), -USAGE_WINDOW_DAYS)),
    ratingsByMeal(db, owner),
    tagsByIngredient(db, owner),
  ]);
  return (
    <>
      <PageHeader
        title={t.meals.title}
        action={{ href: "/meals/new", label: t.meals.new }}
      />
      <MealBrowser
        meals={meals}
        usage={usage.meals}
        ratings={averageScores(ratings)}
        tags={Object.fromEntries(
          meals.map((m) => [
            m.id,
            mealTags(
              m.lines.map((l) => l.ingredientId),
              tagMap,
            ).map(({ name, icon }) => ({ name, icon })),
          ]),
        )}
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
        }}
      />
    </>
  );
}
