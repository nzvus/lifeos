/**
 * V-01, Oggi (screens.md): one logical day, `/oggi` for today and
 * `/oggi/2026-10-15` for any other. The server reads and composes the day
 * (core/day), presents each item as a kit Box (features/day) and hands the
 * client plain rows and the row actions (./actions.ts); the client holds the
 * filters, the rail's mode and the toast.
 * So far: the day as a Box (Nutrients L1 against the targets in force),
 * the filters by domain and state, the timeline (water as one box in it,
 * drunk of the need with its score and +250/+500 ml) and the untimed items; meals,
 * weigh-ins and the night scored (features/day/score.ts); the day's own
 * score behind its box and on the week strip (features/day/day-score.ts,
 * dossiers/ranges.md). The week is read once, up to today: each day's
 * score is computed from it, never stored.
 */
import { notFound } from "next/navigation";
import { DateNav, F, Glyph, NavBar, Nutrients, PageHeader, weekOf } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  dayMinute,
  loadDays,
  readClosure,
  readDayTargets,
  readMicroTargets,
} from "@/core/day";
import { addDays, instantAt, localParts, logicalDay } from "@/core/engines/time";
import { readSettings } from "@/core/account/settings";
import { readPlace } from "@/core/account/place";
import { weatherChips } from "@/app/_server/weather";
import { WeatherCard } from "@/features/day/WeatherCard";
import { mealGroups } from "@/features/day/meal-groups";
import { MEAL_ROLE_WORDS } from "@/features/day/words";
import { readGoals, readNumbers, readSpans, weightProgress } from "@/core/goals";
import { ensureWeekTargets, mondayOf } from "@/core/energy";
import {
  planTag,
  cycleWords,
  readDayPlans,
  habitsDue,
  readHabits,
  readModelBook,
  resolveModel,
  toModels,
} from "@/core/plans";
import { daySlots, slotFits } from "@/features/day/slots";
import { DayPlanBar } from "@/features/day/DayPlanBar";
import { habitItems, modelItems } from "@/features/day/model-items";
import { kindRegistry } from "@/core/kinds";
import { changeDayModel, saveDayAsModel, skipStep } from "./plan-actions";
import { creatineDays, readCreatineLines } from "@/core/training";
import { readFoodEstimates } from "@/core/food/catalog";
import { foodIds, mealL0 } from "@/features/day/nutrients";
import {
  dayScore,
  presentWeek,
  weekBars,
  weekScores,
  weightOn,
} from "@/features/day/day-score";
import {
  mealScore,
  nightOf,
  sleepScore,
  waterBox,
  weighScore,
  type ScoreContext,
} from "@/features/day/score";
import { OpenBox } from "@/features/day/OpenBox";
import {
  caffeineDoses,
  compoundsOf,
  withCompounds,
  type CompoundContext,
} from "@/features/day/compounds";
import { details, hasDetails } from "@/features/day/details";
import { present } from "@/features/day/present";
import { DayView } from "@/features/day/DayView";
import {
  addWater,
  bringBack,
  bringBackAll,
  changeStatus,
  closeDay,
  recomputeTargets,
  removeEntry,
  removePlanned,
} from "./actions";
import { DayClose } from "@/features/day/DayClose";
import { goalLine } from "@/features/day/goal-line";
import { PLACES } from "@/features/places";

