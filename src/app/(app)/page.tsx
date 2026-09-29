/**
 * app/(app)/page.tsx — URL / : one day of eating (default: today).
 *
 * `?day=2026-09-29` selects another day. An invalid value falls back to
 * today in the user's time zone (core/shared/dates.ts).
 *
 * Layout: on phones one column (date, day type, label, entries, forms); from
 * the lg breakpoint two columns, with the label in a sticky right column so
 * the totals stay in view while logging.
 *
 * This page only LOADS and COMPOSES: it fetches the day, meals, ingredients,
 * the day's targets, the day types and usage counts through core
 * repositories (in parallel), formats numbers for display, and hands plain
 * data and server actions to feature components. No sums, no rules, no SQL.
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
import { getUsage, USAGE_WINDOW_DAYS } from "@/core/nutrition/repositories/usage";
import { addDays, isValidDay, todayIn } from "@/core/shared/dates";
import { formatNumber } from "@/core/shared/format";
import { DayNav } from "@/features/nutrition/log/DayNav";
import { DayProfilePicker } from "@/features/nutrition/log/DayProfilePicker";
import { EntryList } from "@/features/nutrition/log/EntryList";
import { LogForms } from "@/features/nutrition/log/LogForms";
import { NutritionLabel } from "@/features/nutrition/log/NutritionLabel";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import {
  copyPreviousDayAction,
  deleteLogEntryAction,
  logIngredientAction,
  logMealAction,
  setDayProfileAction,
} from "./actions";

type Props = { searchParams: Promise<{ day?: string }> };

export default async function DayPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const locale = settings.locale;
  const today = todayIn(settings.timezone);
  const requested = (await searchParams).day;
  const day = requested && isValidDay(requested) ? requested : today;

  const db = getDb();
  // Promise.all: independent queries at once instead of one after another.
  const [view, meals, ingredients, dayTargets, profiles, usage] = await Promise.all([
    getDay(db, owner, day),
    listMeals(db, owner),
    listIngredients(db, owner),
    getDayTargets(db, owner, day), // fixed copy, default profile, or none (ADR-0008)
    listProfiles(db, owner),
    getUsage(db, owner, addDays(today, -USAGE_WINDOW_DAYS)),
  ]);
  const targets = dayTargets.source === "none" ? emptyTargets() : dayTargets.targets;
  const whole = (v: string) => formatNumber(v, locale, 0);

  return (
    <>
      <DayNav day={day} today={today} locale={locale} t={t.day} />
      <DayProfilePicker
        day={day}
        current={dayTargets}
        profiles={profiles.map((p) => ({ id: p.id, name: p.name }))}
        action={setDayProfileAction}
        t={{ day: t.day, errors: t.errors }}
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <aside className="lg:sticky lg:top-4 lg:order-last lg:self-start">
          <NutritionLabel totals={view.totals} targets={targets} locale={locale} t={t} />
        </aside>
        <div className="flex flex-col gap-8 lg:col-span-2">
          <EntryList
            day={view}
            locale={locale}
            removeAction={(id) => deleteLogEntryAction.bind(null, id)}
            t={t}
          />
          {view.entries.length === 0 && (
            <ActionButtonForm
              action={copyPreviousDayAction.bind(null, day)}
              label={t.day.copyYesterday}
              variant="quiet"
            />
          )}
          <LogForms
            day={day}
            meals={meals.map((m) => ({
              id: m.id,
              name: m.name,
              kcal: whole(m.totals.nutrients.kcal),
              protein: whole(m.totals.nutrients.protein),
              uses: usage.meals[m.id]?.uses ?? 0,
              lastUsed: usage.meals[m.id]?.lastUsed ?? null,
            }))}
            ingredients={ingredients.map((i) => ({
              id: i.id,
              name: i.name,
              unit: i.unit,
              kcal: whole(i.kcal),
              protein: whole(i.protein),
              uses: usage.ingredients[i.id]?.uses ?? 0,
              lastUsed: usage.ingredients[i.id]?.lastUsed ?? null,
            }))}
            logMealAction={logMealAction}
            logIngredientAction={logIngredientAction}
            // Only the dictionary parts the client component uses travel to
            // the browser (smaller page, faster load).
            t={{
              day: t.day,
              errors: t.errors,
              meals: t.meals,
              search: t.search,
              macro: t.macro,
              ingredients: t.ingredients,
            }}
          />
        </div>
      </div>
    </>
  );
}
