"use client";
/**
 * The day's ciclo in Oggi's header (the cycle as the line under the title): what changes this
 * day only (PL-43). The button opens a panel: each ciclo's step skipped, or back. Day models
 * and «Cambia la giornata» are gone (PL-61, MOD-32; change 2026-11-07-piano).
 */
import { useState, useTransition } from "react";

export function DayPlanBar({
  steps,
  skip,
}: {
  steps: { cycleId: string; label: string; skipped: boolean }[];
  skip: (cycleId: string, skipped: boolean) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  if (steps.length === 0) return null;
  return (
    <span style={{ position: "relative", zIndex: 20 }}>
      <button
        type="button"
        className="k-back k-act-link"
        style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
        aria-expanded={open}
        aria-label="Giornata: tocca per cambiarla"
        onClick={() => setOpen(!open)}
      >
        Giornata ▾
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
