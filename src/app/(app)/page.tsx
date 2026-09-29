/**
 * app/(app)/page.tsx — URL / : one day of eating (default: today).
 *
 * `?day=2026-09-29` selects another day. An invalid value falls back to
 * today in the user's time zone (core/shared/dates.ts).
 *
 * This page only LOADS and COMPOSES: it fetches the day, meals and
 * ingredients through core repositories (in parallel), then hands plain data
 * and server actions to feature components. No sums, no rules, no SQL here.
 */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listIngredients } from "@/core/nutrition/repositories/ingredients";
import { getDay } from "@/core/nutrition/repositories/log";
import { listMeals } from "@/core/nutrition/repositories/meals";
import { isValidDay, todayIn } from "@/core/shared/dates";
import { DayNav } from "@/features/nutrition/log/DayNav";
import { EntryList } from "@/features/nutrition/log/EntryList";
import { LogForms } from "@/features/nutrition/log/LogForms";
import { NutritionLabel } from "@/features/nutrition/log/NutritionLabel";
import { deleteLogEntryAction, logIngredientAction, logMealAction } from "./actions";

type Props = { searchParams: Promise<{ day?: string }> };

export default async function DayPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const today = todayIn(settings.timezone);
  const requested = (await searchParams).day;
  const day = requested && isValidDay(requested) ? requested : today;

  const db = getDb();
  // Promise.all: three independent queries at once instead of one after another.
  const [view, meals, ingredients] = await Promise.all([
    getDay(db, owner, day),
    listMeals(db, owner),
    listIngredients(db, owner),
  ]);

  return (
    <>
      <DayNav day={day} today={today} locale={settings.locale} t={t.day} />
      <NutritionLabel
        totals={view.totals}
        targets={settings.targets}
        locale={settings.locale}
        t={t}
      />
      <EntryList
        day={view}
        locale={settings.locale}
        removeAction={(id) => deleteLogEntryAction.bind(null, id)}
        t={t}
      />
      <LogForms
        day={day}
        meals={meals.map((m) => ({ id: m.id, name: m.name }))}
        ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
        logMealAction={logMealAction}
        logIngredientAction={logIngredientAction}
        t={t}
      />
    </>
  );
}
