/**
 * Piano (flows.md §1, V-08), first part: the week holding `?settimana=`
 * (today's when missing), Monday to Sunday, each day with what is planned
 * («Previsto»), opened in its editor, and «+» to plan more that day.
 * Models, cycles and habits come with their slices.
 */
import { addDays, Box, F, NavBar, PageHeader, weekOf } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDay, readClock } from "@/core/day";
import { logicalDay } from "@/core/engines/time";
import { present } from "@/features/day/present";
import { PLACES } from "@/features/places";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function PianoPage({
  searchParams,
}: {
  searchParams: Promise<{ settimana?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const today = logicalDay(new Date(), (await readClock(db, owner)).clock);
  const asked = (await searchParams).settimana;
  const week = weekOf(typeof asked === "string" && ISO.test(asked) ? asked : today);
  const days = await Promise.all(week.map((d) => loadDay(db, owner, d)));
  const href = (d: string) =>
    weekOf(today)[0] === weekOf(d)[0] ? "/piano" : "/piano?settimana=" + d;
  return (
    <main className="k-page has-bd">
      <PageHeader title="Piano" of={{ place: "piano" }} />
      <section className="k-section g3" aria-label="La settimana">
        <div className="k-line between">
          <a className="k-link" href={href(addDays(week[0]!, -7))}>
            ‹ prima
          </a>
          <span className="k-body">
            {F.date(week[0]!)} – {F.date(week[6]!)}
          </span>
          <a className="k-link" href={href(addDays(week[0]!, 7))}>
            dopo ›
          </a>
        </div>
      </section>
      <section className="k-section g4" aria-label="I giorni">
        {days.map((d) => {
          const planned = [...d.timed, ...d.untimed].filter(
            (i) => i.status === "planned",
          );
          return (
            <div key={d.day} className="k-stack g2" aria-label={F.Day(d.day)}>
              <div className="k-line between">
                <span className="k-label">{d.day === today ? "Oggi" : F.Day(d.day)}</span>
                {planned.length === 0 && (
                  <span className="k-meta">niente di previsto</span>
                )}
                {d.day >= today && (
                  <a className="k-link" href={"/aggiungi?giorno=" + d.day}>
                    + previsto
                  </a>
                )}
              </div>
              {planned.map((i) => (
                <Box key={i.id} density="row" rail={false} entry={present(i)} />
              ))}
            </div>
          );
        })}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="plan" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
