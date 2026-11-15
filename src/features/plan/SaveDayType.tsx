"use client";
/**
 * «Salva come giornata «Legs»» (proposal §28): one button that runs the page's server action
 * (bound with the day and the step), says it is working, then what it did — no raw form
 * (PAT-61). The page re-reads itself after the action (revalidatePath).
 */
import { useState, useTransition } from "react";

export function SaveDayType({
  label,
  save,
}: {
  label: string;
  save: () => Promise<void>;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="k-btn secondary"
      aria-busy={pending}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await save();
          setDone(true);
        })
      }
    >
      {done ? "Salvata ✓" : label}
    </button>
  );
}
