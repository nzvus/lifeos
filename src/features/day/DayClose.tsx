"use client";
/**
 * «Chiudi la giornata» (S-T28, the boards' last button on Oggi): the person
 * says whether the food log is whole; E4 trusts a closed day's kcal by it.
 * Closed, it says how and can be reopened.
 */
import { useState, useTransition } from "react";
import type { Closure } from "@/core/day";

const WORDS: Record<Closure, string> = {
  complete: "ho segnato tutto",
  partial: "manca qualcosa",
};

export function DayClose({
  closed,
  close,
}: {
  closed: Closure | null;
  close: (state: Closure | null) => Promise<boolean>;
}) {
  const [asking, setAsking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const send = (state: Closure | null) =>
    start(async () => {
      const ok = await close(state).catch(() => false);
      setFailed(!ok);
      if (ok) setAsking(false);
    });

  if (closed)
    return (
      <div className="k-line between k-railed">
        <span className="k-meta">Giornata chiusa: {WORDS[closed]}</span>
        <button
          type="button"
          className="k-btn link"
          disabled={pending}
          onClick={() => send(null)}
        >
          Riapri
        </button>
      </div>
    );
  return (
    <div className="k-stack g2 k-railed">
      {asking ? (
        <>
          <span className="k-meta">Il cibo di questa giornata è tutto qui?</span>
          <div className="k-line wrap">
            <button
              type="button"
              className="k-btn primary"
              disabled={pending}
              onClick={() => send("complete")}
            >
              Ho segnato tutto
            </button>
            <button
              type="button"
              className="k-btn secondary"
              disabled={pending}
              onClick={() => send("partial")}
            >
              Manca qualcosa
            </button>
          </div>
          <span className="k-help">
            Il dispendio si calcola dai giorni chiusi: uno con qualcosa in meno conta solo
            per quello che c&apos;è.
          </span>
        </>
      ) : (
        <button type="button" className="k-btn primary" onClick={() => setAsking(true)}>
          Chiudi la giornata
        </button>
      )}
      {failed && <span className="k-help">Non è stato salvato. Riprova.</span>}
    </div>
  );
}
