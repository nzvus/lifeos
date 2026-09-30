/**
 * ui/ActionButtonForm.tsx — a one-button form that runs a server action and
 * shows its whole-form error, e.g. "Delete ingredient" (which can fail with
 * "A meal still uses it"). Used by ingredients, meals and the daily log.
 *
 * The action is passed in already bound to what it acts on (e.g.
 * `deleteIngredientAction.bind(null, id)`), so this component stays generic.
 * `errorText` translates the error code; it comes from the page's dictionary.
 */
"use client";

import { useActionState, type ReactNode } from "react";
import { SubmitButton } from "./SubmitButton";
import { FormAlert } from "./FormAlert";

type State = { status: "idle" } | { status: "error"; message: string };

type Props = {
  action: (prev: State, formData: FormData) => Promise<State>;
  label: string;
  icon?: ReactNode;
  variant?: "danger" | "quiet" | "subtle";
  /** Compact: icon only, label for screen readers and as tooltip. */
  iconOnly?: boolean;
  size?: "normal" | "small";
};

export type ActionButtonState = State;

export function ActionButtonForm({
  action,
  label,
  icon,
  variant = "danger",
  iconOnly,
  size,
}: Props) {
  const [state, formAction] = useActionState(action, { status: "idle" });
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      {state.status === "error" && <FormAlert tone="error">{state.message}</FormAlert>}
      <SubmitButton variant={variant} icon={icon} iconOnly={iconOnly} size={size}>
        {label}
      </SubmitButton>
    </form>
  );
}
