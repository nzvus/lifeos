"use client";
/**
 * «Al volo» (FOOD-44, FOOD-05, ADR-0060; the 26 Oct idea he did not contest):
 * the «assunzioni» he takes most, one tap each at its dose — no composer, no
 * role, no score — with «Annulla» for 5 s. Under the water on Oggi and Cibo.
 */
import { useRef, useState } from "react";
import { F, Glyph, type GlyphOf } from "@lifeos/kit";

export type Quick = {
  foodId: string;
  name: string;
  /** «1 capsula», «3 g». */
  dose: string;
  of?: GlyphOf;
};

const TOAST_MS = 5000;

export function QuickIntakes({
  day,
  items,
  log,
  remove,
}: {
  day: string;
  items: readonly Quick[];
  log: (day: string, foodId: string) => Promise<string | null>;
  remove: (id: string) => Promise<boolean>;
}) {
  const [toast, setToast] = useState<{ text: string; id: string | null } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  if (items.length === 0) return null;
  const say = (t: { text: string; id: string | null }) => {
    clearTimeout(timer.current);
    setToast(t);
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  };
  return (
    <div className="k-stack g1" aria-label="Al volo">
      <span className="k-cap">Al volo</span>
      <div className="k-chips">
        {items.map((q) => (
          <button
            key={q.foodId}
            type="button"
            className="k-chip"
            aria-busy={busy === q.foodId}
            aria-label={"Segna " + q.name + ", " + q.dose}
            onClick={async () => {
              setBusy(q.foodId);
              const id = await log(day, q.foodId).catch(() => null);
              setBusy(null);
              say(
                id
                  ? { text: q.name + " · " + q.dose, id }
                  : { text: "Non è stato salvato. Riprova.", id: null },
              );
            }}
          >
            {q.of && <Glyph of={q.of} size="s" />}
            {q.name}
            <span className="k-meta">{q.dose}</span>
          </button>
        ))}
      </div>
      {toast && (
        <div className="k-toastbar">
          <div className="k-toast" role="status">
            <span>{toast.text}</span>
            {toast.id && (
              <button
                type="button"
                className="k-btn link"
                onClick={async () => {
                  const id = toast.id!;
                  setToast(null);
                  await remove(id);
                }}
              >
                Annulla
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** «1 capsula» when the dose has a name, else the amount («3 g»). */
export const doseWords = (dose: string, unit: string, name: string | null): string =>
  name ? "1 " + name : F.num(Number(dose), unit);
