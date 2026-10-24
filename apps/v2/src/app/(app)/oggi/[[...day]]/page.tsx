/**
 * V-01, Oggi (screens.md): one logical day, `/oggi` for today and
 * `/oggi/2026-10-15` for any other. The server reads and composes the day
 * (core/day), presents each item as a kit Box (features/day) and hands the
 * client plain rows and the row actions (./actions.ts); the client holds the
 * filters, the rail's mode and the toast.
 * So far: the day as a Box (Nutrients L1 against the targets in force),
 * water as a Box (drunk of the need, its score) with +250/+500 ml, the
 * filters by domain and state, the timeline and the untimed items; meals,
 * weigh-ins and the night scored (features/day/score.ts). The day's own
 * score comes with the ranges (dossiers/ranges.md).
 */
import { notFound } from "next/navigation";
import { DateNav, Box, F, NavBar, Nutrients, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { dayMinute, loadDay, readDayTargets, readMicroTargets } from "@/core/day";
import { addDays, instantAt, logicalDay } from "@/core/engines/time";
import { readSettings } from "@/core/account/settings";
import { readGoals, readNumbers, readSpans } from "@/core/goals";
import { creatineDays, readCreatineLines } from "@/core/training";
import { readFoodEstimates } from "@/core/food/catalog";
import { foodIds, mealL0, presentDay } from "@/features/day/nutrients";
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
  const [day, targets, micros] = await Promise.all([
    loadDay(db, owner, date, known),
    readDayTargets(db, owner, date),
    readMicroTargets(db, owner, date),
  ]);
  const kinds = await readFoodEstimates(db, owner, foodIds(day));
  const whole = presentDay(day, targets, kinds, micros);
  const items = [...day.timed, ...day.untimed];
  // The few rows the weigh-in, night and water scores read, only when the day has them.
  const weighed = items.some((i) => i.kind.key === "weigh_in" && i.status === "done");
  const night = nightOf(items);
  const [weighings, goals, nights, profile] = await Promise.all([
    weighed
      ? readNumbers(db, owner, "weigh_in", "weightKg", addDays(date, -27), date)
      : null,
    weighed ? readGoals(db, owner, date) : null,
    night ? readSpans(db, owner, "sleep", addDays(date, -7), addDays(date, -1)) : null,
    date <= today ? readSettings(db, owner) : null,
  ]);
  const goal = goals?.find(
    (g) => g.source === "weight" && g.target === "reach" && g.value !== null,
  );
  const nowMinute = date === today ? dayMinute(now, date, clock) : null;
  const sctx: ScoreContext = {
    date,
    clock,
    weighings: weighings
      ? weighings
          .map((w) => ({ day: w.day, kg: w.n }))
          .sort((a, b) => a.day.localeCompare(b.day))
      : null,
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
      l0: mealL0(i, targets, kinds),
      details: hasDetails(d) ? d : null,
      id: i.id,
      status: i.status,
    };
  };
  const rows = day.timed.map((i) => ({ ...row(i), minute: i.minute! }));
  const untimed = day.untimed.map(row);
  const empty = rows.length === 0 && untimed.length === 0;

  return (
    <main className="k-page has-bd">
      <PageHeader title="Oggi" of={{ place: "oggi" }} />
      <section className="k-block g3">
        <DateNav day={date} today={today} hrefBase="/oggi/" />
      </section>
      {whole && (
        <section className="k-block g3" aria-label="Il giorno">
          <Box entry={whole.entry} rail={false}>
            <Nutrients data={whole.nutrients} />
          </Box>
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
