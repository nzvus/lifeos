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
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  listIngredients,
  tagsByIngredient,
} from "@/core/nutrition/repositories/ingredients";
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
import { Bell, Copy, Dumbbell } from "lucide-react";
import Link from "next/link";
import { listBatches } from "@/core/nutrition/repositories/batches";
import { derivedReminders, listReminders } from "@/core/pantry/repositories/reminders";
import { getPantry } from "@/core/pantry/repositories/stock";
import { TEXT_LINK } from "@/ui/button";
import { formatNumber } from "@/core/shared/format";
import { DayNav } from "@/features/nutrition/log/DayNav";
import { DayProfilePicker } from "@/features/nutrition/log/DayProfilePicker";
import { averageScores, ratingsByMeal } from "@/core/nutrition/repositories/ratings";
import { mealTags, qualitySummary } from "@/core/nutrition/quality-summary";
import { MealQuality } from "@/features/nutrition/meals/MealQuality";
import { dayBurn } from "@/core/training/progress";
import { fill } from "@/i18n";
import { EntryList } from "@/features/nutrition/log/EntryList";
import { AddToDay } from "@/features/nutrition/log/AddToDay";
import { DayPanel } from "@/features/nutrition/log/DayPanel";
import { WeekStrip } from "@/features/nutrition/log/WeekStrip";
import { DayScore } from "@/features/nutrition/log/DayScore";
import { AddTraining } from "@/features/training/sessions/AddTraining";
import { SessionList } from "@/features/training/sessions/SessionList";
import { presetTiles } from "./training/preset-tiles";
import { listMeasurements } from "@/core/training/repositories/measurements";
import { listSessions } from "@/core/training/repositories/sessions";
import { listExercises } from "@/core/training/repositories/exercises";
import {
  createEstimateAction,
  deleteSessionAction,
  restoreSessionAction,
} from "./training/actions";
import { Card } from "@/ui/Card";
import { Section } from "@/ui/Section";
import { dayScore } from "@/core/nutrition/day-score";
import { eatenQuality } from "@/core/nutrition/quality-summary";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import {
  copyPreviousDayAction,
  deleteLogEntryAction,
  restoreLogEntryAction,
  logEstimateAction,
  logPortionAction,
  setDayActivityAction,
  logIngredientAction,
  logMealAction,
  refreshLogEntryAction,
  setDayProfileAction,
  setEntryStatusAction,
  setEntryTimeAction,
} from "./actions";
import { dynamicTargets } from "@/core/energy/energy";
import { getDayEnergy } from "@/core/energy/repositories/energy";
import { EnergySection } from "@/features/nutrition/log/EnergySection";

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
    presets,
    exercises,
    ratings,
    tagMap,
    batchList,
    pantry,
    manualReminders,
    energyView,
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
    presetTiles(owner, day), // start a session from a routine, at its latest version
    listExercises(db, owner), // "Add training · Exercise" (ADR-0016)
    ratingsByMeal(db, owner), // entries show what their meal shows (ADR-0012)
    tagsByIngredient(db, owner),
    listBatches(db, owner), // ADR-0017: portions to log, and their reminders
    getPantry(db, owner),
    listReminders(db, owner),
    getDayEnergy(db, owner, day), // ADR-0014: what the day costs
  ]);
  // Today's reminders (ADR-0017): derived from the pantry and the batches,
  // plus the hand-made ones that are due. Worded here, shown only if any.
  const p = t.pantry;
  const reminderLines = [
    ...derivedReminders(pantry, batchList).map((d) =>
      d.kind === "gone"
        ? fill(p.gone, { name: d.name })
        : d.kind === "runOut"
          ? d.daysLeft === 0
            ? fill(p.runOutToday, { name: d.name })
            : fill(p.runOut, { name: d.name, n: String(d.daysLeft) })
          : fill(p.lastPortion, { name: d.name }),
    ),
    ...manualReminders.filter((r) => !r.dueDay || r.dueDay <= today).map((r) => r.text),
  ];
  const mealRatings = averageScores(ratings);
  // The day's own targets, plus recommended maxima where none is set
  // (sugars, saturated fat, salt — core/nutrition/targets.ts), unless the
  // user turned them off (preferences).
  // A dynamic day type (ADR-0014): energy, protein, fat, carbs and fibre
  // come from what the day costs with the plan; the limits stay automatic.
  const dynamic =
    dayTargets.source !== "none" && dayTargets.dynamic && energyView.energy
      ? dynamicTargets(energyView.energy, energyView.body.weightKg!, dayTargets.dynamic)
      : null;
  const own =
    dayTargets.source === "none"
      ? emptyTargets()
      : dynamic
        ? {
            ...emptyTargets(),
            kcal: String(dynamic.kcal),
            protein: String(dynamic.protein),
            fat: String(dynamic.fat),
            carbs: String(dynamic.carbs),
            fiber: String(dynamic.fiber),
          }
        : dayTargets.targets;
  const { targets, auto } = settings.preferences.autoTargets
    ? withAutoTargets(own)
    : { targets: own, auto: [] };
  // The day's training burn as ranges: done, then with the planned sessions.
  const burn = dayBurn(sessions, measurements);
  const range = (r: { low: number; high: number }) => ({
    low: String(r.low),
    high: String(r.high),
  });
  const burnText = [
    burn.done && fill(t.training.burn, range(burn.done)),
    burn.withPlanned &&
      burn.withPlanned.high !== burn.done?.high &&
      fill(t.training.burnWithPlanned, range(burn.withPlanned)),
  ]
    .filter(Boolean)
    .join(" · ");
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
    // Phone: one column, in this order. Wide screens: the day's numbers on
    // the left, what was eaten and trained on the right (S20).
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-4">
        <Card>
          <DayNav day={day} today={today} locale={locale} t={t.day} />
          <WeekStrip week={week} day={day} today={today} locale={locale} />
          <DayProfilePicker
            day={day}
            current={dayTargets}
            profiles={profiles.map((p) => ({ id: p.id, name: p.name }))}
            action={setDayProfileAction}
            t={{ day: t.day, errors: t.errors }}
          />
          {/* ADR-0014: say where dynamic targets come from, or why they can't. */}
          {dayTargets.source !== "none" && dayTargets.dynamic && (
            <p className="text-meta text-muted">
              {dynamic
                ? fill(t.energy.dynamicNote, { kcal: String(dynamic.kcal) })
                : t.energy.dynamicMissing}
            </p>
          )}
        </Card>
        <DayPanel
          totals={view.totals}
          withPlanned={view.withPlanned}
          targets={targets}
          auto={auto}
          locale={locale}
          t={{
            label: t.label,
            nutrients: t.nutrients,
            macro: t.macro,
            panel: t.panel,
            day: t.day,
          }}
        />
        <EnergySection
          energy={energyView.energy}
          missing={energyView.missing}
          activity={energyView.activity}
          eaten={view.totals.nutrients.kcal}
          withPlanned={view.withPlanned.nutrients.kcal}
          action={setDayActivityAction.bind(null, day)}
          locale={locale}
          t={{ energy: t.energy, errors: t.errors }}
        />
        <DayScore
          score={dayScore({
            totals: view.totals.nutrients,
            targets,
            quality: dayQuality,
          })}
          planned={
            view.entries.some((e) => e.status === "planned")
              ? dayScore({
                  totals: view.withPlanned.nutrients,
                  targets,
                  quality: eatenQuality(view.entries, true),
                })
              : null
          }
          quality={dayQuality}
          empty={view.entries.every((e) => e.status !== "eaten")}
          locale={locale}
          t={{ dayScore: t.dayScore, quality: t.quality }}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        {day === today && reminderLines.length > 0 && (
          <Section
            title={p.reminders}
            icon={<Bell size={20} aria-hidden="true" />}
            aside={
              <Link href="/pantry" className={TEXT_LINK}>
                {p.open}
              </Link>
            }
          >
            <ul className="flex flex-col gap-1">
              {reminderLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>
        )}
        <div className="flex flex-col gap-4">
          <EntryList
            day={view}
            locale={locale}
            trash={deleteLogEntryAction}
            restore={restoreLogEntryAction}
            refresh={refreshLogEntryAction}
            statusAction={(id, status) => setEntryStatusAction.bind(null, id, status)}
            timeAction={(id) => setEntryTimeAction.bind(null, id, day)}
            timeZone={settings.timezone}
            bounds={settings.preferences.bounds}
            // The same quality block as the meal cards, from the entry's
            // snapshot lines (ADR-0007) and the current tags and ratings.
            quality={(e) => (
              <MealQuality
                summary={qualitySummary(e.lines, e.servings)}
                rating={e.mealId ? (mealRatings[e.mealId] ?? null) : null}
                tags={mealTags(
                  e.lines.flatMap((l) => (l.ingredientId ? [l.ingredientId] : [])),
                  tagMap,
                ).map(({ name, icon }) => ({ name, icon }))}
                locale={locale}
                t={t}
              />
            )}
            t={t}
          />
          {view.entries.length === 0 && (
            <ActionButtonForm
              action={copyPreviousDayAction.bind(null, day)}
              label={t.day.copyYesterday}
              icon={<Copy size={18} aria-hidden="true" />}
              variant="secondary"
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
            portions={batchList
              .filter((b) => Number(b.portionsLeft) > 0)
              .map((b) => ({
                id: b.id,
                name: b.label,
                notes: fill(p.portionsLeft, {
                  n: formatNumber(b.portionsLeft, locale, 0),
                }),
                values: pick(b.perPortion.nutrients), // per portion
                uses: 0,
                lastUsed: null,
              }))}
            logPortionAction={logPortionAction}
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
        {sessions.length > 0 && (
          <Section
            title={t.training.onThisDay}
            icon={<Dumbbell size={20} aria-hidden="true" />}
            subtitle={burnText}
          >
            <SessionList
              sessions={sessions}
              measurements={measurements}
              showDay={false}
              locale={locale}
              t={t.training}
              tx={t.exercises}
              trash={deleteSessionAction}
              restore={restoreSessionAction}
              labels={t.actions}
            />
          </Section>
        )}
        <AddTraining
          day={day}
          plannedByDefault={day > today}
          presets={presets}
          exercises={exercises.map(({ id, name, kind }) => ({ id, name, kind }))}
          estimate={createEstimateAction}
          t={{
            training: t.training,
            exercises: t.exercises,
            errors: t.errors,
            actions: t.actions,
            search: t.search,
          }}
        />
      </div>
    </div>
  );
}
