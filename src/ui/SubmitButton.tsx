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
  danger: "rule-medium border-tomato text-tomato",
  quiet: "rule-medium border-ink text-ink",
} as const;

type Props = {
  children: ReactNode;
  /** Optional icon shown before the text (decorative). */
  icon?: ReactNode;
  variant?: keyof typeof VARIANTS;
  /** Lets one form have several buttons with different actions. */
  formAction?: (formData: FormData) => void;
  /** Show only the icon; the text stays for screen readers and as tooltip. */
  iconOnly?: boolean;
};

export function SubmitButton({
  children,
  icon,
  variant = "primary",
  formAction,
  iconOnly = false,
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      aria-disabled={pending}
      title={iconOnly && typeof children === "string" ? children : undefined}
      className={`${VARIANTS[variant]} inline-flex rounded-control items-center gap-2 ${iconOnly ? "p-2" : "px-4 py-2"} font-display text-item font-semibold tracking-wide disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
    >
      {icon}
      {iconOnly ? <span className="sr-only">{children}</span> : children}
    </button>
  );
}
