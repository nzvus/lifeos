/**
 * app/(app)/page.tsx — URL / : one day of eating (default: today).
 *
 * `?day=2026-09-29` selects another day. An invalid value falls back to
 * today in the user's time zone (core/shared/dates.ts).
 *
 * `?tab=food|training` picks the view (ADR-0033): the header (date, week,
 * day type and goal, night and movement) is always there; below it Summary
 * (quality, totals, food per moment, training, energy), Food (the day as
 * planned, live, and the day's entries) or Training (the program's day and
 * the sessions). All three are rendered at once and switched in the browser
 * (ui/ViewSwitch): no server round trip per tab. The sheets the "+" and the
 * chips open are rendered outside the views.
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
import { macroValues } from "@/core/nutrition/preview";
import {
  emptyTargets,
  getDayTargets,
  listProfiles,
} from "@/core/nutrition/repositories/profiles";
import { getHistory } from "@/core/nutrition/repositories/history";
import { carbsGoodMax, macroBands, trainingLoad } from "@/core/nutrition/bands";
import { withAutoTargets } from "@/core/nutrition/targets";
import { sessionMinutes } from "@/core/training/analysis";
import { lookOf } from "@/core/training/calendar";
import { getUsage, USAGE_WINDOW_DAYS } from "@/core/nutrition/repositories/usage";
import { addDays, isValidDay, startOfWeek, timeIn, todayIn } from "@/core/shared/dates";
import { Bell, Copy, Dumbbell, Gauge, Scale, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { listBatches } from "@/core/nutrition/repositories/batches";
import { listReminders } from "@/core/pantry/repositories/reminders";
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
import { ClearPlanned } from "@/features/nutrition/log/ClearPlanned";
import { AddToDay } from "@/features/nutrition/log/AddToDay";
import { AddFab } from "@/features/nutrition/log/AddFab";
import { MeasurementForm } from "@/features/training/body/MeasurementForm";
import { Sheet } from "@/ui/Sheet";
import { DayChips } from "@/features/nutrition/log/DayChips";
import { MovementSheet } from "@/features/nutrition/log/MovementSheet";
import { SleepCard } from "@/features/training/body/SleepCard";
import { TrainingSummary } from "@/features/training/sessions/TrainingSummary";
import { listSleep } from "@/core/training/repositories/sleep";
import { sleepScore } from "@/core/training/sleep";
import { DayPanel } from "@/features/nutrition/log/DayPanel";
import { WeekStrip } from "@/features/nutrition/log/WeekStrip";
import { DayScore } from "@/features/nutrition/log/DayScore";
import { ProgramDay } from "@/features/training/programs/ProgramDay";
import { AddTraining } from "@/features/training/sessions/AddTraining";
import { programSlotOn } from "@/core/training/repositories/programs";
import { startOrPlanAction } from "./training/live-actions";
import { SessionList } from "@/features/training/sessions/SessionList";
import { presetTiles } from "./training/preset-tiles";
import { listMeasurements } from "@/core/training/repositories/measurements";
import { listSessions } from "@/core/training/repositories/sessions";
import { listExercises } from "@/core/training/repositories/exercises";
import {
  addMeasurementAction,
  createEstimateAction,
  deleteSessionAction,
  restoreSessionAction,
} from "./training/actions";
import { Card, CARD } from "@/ui/Card";
import { ViewLink, ViewNav, ViewPanel, ViewSwitch } from "@/ui/ViewSwitch";
import { LiveDay, LiveTotals } from "@/features/nutrition/log/LiveDay";
import { FoodSummary } from "@/features/nutrition/log/FoodSummary";
import { groupByMoment } from "@/core/nutrition/moments";
import { Section } from "@/ui/Section";
import { dayScore } from "@/core/nutrition/day-score";
import { eatenQuality } from "@/core/nutrition/quality-summary";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import {
  copyPreviousDayAction,
  restoreLogEntriesAction,
  trashPlannedAction,
  deleteLogEntryAction,
  restoreLogEntryAction,
  logEstimateAction,
  logPortionAction,
  setDayActivityAction,
  setEnergyCorrectionAction,
  logIngredientAction,
  logMealAction,
  refreshLogEntryAction,
  setDayProfileAction,
  setEntryServingsAction,
  setSleepAction,
  clearSleepAction,
  setEntryStatusAction,
  setEntryTimeAction,
} from "./actions";
import { dynamicTargets } from "@/core/energy/energy";
import { kcalTargets } from "@/core/energy/repositories/outlook";
import { getCalibration, getDayEnergy } from "@/core/energy/repositories/energy";
import { EnergySection } from "@/features/nutrition/log/EnergySection";
import { DayGoal } from "./day-goal";
import { reminderLines } from "./day-reminders";

type Props = {
  searchParams: Promise<{ day?: string; late?: string; tab?: string }>;
};

/** Today's views (ADR-0033), in the URL as ?tab=; summary is the default. */
type View = "summary" | "food" | "training";

