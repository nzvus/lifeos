/**
 * «Soldi» (V-11, the board Money): a month (`?mese=YYYY-MM`, this one when
 * missing) — spent and earned, the pace against the month before at the
 * same day, spending by category (a sub-category in its parent), then the
 * movements day by day with each day's total. ⊕ → Spesa adds one.
 */
import { addDays, Box, F, NavBar, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { readCategories, readMovements } from "@/core/money";
import { monthMoney } from "@/core/money/month";
import { categoryName } from "@/features/money/words";
import { AREA_HREF } from "@/features/places";

const MONTH = /^\d{4}-\d{2}$/;
const eur = (cents: number) => F.num(Math.abs(cents) / 100, "€");

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ mese?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const { mese } = await searchParams;
  const month =
    typeof mese === "string" && MONTH.test(mese) && mese <= today.slice(0, 7)
      ? mese
      : today.slice(0, 7);
  const first = month + "-01";
  const last = addDays(addDays(first, 32).slice(0, 7) + "-01", -1);
  const upTo = last < today ? last : today;
  const prevFirst = addDays(first, -1).slice(0, 7) + "-01";
  const [now, before, cats] = await Promise.all([
    readMovements(db, owner, first, upTo),
    readMovements(db, owner, prevFirst, addDays(first, -1)),
    readCategories(db, owner),
  ]);
  const m = monthMoney(now, before.length ? before : null, cats, upTo);
  const nameOf = new Map(cats.map((c) => [c.id, categoryName(c.name)]));
  const pace =
    m.beforeCents && m.beforeCents > 0
      ? Math.round(((m.spentCents - m.beforeCents) / m.beforeCents) * 100)
      : null;
  const link = (mm: string) =>
    "/andamento/soldi" + (mm === today.slice(0, 7) ? "" : "?mese=" + mm);
  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Soldi"
        context={F.month(first) + " " + first.slice(0, 4) + " · i movimenti, il mese"}
        back={{ label: "Andamento", href: "/oggi/andamento" }}
        action={{ label: "+ Spesa", href: "/aggiungi/spesa" }}
        of={{ fam: "money" }}
      />
      <section className="k-block g3">
        <div className="k-line between">
          <a className="k-link" href={link(prevFirst.slice(0, 7))}>
            ‹ {F.month(prevFirst)}
          </a>
          {month < today.slice(0, 7) && (
            <a className="k-link" href={link(addDays(last, 1).slice(0, 7))}>
              {F.month(addDays(last, 1))} ›
            </a>
          )}
        </div>
        <div className="k-stats">
          <div className="k-stat">
            <span className="k-meta">Spesi</span>
            <span className="v">{eur(m.spentCents)}</span>
            <span className="k-help">
              {upTo === last ? "nel mese" : "al " + F.date(upTo)}
            </span>
          </div>
          <div className="k-stat">
            <span className="k-meta">Ritmo</span>
            <span className="v">{pace === null ? "—" : F.signed(pace, "%")}</span>
            <span className="k-help">
              {pace === null
                ? "serve il mese prima"
                : "rispetto a " + F.month(prevFirst) + " allo stesso giorno"}
            </span>
          </div>
          <div className="k-stat">
            <span className="k-meta">Entrate</span>
            <span className="v">{eur(m.earnedCents)}</span>
            <span className="k-help">nel mese</span>
          </div>
        </div>
      </section>
      {m.byCategory.length > 0 && (
        <section className="k-section g2" aria-label="Il mese per categoria">
          <h2>Il mese per categoria</h2>
          {m.byCategory.map((c) => (
            <Box
              key={c.id ?? "none"}
              density="row"
              rail={false}
              entry={{
                fam: "money",
                title: c.id ? (nameOf.get(c.id) ?? "Categoria") : "Senza categoria",
                value: eur(c.cents),
                meta:
                  F.n((c.cents / Math.max(1, m.spentCents)) * 100, 0) + " % della spesa",
                strip: [
                  {
                    w: Math.max(
                      2,
                      Math.round((c.cents / Math.max(1, m.spentCents)) * 100),
                    ),
                    c: "var(--muscle-shoulders)",
                  },
                ],
              }}
            />
          ))}
        </section>
      )}
      <section className="k-section g2" aria-label="Movimenti">
        <h2>Movimenti</h2>
        {m.days.length === 0 && (
          <p className="k-help">Nessun movimento nel mese: si aggiungono da ⊕ → Spesa.</p>
        )}
        {m.days.map((d) => (
          <div key={d.day} className="k-stack g2">
            <div className="k-line between">
              <span className="k-cap">{F.Day(d.day)}</span>
              <span className="k-meta">{(d.cents < 0 ? "−" : "+") + eur(d.cents)}</span>
            </div>
            {d.movements.map((x) => (
              <Box
                key={x.id}
                density="row"
                rail={false}
                entry={{
                  fam: "money",
                  title:
                    x.note ||
                    x.shop ||
                    (x.categoryId ? nameOf.get(x.categoryId) : "") ||
                    "Movimento",
                  value: (x.cents < 0 ? "−" : "+") + eur(x.cents),
                  meta: [
                    x.categoryId ? nameOf.get(x.categoryId) : "",
                    x.note && x.shop ? x.shop : "",
                    x.method === "cash" ? "contanti" : "",
                  ]
                    .filter(Boolean)
                    .join(" · "),
                  href: "/voce/" + x.id,
                  hrefLabel: "Modifica il movimento",
                }}
              />
            ))}
          </div>
        ))}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="oggi" hrefs={AREA_HREF} addHref="/aggiungi" />
      </div>
    </main>
  );
}
