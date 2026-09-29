/**
 * app/(app)/page.tsx — URL / : one day of eating (default: today).
 *
 * `?day=2026-09-29` selects another day. An invalid value falls back to
 * today in the user's time zone (core/shared/dates.ts).
 *
 * This page only LOADS and COMPOSES: it fetches the day, meals, ingredients,
 * the day's targets and the day types through core repositories (in
 * parallel), then hands plain data and server actions to feature
 * components. No sums, no rules, no SQL here.
 */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listIngredients } from "@/core/nutrition/repositories/ingredients";
import { getDay } from "@/core/nutrition/repositories/log";
import { listMeals } from "@/core/nutrition/repositories/meals";
import {
  emptyTargets,
  getDayTargets,
  listProfiles,
} from "@/core/nutrition/repositories/profiles";
import { isValidDay, todayIn } from "@/core/shared/dates";
import { DayNav } from "@/features/nutrition/log/DayNav";
import { DayProfilePicker } from "@/features/nutrition/log/DayProfilePicker";
import { EntryList } from "@/features/nutrition/log/EntryList";
import { LogForms } from "@/features/nutrition/log/LogForms";
import { NutritionLabel } from "@/features/nutrition/log/NutritionLabel";
import {
  deleteLogEntryAction,
  logIngredientAction,
  logMealAction,
  setDayProfileAction,
} from "./actions";

type Props = { searchParams: Promise<{ day?: string }> };

export default async function DayPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const today = todayIn(settings.timezone);
  const requested = (await searchParams).day;
  const day = requested && isValidDay(requested) ? requested : today;

  const db = getDb();
  // Promise.all: independent queries at once instead of one after another.
  const [view, meals, ingredients, dayTargets, profiles] = await Promise.all([
    getDay(db, owner, day),
    listMeals(db, owner),
    listIngredients(db, owner),
    getDayTargets(db, owner, day), // fixed copy, default profile, or none (ADR-0008)
    listProfiles(db, owner),
  ]);
  const targets = dayTargets.source === "none" ? emptyTargets() : dayTargets.targets;

  return (
    <>
      <DayNav day={day} today={today} locale={settings.locale} t={t.day} />
      <DayProfilePicker
        day={day}
        current={dayTargets}
        profiles={profiles.map((p) => ({ id: p.id, name: p.name }))}
        action={setDayProfileAction}
        t={t}
      />
      <NutritionLabel
        totals={view.totals}
        targets={targets}
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
