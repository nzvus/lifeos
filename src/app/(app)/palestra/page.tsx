/**
 * ⊕ → Allenamento (V-05): pick a routine (most trained first, with its
 * exercises) or none, and the session starts now; gym mode opens. Starting
 * is for today: a past session is edited from its day.
 */
import { Box, F, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { readExercises, readRoutines } from "@/core/training";
import { startGym } from "./actions";

export default async function GymStartPage() {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const routines = await readRoutines(db, owner, today, await readExercises(db, owner));
  return (
    <main className="k-page">
      <PageHeader
        title="Allenamento"
        context="si inizia adesso"
        back={{ label: "Aggiungi", href: "/aggiungi?giorno=" + today }}
        of={{ fam: "train", kind: "session" }}
      />
      <section className="k-section g2" aria-label="Scegli il modello">
        <h2>Da un modello</h2>
        {routines.map((r) => (
          <form key={r.id} action={startGym.bind(null, r.id)}>
            <button type="submit" className="k-pick">
              <Box
                density="row"
                rail={false}
                entry={{
                  fam: "train",
                  of: { kind: "session" },
                  title: r.name,
                  meta:
                    F.plural(r.exercises.length, "esercizio", "esercizi") +
                    (r.uses ? " · " + r.uses + " volte in 90 giorni" : ""),
                  value: "›",
                }}
              />
            </button>
          </form>
        ))}
        {routines.length === 0 && <p className="k-help">Nessun modello: inizia senza.</p>}
      </section>
      <section className="k-section g2" aria-label="Senza modello">
        <form action={startGym.bind(null, "")}>
          <button type="submit" className="k-btn secondary k-grow">
            Inizia senza modello
          </button>
        </form>
      </section>
    </main>
  );
}
