/**
 * V-01, Oggi (screens.md): one logical day, `/oggi` for today and
 * `/oggi/2026-10-15` for any other. The server reads and composes the day
 * (core/day), presents each item as a kit Box (features/day) and hands the
 * client plain rows and the row actions (./actions.ts); the client holds the
 * filters, the rail's mode and the toast.
 * So far: the day as a Box (Nutrients L1 against the targets in force),
 * water as a Box (drunk of the need, its score) with +250/+500 ml, the
 * filters by domain and state, the timeline and the untimed items; meals,
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
import { addWater, bringBack, changeStatus, removeEntry } from "./actions";
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
  const [days, dayTargets, micros] = await Promise.all([
    loadDays(db, owner, week[0]!, to, known),
    Promise.all(
      [...new Set([...scored, date])].map(
        async (d) => [d, await readDayTargets(db, owner, d)] as const,
      ),
    ).then((xs) => new Map(xs)),
    readMicroTargets(db, owner, date),
  ]);
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
    const d = details(i);
    return {
      ...withCompounds(present(i), i, ctx),
      ...withScore(
        mealScore(i, targets, kinds, micros) ??
          weighScore(i, items, sctx) ??
          sleepScore(i, items, sctx),
      ),
      l0: mealL0(i, targets, kinds, weightOn(series, date)),
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
  const rows = day.timed.map((i) => ({ ...row(i), minute: i.minute! }));
  const untimed = day.untimed.map(row);
  const empty = rows.length === 0 && untimed.length === 0;

  return (
    <main className="k-page has-bd">
      <PageHeader title="Oggi" of={{ place: "oggi" }} />
      <section className="k-block g3">
        <DateNav day={date} today={today} hrefBase="/oggi/" scores={scores} />
      </section>
      {whole && (
        <section className="k-block g3" aria-label="Il giorno">
          <OpenBox entry={{ ...whole.entry, ...withScore(score) }}>
            <Nutrients data={whole.nutrients} />
          </OpenBox>
        </section>
      )}
      {date <= today && (
        <section className="k-block g3" aria-label="Acqua">
          <OpenBox entry={waterBox(items, sctx)}>
            <div className="k-chips">
              <form action={addWater.bind(null, date, 250)}>
                <button type="submit" className="k-chip">
                  +250 ml
                </button>
              </form>
              <form action={addWater.bind(null, date, 500)}>
                <button type="submit" className="k-chip">
                  +500 ml
                </button>
              </form>
            </div>
          </OpenBox>
        </section>
      )}
      <section className="k-section g3" aria-label="La giornata">
        {empty ? (
          <p className="k-empty k-meta">Niente in questa giornata.</p>
        ) : (
          <DayView
            actions={{ changeStatus, removeEntry, bringBack }}
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