/** A meal's score on its box, when it has one (exactOptionalPropertyTypes: no `score: undefined`). */
const withScore = <T,>(s: T | undefined) => (s === undefined ? {} : { score: s });

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function OggiPage({
  params,
}: {
  params: Promise<{ day?: string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { day: segments = [] } = await params;
  if (segments.length > 1 || (segments[0] !== undefined && !ISO.test(segments[0])))
    notFound();
  const known = await ownerClock();
  const { clock } = known;
  const now = new Date();
  const today = logicalDay(now, clock);
  const date = segments[0] ?? today;
  // The week up to today (and the viewed day, when it is ahead): one set of queries.
  const week = weekOf(date);
  const to = [date, week[6]! < today ? week[6]! : today].sort().at(-1)!;
  const scored = week.filter((d) => d <= today);
  // The viewed week's automatic targets, made on its first open (core/energy, dossiers/targets.md).
  const thisWeek = mondayOf(date) === mondayOf(today);
  const [days, micros, plans, , closed] = await Promise.all([
    loadDays(db, owner, week[0]!, to, known),
    readMicroTargets(db, owner, date),
    readDayPlans(db, owner, week[0]!, week[6]!, today),
    date <= today ? ensureWeekTargets(db, owner, date, clock) : null,
    date <= today ? readClosure(db, owner, date) : null,
  ]);
  // Each day's targets: its own decision, its fixed model, or the week's with its model.
  const dayTargets = new Map(
    await Promise.all(
      [...new Set([...scored, date])].map(async (d) => {
        const m = plans.get(d)?.model;
        return [
          d,
          await readDayTargets(
            db,
            owner,
            d,
            m ? { name: m.name, targets: m.targets } : null,
          ),
        ] as const;
      }),
    ),
  );
  const day = days.find((d) => d.day === date)!;
  const targets = dayTargets.get(date) ?? null;
  const kinds = await readFoodEstimates(db, owner, days.flatMap(foodIds));
  const items = [...day.timed, ...day.untimed];
  // The few rows the scores and the zones read: weigh-ins (the reference
  // weight, the weigh-in's score), the week's nights; goals only for a weigh-in.
  const weighed = items.some((i) => i.kind.key === "weigh_in" && i.status === "done");
  const [weighings, goals, nights, profile] = await Promise.all([
    readNumbers(db, owner, "weigh_in", "weightKg", addDays(date, -27), to),
    // The goal's line under the day box needs it on every day up to today.
    weighed || date <= today ? readGoals(db, owner, date) : null,
    readSpans(db, owner, "sleep", addDays(week[0]!, -7), to),
    date <= today ? readSettings(db, owner) : null,
  ]);
  // The week strip names each day by its cycle's step or its model (day-templates.md §6).
  const tags = Object.fromEntries(
    week.flatMap((d) => (planTag(plans.get(d)) ? [[d, planTag(plans.get(d))]] : [])),
  );
  const cycleLine = cycleWords(plans.get(date), date === today);
  const goal = goals?.find(
    (g) => g.source === "weight" && g.target === "reach" && g.value !== null,
  );
  const nowMinute = date === today ? dayMinute(now, date, clock) : null;
  const series = weighings
    .map((w) => ({ day: w.day, kg: w.n }))
    .sort((a, b) => a.day.localeCompare(b.day));
  const boxes = presentWeek({
    days,
    targets: dayTargets,
    estimates: kinds,
    micros,
    weighings: series,
  });
  const whole = boxes.get(date) ?? null;
  const progress = goal
    ? weightProgress(series, { value: goal.value!, since: goal.since, by: goal.by }, date)
    : null;
  const line = progress ? goalLine(progress, goal!.by) : null;
  const sctx: ScoreContext = {
    date,
    clock,
    weighings: weighed ? series.filter((w) => w.day <= date) : null,
    weightGoal: goal ? { value: goal.value!, since: goal.since, by: goal.by } : null,
    nights,
    sex: profile?.sex ?? null,
    now: nowMinute,
  };
  // Creatine's days of 28 only when the day has some: one narrow read.
  const creatine = items.some((i) => compoundsOf(i, kinds).creatine > 0)
    ? creatineDays(await readCreatineLines(db, owner, date))
    : null;
  // Bedtime: the evening's sleep when logged on this day, else 23:30.
  const sleep = items.find(
    (i) => i.kind.key === "sleep" && i.start && (i.minute ?? 0) >= 18 * 60,
  );
  const ctx: CompoundContext = {
    compounds: kinds,
    doses: caffeineDoses(items, kinds),
    bed: sleep?.start
      ? { at: sleep.start, known: true }
      : { at: instantAt(date, 23 * 60 + 30, clock), known: false },
    creatineDays: creatine,
  };
  // The day's model's meal blocks: each meal's bars against its block, the block's fit in its score.
  const model = plans.get(date)?.model ?? null;
  // Always read: «Cambia la giornata» offers the models (three narrow queries); the habits.
  // The hour the weather card speaks of: now today, midday on another day.
  const wxHour =
    date === today ? Math.floor(localParts(now, clock.timeZone).minute / 60) : 12;
  const [book, habits, weather] = await Promise.all([
    readModelBook(db, owner),
    date >= today ? readHabits(db, owner) : [],
    // The weather and the air of the day where the person lives (E11), when a city is set.
    readPlace(db, owner).then((p) =>
      p
        ? weatherChips(p, date, today, clock.timeZone, wxHour).then((w) =>
            w ? { p, w } : null,
          )
        : null,
    ),
  ]);
  const blocks = model
    ? (resolveModel(model.id, toModels(book.models, book.rows))?.blocks ?? [])
    : [];
  const slots = daySlots(blocks, targets);
  const fits = slotFits(items, slots);
  const slotOf = (i: (typeof items)[number]) =>
    (i.subcategory && slots.get(i.subcategory)) || targets;
  const row = (i: (typeof items)[number]) => {
    const l0 = mealL0(i, slotOf(i), kinds, weightOn(series, date), micros);
    // A meal of several foods lists them as its window's chips (L2), not again below.
    const d = details(i, { foods: (l0?.foods?.length ?? 0) < 2 });
    return {
      ...withCompounds(present(i), i, ctx),
      ...withScore(
        mealScore(i, targets, kinds, micros, fits.get(i.subcategory ?? "") ?? null) ??
          weighScore(i, items, sctx) ??
          sleepScore(i, items, sctx),
      ),
      l0,
      details: hasDetails(d) ? d : null,
      id: i.id,
      status: i.status,
    };
  };
  const night = nightOf(items);
  const nightScore = night ? (sleepScore(night, items, sctx)?.value ?? null) : null;
  const score = dayScore({
    day,
    nutrients: whole?.nutrients ?? null,
    night: nightScore,
    now: nowMinute,
  });
  const weekInput = {
    days,
    present: boxes,
    ctx: sctx,
    today,
    nowMinute: date === today ? nowMinute : dayMinute(now, today, clock),
  };
  const scores = weekScores(weekInput);
  const bars = weekBars(weekInput);
  // Water is one box in the timeline (WaterRow): its drinks are not rows of their own.
  const notWater = (i: (typeof items)[number]) => i.kind.key !== "water";
  const timedRows = day.timed
    .filter(notWater)
    .map((i) => ({ ...row(i), minute: i.minute! }));
  // Meals of one role together (Cena ×5 → one «Cena» that opens on its entries).
  const groups = mealGroups(
    day.timed.filter(notWater),
    (i) => timedRows.find((r) => r.id === i.id)?.title ?? "",
  );
  const grouped = new Set(groups.flatMap((g) => g.items.map((i) => i.id)));
  const groupRows = groups.map((g) => {
    const kids = timedRows.filter((r) => g.items.some((i) => i.id === r.id));
    const { href: _href, hrefLabel: _label, ...whole } = row(g.merged);
    const what = kids
      .map((k) => (k.meta ?? "").split(" · ")[0])
      .filter(Boolean)
      .join(", ");
    return {
      ...whole,
      id: g.merged.id,
      title: MEAL_ROLE_WORDS[g.role] ?? whole.title,
      meta: kids.length + " voci" + (what ? " · " + what : ""),
      minute: g.merged.minute!,
      group: kids,
      addHref: `/aggiungi/pasto?giorno=${date}&ruolo=${g.role}`,
    };
  });
  const rows = [...timedRows.filter((r) => !grouped.has(r.id)), ...groupRows];
  const untimed = day.untimed.filter(notWater).map(row);
  const drinks = items.filter((i) => i.kind.key === "water" && i.status === "done");
  const lastDrink = Math.max(-1, ...drinks.map((i) => i.minute ?? -1));
  const water =
    date <= today
      ? {
          entry: waterBox(items, sctx),
          minute: lastDrink >= 0 ? lastDrink : (nowMinute ?? 12 * 60),
          drinks: drinks.map((i) => ({
            id: i.id,
            label:
              (i.minute !== null ? F.time(i.minute) + " · " : "") +
              F.num(Number(i.values["ml"] ?? 0), "ml"),
          })),
          add: addWater.bind(null, date),
        }
      : null;
  // Today and the days to come: what the model still plans, each opening its flow.
  const fromModel =
    date >= today
      ? modelItems({
          day: date,
          blocks,
          items,
          nowMinute,
          step: (plans.get(date)?.cycles ?? [])[0]?.label ?? null,
          slots,
        }).concat(
          habitItems({
            day: date,
            // The week's entries say what covers a habit («3 volte a settimana» counts them).
            habits: habitsDue(
              habits,
              date,
              days.flatMap((d) =>
                [...d.timed, ...d.untimed].map((i) => ({
                  day: d.day,
                  kind: i.kind.key,
                  category: i.kind.key === "activity" ? i.subcategory : null,
                })),
              ),
            ),
            nowMinute,
            familyOf: (k) => kindRegistry().get(k).family,
          }),
        )
      : [];
  const empty =
    rows.length === 0 && untimed.length === 0 && water === null && fromModel.length === 0;

  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Oggi"
        of={{ place: "oggi" }}
        context={cycleLine}
        extra={
          <DayPlanBar
            modelName={model?.name ?? null}
            model={model?.id ?? ""}
            fromDay={model?.from === "day"}
            models={(book?.models ?? [])
              .filter((m) => m.active)
              .map((m) => ({ id: m.id, name: m.name }))}
            steps={(plans.get(date)?.cycles ?? [])
              .filter((c) => !c.rest)
              .map((c) => ({ cycleId: c.cycleId, label: c.label, skipped: c.skipped }))}
            change={changeDayModel.bind(null, date)}
            skip={skipStep.bind(null, date)}
          />
        }
      />
      <section className="k-block g3">
        <DateNav
          day={date}
          today={today}
          hrefBase="/oggi/"
          scores={scores}
          tags={tags}
          bars={bars}
        />
        {weather && <WeatherCard w={weather.w} place={weather.p.name} hour={wxHour} />}
      </section>
      {whole && (
        <section className="k-block g3" aria-label="Il giorno">
          <OpenBox entry={{ ...whole.entry, ...withScore(score) }}>
            <Nutrients data={whole.nutrients} />
            {thisWeek && targets?.basis?.expenditureKcal !== undefined && (
              <form action={recomputeTargets} className="k-line end">
                <button type="submit" className="k-btn link">
                  Ricalcola la settimana
                </button>
              </form>
            )}
          </OpenBox>
          {line && (
            <a className="k-line k-plain" href="/andamento/obiettivi">
              <Glyph of={{ fam: "goal" }} size="m" />
              <span className="k-body">{line}</span>
            </a>
          )}
        </section>
      )}
      <section className="k-section g3" aria-label="La giornata">
        {empty ? (
          <p className="k-empty k-meta">Niente in questa giornata.</p>
        ) : (
          <DayView
            actions={{
              changeStatus,
              removeEntry,
              bringBack,
              removePlanned,
              bringBackAll,
            }}
            water={water}
            fromModel={fromModel}
            rows={rows}
            untimed={untimed}
            now={
              nowMinute === null ? null : { minute: nowMinute, label: F.time(nowMinute) }
            }
          />
        )}
        {rows.some((r) => r.fam === "food" || r.fam === "train") && (
          <form action={saveDayAsModel.bind(null, date)} className="k-line k-railed">
            <button type="submit" className="k-btn secondary">
              Salva come modello
            </button>
          </form>
        )}
        {date <= today && <DayClose closed={closed} close={closeDay.bind(null, date)} />}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="today" hrefs={PLACES} addHref={"/aggiungi?giorno=" + date} />
      </div>
    </main>
  );
}
