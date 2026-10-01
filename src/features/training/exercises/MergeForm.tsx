/**
 * features/training/exercises/MergeForm.tsx — merge this exercise into
 * another (ADR-0005): its whole history moves, then it is deleted.
 */
"use client";

import { Merge } from "lucide-react";
import { useActionState } from "react";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  others: { id: string; name: string }[];
  t: Pick<Messages, "exercises" | "errors">;
};

export function MergeForm({ action, others, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  if (others.length === 0) return null;
  return (
    <form action={formAction} className="flex flex-col gap-2">
      {fieldError(state, "_form", t.errors) && (
        <FormAlert tone="error">{fieldError(state, "_form", t.errors)!}</FormAlert>
      )}
      <p className="text-meta text-muted">{t.exercises.mergeHint}</p>
      <div className="flex items-end gap-2">
        <SelectField
          label={t.exercises.mergeInto}
          name="intoId"
          options={others.map((o) => ({ value: o.id, label: o.name }))}
          className="flex min-w-0 flex-1 flex-col gap-1"
        />
        <SubmitButton
          variant="secondary"
          size="sm"
          icon={<Merge size={14} aria-hidden="true" />}
        >
          {t.exercises.merge}
        </SubmitButton>
      </div>
    </form>
  );
}
