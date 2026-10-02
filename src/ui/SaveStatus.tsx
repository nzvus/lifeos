/**
 * ui/SaveStatus.tsx — "Saving…" / "Saved" for a form that saves itself
 * (ui/useAutoSave): small, polite, in place of a Save button and a green
 * box after every change. Must be rendered inside the <form>.
 */
"use client";

import { Check } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SaveStatus({
  saved,
  labels,
}: {
  /** The last save succeeded. */
  saved: boolean;
  labels: { saving: string; saved: string };
}) {
  const { pending } = useFormStatus();
  return (
    <p aria-live="polite" className="min-h-5 text-meta text-muted">
      {pending ? (
        labels.saving
      ) : saved ? (
        <span className="inline-flex items-center gap-1 text-herb">
          <Check size={14} aria-hidden="true" />
          {labels.saved}
        </span>
      ) : null}
    </p>
  );
}
