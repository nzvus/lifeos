/**
 * «Qualità dei dati» (V-06, E9): the last 30 days up to yesterday — weigh-ins,
 * steps, nights, meals — each with how many days have it, what is missing,
 * what looks wrong (each opening its entry) and, for meals, the estimates.
 * Read only when opened: one narrow query per thing.
 */
import { Box, F, NavBar, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { PER_SIDE_FACTORS, quality, UNIT_FACTORS } from "@/core/engines/quality";
import { addDays, logicalDay } from "@/core/engines/time";
import { readQualityEntries } from "@/core/quality/read";
import { AREA_HREF } from "@/features/places";
import { qualityBox } from "@/features/progress/quality";

const DAYS = 30;

export default async function QualityPage() {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const to = addDays(logicalDay(new Date(), clock), -1);
  const from = addDays(to, -(DAYS - 1));
  const read = (kind: string, field: string | null) =>
    readQualityEntries(db, owner, kind, field, from, to, clock.timeZone);
  const [weigh, steps, nights, meals] = await Promise.all([
    read("weigh_in", "weightKg"),
    read("steps", "steps"),
    read("sleep", null),
    read("meal", null),
  ]);
  const window = { from, to };
  const daily = () => true;
  const dayOf = (list: { id: string; day: string }[]) => (id: string) =>
    list.find((e) => e.id === id)?.day ?? null;
  const boxes = [
    qualityBox({
      fam: "body",
      title: "Pesate",
      days: DAYS,
      report: quality({
        entries: weigh,
        window,
        expected: daily,
        range: { min: 30, max: 250 },
        factors: UNIT_FACTORS,
      }),
      show: (v) => F.num(v, "kg"),
      dayOf: dayOf(weigh),
    }),
    qualityBox({
      fam: "habit",
      title: "Passi",
      days: DAYS,
      report: quality({
        entries: steps,
        window,
        expected: daily,
        range: { min: 0, max: 60000 },
        factors: PER_SIDE_FACTORS.filter((f) => f !== 2),
      }),
      show: (v) => F.n(v, 0),
      dayOf: dayOf(steps),
    }),
    qualityBox({
      fam: "sleep",
      title: "Notti",
      days: DAYS,
      report: quality({ entries: nights, window, expected: daily }),
      show: (v) => String(v),
      dayOf: dayOf(nights),
    }),
    qualityBox({
      fam: "food",
      title: "Pasti",
      days: DAYS,
      // One entry a day is enough to have the day; the duplicates check is for the values.
      report: (() => {
        const q = quality({ entries: meals, window, expected: daily });
        return { ...q, issues: q.issues.filter((i) => i.type === "missing") };
      })(),
      show: (v) => String(v),
      dayOf: dayOf(meals),
      estimates: true,
    }),
  ];
  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Qualità dei dati"
        context={"dal " + F.date(from) + " al " + F.date(to)}
        back={{ label: "Andamento", href: "/oggi/andamento" }}
        of={{ place: "andamento" }}
      />
      <section className="k-section g3" aria-label="Le cose segnate">
        <p className="k-help">
          Più i dati sono completi e giusti, più i consumi, i voti e i legami sono
          affidabili. Ogni cosa strana si apre per correggerla.
        </p>
        {boxes.map((b) => (
          <div key={b.entry.title} className="k-stack g1">
            <Box density="row" rail={false} entry={b.entry} />
            {b.lines.map((l, i) =>
              l.href ? (
                <a key={i} className="k-link" href={l.href}>
                  {l.text} ›
                </a>
              ) : (
                <span key={i} className="k-help">
                  {l.text}
                </span>
              ),
            )}
          </div>
        ))}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="oggi" hrefs={AREA_HREF} addHref="/aggiungi" />
      </div>
    </main>
  );
}
