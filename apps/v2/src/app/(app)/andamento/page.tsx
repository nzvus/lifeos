/**
 * Andamento (flows.md §1, V-06), first part: «Il periodo», the last 7, 30
 * or 90 days (`?giorni=`) up to `?fino=YYYY-MM-DD` (today when missing), or a
 * calendar month (`?mese=YYYY-MM`), moved through with the kit's RangeNav
 * (the board: presets and the month with the period highlighted): the day's Nutrients
 * averaged over the days with something eaten, and each day's kcal against
 * its target; «Energia» (what E4 learnt the person spends next to the
 * priors, the week of the period's end: core/energy, dossiers/targets.md).
 * Trackers, goals and correlations come with their slices.
 */
import { Box, F, NavBar, Nutrients, PageHeader, RangeNav } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDays, readRangeTargets } from "@/core/day";
import { ensureWeekTargets, mondayOf } from "@/core/energy";
import { readDayModels } from "@/core/plans";
import { energyBoxes } from "@/features/progress/energy";
import { addDays, logicalDay } from "@/core/engines/time";
import { presentDay } from "@/features/day/nutrients";
import { PLACES } from "@/features/places";
import { period, trainingOf, weightChange } from "@/features/progress/period";

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
    // The week of the period's end, made when missing (it also gives that week's targets).
    ensureWeekTargets(db, owner, end, known.clock),
  ]);
  const targets = await readRangeTargets(db, owner, days[0]!, end, models);
  const energy = energyBoxes(week as Record<string, unknown> | null, mondayOf(end));
  const data = loaded.map((d) => ({
    day: d.day,
    nutrients: presentDay(d, targets.get(d.day) ?? null)?.nutrients ?? null,
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
        <a className="k-link" href="/andamento/obiettivi">
          Obiettivi ›
        </a>
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
        />
        <Box
          rail={false}
          entry={{
            fam: "day",
            title: "Il periodo",
            meta:
              p.logged === 0
                ? "nessun giorno con pasti"
                : "media di " + F.plural(p.logged, "giorno", "giorni") + " con pasti",
          }}
        >
          {p.nutrients && <Nutrients data={p.nutrients} />}
        </Box>
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
