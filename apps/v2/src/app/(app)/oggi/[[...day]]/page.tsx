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
import { DateNav, F, NavBar, Nutrients, PageHeader, weekOf } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { dayMinute, loadDays, readDayTargets, readMicroTargets } from "@/core/day";
import { addDays, instantAt, logicalDay } from "@/core/engines/time";
import { readSettings } from "@/core/account/settings";
import { readGoals, readNumbers, readSpans } from "@/core/goals";
import { ensureWeekTargets, mondayOf } from "@/core/energy";
import { planTag, planWords, readDayPlans } from "@/core/plans";
import { creatineDays, readCreatineLines } from "@/core/training";
import { readFoodEstimates } from "@/core/food/catalog";
import { foodIds, mealL0 } from "@/features/day/nutrients";
import { dayScore, presentWeek, weekScores, weightOn } from "@/features/day/day-score";
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
  changeStatus,
  recomputeTargets,
  removeEntry,
} from "./actions";
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
  const [days, micros, plans] = await Promise.all([
    loadDays(db, owner, week[0]!, to, known),
    readMicroTargets(db, owner, date),
    readDayPlans(db, owner, week[0]!, week[6]!, today),
    date <= today ? ensureWeekTargets(db, owner, date, clock) : null,
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
    weighed ? readGoals(db, owner, date) : null,
    readSpans(db, owner, "sleep", addDays(week[0]!, -7), to),
    date <= today ? readSettings(db, owner) : null,
  ]);
  // The week strip names each day by its cycle's step or its model (day-templates.md §6).
  const tags = Object.fromEntries(
    week.flatMap((d) => (planTag(plans.get(d)) ? [[d, planTag(plans.get(d))]] : [])),
  );
  const planLine = planWords(plans.get(date), date === today);
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
  const row = (i: (typeof items)[number]) => {
    const l0 = mealL0(i, targets, kinds, weightOn(series, date), micros);
    // A meal of several foods lists them as its window's chips (L2), not again below.
    const d = details(i, { foods: (l0?.foods?.length ?? 0) < 2 });
    return {
      ...withCompounds(present(i), i, ctx),
      ...withScore(
        mealScore(i, targets, kinds, micros) ??
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
  const scores = weekScores({
    days,
    present: boxes,
    ctx: sctx,
    today,
    nowMinute: date === today ? nowMinute : dayMinute(now, today, clock),
  });
  // Water is one box in the timeline (WaterRow): its drinks are not rows of their own.
  const notWater = (i: (typeof items)[number]) => i.kind.key !== "water";
  const rows = day.timed.filter(notWater).map((i) => ({ ...row(i), minute: i.minute! }));
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
  const empty = rows.length === 0 && untimed.length === 0 && water === null;

  return (
    <main className="k-page has-bd">
      <PageHeader title="Oggi" of={{ place: "oggi" }} />
      <section className="k-block g3">
        <DateNav day={date} today={today} hrefBase="/oggi/" scores={scores} tags={tags} />
        {planLine && <p className="k-meta">{planLine}</p>}
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
        </section>
      )}
      <section className="k-section g3" aria-label="La giornata">
        {empty ? (
          <p className="k-empty k-meta">Niente in questa giornata.</p>
        ) : (
          <DayView
            actions={{ changeStatus, removeEntry, bringBack }}
            water={water}
            rows={rows}
            untimed={untimed}
            now={
              nowMinute === null ? null : { minute: nowMinute, label: F.time(nowMinute) }
            }
          />
        )}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="today" hrefs={PLACES} addHref={"/aggiungi?giorno=" + date} />
      </div>
    </main>
  );
}
