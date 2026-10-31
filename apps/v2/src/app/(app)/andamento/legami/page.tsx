/**
 * «Legami» (V-06 correlations, E8): the last 90 days' pairs of daily
 * measures — sleep, morning energy and mood, stress, steps, training
 * minutes — as features/progress/links says them; a pair short of 21 days
 * says how many it has. Read only when opened: a few narrow queries.
 */
import { Box, F, NavBar, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { sleepOn } from "@/core/engines/sleep";
import { addDays, logicalDay, type IsoDate } from "@/core/engines/time";
import { readNumbers, readSpans, SLEEP_KINDS } from "@/core/goals";
import { links, type Measure } from "@/features/progress/links";
import { AREA_HREF } from "@/features/places";

const DAYS = 90;

export default async function LinksPage() {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const from = addDays(today, -DAYS);
  const [nights, energy, mood, stress, steps, train] = await Promise.all([
    readSpans(db, owner, SLEEP_KINDS, addDays(from, -1), addDays(today, 1)),
    readNumbers(db, owner, "checkin", "energy", from, today),
    readNumbers(db, owner, "checkin", "mood", from, today),
    readNumbers(db, owner, "checkin", "stress", from, today),
    readNumbers(db, owner, "steps", "steps", from, today),
    readNumbers(db, owner, "session", "durationMin", from, today),
  ]);
  const mean = (xs: { day: IsoDate; n: number }[]) => {
    const by = new Map<IsoDate, number[]>();
    for (const x of xs) by.set(x.day, [...(by.get(x.day) ?? []), x.n]);
    return new Map([...by].map(([d, v]) => [d, v.reduce((a, b) => a + b, 0) / v.length]));
  };
  const sum = (xs: { day: IsoDate; n: number }[]) => {
    const by = new Map<IsoDate, number>();
    for (const x of xs) by.set(x.day, (by.get(x.day) ?? 0) + x.n);
    return by;
  };
  const measures: Measure[] = [
    {
      key: "sleepH",
      words: "le ore di sonno",
      // The day's sleep, its night rebuilt from the pieces and naps (dossiers/sleep.md).
      byDay: new Map(
        Array.from({ length: DAYS + 1 }, (_, i) => addDays(from, i)).flatMap((d) => {
          const m = sleepOn(nights, d, clock.timeZone).totalMin;
          return m > 0 ? [[d, m / 60] as const] : [];
        }),
      ),
    },
    { key: "energy", words: "l’energia", byDay: mean(energy) },
    { key: "mood", words: "l’umore", byDay: mean(mood) },
    { key: "stress", words: "lo stress", byDay: mean(stress) },
    { key: "steps", words: "i passi", byDay: sum(steps) },
    { key: "trainMin", words: "i minuti di allenamento", byDay: sum(train) },
  ];
  const rows = links(measures);
  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Legami"
        context="ultimi 90 giorni · cosa va insieme a cosa"
        back={{ label: "Andamento", href: "/oggi/andamento" }}
        of={{ place: "andamento" }}
      />
      <section className="k-section g2" aria-label="I legami">
        <p className="k-help">
          Un legame si calcola quando ci sono almeno 21 giorni con entrambe le cose
          segnate. Dice solo che due cose vanno insieme, non che una causa l’altra.
        </p>
        {rows.map((r) => (
          <Box
            key={r.pair.x + r.pair.y + r.pair.lag}
            density="row"
            rail={false}
            entry={
              r.ready
                ? {
                    fam: "mind",
                    title: r.pair.words[0]!.toUpperCase() + r.pair.words.slice(1),
                    value: "ρ " + F.n(r.c.rho, 2),
                    meta:
                      r.says +
                      " " +
                      r.c.n +
                      " giorni · intervallo " +
                      F.n(r.c.low, 2) +
                      " – " +
                      F.n(r.c.high, 2),
                  }
                : {
                    fam: "mind",
                    title: r.pair.words[0]!.toUpperCase() + r.pair.words.slice(1),
                    value: r.have + "/" + r.need,
                    meta: "giorni con entrambe segnate: ne servono " + r.need,
                    faded: true,
                  }
            }
          />
        ))}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="oggi" hrefs={AREA_HREF} addHref="/aggiungi" />
      </div>
    </main>
  );
}
