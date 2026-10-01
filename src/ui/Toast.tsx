/**
 * ui/Toast.tsx — short messages at the bottom of the screen, with an
 * optional action: "Meal deleted · Undo" (ADR-0015: undo instead of
 * asking first). `toast()` can be called from any client component; the
 * one <ToastHost> in the signed-in layout shows them. The store lives in
 * this module, so a message survives a client-side navigation (save, then
 * go back to where you came from, then "Saved · Undo").
 */
"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastSpec = {
  message: string;
  action?: { label: string; run: () => void | Promise<void> };
};
type Shown = ToastSpec & { id: number };

let shown: Shown[] = [];
let nextId = 0;
const listeners = new Set<(t: Shown[]) => void>();
const emit = () => listeners.forEach((l) => l(shown));

/** How long a message stays (ms): long enough to reach "Undo". */
const LIFETIME = 10000;

export function toast(spec: ToastSpec): void {
  const t = { ...spec, id: nextId++ };
  shown = [...shown.slice(-2), t];
  emit();
  setTimeout(() => dismiss(t.id), LIFETIME);
}

function dismiss(id: number) {
  shown = shown.filter((t) => t.id !== id);
  emit();
}

export function ToastHost({ closeLabel }: { closeLabel: string }) {
  const [list, setList] = useState<Shown[]>(shown);
  useEffect(() => {
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);
  if (list.length === 0) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex flex-col items-center gap-2 px-4 md:bottom-8"
    >
      {list.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-full max-w-page items-center gap-3 rounded-control bg-ink px-4 py-3 text-sheet shadow-lg"
        >
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={async () => {
                dismiss(t.id);
                await t.action!.run();
              }}
              className="font-display text-item font-bold text-sheet underline underline-offset-4"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label={closeLabel}
            className="text-sheet opacity-70 hover:opacity-100"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
