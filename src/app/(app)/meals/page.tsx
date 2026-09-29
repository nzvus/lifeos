/** app/(app)/meals/page.tsx — URL /meals: meals with per-serving totals. */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listMeals } from "@/core/nutrition/repositories/meals";
import { MealList } from "@/features/nutrition/meals/MealList";

export default async function MealsPage() {
  const { owner, settings, t } = await requireContext();
  const meals = await listMeals(getDb(), owner);
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">{t.meals.title}</h1>
        <Link
          href="/meals/new"
          className="bg-herb px-3 py-1 font-display text-lg font-semibold text-sheet"
        >
          {t.meals.new}
        </Link>
      </div>
      <MealList meals={meals} locale={settings.locale} t={t} />
    </>
  );
}
