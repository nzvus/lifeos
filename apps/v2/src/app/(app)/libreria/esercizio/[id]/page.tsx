/** An exercise's page (V-07): its sessions, newest first, with their work sets and best e1RM (E6). */
import { notFound } from "next/navigation";
import { F, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readExerciseLog, readExercises } from "@/core/training";
import { archiveExercise } from "./actions";

const SHOWN = 20;

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { id } = await params;
  const x = (await readExercises(db, owner)).find((e) => e.id === id);
  if (!x) notFound();
  const sessions = (await readExerciseLog(db, owner, id)).get(id) ?? [];
  const best = sessions.reduce((m, s) => Math.max(m, s.best ?? 0), 0);
  return (
    <main className="k-page">
      <PageHeader
        title={x.name}
        context={F.plural(sessions.length, "sessione", "sessioni")}
        back={{ label: "Libreria", href: "/libreria" }}
        of={{ fam: "train" }}
      />
      {best > 0 && (
        <section className="k-section g3" aria-label="Record">
          <div className="k-line between">
            <span className="k-body">e1RM migliore</span>
            <span className="k-num">{F.num(best, "kg")}</span>
          </div>
        </section>
      )}
      <section className="k-section g3" aria-label="Sessioni">
        <h2>Sessioni</h2>
        {sessions.length === 0 && <p className="k-help">Ancora mai fatto.</p>}
        {sessions.slice(0, SHOWN).map((s, i) => (
          <div key={i} className="k-line between">
            <span className="k-body">
              {F.Day(s.day)}
              <span className="k-meta">
                {" · "}
                {s.sets
                  .map(
                    (t) =>
                      (t.reps ?? "?") +
                      (t.loadKg === null ? "" : "×" + F.n(Number(t.loadKg), 2)),
                  )
                  .join(", ") || "nessuna serie"}
              </span>
            </span>
            <span className="k-num">{s.best ? F.num(s.best, "kg") : "—"}</span>
          </div>
        ))}
      </section>
      <form action={archiveExercise.bind(null, id)} className="k-section g3">
        <p className="k-help">
          Archiviato, esce dalla Libreria e dalla palestra; le sessioni fatte restano.
        </p>
        <button type="submit" className="k-btn secondary">
          Archivia
        </button>
      </form>
    </main>
  );
}
