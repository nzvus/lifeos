/**
 * Andamento (flows.md §1, V-06), first part: «Il periodo», the last 7, 30
 * or 90 days (`?giorni=`) up to `?fino=YYYY-MM-DD` (today when missing), or a
 * calendar month (`?mese=YYYY-MM`), moved through with the kit's RangeNav
 * (the board: presets and the month with the period highlighted): the day's Nutrients
 * averaged over the days with something eaten, and each day's kcal against
 * its target, each day's score as the calendar's dots and the period's as
 * the box's (E7 `DAY`), «Gli ambiti» (food, weight, sleep, water: each
 * domain's score averaged over the period; the steps' numbers, no score yet); «Energia» (what E4 learnt the person spends next to the
 * priors, the week of the period's end: core/energy, dossiers/targets.md).
 * Trackers, goals and correlations come with their slices.
 */
import {
  Box,
  F,
  NavBar,
  Nutrients,
  PageHeader,
  RangeNav,
  type BoxEntry,
} from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { dayMinute, loadDays, readMicroTargets, readRangeTargets } from "@/core/day";
import { ensureWeekTargets, mondayOf } from "@/core/energy";
import { readDayModels } from "@/core/plans";
import { energyBoxes } from "@/features/progress/energy";
import { addDays, daysBetween, logicalDay } from "@/core/engines/time";
import { readFoodEstimates } from "@/core/food/catalog";
import { readGoals, readNumbers, readSpans } from "@/core/goals";
import { readSettings } from "@/core/account/settings";
import { foodIds } from "@/features/day/nutrients";
import { dayScores, presentWeek } from "@/features/day/day-score";
import {
  mealScore,
  nightOf,
  sleepScore,
  waterBox,
  weighScore,
  type ScoreContext,
} from "@/features/day/score";
import { OpenBox } from "@/features/day/OpenBox";
import { averageScore } from "@/features/progress/average";
import { stepsDomain } from "@/features/progress/steps";
import { PLACES } from "@/features/places";
import {
  period,
  periodPills,
  trainingOf,
  weightChange,
} from "@/features/progress/period";

const RANGES = [7, 30, 90] as const;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

