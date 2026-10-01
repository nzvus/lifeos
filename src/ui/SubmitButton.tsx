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
import { buttonClass, type ButtonSize, type ButtonVariant } from "./button";

type Props = {
  children: ReactNode;
  /** Optional icon shown before the text (decorative). */
  icon?: ReactNode;
  variant?: ButtonVariant;
  /** Lets one form have several buttons with different actions. */
  formAction?: (formData: FormData) => void;
  /** Show only the icon; the text stays for screen readers and as tooltip. */
  iconOnly?: boolean;
  size?: ButtonSize;
};

export function SubmitButton({
  children,
  icon,
  variant = "primary",
  formAction,
  iconOnly = false,
  size = "md",
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      aria-disabled={pending}
      title={iconOnly && typeof children === "string" ? children : undefined}
      className={buttonClass({ variant, size, iconOnly })}
    >
      {icon}
      {iconOnly ? <span className="sr-only">{children}</span> : children}
    </button>
  );
}
