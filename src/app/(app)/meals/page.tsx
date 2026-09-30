/**
 * app/(app)/meals/page.tsx — URL /meals: meals with per-serving totals,
 * instant search (also by ingredient) and smart ordering.
 */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listMeals } from "@/core/nutrition/repositories/meals";
import { getUsage, USAGE_WINDOW_DAYS } from "@/core/nutrition/repositories/usage";
import { addDays, todayIn } from "@/core/shared/dates";
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
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-title font-bold">{t.meals.title}</h1>
        <Link
          href="/meals/new"
          className="bg-herb px-3 py-1 font-display text-item font-semibold text-sheet"
        >
          {t.meals.new}
        </Link>
      </div>
      <MealBrowser
        meals={meals}
        usage={usage.meals}
        locale={settings.locale}
        t={{
          meals: t.meals,
          nutrients: t.nutrients,
          search: t.search,
          macro: t.macro,
          label: t.label,
        }}
      />
    </>
  );
}
