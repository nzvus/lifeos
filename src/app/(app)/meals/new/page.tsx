/**
 * app/(app)/meals/new/page.tsx — URL /meals/new[?copy=ID][&from=PATH]. A meal
 * is made of ingredients, so with none yet the page says so instead of an
 * unusable form. `copy` starts from another meal ("Duplicate", ADR-0015),
 * named "<name> (copy)"; `from` is where Cancel and saving lead.
 */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getMeal } from "@/core/nutrition/repositories/meals";
import { listFactors, ratingsByMeal } from "@/core/nutrition/repositories/ratings";
import { idInput } from "@/core/nutrition/validation";
import { Big } from "@/core/shared/decimal";
import { safeFrom } from "@/core/shared/navigation";
import { MealForm } from "@/features/nutrition/meals/MealForm";
import { fill } from "@/i18n";
import { PageHeader } from "@/ui/PageHeader";
import { createMealAction } from "../actions";
import { mealEditorIngredients } from "../ingredient-options";
import { TEXT_LINK } from "@/ui/button";

type Props = { searchParams: Promise<{ copy?: string; from?: string }> };

export default async function NewMealPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const params = await searchParams;
  const from = safeFrom(params.from, "/meals");
  const db = getDb();
  const copyId =
    params.copy && idInput.safeParse(params.copy).success ? params.copy : null;
  const [ingredients, factors, source, ratings] = await Promise.all([
    mealEditorIngredients(owner, settings),
    listFactors(db, owner),
    copyId ? getMeal(db, owner, copyId) : null,
    copyId ? ratingsByMeal(db, owner) : null,
  ]);
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      {ingredients.length === 0 ? (
        <>
          <PageHeader
            title={t.meals.newTitle}
            back={{ href: from, label: t.meals.back }}
          />
          <p className="text-muted">
            {t.meals.needIngredients}{" "}
            <Link href="/ingredients/new" className={TEXT_LINK}>
              {t.ingredients.newTitle}
            </Link>
          </p>
        </>
      ) : (
        <MealForm
          title={t.meals.newTitle}
          from={from}
          action={createMealAction}
          ingredients={ingredients}
          initial={
            source
              ? {
                  name: fill(t.actions.copyOf, { name: source.name }),
                  notes: source.notes,
                  category: source.category ?? "",
                  review: source.review,
                  ratings: ratings?.get(source.id) ?? {},
                  items: source.lines.map((l) => ({
                    ingredientId: l.ingredientId,
                    quantity: new Big(l.quantity).toString(),
                  })),
                }
              : { name: "", notes: "", category: "", review: "", ratings: {}, items: [] }
          }
          locale={settings.locale}
          factors={factors}
          t={{
            meals: t.meals,
            moments: t.moments,
            ratings: t.ratings,
            nutrients: t.nutrients,
            errors: t.errors,
            search: t.search,
            macro: t.macro,
            ingredients: t.ingredients,
            actions: t.actions,
          }}
        />
      )}
    </div>
  );
}