export default async function AndamentoPage({
  searchParams,
}: {
  searchParams: Promise<{
    fino?: string | string[];
    giorni?: string | string[];
    mese?: string | string[];
  }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const known = await ownerClock();
  const today = logicalDay(new Date(), known.clock);
  const { fino: asked, giorni, mese } = await searchParams;
  const month =
    typeof mese === "string" && MONTH.test(mese) && mese <= today.slice(0, 7)
      ? mese
      : null;
  const link = (fino: string | null, n: number) => {
    const q = [fino ? "fino=" + fino : "", n !== 7 ? "giorni=" + n : ""].filter(Boolean);
    return "/andamento" + (q.length ? "?" + q.join("&") : "");
  };
  const monthLink = (m: string) => "/andamento?mese=" + m;
  // A month: from its first day to its last, or to today in the current one.
  const monthEnd = (m: string) => {
    const last = addDays(addDays(m + "-01", 32).slice(0, 7) + "-01", -1);
    return last < today ? last : today;
  };
  const end = month
    ? monthEnd(month)
    : typeof asked === "string" && ISO.test(asked) && asked < today
      ? asked
      : today;
  const start = month ? month + "-01" : null;
  const DAYS = start
    ? Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1
    : (RANGES.find((n) => String(n) === giorni) ?? 7);
  const days = Array.from({ length: DAYS }, (_, i) => addDays(end, i - DAYS + 1));
  // The whole range in one set of queries (core/day `loadDays`), not one per day.
  const [loaded, models, week] = await Promise.all([
    loadDays(db, owner, days[0]!, end, known),
    readDayModels(db, owner, days[0]!, end),
    // Every week of the period, made when missing (once each): their targets, and
    // the last one's energy for «Energia».
    Promise.all(
      Array.from(
        { length: Math.floor(daysBetween(mondayOf(days[0]!), mondayOf(end)) / 7) + 1 },
        (_, i) =>
          ensureWeekTargets(db, owner, addDays(mondayOf(days[0]!), 7 * i), known.clock),
      ),
    ).then((weeks) => weeks.at(-1) ?? null),
  ]);
  const [targets, estimates, micros, weighings, goals, nights, profile] =
    await Promise.all([
      readRangeTargets(db, owner, days[0]!, end, models),
      readFoodEstimates(db, owner, loaded.flatMap(foodIds)),
      readMicroTargets(db, owner, end),
      readNumbers(db, owner, "weigh_in", "weightKg", addDays(days[0]!, -27), end),
      readGoals(db, owner, end),
      readSpans(db, owner, "sleep", addDays(days[0]!, -7), end),
      readSettings(db, owner),
    ]);
  const energy = energyBoxes(week as Record<string, unknown> | null, mondayOf(end));
  const series = weighings
    .map((w) => ({ day: w.day, kg: w.n }))
    .sort((a, b) => a.day.localeCompare(b.day));
  // Each day as Oggi presents and scores it (features/day), from the rows already read.
  const boxes = presentWeek({
    days: loaded,
    targets,
    estimates,
    micros,
    weighings: series,
  });
  const goal = goals.find(
    (g) => g.source === "weight" && g.target === "reach" && g.value !== null,
  );
  const nowMinute = dayMinute(new Date(), today, known.clock);
  const ctxOf = (d: string): ScoreContext => ({
    date: d,
    clock: known.clock,
    weighings: series.filter((w) => w.day <= d),
    weightGoal: goal ? { value: goal.value!, since: goal.since, by: goal.by } : null,
    nights,
    sex: profile.sex,
    now: d === today ? nowMinute : null,
    weights: known.weights,
  });
  const scores = dayScores({
    days: loaded,
    present: boxes,
    ctx: ctxOf(end),
    today,
    nowMinute,
  });
  // «Gli ambiti» (the Progress board): each domain's score, its parts averaged over the period.
  const domain = (
    pick: (d: (typeof loaded)[number]) => (BoxEntry["score"] | undefined)[],
  ) => averageScore(loaded.flatMap(pick));
  const itemsOf = (d: (typeof loaded)[number]) => [...d.timed, ...d.untimed];
  const domains: BoxEntry[] = [
    {
      fam: "food",
      sub: "lunch",
      title: "Cibo",
      score: domain((d) =>
        itemsOf(d).map((i) =>
          mealScore(
            i,
            targets.get(d.day) ?? null,
            estimates,
            micros,
            null,
            null,
            known.weights,
          ),
        ),
      ),
    },
    {
      fam: "body",
      sub: "weight",
      title: "Peso",
      href: "/andamento/peso",
      score: domain((d) =>
        itemsOf(d).map((i) => weighScore(i, itemsOf(d), ctxOf(d.day))),
      ),
    },
    {
      fam: "sleep",
      sub: "wake",
      title: "Sonno",
      href: "/andamento/sonno",
      score: domain((d) => {
        const n = nightOf(itemsOf(d));
        return n ? [sleepScore(n, itemsOf(d), ctxOf(d.day))] : [];
      }),
    },
    {
      fam: "drink",
      sub: "water",
      title: "Acqua",
      href: "/andamento/acqua",
      score: domain((d) =>
        itemsOf(d).some((i) => i.kind.key === "water")
          ? [waterBox(itemsOf(d), ctxOf(d.day)).score]
          : [],
      ),
    },
  ].flatMap((e) =>
    e.score ? [{ ...e, value: String(e.score.value), score: e.score } as BoxEntry] : [],
  );
  // The steps: numbers without a score (the movement dossier has not decided one).
  const stepGoal = goals.find(
    (g) => g.source === "steps" && g.target === "at_least" && g.value !== null,
  );
  const stepsRow = stepsDomain(
    days,
    loaded.flatMap((d) =>
      itemsOf(d)
        .filter((i) => i.kind.key === "steps" && i.status === "done")
        .map((i) => ({ day: d.day, n: Number(i.values["steps"] ?? 0) })),
    ),
    stepGoal
      ? { value: stepGoal.value!, weekdaysOnly: stepGoal.metric["days"] === "weekdays" }
      : null,
  );
  if (stepsRow) domains.push({ ...stepsRow, href: "/andamento/passi" });
  // The person's own trackers used in the period, each to its page (no score: theirs to say).
  const own = new Map<
    string,
    { kind: (typeof loaded)[number]["timed"][number]["kind"]; n: number }
  >();
  for (const d of loaded)
    for (const i of itemsOf(d))
      if (i.kind.name && i.status === "done")
        own.set(i.kind.key, { kind: i.kind, n: (own.get(i.kind.key)?.n ?? 0) + 1 });
  const periodScore = averageScore([...scores.values()]);
  const data = loaded.map((d) => ({
    day: d.day,
    nutrients: boxes.get(d.day)?.nutrients ?? null,
  }));
  const p = period(data);
  const training = trainingOf(
    loaded.map((d) => {
      const done = [...d.timed, ...d.untimed].filter(
        (i) => i.kind.key === "session" && i.status === "done",
      );
      return {
        sessions: done.length,
        workSets: done.reduce(
          (n, i) =>
            n +
            i.children.reduce((m, c) => m + c.sets.filter((x) => !x.warmup).length, 0),
          0,
        ),
        minutes: done.reduce((n, i) => n + (Number(i.values["durationMin"]) || 0), 0),
      };
    }),
  );
  const weight = weightChange(
    loaded.flatMap((d) =>
      [...d.timed, ...d.untimed]
        .filter((i) => i.kind.key === "weigh_in" && i.status === "done")
        .flatMap((i) => {
          const kg = Number(i.values["weightKg"]);
          return Number.isFinite(kg) && kg > 0 ? [{ day: d.day, kg }] : [];
        }),
    ),
  );
  const later = addDays(end, DAYS);
  return (
    <main className="k-page has-bd">
      <PageHeader title="Andamento" of={{ place: "andamento" }} />
      <section className="k-section" aria-label="Obiettivi">
        <div className="k-line between">
          <a className="k-link" href="/andamento/obiettivi">
            Obiettivi ›
          </a>
          <a className="k-link" href="/andamento/soldi">
            Soldi ›
          </a>
          <a className="k-link" href="/andamento/legami">
            Legami ›
          </a>
          <a className="k-link" href="/andamento/qualita">
            Qualità ›
          </a>
          <a className="k-link" href="/andamento/come-valutiamo">
            Come valutiamo ›
          </a>
        </div>
      </section>
      <section className="k-section g3" aria-label="Il periodo">
        <RangeNav
          from={days[0]!}
          to={end}
          today={today}
          prevHref={
            month
              ? monthLink(addDays(month + "-01", -1).slice(0, 7))
              : link(addDays(end, -DAYS), DAYS)
          }
          nextHref={
            end >= today
              ? null
              : month
                ? monthLink(addDays(month + "-01", 32).slice(0, 7))
                : link(later >= today ? null : later, DAYS)
          }
          presets={[
            ...RANGES.map((n) => ({
              label: n + " giorni",
              href: link(end === today ? null : end, n),
              on: !month && n === DAYS,
            })),
            { label: "Mese", href: monthLink(end.slice(0, 7)), on: !!month },
          ]}
          dayHref={(d) => "/oggi/" + d}
          scores={Object.fromEntries([...scores].map(([d, x]) => [d, x.value!]))}
        />
        <OpenBox
          entry={{
            fam: "day",
            title: "Il periodo",
            ...(periodScore
              ? { value: String(periodScore.value), score: periodScore }
              : {}),
            meta:
              p.logged === 0
                ? "nessun giorno con pasti"
                : "media di " + F.plural(p.logged, "giorno", "giorni") + " con pasti",
            pills: periodPills({
              sessions: training.sessions,
              nights: nights.filter((n) => n.day >= days[0]! && n.day <= end),
              weight,
            }),
          }}
        >
          {p.nutrients && <Nutrients data={p.nutrients} />}
        </OpenBox>
      </section>
      {energy && (
        <section className="k-section g3" aria-label="Energia">
          <h2>
            Energia <span className="k-meta">quanto consumi, e da dove</span>
          </h2>
          <Box rail={false} entry={energy.learnt} />
          {energy.priors.map((e) => (
            <Box key={e.title} density="row" rail={false} entry={e} />
          ))}
          <span className="k-meta">
            Le stime sono il punto di partenza; il trend del peso le corregge. Lo scarto
            tra la loro somma e il consumo appreso è ciò che lifeos ha imparato su di te.
          </span>
        </section>
      )}
      {domains.length > 0 && (
        <section className="k-section g3" aria-label="Gli ambiti">
          <h2>
            Gli ambiti <span className="k-meta">il voto del periodo</span>
          </h2>
          {domains.map((e) => (
            <OpenBox key={e.title} entry={e} />
          ))}
        </section>
      )}
      {own.size > 0 && (
        <section className="k-section g3" aria-label="I tuoi tracker">
          <h2>I tuoi tracker</h2>
          {[...own.values()].map(({ kind, n }) => (
            <Box
              key={kind.key}
              density="row"
              rail={false}
              entry={{
                fam: kind.family,
                of: { kind: kind.key },
                title: kind.name!,
                value: String(n),
                meta: n === 1 ? "volta nel periodo" : "volte nel periodo",
                href: "/andamento/" + kind.key,
                hrefLabel: "Andamento di " + kind.name,
              }}
            />
          ))}
        </section>
      )}
      <section className="k-section g3" aria-label="Peso">
        <h2>Peso</h2>
        {weight ? (
          <>
            <div className="k-line between">
              <span className="k-body">
                {F.num(weight.from, "kg")} → {F.num(weight.to, "kg")}
              </span>
              <span className="k-num">
                {(weight.delta > 0 ? "+" : "") + F.num(weight.delta, "kg")}
              </span>
            </div>
            <p className="k-help">
              Media della prima e dell’ultima settimana con pesate (
              {F.plural(weight.n, "pesata", "pesate")}): una pesata sola oscilla di un
              chilo.
            </p>
          </>
        ) : (
          <p className="k-help">Servono almeno due pesate nel periodo.</p>
        )}
      </section>
      <section className="k-section g3" aria-label="Allenamento">
        <h2>Allenamento</h2>
        {training.sessions === 0 ? (
          <p className="k-help">Nessun allenamento nel periodo.</p>
        ) : (
          <>
            <div className="k-line between">
              <span className="k-body">
                {F.plural(training.sessions, "sessione", "sessioni")}
              </span>
              <span className="k-num">{F.n(training.perWeek, 1)} a settimana</span>
            </div>
            <div className="k-line between">
              <span className="k-body">Serie allenanti</span>
              <span className="k-num">{training.workSets}</span>
            </div>
            {training.minutes > 0 && (
              <div className="k-line between">
                <span className="k-body">Tempo</span>
                <span className="k-num">{F.hm(training.minutes)}</span>
              </div>
            )}
          </>
        )}
      </section>
      <section className="k-section g3" aria-label="I giorni">
        <h2>I giorni</h2>
        <div className="k-stack g2">
          {[...p.rows].reverse().map((r) => (
            <Box
              key={r.day}
              density="row"
              rail={false}
              entry={{
                fam: "day",
                title: F.Day(r.day),
                value:
                  r.kcal === null
                    ? "—"
                    : r.t
                      ? F.n(r.kcal, 0) + " / " + F.num(r.t, "kcal")
                      : F.num(r.kcal, "kcal"),
                href: r.day === today ? "/oggi" : "/oggi/" + r.day,
                ...(scores.get(r.day) ? { score: scores.get(r.day)! } : {}),
              }}
            />
          ))}
        </div>
      </section>
      <div className="k-nav k-stick">
        <NavBar active="progress" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
