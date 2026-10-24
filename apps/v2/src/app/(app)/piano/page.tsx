/**
 * Piano (flows.md §1, V-08), first part: the week holding `?settimana=`
 * (today's when missing), Monday to Sunday, each day with what is planned
 * («Previsto»), opened in its editor, and «+» to plan more that day; each
 * day says its model, its kcal (core/day, dossiers/targets.md) and, from
 * today, its cycle's step (core/plans,
 * dossiers/day-templates.md slice a). Editing models and cycles comes with
 * slices b and c.
 */
import { addDays, Box, F, NavBar, PageHeader, weekOf } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDays, readRangeTargets } from "@/core/day";
import { ensureWeekTargets } from "@/core/energy";
import { planWords, readDayPlans } from "@/core/plans";
import { logicalDay } from "@/core/engines/time";
import { present } from "@/features/day/present";
import { withCompounds } from "@/features/day/compounds";
import { foodIds } from "@/features/day/nutrients";
import { readFoodEstimates } from "@/core/food/catalog";
import { PLACES } from "@/features/places";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function PianoPage({
  searchParams,
}: {
  searchParams: Promise<{ settimana?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const known = await ownerClock();
  const today = logicalDay(new Date(), known.clock);
  const asked = (await searchParams).settimana;
  const week = weekOf(typeof asked === "string" && ISO.test(asked) ? asked : today);
  // The whole week from one set of queries, not seven.
  const [days, plans] = await Promise.all([
    loadDays(db, owner, week[0]!, week[6]!, known),
    readDayPlans(db, owner, week[0]!, week[6]!, today),
    // A week begun: its automatic targets, made when missing.
    week[0]! <= today ? ensureWeekTargets(db, owner, week[0]!, known.clock) : null,
  ]);
  // A coffee or creatine planned is drawn as on Oggi («Caffè ≈ 100 mg»), not as grams.
  const [compounds, targets] = await Promise.all([
    readFoodEstimates(db, owner, days.flatMap(foodIds)),
    // Each day's kcal from its model and the week (dossiers/targets.md slice c).
    readRangeTargets(
      db,
      owner,
      week[0]!,
      week[6]!,
      new Map(
        week.map((d) => {
          const m = plans.get(d)?.model;
          return [d, m ? { name: m.name, targets: m.targets } : null] as const;
        }),
      ),
    ),
  ]);
  const ctx = { compounds, doses: [], bed: null, creatineDays: null };
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
              {(planWords(plans.get(d.day), d.day === today) || targets.get(d.day)) && (
                <span className="k-meta">
                  {[
                    planWords(plans.get(d.day), d.day === today),
                    targets.get(d.day) ? F.num(targets.get(d.day)!.kcal, "kcal") : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
              {planned.map((i) => (
                <Box
                  key={i.id}
                  density="row"
                  rail={false}
                  entry={withCompounds(present(i), i, ctx)}
                />
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
