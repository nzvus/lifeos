/**
 * features/nutrition/log/AddFab.tsx — the day page's "+" (design review S1,
 * 2026-10-02): adding is the most frequent action and its sections sat
 * ~1,200 px down. A round button where the thumb is (above the tab bar)
 * opens a sheet: Food, Training, Weight. Food and Training open their
 * section on this page (ui/Collapsible follows a #id link); Weight goes to
 * Progress. The convention of MacroFactor, Yazio and MyFitnessPal.
 */
"use client";

import { Dumbbell, Plus, Scale, UtensilsCrossed, X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import type { Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";

export function AddFab({
  training,
  t,
}: {
  /** False when the day can't take training (none today). */
  training: boolean;
  t: Pick<Messages, "addFab">;
}) {
  const sheet = useRef<HTMLDialogElement>(null);
  const a = t.addFab;
  const close = () => sheet.current?.close();
  // Same hash twice fires no hashchange: set it and tell ui/Collapsible.
  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    close();
    history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  const item =
    "flex items-center gap-3 rounded-control px-3 py-3 font-display text-item font-semibold hover:bg-paper";
  return (
    <>
      <button
        type="button"
        aria-label={a.open}
        title={a.open}
        onClick={() => sheet.current?.showModal()}
        className="fixed right-4 bottom-24 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-herb text-sheet shadow-lg editing:hidden md:bottom-8"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Plus size={28} aria-hidden="true" />
      </button>
      <dialog
        ref={sheet}
        onClick={(e) => e.target === sheet.current && close()}
        aria-label={a.open}
        className="mx-auto mt-auto mb-0 w-full max-w-md rounded-t-surface border border-hairline bg-sheet p-0 text-ink backdrop:bg-ink/50 md:mb-auto md:rounded-surface"
      >
        <div
          className="flex flex-col gap-1 p-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          <div className="flex items-center justify-between px-3 py-1">
            <span className="font-display text-section font-bold">{a.title}</span>
            <button
              type="button"
              onClick={close}
              aria-label={a.close}
              className={buttonClass({ variant: "quiet", iconOnly: true })}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <a href="#day-add-food" onClick={(e) => go(e, "day-add-food")} className={item}>
            <UtensilsCrossed size={22} aria-hidden="true" className="text-herb" />
            {a.food}
          </a>
          {training && (
            <a
              href="#day-add-training"
              onClick={(e) => go(e, "day-add-training")}
              className={item}
            >
              <Dumbbell size={22} aria-hidden="true" className="text-herb" />
              {a.training}
            </a>
          )}
          <Link href="/profiles?view=weight" onClick={close} className={item}>
            <Scale size={22} aria-hidden="true" className="text-herb" />
            {a.weight}
          </Link>
        </div>
      </dialog>
    </>
  );
}
