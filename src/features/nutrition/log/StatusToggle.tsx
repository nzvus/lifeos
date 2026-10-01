/**
 * features/nutrition/log/StatusToggle.tsx — the round checkbox beside each
 * log entry (ADR-0009): empty circle = planned, ticked = eaten. Tapping it
 * flips the status; confirming records the current time (editable after).
 *
 * A tiny form so it works like every other action (server action, no
 * client-side data logic). aria-pressed tells screen readers the state.
 */
"use client";

import { Circle, CircleCheck } from "lucide-react";
import { useActionState } from "react";
import type { ActionButtonState } from "@/ui/ActionButtonForm";

type Props = {
  eaten: boolean;
  action: (prev: ActionButtonState, formData: FormData) => Promise<ActionButtonState>;
  labels: { markEaten: string; markPlanned: string; future: string };
  /** A day still to come: planned food can't be ticked as eaten. */
  future?: boolean;
};

export function StatusToggle({ eaten, action, labels, future = false }: Props) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const locked = future && !eaten;
  const label = locked ? labels.future : eaten ? labels.markPlanned : labels.markEaten;
  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending || locked}
        aria-pressed={eaten}
        aria-label={label}
        title={state.status === "error" ? state.message : label}
        className={`p-1 disabled:opacity-50 ${eaten ? "text-herb" : "text-muted"}`}
      >
        {eaten ? (
          <CircleCheck size={24} aria-hidden="true" />
        ) : (
          <Circle size={24} aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
