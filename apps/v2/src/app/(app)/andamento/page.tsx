/**
 * Andamento (flows.md §1, V-06), first part: «Il periodo», the last 7 or 30
 * days (`?giorni=`) up to `?fino=YYYY-MM-DD` (today when missing): the day's Nutrients
 * averaged over the days with something eaten, and each day's kcal against
 * its target. Trackers, goals and correlations come with their slices.
 */
import { Box, F, NavBar, Nutrients, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDay, readClock, readDayTargets } from "@/core/day";
import { addDays, logicalDay } from "@/core/engines/time";
import { presentDay } from "@/features/day/nutrients";
import { PLACES } from "@/features/places";
import { period } from "@/features/progress/period";

// Each day is read on its own: 90 would be 180 queries, until a range reader exists.
const RANGES = [7, 30] as const;
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
  const data = await Promise.all(
    days.map(async (day) => {
      const [d, t] = await Promise.all([
        loadDay(db, owner, day),
        readDayTargets(db, owner, day),
      ]);
      return { day, nutrients: presentDay(d, t)?.nutrients ?? null };
    }),
  );
  const p = period(data);
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
