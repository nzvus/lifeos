"use client";
/**
 * «Questa volta» on a ritmo (proposal §32, slice 2; his 15 Nov «toccando quel tag… puoi
 * visualizzare e configurare»): the ciclo's steps as chips, the day's one on; a tap gives this
 * day that step (the same again: back to the ciclo's own); «Salta questa volta» or its undo; «Sposta» its lines to
 * another time that day (PL-43), «↺ Ora del ciclo» back.
 * The page's server actions come bound with the day and the ciclo; it re-reads after each.
 */
import { Field } from "@lifeos/kit";
import { useState, useTransition } from "react";

export function ThisTime({
  steps,
  current,
  custom,
  skipped,
  choose,
  skip,
  line,
  at,
  moved,
  move,
}: {
  steps: { label: string; position: number | null }[];
  /** The step the day has now (its position, null for a rest). */
  current: number | null;
  /** The day's step was chosen by hand: a tap on it goes back to the ciclo's own. */
  custom: boolean;
  skipped: boolean;
  choose: (position: number | null | undefined) => Promise<void>;
  skip: (skipped: boolean) => Promise<void>;
  /** The line he came from (its tag), by name; null: no «Sposta». */
  line: string | null;
  /** That line's time that day («HH:MM»), "" when not known. */
  at: string;
  /** The line was moved this day: «↺ Ora del ciclo» shows. */
  moved: boolean;
  /** «HH:MM» moves the line that day; "" gives it back its own time. */
  move: ((at: string) => Promise<void>) | null;
}) {
  const [pending, start] = useTransition();
  const [when, setWhen] = useState(at);
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
      {!skipped && line !== null && move && (
        <div className="k-line bottom wrap g2">
          <Field
            name="ora"
            label={line + " alle"}
            type="time"
            defaultValue={at}
            onChange={setWhen}
          />
          <button
            type="button"
            className="k-btn secondary"
            disabled={pending || when === "" || when === at}
            onClick={() => start(() => move(when))}
          >
            Sposta
          </button>
          {moved && (
            <button
              type="button"
              className="k-btn link"
              disabled={pending}
              onClick={() => start(() => move(""))}
            >
              ↺ Ora del ciclo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
