/**
 * An exercise's page (V-07): its trend (E6, dossiers/training.md §5.2), its
 * sessions newest first with their work sets and best e1RM; «Unisci» with
 * an exercise of the same movement (a duplicate: Run and Corsa).
 */
import { notFound } from "next/navigation";
import { F, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { exerciseTrend } from "@/core/engines/training";
import { readExerciseLog, readExercises } from "@/core/training";
import { trendText } from "@/features/training/present";
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
  const all = await readExercises(db, owner);
  const x = all.find((e) => e.id === id);
  if (!x) notFound();
  const sessions = (await readExerciseLog(db, owner, id)).get(id) ?? [];
  // Possible duplicates: another exercise of the same movement pattern.
  const twins = x.pattern
    ? all.filter((e) => e.id !== id && e.pattern === x.pattern)
    : [];
  const best = sessions.reduce((m, s) => Math.max(m, s.best ?? 0), 0);
  const trend = trendText(
    exerciseTrend(
      sessions.flatMap((s) => (s.best ? [{ day: s.day, value: s.best }] : [])),
    ),
  );
  return (
    <main className="k-page">
      <PageHeader
        title={x.name}
        context={F.plural(sessions.length, "sessione", "sessioni")}
        back={{ label: "Esercizi", href: "/libreria?vista=esercizi" }}
        of={{ fam: "train" }}
      />
      {best > 0 && (
        <section className="k-section g3" aria-label="Record">
          {trend && <p className="k-body">{trend}</p>}
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
      {twins.length > 0 && (
        <details className="k-section k-fold">
          <summary>
            Unisci un doppione <span className="k-meta">{twins.length}</span>
          </summary>
          <div className="k-foldbody">
            <p className="k-help">
              Lo stesso movimento con un altro nome? Le sue sessioni passano qui e il suo
              nome resta come alias.
            </p>
            {twins.map((t) => (
              <a
                key={t.id}
                className="k-btn link"
                href={`/libreria/esercizio/${id}/unisci?con=${t.id}`}
              >
                Unisci «{t.name}» in «{x.name}» ›
              </a>
            ))}
          </div>
        </details>
      )}
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
