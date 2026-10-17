/**
 * Andamento (flows.md §1, V-06), first part: «Il periodo», the last 7, 30
 * or 90 days (`?giorni=`) up to `?fino=YYYY-MM-DD` (today when missing): the day's Nutrients
 * averaged over the days with something eaten, and each day's kcal against
 * its target. Trackers, goals and correlations come with their slices.
 */
import { Box, F, NavBar, Nutrients, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDays, readClock, readRangeTargets } from "@/core/day";
import { addDays, logicalDay } from "@/core/engines/time";
import { presentDay } from "@/features/day/nutrients";
import { PLACES } from "@/features/places";
import { period, weightChange } from "@/features/progress/period";

const RANGES = [7, 30, 90] as const;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function AndamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ fino?: string | string[]; giorni?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const today = logicalDay(new Date(), (await readClock(db, owner)).clock);
  const { fino: asked, giorni } = await searchParams;
  const DAYS = RANGES.find((n) => String(n) === giorni) ?? 7;
  const link = (fino: string | null, n: number) => {
    const q = [fino ? "fino=" + fino : "", n !== 7 ? "giorni=" + n : ""].filter(Boolean);
    return "/andamento" + (q.length ? "?" + q.join("&") : "");
  };
  const end =
    typeof asked === "string" && ISO.test(asked) && asked < today ? asked : today;
  const days = Array.from({ length: DAYS }, (_, i) => addDays(end, i - DAYS + 1));
  // The whole range in one set of queries (core/day `loadDays`), not one per day.
  const [loaded, targets] = await Promise.all([
    loadDays(db, owner, days[0]!, end),
    readRangeTargets(db, owner, days[0]!, end),
  ]);
  const data = loaded.map((d) => ({
    day: d.day,
    nutrients: presentDay(d, targets.get(d.day) ?? null)?.nutrients ?? null,
  }));
  const p = period(data);
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
      <section className="k-section g3" aria-label="Il periodo">
        <div className="k-chips">
          {RANGES.map((n) => (
            <a
              key={n}
              className="k-chip"
              aria-pressed={n === DAYS}
              href={link(end === today ? null : end, n)}
            >
              {n} giorni
            </a>
          ))}
        </div>
        <div className="k-line between">
          <a className="k-link" href={link(addDays(end, -DAYS), DAYS)}>
            ‹ prima
          </a>
          <span className="k-body">
            {F.date(days[0]!)} – {F.date(end)}
          </span>
          {end < today ? (
            <a className="k-link" href={link(later >= today ? null : later, DAYS)}>
              dopo ›
            </a>
          ) : (
            <span />
          )}
        </div>
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
