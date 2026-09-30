/**
 * ui/SubmitButton.tsx — a form's submit button that disables itself while the
 * form is being sent, so a double tap can't submit twice (e.g. log the same
 * meal twice).
 *
 * "use client": this component runs in the browser, because it reacts to
 * the form's live state. `useFormStatus()` (React) reads the state of the
 * <form> this button is inside: `pending` is true while its action runs.
 */
"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

const VARIANTS = {
  primary: "bg-herb text-sheet",
  danger: "border-2 border-tomato text-tomato",
  quiet: "border-2 border-ink text-ink",
} as const;

type Props = {
  children: ReactNode;
  /** Optional icon shown before the text (decorative). */
  icon?: ReactNode;
  variant?: keyof typeof VARIANTS;
  /** Lets one form have several buttons with different actions. */
  formAction?: (formData: FormData) => void;
};

export function SubmitButton({ children, icon, variant = "primary", formAction }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      aria-disabled={pending}
      className={`${VARIANTS[variant]} inline-flex items-center gap-2 px-4 py-2 font-display text-lg font-semibold tracking-wide disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
    >
      {icon}
      {children}
    </button>
  );
}
