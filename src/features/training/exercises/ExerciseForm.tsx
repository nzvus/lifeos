/**
 * features/training/exercises/ExerciseForm.tsx — create or edit an exercise
 * (ADR-0005): name, kind, muscle groups, equipment, unilateral, notes. Same
 * server-action pattern as the other forms.
 */
"use client";

import { useActionState } from "react";
import { EXERCISE_KINDS } from "@/core/training/kinds";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Record<string, string>;
  submitLabel: string;
  t: Pick<Messages, "exercises" | "training" | "errors">;
};

export function ExerciseForm({ action, initial, submitLabel, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: string) => valueOf(state, f, initial[f] ?? "");
  const x = t.exercises;
  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.status === "saved" && (
        <FormAlert tone="success">{t.training.save}</FormAlert>
      )}
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Field
        label={x.name}
        name="name"
        defaultValue={val("name")}
        error={err("name")}
        required
      />
      <SelectField
        label={x.kind}
        name="kind"
        defaultValue={val("kind") || "strength"}
        options={EXERCISE_KINDS.map((k) => ({ value: k, label: t.training.kinds[k] }))}
        error={err("kind")}
      />
      <Field
        label={x.muscles}
        name="muscleGroups"
        defaultValue={val("muscleGroups")}
        hint={x.musclesHint}
        error={err("muscleGroups")}
      />
      <Field
        label={x.equipment}
        name="equipment"
        defaultValue={val("equipment")}
        error={err("equipment")}
      />
      <label className="flex items-center gap-2 text-meta font-semibold">
        <input
          type="checkbox"
          name="unilateral"
          defaultChecked={val("unilateral") === "on"}
          className="h-4 w-4 accent-herb"
        />
        {x.unilateral}
      </label>
      <Field
        label={x.notes}
        name="notes"
        defaultValue={val("notes")}
        error={err("notes")}
      />
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
