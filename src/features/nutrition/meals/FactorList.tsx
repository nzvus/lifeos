/**
 * features/nutrition/meals/FactorList.tsx — the factors meals are rated on
 * (ADR-0012), in the settings: the list, each with a delete button (its
 * scores go with it), and a small form to add one.
 */
"use client";

import { Plus, Star, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { ActionButtonForm, type ActionButtonState } from "@/ui/ActionButtonForm";
import { Field } from "@/ui/Field";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  factors: { id: string; name: string }[];
  createAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  /**
   * The server action itself, bound to each factor's id here: a server page
   * may hand a client component server actions, not plain functions.
   */
  deleteAction: (
    id: string,
    prev: ActionButtonState,
    formData: FormData,
  ) => Promise<ActionButtonState>;
  t: Pick<Messages, "ratings" | "errors">;
};

export function FactorList({ factors, createAction, deleteAction, t }: Props) {
  const [state, formAction] = useActionState(createAction, IDLE);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-meta text-muted">{t.ratings.factorsHint}</p>
      {factors.length > 0 && (
        <ul className="flex flex-col">
          {factors.map((f) => (
            <li
              key={f.id}
              className="item flex items-center justify-between gap-2 py-1.5"
            >
              <span className="inline-flex items-center gap-1.5">
                <Star size={14} aria-hidden="true" className="text-warn" />
                {f.name}
              </span>
              <ActionButtonForm
                action={deleteAction.bind(null, f.id)}
                label={`${t.ratings.deleteFactor} ${f.name}`}
                icon={<Trash2 size={16} aria-hidden="true" />}
                variant="quiet"
                iconOnly
              />
            </li>
          ))}
        </ul>
      )}
      {/* key: a fresh, empty form after each save */}
      <form
        key={state.status === "saved" ? factors.length : "form"}
        action={formAction}
        className="flex items-end gap-2"
      >
        <Field
          label={t.ratings.factorName}
          name="name"
          error={fieldError(state, "name", t.errors)}
          className="flex flex-1 flex-col gap-1"
          required
        />
        <SubmitButton
          variant="subtle"
          size="small"
          icon={<Plus size={14} aria-hidden="true" />}
        >
          {t.ratings.addFactor}
        </SubmitButton>
      </form>
    </div>
  );
}
