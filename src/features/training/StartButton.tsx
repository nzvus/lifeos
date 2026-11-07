"use client";
/** «Inizia» (TR-07): the scheda's one primary — a session starts from it, then gym mode. */
import { useTransition } from "react";

export function StartButton({
  label,
  start,
}: {
  label: string;
  start: () => Promise<void>;
}) {
  const [busy, go] = useTransition();
  return (
    <button
      type="button"
      className="k-btn primary"
      disabled={busy}
      aria-busy={busy || undefined}
      onClick={() => go(() => start())}
    >
      {label}
    </button>
  );
}
