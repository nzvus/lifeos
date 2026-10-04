/**
 * ui/DeleteButton.tsx — a trash-can button that asks first (developer's
 * choice, 2026-10-02: a visible bin and a confirmation, not "⋯ → Delete").
 * The question is a real modal (<dialog>): opaque, centred, the whole
 * button area tappable; Escape or Cancel closes it.
 */
"use client";

import { Trash2 } from "lucide-react";
import { useRef } from "react";
import { buttonClass } from "./button";

export function DeleteButton({
  onConfirm,
  title,
  hint,
  labels,
  text,
}: {
  onConfirm: () => void;
  /** The question, e.g. "Delete «Porridge»?". */
  title: string;
  /** What happens, e.g. "It goes to the trash for 30 days." */
  hint?: string;
  labels: { delete: string; cancel: string };
  /** A labelled button instead of the bare bin, e.g. "Remove what's still planned". */
  text?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        aria-label={text ? undefined : labels.delete}
        title={text ? undefined : labels.delete}
        onClick={() => dialog.current?.showModal()}
        className={
          text
            ? `self-start ${buttonClass({ variant: "secondary", size: "sm" })} h-auto min-h-9 max-w-full py-1 whitespace-normal! text-left`
            : `${buttonClass({ variant: "ghost", iconOnly: true })} hover:text-tomato`
        }
      >
        <Trash2 size={text ? 16 : 20} aria-hidden="true" />
        {text}
      </button>
      <dialog
        ref={dialog}
        // Tapping the backdrop (the dialog element itself) closes it.
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-11/12 max-w-sm rounded-surface border border-hairline bg-sheet p-0 text-ink backdrop:bg-scrim"
      >
        <div className="flex flex-col gap-3 p-5">
          <p className="font-display text-section font-bold">{title}</p>
          {hint && <p className="text-meta text-muted">{hint}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className={buttonClass({ variant: "secondary" })}
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                dialog.current?.close();
                onConfirm();
              }}
              className={buttonClass({ variant: "danger" })}
            >
              <Trash2 size={18} aria-hidden="true" />
              {labels.delete}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
