/**
 * A tracker page (V-06, the board Tracker): `/andamento/peso`, `sonno`,
 * `acqua`, `passi`, or a kind of the person's own by its key — the period (`?giorni=` 7, 30 or 90, 30 when missing, up
 * to `?fino=`) as a box with its score and three stats, the chart, each
 * entry a row with its own score, what the tracker says about you. The
 * rows of the period are read once (core/day `loadDays`) and drawn by
 * features/progress/tracker.
 */
import { notFound } from "next/navigation";
import { Box, Chart, NavBar, PageHeader, RangeNav } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { dayMinute, loadDays, readUserKinds } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { ensureWeekTargets } from "@/core/energy";
import { addDays, logicalDay } from "@/core/engines/time";
import { readGoals, readNumbers, readSpans, weightProgress } from "@/core/goals";
import { readSettings } from "@/core/account/settings";
import type { ScoreContext } from "@/features/day/score";
import { OpenBox } from "@/features/day/OpenBox";
import { PLACES } from "@/features/places";
import {
  kindTracker,
  sleepTracker,
  stepsTracker,
  TRACKERS,
  waterTracker,
  weightTracker,
  type Tracker,
} from "@/features/progress/tracker";

const RANGES = [7, 30, 90] as const;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** The E7 model each tracker's rows are scored by («Come valutiamo»). */
const SCORED: Partial<Record<Tracker, string>> = {
  peso: "weighing",
  sonno: "sleep",
  acqua: "water",
};

export default async function TrackerPage({
  params,
  searchParams,
}: {
  params: Promise<{ tracker: string }>;
  searchParams: Promise<{ fino?: string | string[]; giorni?: string | string[] }>;
}) {
  const { tracker: asked } = await params;
  const owner = await requireOwner();
  const db = await getDb();
  const builtIn = (TRACKERS as readonly string[]).includes(asked);
  // A kind of the person's own: its key, live (an archived one keeps its page).
  const own = builtIn
    ? null
    : (kindRegistry(await readUserKinds(db, owner)).all.find(
        (k) => k.key === asked && k.name,
      ) ?? null);
  if (!builtIn && !own) notFound();
  const tracker = asked as Tracker;
  const known = await ownerClock();
  const today = logicalDay(new Date(), known.clock);
  const { fino, giorni } = await searchParams;
  const end = typeof fino === "string" && ISO.test(fino) && fino < today ? fino : today;
  const DAYS = RANGES.find((n) => String(n) === giorni) ?? 30;
  const period = Array.from({ length: DAYS }, (_, i) => addDays(end, i - DAYS + 1));
  const start = period[0]!;
  const link = (to: string | null, n: number) => {
    const q = [to ? "fino=" + to : "", n !== 30 ? "giorni=" + n : ""].filter(Boolean);
    return "/andamento/" + tracker + (q.length ? "?" + q.join("&") : "");
  };
  const [days, weighings, goals, nights, profile] = await Promise.all([
    loadDays(db, owner, start, end, known),
    tracker === "peso"
      ? readNumbers(db, owner, "weigh_in", "weightKg", addDays(start, -27), end)
      : Promise.resolve([]),
    readGoals(db, owner, end),
    tracker === "sonno"
      ? readSpans(db, owner, "sleep", addDays(start, -7), end)
      : Promise.resolve([]),
    readSettings(db, owner),
  ]);
  const series = weighings
    .map((w) => ({ day: w.day, kg: w.n }))
    .sort((a, b) => a.day.localeCompare(b.day));
  const wGoal = goals.find(
    (g) => g.source === "weight" && g.target === "reach" && g.value !== null,
  );
  const nowMinute = dayMinute(new Date(), today, known.clock);
  const ctxOf = (d: string): ScoreContext => ({
    date: d,
    clock: known.clock,
    weighings: series.filter((w) => w.day <= d),
    weightGoal: wGoal ? { value: wGoal.value!, since: wGoal.since, by: wGoal.by } : null,
    nights,
    sex: profile.sex,
    now: d === today ? nowMinute : null,
  });
  let view;
  if (own) view = kindTracker({ kind: own, days, period });
  else if (tracker === "peso") {
    const week = (await ensureWeekTargets(db, owner, end, known.clock)) as Record<
      string,
      unknown
    > | null;
    const kcal = Number(week?.["expenditureKcal"]);
    view = weightTracker({
      days,
      ctxOf,
      progress: wGoal
        ? weightProgress(
            series,
            { value: wGoal.value!, since: wGoal.since, by: wGoal.by },
            end,
          )
        : null,
      goal: wGoal ? { value: wGoal.value!, by: wGoal.by } : null,
      energy:
        week && Number.isFinite(kcal)
          ? {
              kcal,
              sigma: Number(week["sigmaKcal"]) || 0,
              loggedDays: Number(week["loggedDays"]) || 0,
            }
          : null,
    });
  } else if (tracker === "sonno")
    view = sleepTracker({ days, period, ctxOf, timeZone: known.clock.timeZone });
  else if (tracker === "acqua") view = waterTracker({ days, period, ctxOf });
  else {
    const g = goals.find(
      (x) => x.source === "steps" && x.target === "at_least" && x.value !== null,
    );
    view = stepsTracker({
      days,
      period,
      goal: g ? { value: g.value!, weekdaysOnly: g.metric["days"] === "weekdays" } : null,
    });
  }
  const later = addDays(end, DAYS);
  return (
    <main className="k-page has-bd">
      <PageHeader
        title={view.title}
        context={view.context}
        back={{ label: "Andamento", href: "/andamento" }}
        action={{ label: "Obiettivi", href: "/andamento/obiettivi" }}
        of={view.of}
      />
      <section className={"k-section g3 fam-" + view.head.fam} aria-label="Il periodo">
        <RangeNav
          from={start}
          to={end}
          today={today}
          prevHref={link(addDays(end, -DAYS), DAYS)}
          nextHref={end >= today ? null : link(later >= today ? null : later, DAYS)}
          presets={RANGES.map((n) => ({
            label: n + " giorni",
            href: link(end === today ? null : end, n),
            on: n === DAYS,
          }))}
          dayHref={(d) => "/oggi/" + d}
        />
        <OpenBox entry={view.head} />
        {view.stats.length > 0 && (
          <div className="k-stats">
            {view.stats.map((s) => (
              <div key={s.l} className="k-stat">
                <span className="k-meta">{s.l}</span>
                <span className="v">{s.v}</span>
                <span className="k-help">{s.u}</span>
              </div>
            ))}
          </div>
        )}
        {view.chart && (
          <Chart
            type={view.chart.type}
            data={view.chart.data}
            caption={view.chart.caption}
          />
        )}
      </section>
      <section className="k-section" aria-label="Cosa dice di te">
        <h2>Cosa dice di te</h2>
        <span className="k-body">{view.about}</span>
      </section>
      <section className="k-section g3" aria-label={view.rowsTitle}>
        <h2>
          {view.rowsTitle}{" "}
          {SCORED[tracker] && (
            <a href={"/andamento/come-valutiamo?modello=" + SCORED[tracker]}>
              come valutiamo ›
            </a>
          )}
        </h2>
        <span className="k-meta">{view.rowsNote}</span>
        {view.rows.length === 0 ? (
          <p className="k-help">Niente nel periodo.</p>
        ) : (
          <div className="k-stack g2">
            {view.rows.map((e) => (
              <Box key={e.href} density="row" rail={false} entry={e} />
            ))}
          </div>
        )}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="progress" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
