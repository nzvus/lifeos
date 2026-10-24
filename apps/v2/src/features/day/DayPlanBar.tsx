"use client";
/**
 * The day's plan on Oggi (the boards' header line «Giornata «Rec» · PLPRR:
 * oggi Push, poi Riposo») with what changes this day only
 * (dossiers/day-templates.md §5): «Cambia la giornata» picks another model
 * (or the week's again); each cycle's step can be skipped, and back.
 */
import { useState, useTransition } from "react";

export function DayPlanBar({
  words,
  model,
  fromDay,
  models,
  steps,
  change,
  skip,
}: {
  words: string;
  /** The day's model id, "" for none. */
  model: string;
  /** The model was chosen for this day (not the week's). */
  fromDay: boolean;
  models: { id: string; name: string }[];
  steps: { cycleId: string; label: string; skipped: boolean }[];
  change: (d: FormData) => Promise<void>;
  skip: (cycleId: string, skipped: boolean) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="k-stack g2">
      {words && <p className="k-meta">{words}</p>}
      <div className="k-line wrap">
        {models.length > 0 && (
          <button
            type="button"
            className="k-btn link"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            Cambia la giornata
          </button>
        )}
        {steps.map((s) => (
          <button
            key={s.cycleId}
            type="button"
            className="k-btn link"
            disabled={pending}
            onClick={() => start(() => skip(s.cycleId, !s.skipped))}
          >
            {s.skipped
              ? "Annulla il salto di «" + s.label + "»"
              : "Salta «" + s.label + "»"}
          </button>
        ))}
      </div>
      {open && (
        <form
          action={async (d) => {
            await change(d);
            setOpen(false);
          }}
          className="k-line k-panel"
        >
          <select
            className="k-select"
            name="model"
            defaultValue={fromDay ? model : ""}
            aria-label="Il modello di questa giornata"
          >
            <option value="">come la settimana</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button type="submit" className="k-btn primary">
            Salva
          </button>
        </form>
      )}
    </div>
  );
}
