"use client";
/**
 * «Finisci…» (gym mode): what the session holds before it ends — the sets
 * done, the exercises with no set (skipped at the end), the presunte that
 * finishing confirms. The session ends only from here; «Continua» goes back.
 */
import { F } from "@lifeos/kit";
import type { GymExercise } from "./Gym";
import { workDone } from "./gym-parts";

export function FinishSheet({
  exercises,
  minutes,
  busy,
  onBack,
  onFinish,
}: {
  exercises: GymExercise[];
  minutes: number | null;
  busy: boolean;
  onBack: () => void;
  onFinish: () => void;
}) {
  const work = exercises.reduce((n, e) => n + workDone(e), 0);
  const warm = exercises.reduce((n, e) => n + e.done.filter((d) => d.warmup).length, 0);
  const untouched = exercises.filter((e) => e.done.length === 0);
  const assumed = exercises.reduce(
    (n, e) => n + e.done.filter((d) => d.assumed).length,
    0,
  );
  return (
    <div className="k-sheet-wrap k-screen">
      <button
        type="button"
        className="k-dim"
        aria-label="Torna all’allenamento"
        onClick={onBack}
      />
      <section className="k-sheet" role="dialog" aria-label="Finire l’allenamento">
        <span className="handle" />
        <div className="k-sh">
          <h2>Finire l’allenamento?</h2>
          {minutes !== null && <span className="k-meta">{F.num(minutes, "min")}</span>}
        </div>
        <div className="k-sbody">
          <p className="k-body">
            {F.plural(work, "serie fatta", "serie fatte")} in{" "}
            {F.plural(exercises.length - untouched.length, "esercizio", "esercizi")}
            {warm > 0 && (
              <>, più {F.plural(warm, "di riscaldamento", "di riscaldamento")}</>
            )}
            .
          </p>
          {untouched.length > 0 && (
            <p className="k-body">
              Senza serie, segnati come saltati: {untouched.map((e) => e.name).join(", ")}
              .
            </p>
          )}
          {assumed > 0 && (
            <p className="k-body" role="alert">
              {F.plural(assumed, "serie presunta", "serie presunte")}: le ha contate l’app
              mentre i tempi andavano da soli. Finendo le confermi come fatte; se una non
              è andata così, torna indietro e correggila.
            </p>
          )}
          <p className="k-help">Potrai riprenderlo dopo, dalla sessione.</p>
        </div>
        <div className="foot">
          <button type="button" className="k-btn secondary k-grow" onClick={onBack}>
            Continua
          </button>
          <button
            type="button"
            className="k-btn primary k-grow"
            aria-busy={busy}
            onClick={onFinish}
          >
            {assumed > 0 ? "Conferma e finisci" : "Finisci"}
          </button>
        </div>
      </section>
    </div>
  );
}
