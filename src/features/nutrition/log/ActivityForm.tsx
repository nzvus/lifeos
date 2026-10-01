/**
 * features/nutrition/log/ActivityForm.tsx — the day's movement besides
 * training (ADR-0014): everyday level, walking minutes or steps.
 */
"use client";

import { useActionState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";

const LEVELS = ["sitting", "mixed", "on_feet"] as const;

export function ActivityForm({
  action,
  initial,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: { level: string; walkingMin: number | null; steps: number | null };
  t: Pick<Messages, "energy" | "errors">;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const e = t.energy;
  const err = (f: string) => fieldError(state, f, t.errors);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.status === "saved" && (
        <FormAlert tone="success">{e.activitySaved}</FormAlert>
      )}
      <SelectField
        label={e.level}
        name="level"
        defaultValue={valueOf(state, "level", initial.level)}
        options={LEVELS.map((l) => ({ value: l, label: e.levels[l] }))}
        error={err("level")}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={e.walkingMin}
          name="walkingMin"
          inputMode="numeric"
          defaultValue={valueOf(
            state,
            "walkingMin",
            initial.walkingMin?.toString() ?? "",
          )}
          error={err("walkingMin")}
        />
        <Field
          label={e.steps}
          name="steps"
          inputMode="numeric"
          defaultValue={valueOf(state, "steps", initial.steps?.toString() ?? "")}
          error={err("steps")}
        />
      </div>
      <span className="self-start">
        <SubmitButton variant="secondary" size="sm">
          {e.saveActivity}
        </SubmitButton>
      </span>
    </form>
  );
}
