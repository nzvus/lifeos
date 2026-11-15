"use client";
/**
 * «Questa volta» on a ritmo (proposal §32, slice 2; his 15 Nov «toccando quel tag… puoi
 * visualizzare e configurare»): the ciclo's steps as chips, the day's one on; a tap gives this
 * day that step (the same again: back to the ciclo's own); «Salta questa volta» or its undo.
 * The page's server actions come bound with the day and the ciclo; it re-reads after each.
 */
import { useTransition } from "react";

export function ThisTime({
  steps,
  current,
  custom,
  skipped,
  choose,
  skip,
}: {
  steps: { label: string; position: number | null }[];
  /** The step the day has now (its position, null for a rest). */
  current: number | null;
  /** The day's step was chosen by hand: a tap on it goes back to the ciclo's own. */
  custom: boolean;
  skipped: boolean;
  choose: (position: number | null | undefined) => Promise<void>;
  skip: (skipped: boolean) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="k-stack g2" aria-busy={pending}>
      <div className="k-chips" role="group" aria-label="Il passo di questo giorno">
        {steps.map((s) => {
          const on = s.position === current;
          return (
            <button
              key={String(s.position) + s.label}
              type="button"
              className="k-chip"
              aria-pressed={on}
              disabled={pending}
              onClick={() => start(() => choose(on && custom ? undefined : s.position))}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="k-line">
        <button
          type="button"
          className="k-btn secondary"
          disabled={pending}
          onClick={() => start(() => skip(!skipped))}
        >
          {skipped ? "Non saltare più" : "Salta questa volta"}
        </button>
      </div>
    </div>
  );
}
