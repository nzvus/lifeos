"use client";
/**
 * The day's model in Oggi's header (the board Main: «Giornata «Rec» ▾»,
 * the cycle as the line under the title): what changes this day only
 * (dossiers/day-templates.md §5). The button opens a panel: another model
 * (or the week's again), and each cycle's step skipped, or back.
 */
import { useState, useTransition } from "react";

export function DayPlanBar({
  model,
  modelName,
  fromDay,
  models,
  steps,
  change,
  skip,
}: {
  /** The day's model id, "" for none. */
  model: string;
  modelName: string | null;
  /** The model was chosen for this day (not the week's). */
  fromDay: boolean;
  models: { id: string; name: string }[];
  steps: { cycleId: string; label: string; skipped: boolean }[];
  change: (d: FormData) => Promise<void>;
  skip: (cycleId: string, skipped: boolean) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  if (models.length === 0 && steps.length === 0) return null;
  return (
    <span style={{ position: "relative", zIndex: 20 }}>
      <button
        type="button"
        className="k-back k-act-link"
        style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
        aria-expanded={open}
        aria-label={
          (modelName ? "Giornata «" + modelName + "»" : "Nessun modello") +
          ": tocca per cambiarla"
        }
        onClick={() => setOpen(!open)}
      >
        {modelName ? "Giornata «" + modelName + "»" : "Giornata"} ▾
      </button>
      {open && (
        <div
          className="k-panel k-stack g2"
          style={{
            position: "absolute",
            // Its right edge on the page's gutter: past the gear beside the button.
            right: -48,
            top: "calc(100% + 4px)",
            zIndex: 20,
            boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
            width: "min(20rem, calc(100vw - 32px))",
          }}
        >
          {models.length > 0 && (
            <form
              action={async (d) => {
                await change(d);
                setOpen(false);
              }}
              className="k-line g2"
            >
              <select
                className="k-select"
                style={{ flex: 1, minWidth: 0 }}
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
      )}
    </span>
  );
}
