/**
 * Piano → Modelli (V-08), first part: the cycles, the one in use first,
 * each with its steps (a rest, or the routines it trains) and «Usa questo
 * ciclo» on the others. Day types, the week layout and the editors come
 * with their slices.
 */
import { Box, F, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readCycles } from "@/core/plans";
import { chooseCycle } from "./actions";

export default async function ModelsPage() {
  const owner = await requireOwner();
  const cycles = await readCycles(await getDb(), owner);
  return (
    <main className="k-page">
      <PageHeader
        title="Modelli"
        back={{ label: "Piano", href: "/piano" }}
        of={{ place: "piano" }}
      />
      <section className="k-section g3" aria-label="Cicli">
        <h2>Cicli</h2>
        {cycles.length === 0 && <p className="k-help">Nessun ciclo.</p>}
        {cycles.map((c) => (
          <Box
            key={c.id}
            rail={false}
            entry={{
              fam: "train",
              title: c.name,
              meta:
                F.plural(c.steps.length, "passo", "passi") +
                (c.active && c.startDay ? " · in uso dal " + F.date(c.startDay) : ""),
              ...(c.active ? { pills: [{ t: "in uso", state: "good" as const }] } : {}),
            }}
          >
            {c.notes && <p className="k-help">{c.notes}</p>}
            <ol className="k-stack g1">
              {c.steps.map((s) => (
                <li key={s.position} className="k-body">
                  {s.position + 1}.{" "}
                  {s.items.length > 0 ? s.items.join(", ") : s.label || "—"}
                </li>
              ))}
            </ol>
            {!c.active && (
              <form action={chooseCycle.bind(null, c.id)}>
                <button type="submit" className="k-btn secondary">
                  Usa questo ciclo
                </button>
              </form>
            )}
          </Box>
        ))}
      </section>
    </main>
  );
}
