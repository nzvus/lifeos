/**
 * Oggi · Piano (his «yc» on proposal §38, 1A — 15 Nov: «la pagina piano non ha senso nei giorni
 * passati, mentre quella oggi non ha senso per quelli futuri… la pagina piano attuale deve essere
 * diversa da adesso, non così ridondante come Oggi»): what repeats, and the weeks ahead. The week
 * strip with each day's step (`?settimana=`; a day opens in Oggi, which holds every day), then
 * the ritmi — cicli and the blocchi outside them — as the kit `Elenco`, the same as an area's
 * Piano. No day page here any more: a day is planned in Oggi.
 */
import { AreaFilter, DateNav, Elenco, F, PageHeader, weekOf } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, logicalDay } from "@/core/engines/time";
import { listBlocks, planTag, readCycleBook, readDayPlans } from "@/core/plans";
import { areaHrefs, placeHead } from "@/features/places";
import { planSections } from "@/features/plan/plan-sections";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function PianoPage({
  searchParams,
}: {
  searchParams: Promise<{
    settimana?: string | string[];
    archiviati?: string | string[];
  }>;
}) {
  const [owner, db, known] = await Promise.all([requireOwner(), getDb(), ownerClock()]);
  const today = logicalDay(new Date(), known.clock);
  const asked = await searchParams;
  const archived = asked.archiviati === "1";
  // What is ahead: the week of tomorrow (on a Sunday, the next one) unless he asked for one.
  const week = weekOf(
    typeof asked.settimana === "string" && ISO.test(asked.settimana)
      ? asked.settimana
      : addDays(today, 1),
  );
  const [plans, blocks, book] = await Promise.all([
    readDayPlans(db, owner, week[0]!, week[6]!, today),
    listBlocks(db, owner, archived),
    readCycleBook(db, owner),
  ]);
  const day = week.includes(today) ? today : week[0]!;
  return (
    <main className="k-page has-bd">
      <PageHeader
        title={placeHead("piano").title}
        context={[
          F.week(week[0]!),
          ...(plans.get(day)?.cycles ?? []).map((c) => "ciclo " + c.cycle),
        ]
          .filter(Boolean)
          .join(" · ")}
        of={placeHead("piano").of}
      />
      <AreaFilter area="oggi" hrefs={areaHrefs("piano")} />
      <section className="k-block g3 k-top">
        {/* Each day with its step; a tap opens it in Oggi, past, today or to come (1A). */}
        <DateNav
          mode="week"
          day={day}
          today={today}
          hrefBase="/oggi/"
          weekBase="/oggi/piano?settimana="
          levelKey="piano.settimana"
          tags={Object.fromEntries(week.map((d) => [d, planTag(plans.get(d))]))}
        />
      </section>
      <Elenco
        archived={archived}
        filterHref={{ active: "/oggi/piano", archived: "/oggi/piano?archiviati=1" }}
        sections={planSections({
          blocks,
          cycles: book?.cycles ?? null,
          archived,
          area: null,
        })}
      />
    </main>
  );
}
