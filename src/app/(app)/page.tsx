/**
 * app/(app)/page.tsx — URL / : one day of eating (default: today).
 *
 * `?day=2026-09-29` selects another day. An invalid value falls back to
 * today in the user's time zone (core/shared/dates.ts).
 *
 * Layout: date, day type, then the day panel (rings + bars, full width);
 * below it, on phones one column (entries, forms, 7-day charts), from the lg
 * breakpoint two columns with the charts in a sticky right column.
 *
 * This page only LOADS and COMPOSES: it fetches the day, meals, ingredients,
 * the day's targets, the day types and usage counts through core
 * repositories (in parallel), formats numbers for display, and hands plain
 * data and server actions to feature components. No sums, no rules, no SQL.
 */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listIngredients } from "@/core/nutrition/repositories/ingredients";
import { getDay } from "@/core/nutrition/repositories/log";
import { listMeals } from "@/core/nutrition/repositories/meals";
import type { MacroValues } from "@/core/nutrition/preview";
import {
  emptyTargets,
  getDayTargets,
  listProfiles,
} from "@/core/nutrition/repositories/profiles";
import { getHistory } from "@/core/nutrition/repositories/history";
import { withAutoTargets } from "@/core/nutrition/targets";
import { getUsage, USAGE_WINDOW_DAYS } from "@/core/nutrition/repositories/usage";
import { addDays, isValidDay, startOfWeek, todayIn } from "@/core/shared/dates";
import { Copy, Dumbbell } from "lucide-react";
import { DayNav } from "@/features/nutrition/log/DayNav";
import { DayProfilePicker } from "@/features/nutrition/log/DayProfilePicker";
import { EntryList } from "@/features/nutrition/log/EntryList";
import { THEME_SLOTS } from "@/core/shared/themes";
import { AddToDay } from "@/features/nutrition/log/AddToDay";
import { DayPanel } from "@/features/nutrition/log/DayPanel";
import { WeekStrip } from "@/features/nutrition/log/WeekStrip";
import { DayScore } from "@/features/nutrition/log/DayScore";
import { SessionList } from "@/features/training/sessions/SessionList";
import { listMeasurements } from "@/core/training/repositories/measurements";
import { listSessions } from "@/core/training/repositories/sessions";
import { Section } from "@/ui/Section";
import { dayScore } from "@/core/nutrition/day-score";
import { eatenQuality } from "@/core/nutrition/quality-summary";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import {
  copyPreviousDayAction,
  deleteLogEntryAction,
  logEstimateAction,
  logIngredientAction,
  logMealAction,
  refreshLogEntryAction,
  setDayProfileAction,
  setEntryStatusAction,
  setEntryTimeAction,
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
  const monday = startOfWeek(day);
  const [
    view,
    meals,
    ingredients,
    dayTargets,
    profiles,
    usage,
    week,
    sessions,
    measurements,
  ] = await Promise.all([
    getDay(db, owner, day),
    listMeals(db, owner),
    listIngredients(db, owner),
    getDayTargets(db, owner, day), // fixed copy, default profile, or none (ADR-0008)
    listProfiles(db, owner),
    getUsage(db, owner, addDays(today, -USAGE_WINDOW_DAYS)),
    getHistory(db, owner, monday, addDays(monday, 6)), // the shown day's week, for WeekStrip
    listSessions(db, owner, day, day), // ADR-0005: the day's training
    listMeasurements(db, owner), // body weight, for the burn estimate
  ]);
  // The day's own targets, plus recommended maxima where none is set
  // (sugars, saturated fat, salt — core/nutrition/targets.ts), unless the
  // user turned them off (preferences).
  const own = dayTargets.source === "none" ? emptyTargets() : dayTargets.targets;
  const { targets, auto } = settings.preferences.autoTargets
    ? withAutoTargets(own)
    : { targets: own, auto: [] };
  // What the eaten food is made of (ADR-0012), for the score and fibre types.
  const dayQuality = eatenQuality(view.entries);
  /** The five values the add-to-day preview scales (core/nutrition/preview.ts). */
  const pick = (v: MacroValues): MacroValues => ({
    kcal: v.kcal,
    protein: v.protein,
    carbs: v.carbs,
    fat: v.fat,
    fiber: v.fiber,
  });

  return (
    <>
      <DayNav day={day} today={today} locale={locale} t={t.day} />
      <WeekStrip week={week} day={day} today={today} locale={locale} t={t.day} />
      <DayProfilePicker
        day={day}
        current={dayTargets}
        profiles={profiles.map((p) => ({ id: p.id, name: p.name }))}
        action={setDayProfileAction}
        t={{ day: t.day, errors: t.errors }}
      />
      <DayPanel
        totals={view.totals}
        withPlanned={view.withPlanned}
        targets={targets}
        auto={auto}
        variant={THEME_SLOTS[settings.theme].dayPanel}
        locale={locale}
        t={{
          label: t.label,
          nutrients: t.nutrients,
          macro: t.macro,
          panel: t.panel,
          day: t.day,
        }}
      />
      <Section
        title={t.training.onThisDay}
        icon={<Dumbbell size={20} aria-hidden="true" />}
      >
        {sessions.length > 0 && (
          <SessionList
            sessions={sessions}
            measurements={measurements}
            showDay={false}
            locale={locale}
            t={t.training}
          />
        )}
        <Link
          href={`/training/new?day=${day}`}
          className="self-start text-meta underline"
        >
          {t.training.planForDay}
        </Link>
      </Section>
      <DayScore
        score={dayScore({ totals: view.totals.nutrients, targets, quality: dayQuality })}
        quality={dayQuality}
        empty={view.entries.every((e) => e.status !== "eaten")}
        locale={locale}
        t={{ dayScore: t.dayScore, quality: t.quality }}
      />
      <div className="flex flex-col gap-8">
        <EntryList
          day={view}
          locale={locale}
          removeAction={(id) => deleteLogEntryAction.bind(null, id)}
          refreshAction={(id) => refreshLogEntryAction.bind(null, id)}
          statusAction={(id, status) => setEntryStatusAction.bind(null, id, status)}
          timeAction={(id) => setEntryTimeAction.bind(null, id, day)}
          timeZone={settings.timezone}
          bounds={settings.preferences.bounds}
          t={t}
        />
        {view.entries.length === 0 && (
          <ActionButtonForm
            action={copyPreviousDayAction.bind(null, day)}
            label={t.day.copyYesterday}
            icon={<Copy size={18} aria-hidden="true" />}
            variant="quiet"
          />
        )}
        <AddToDay
          day={day}
          locale={locale}
          bounds={settings.preferences.bounds}
          meals={meals.map((m) => ({
            id: m.id,
            name: m.name,
            notes: m.notes,
            category: m.category, // suggests the moment (ADR-0011)
            values: pick(m.totals.nutrients), // per serving
            uses: usage.meals[m.id]?.uses ?? 0,
            lastUsed: usage.meals[m.id]?.lastUsed ?? null,
          }))}
          ingredients={ingredients.map((i) => ({
            id: i.id,
            name: i.name,
            notes: i.description,
            unit: i.unit,
            values: pick(i), // per 100 g/ml
            uses: usage.ingredients[i.id]?.uses ?? 0,
            lastUsed: usage.ingredients[i.id]?.lastUsed ?? null,
          }))}
          logMealAction={logMealAction}
          logIngredientAction={logIngredientAction}
          logEstimateAction={logEstimateAction}
          // Only the dictionary parts the client component uses travel to
          // the browser (smaller page, faster load).
          t={{
            day: t.day,
            errors: t.errors,
            meals: t.meals,
            search: t.search,
            macro: t.macro,
            ingredients: t.ingredients,
            nutrients: t.nutrients,
            moments: t.moments,
          }}
        />
      </div>
    </>
  );
}
