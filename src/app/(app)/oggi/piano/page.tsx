/**
 * Oggi · Piano (PAT-97; proposal §31–§32, his 15 Nov): a day of Oggi in the future. The header,
 * the week strip (`?settimana=`, `?giorno=`), then the day (`DayPage` in Piano's frame): its voci,
 * what the cicli and blocchi plan (each line with its ritmo as a tag that opens it), the gaps
 * that offer what is missing. No card of controls, no list of the week or of the cicli: one
 * place per idea.
 */
import { DateNav, F, PageHeader, weekOf, AreaFilter } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { ensureWeekTargets } from "@/core/energy";
import { planTag, readDayPlans } from "@/core/plans";
import { logicalDay } from "@/core/engines/time";
import { areaHrefs, placeHead } from "@/features/places";
import { plan } from "@/i18n/plan";
import { DayPage } from "../day-page";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function PianoPage({
  searchParams,
}: {
  searchParams: Promise<{ settimana?: string | string[]; giorno?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const known = await ownerClock();
  const today = logicalDay(new Date(), known.clock);
  const asked = await searchParams;
  const wanted =
    typeof asked.giorno === "string" && ISO.test(asked.giorno) ? asked.giorno : null;
  const week = weekOf(
    wanted ??
      (typeof asked.settimana === "string" && ISO.test(asked.settimana)
        ? asked.settimana
        : today),
  );
  const open = wanted ?? (week.includes(today) ? today : week[0]!);
  const [plans] = await Promise.all([
    readDayPlans(db, owner, week[0]!, week[6]!, today),
    // A week begun: its automatic targets, made when missing.
    week[0]! <= today ? ensureWeekTargets(db, owner, week[0]!, known.clock) : null,
  ]);
  const head = (
    <>
      <PageHeader
        title={placeHead("piano").title}
        context={[
          F.week(week[0]!),
          ...(plans.get(open)?.cycles ?? []).map((c) => "ciclo " + c.cycle),
        ]
          .filter(Boolean)
          .join(" · ")}
        action={{ label: plan.elenco.addCycle, href: "/oggi/ciclo/nuovo" }}
        of={placeHead("piano").of}
      />
      <AreaFilter area="oggi" hrefs={areaHrefs("piano")} />
      <section className="k-block g3 k-top">
        <DateNav
          mode="week"
          day={open}
          today={today}
          hrefBase="/oggi/piano?giorno="
          weekBase="/oggi/piano?settimana="
          levelKey="piano.settimana"
          tags={Object.fromEntries(week.map((d) => [d, planTag(plans.get(d))]))}
        />
      </section>
    </>
  );
  // His 15 Nov: «togliere anche quello… solo una pianificazione come fosse una giornata in
  // Oggi ma nel futuro». What repeats is a tag on its line, opening its ritmo (proposal §32).
  return (
    <DayPage
      params={Promise.resolve({ day: [open] })}
      searchParams={Promise.resolve({})}
      piano={{ head }}
    />
  );
}
