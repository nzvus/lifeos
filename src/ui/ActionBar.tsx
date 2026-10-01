/**
 * ui/ActionBar.tsx — the bar pinned to the bottom of every edit page
 * (ADR-0015): ↺ restore (only when something changed), Cancel, and the
 * primary action (Save) on the right, where the thumb is. Save is enabled
 * once something changed (always on a new record). It lives inside the
 * <form>, so Save is its submit button.
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
            className="tile inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control"
          >
            <RotateCcw size={18} aria-hidden="true" />
          </button>
        )}
        <span className="flex-1" />
        <Link
          href={cancelHref}
          className="inline-flex h-11 items-center rounded-control px-4 font-display text-item font-semibold underline-offset-4 hover:underline"
        >
          {labels.cancel}
        </Link>
        <Save enabled={dirty || isNew} labels={labels} />
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
      className="inline-flex h-11 items-center rounded-control bg-herb px-5 font-display text-item font-bold text-sheet disabled:opacity-40"
    >
      {pending ? labels.saving : labels.save}
    </button>
  );
}
