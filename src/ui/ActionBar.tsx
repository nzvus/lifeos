/**
 * ui/ActionBar.tsx — the bar pinned to the bottom of every edit page
 * (ADR-0015): ↺ restore (only when something changed), Cancel, and the
 * primary action (Save) on the right, where the thumb is. It lives inside
 * the <form>, so Save is its submit button. With nothing changed (2026-10-04:
 * "I can't save without changing something, I have to press Cancel"), Save
 * is not a dead button: it simply goes back, and Cancel is not needed.
 *
 * While mounted it marks <html data-editing>, so the phone's tab bar steps
 * aside (design/theme.css `editing:`); the page keeps its bottom padding,
 * so nothing hides behind the bar.
 */
"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "./button";

type Props = {
  /** Something differs from what is saved. */
  dirty: boolean;
  /** A new record can be saved as it is. */
  isNew?: boolean;
  onRestore: () => void;
  cancelHref: string;
  labels: { save: string; cancel: string; restore: string; saving: string };
};

export function ActionBar({
  dirty,
  isNew = false,
  onRestore,
  cancelHref,
  labels,
}: Props) {
  useEffect(() => {
    document.documentElement.dataset.editing = "";
    return () => {
      delete document.documentElement.dataset.editing;
    };
  }, []);
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 rule-t-medium border-ink bg-sheet"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-page items-center gap-2 px-4 py-2">
        {dirty && (
          <button
            type="button"
            onClick={onRestore}
            aria-label={labels.restore}
            title={labels.restore}
            className={buttonClass({ variant: "subtle", iconOnly: true })}
          >
            <RotateCcw size={18} aria-hidden="true" />
          </button>
        )}
        <span className="flex-1" />
        {dirty || isNew ? (
          <>
            <Link href={cancelHref} className={buttonClass({ variant: "quiet" })}>
              {labels.cancel}
            </Link>
            <Save enabled labels={labels} />
          </>
        ) : (
          // Nothing to save: done, back where it came from.
          <Link href={cancelHref} className={buttonClass({ variant: "primary" })}>
            {labels.save}
          </Link>
        )}
      </div>
    </div>
  );
}

function Save({ enabled, labels }: { enabled: boolean; labels: Props["labels"] }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!enabled || pending}
      className={buttonClass({ variant: "primary" })}
    >
      {pending ? labels.saving : labels.save}
    </button>
  );
}