export default async function DayPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const locale = settings.locale;
  const today = todayIn(settings.timezone);
  const query = await searchParams;
  const requested = query.day;
  const day = requested && isValidDay(requested) ? requested : today;
  // A past day is history: adding is hidden, one link away for what was forgotten.
  const canAdd = day >= today || query.late === "1";
  const tab: View =
    query.tab === "food" || query.tab === "training" ? query.tab : "summary";

  const db = getDb();
  const monday = startOfWeek(day);
  // ADR-0024: what the active program puts on this day (from today on). The
  // day's energy needs it, so that one query waits for it; nothing else does.
  const slotLoad = programSlotOn(db, owner, today, day);
  // Promise.all: independent queries at once instead of one after another —
  // one round of waiting per page, not four (2026-10-03, "feels slow").
  const [
    programSlot,
    weekKcal,
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
    calibration,
    nights,
    recent,
  ] = await Promise.all([
    slotLoad,
    // The week strip: each day's energy target, dynamic days included.
    kcalTargets(
      db,
      owner,
      Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    ),
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
    // ADR-0014: what the day costs (a skipped program day adds nothing).
    slotLoad.then((slot) =>
      getDayEnergy(db, owner, day, slot && !slot.skipped ? slot.slot : null),
    ),
    day === today ? getCalibration(db, owner, today) : null, // ADR-0020
    listSleep(db, owner, day, day), // ADR-0031: the night that ended today
    listSessions(db, owner, addDays(today, -60), today), // "like a past session" (ADR-0035)
  ]);
  const plannedCount = view.entries.filter((e) => e.status === "planned").length;
  const night = nights[0] ?? null;
  const nightScore = night
    ? { hours: night.hours, score: sleepScore(night.hours) }
    : null;
  const p = t.pantry;
  // Today's reminders (ADR-0017), worded.
  const reminders = reminderLines(pantry, batchList, manualReminders, today, p);
  const mealRatings = averageScores(ratings);
  // The day's own targets, plus recommended maxima where none is set
  // (sugars, saturated fat, salt — core/nutrition/targets.ts), unless the
  // user turned them off (preferences).
  // A dynamic day type (ADR-0014): energy, protein, fat, carbs and fibre
  // come from what the day costs with the plan; the limits stay automatic.
  // ADR-0023: the day's training load (done + planned) sets the carbs' zone.
  const minutes = sessions.reduce((a, x) => a + (sessionMinutes(x) ?? 0), 0);
  const cardio = sessions
    .flatMap((x) => x.exercises)
    .filter((e) => e.kind === "cardio")
    .flatMap((e) => e.sets)
    .reduce((a, x) => a + (x.durationS ?? 0) / 60, 0);
  const load = trainingLoad(minutes, cardio);
  const kg = energyView.body.weightKg ? Number(energyView.body.weightKg) : null;
  const dynamic =
    dayTargets.source !== "none" && dayTargets.dynamic && energyView.energy
      ? dynamicTargets(
          energyView.energy,
          energyView.body.weightKg!,
          dayTargets.dynamic,
          carbsGoodMax(kg!, load),
        )
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
  // The shown day's target is the one computed here (with the program's slot).
  const weekWithTargets = week.map((d) => {
    const kcal = d.day === day ? own.kcal : (weekKcal.get(d.day)?.toString() ?? null);
    return { ...d, targets: { ...(d.targets ?? emptyTargets()), kcal } };
  });
  const { targets, auto } = settings.preferences.autoTargets
    ? withAutoTargets(own)
    : { targets: own, auto: [] };
  // Floor / good zone / ceiling per macro, from the weight, the training and
  // the goal (ADR-0023). Needs a weight.
  const bands =
    kg === null
      ? undefined
      : macroBands({
          kg,
          kcal: targets.kcal === null ? null : Number(targets.kcal),
          load,
          cutting:
            dayTargets.source !== "none" && (dayTargets.dynamic?.deficitKcal ?? 0) > 0,
        });
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
  /** The values the add-to-day preview scales (core/nutrition/preview.ts). */
  const pick = macroValues;

  const v = t.day.views;
  const num = (x: string | null) => (x === null ? null : Number(x));
  const late = query.late === "1" ? "&late=1" : "";
  const tabHref = (k: View) => `/?day=${day}${late}${k === "summary" ? "" : `&tab=${k}`}`;
  const burnRange = burn.withPlanned
    ? `~${formatNumber(String(burn.withPlanned.low), locale, 0)}–${formatNumber(String(burn.withPlanned.high), locale, 0)} kcal`
    : null;
  const programName = programSlot
    ? programSlot.items.length
      ? programSlot.name
      : programSlot.slot.label || t.programs.rest
    : null;
  // ADR-0035: each of the program's items, done when a session stands for it.
  const lookById = new Map([
    ...presets.map((x) => [x.routineId, x.look] as const),
    ...exercises.map((e) => [e.id, lookOf([{ ...e, sets: 1 }])] as const),
  ]);
  const programItems = (programSlot?.items ?? []).map((it) => ({
    ...it,
    look: lookById.get(it.routineId ?? it.exerciseId ?? "") ?? {
      region: null,
      pattern: null,
      cardio: false,
    },
    done: sessions.some((x) =>
      it.routineId
        ? x.routineId === it.routineId
        : x.exercises.some((e) => e.exerciseId === it.exerciseId),
    ),
  }));

  return (
    // ADR-0033: the day's header (date, week, day type, night and movement)
    // always on top; below it one view at a time. The sheets the "+" opens
    // are outside the views, so adding works from any of them.
    <ViewSwitch initial={tab} fallback="summary" param="tab">
      <LiveDay
        entries={view.entries.map((e) => ({
          id: e.id,
          status: e.status,
          servings: e.servings,
          lines: e.lines,
        }))}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <DayNav day={day} today={today} locale={locale} t={t.day} />
            <WeekStrip
              week={weekWithTargets}
              day={day}
              today={today}
              locale={locale}
              t={t.day}
            />
            <DayProfilePicker
              day={day}
              current={dayTargets}
              profiles={profiles.map((p) => ({ id: p.id, name: p.name }))}
              action={setDayProfileAction}
              t={{ day: t.day, errors: t.errors }}
            />
            {/* ADR-0014: the goal in plain words, or why dynamic targets can't be. */}
            <DayGoal
              day={day}
              today={today}
              dayTargets={dayTargets}
              dynamic={dynamic}
              total={energyView.energy?.total ?? null}
              eatenKcal={view.totals.nutrients.kcal}
              withPlannedKcal={view.withPlanned.nutrients.kcal}
              targetKcal={targets.kcal}
              locale={locale}
              t={t}
            />
            {/* The night and the movement at a glance; tap to add or change (sheets). */}
            <DayChips
              sleptHours={night?.hours ?? null}
              activity={energyView.activity}
              locale={locale}
              t={t}
            />
          </Card>
          <ViewNav
            label={v.label}
            items={[
              {
                key: "summary",
                href: tabHref("summary"),
                label: v.summary,
                icon: <Gauge size={18} aria-hidden="true" />,
              },
              {
                key: "food",
                href: tabHref("food"),
                label: v.food,
                icon: <UtensilsCrossed size={18} aria-hidden="true" />,
              },
              {
                key: "training",
                href: tabHref("training"),
                label: v.training,
                icon: <Dumbbell size={18} aria-hidden="true" />,
              },
            ]}
          />
          <ViewPanel view="summary">
            {/* Phone: one column. */}
            {/* Wide screens: the numbers left, food, training
        and energy right (S20). */}
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-4">
                {/* The day's quality first (2026-10-02), then the numbers. */}
                <DayScore
                  score={dayScore({
                    totals: view.totals.nutrients,
                    targets,
                    quality: dayQuality,
                    bands,
                    sleep: nightScore,
                  })}
                  planned={
                    view.entries.some((e) => e.status === "planned")
                      ? dayScore({
                          totals: view.withPlanned.nutrients,
                          targets,
                          quality: eatenQuality(view.entries, true),
                          bands,
                          sleep: nightScore,
                        })
                      : null
                  }
                  quality={dayQuality}
                  empty={view.entries.every((e) => e.status !== "eaten")}
                  locale={locale}
                  t={{ dayScore: t.dayScore, quality: t.quality }}
                />
                <DayPanel
                  totals={view.totals}
                  withPlanned={view.withPlanned}
                  targets={targets}
                  bands={bands}
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
              </div>
              <div className="flex min-w-0 flex-col gap-4">
                {day === today && reminders.length > 0 && (
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
                      {reminders.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </Section>
                )}
                <Section
                  title={t.nav.food}
                  icon={<UtensilsCrossed size={20} aria-hidden="true" />}
                  aside={
                    <ViewLink view="food" href={tabHref("food")} className={TEXT_LINK}>
                      {v.open}
                    </ViewLink>
                  }
                >
                  <FoodSummary
                    groups={groupByMoment(
                      view.entries,
                      settings.timezone,
                      settings.preferences.bounds,
                    )}
                    locale={locale}
                    t={t}
                  />
                </Section>
                <Section
                  title={t.training.onThisDay}
                  icon={<Dumbbell size={20} aria-hidden="true" />}
                  aside={
                    <ViewLink
                      view="training"
                      href={tabHref("training")}
                      className={TEXT_LINK}
                    >
                      {v.open}
                    </ViewLink>
                  }
                >
                  {sessions.length > 0 ? (
                    <TrainingSummary
                      sessions={sessions}
                      burn={burnRange}
                      locale={locale}
                      t={t.training}
                      tx={t.exercises}
                    />
                  ) : (
                    <p className="text-muted">
                      {programName
                        ? fill(v.inProgram, { name: programName })
                        : v.noTraining}
                    </p>
                  )}
                </Section>
                <EnergySection
                  energy={energyView.energy}
                  missing={energyView.missing}
                  eaten={view.totals.nutrients.kcal}
                  withPlanned={view.withPlanned.nutrients.kcal}
                  dynamic={
                    dynamic && dayTargets.source !== "none" && dayTargets.dynamic
                      ? { params: dayTargets.dynamic, ...dynamic }
                      : null
                  }
                  correction={energyView.body.correction ?? 1}
                  calibration={calibration}
                  setCorrection={setEnergyCorrectionAction}
                  locale={locale}
                  t={{ energy: t.energy, errors: t.errors, actions: t.actions }}
                />
              </div>
            </div>
          </ViewPanel>
          <ViewPanel view="food">
            {day === today && reminders.length > 0 && (
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
                  {reminders.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </Section>
            )}
            {/* The day as planned, redrawn on every −/+ and tick (2026-10-03). */}
            {view.entries.length > 0 && (
              <LiveTotals
                targets={{
                  kcal: num(targets.kcal),
                  protein: num(targets.protein),
                  carbs: num(targets.carbs),
                  fat: num(targets.fat),
                  fiber: num(targets.fiber),
                }}
                bands={bands}
                locale={locale}
                t={{ nutrients: t.nutrients, panel: t.panel }}
              />
            )}
            {/* The day's food in one card: the moments inside it (2026-10-02). */}
            <Section
              title={t.nav.food}
              icon={<UtensilsCrossed size={20} aria-hidden="true" />}
            >
              <EntryList
                day={view}
                locale={locale}
                trash={deleteLogEntryAction}
                restore={restoreLogEntryAction}
                refresh={refreshLogEntryAction}
                statusAction={(id, status) => setEntryStatusAction.bind(null, id, status)}
                future={day > today}
                timeAction={(id) => setEntryTimeAction.bind(null, id, day)}
                servingsAction={(id) => setEntryServingsAction.bind(null, id)}
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
              {/* A menu planned whole: drop what was not chosen in one go. */}
              {plannedCount >= 2 && (
                <ClearPlanned
                  day={day}
                  count={plannedCount}
                  trash={trashPlannedAction}
                  restore={restoreLogEntriesAction}
                  t={t}
                />
              )}
              {canAdd && view.entries.length === 0 && (
                <ActionButtonForm
                  action={copyPreviousDayAction.bind(null, day)}
                  label={t.day.copyYesterday}
                  icon={<Copy size={18} aria-hidden="true" />}
                  variant="secondary"
                />
              )}
            </Section>
          </ViewPanel>
          <ViewPanel view="training">
            {programSlot &&
              !(programItems.length > 0 && programItems.every((x) => x.done)) && (
                <ProgramDay
                  program={programSlot.program}
                  items={programItems}
                  restLabel={programSlot.slot.label || t.programs.rest}
                  late={programSlot.late}
                  skipped={programSlot.skipped ?? false}
                  day={day}
                  isToday={day === today}
                  action={startOrPlanAction}
                  t={t.programs}
                />
              )}
            {sessions.length > 0 ? (
              <Section
                title={t.training.onThisDay}
                icon={<Dumbbell size={20} aria-hidden="true" />}
                aside={String(sessions.length)}
              >
                <TrainingSummary
                  sessions={sessions}
                  burn={burnRange}
                  locale={locale}
                  t={t.training}
                  tx={t.exercises}
                />
                {/* Done vs with the planned; the summary above has the total only. */}
                {burn.done && <p className="text-meta text-muted">{burnText}</p>}
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
                  startable={day === today}
                  timeZone={settings.timezone}
                />
              </Section>
            ) : (
              !programSlot && <p className={`${CARD} text-muted`}>{v.noTraining}</p>
            )}
          </ViewPanel>
          {/* The sheets: opened by the "+" and the header's chips, from any view. */}
          {canAdd && (
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
                actions: t.actions,
              }}
            />
          )}
          {canAdd && (
            <AddTraining
              day={day}
              today={today}
              startOrPlan={startOrPlanAction}
              presets={presets}
              exercises={exercises.map(({ id, name, kind }) => ({ id, name, kind }))}
              past={recent
                .filter((x) => x.status === "done" && x.exercises.length > 0)
                .reverse()
                .slice(0, 12)
                .map((x) => ({
                  id: x.id,
                  label: x.label,
                  when: new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  }).format(new Date(`${x.day}T12:00:00Z`)),
                }))}
              estimate={createEstimateAction}
              t={{
                training: t.training,
                exercises: t.exercises,
                errors: t.errors,
                actions: t.actions,
                search: t.search,
              }}
            />
          )}
          <MovementSheet
            action={setDayActivityAction.bind(null, day)}
            activity={energyView.activity}
            energy={energyView.energy}
            t={{ energy: t.energy, errors: t.errors, actions: t.actions }}
          />
          <SleepCard
            day={day}
            night={
              night
                ? {
                    hours: formatNumber(String(night.hours), locale, 1),
                    bed: timeIn(night.bedAt, settings.timezone),
                    wake: timeIn(night.wakeAt, settings.timezone),
                    quality: night.quality,
                  }
                : null
            }
            action={setSleepAction}
            clear={clearSleepAction}
            t={{ sleep: t.sleep, errors: t.errors, actions: t.actions }}
          />
          {/* Design review S1: adding is one tap away, wherever you are on the page. */}
          {/* A weigh-in from the "+" (2026-10-02); the trend stays in Progress. */}
          <Sheet
            id="day-weigh"
            title={t.body.title}
            icon={<Scale size={20} aria-hidden="true" />}
            closeLabel={t.actions.close}
          >
            <MeasurementForm
              action={addMeasurementAction}
              today={day}
              now={timeIn(new Date(), settings.timezone)}
              count={measurements.length}
              t={{ body: t.body, errors: t.errors }}
            />
            <Link href="/profiles?view=weight" className={`text-meta ${TEXT_LINK}`}>
              {t.body.seeTrend}
            </Link>
          </Sheet>
          <AddFab
            training
            late={canAdd ? null : tabHref(tab).replace("?", "?late=1&")}
            t={t}
          />
        </div>
      </LiveDay>
    </ViewSwitch>
  );
}
