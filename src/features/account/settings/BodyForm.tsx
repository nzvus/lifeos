/**
 * features/account/settings/BodyForm.tsx — sex, birth year and height for
 * the energy model (ADR-0014). Weight is not here: it comes from the body
 * measurements, one per day. Empty = not given; the day page then says
 * what is missing instead of guessing.
 */
"use client";

import { useActionState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";

export function BodyForm({
  action,
  initial,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: { sex: string; birthYear: string; heightCm: string };
  t: Pick<Messages, "energy" | "errors" | "settings">;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const e = t.energy;
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: keyof typeof initial) => valueOf(state, f, initial[f]);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "saved" && (
        <FormAlert tone="success">{t.settings.saved}</FormAlert>
      )}
      <SelectField
        label={e.sex}
        name="sex"
        defaultValue={val("sex")}
        options={[
          { value: "", label: e.sexNone },
          { value: "male", label: e.sexes.male },
          { value: "female", label: e.sexes.female },
        ]}
        error={err("sex")}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label={e.birthYear}
          name="birthYear"
          inputMode="numeric"
          defaultValue={val("birthYear")}
          error={err("birthYear")}
        />
        <Field
          label={e.heightCm}
          name="heightCm"
          inputMode="numeric"
          defaultValue={val("heightCm")}
          error={err("heightCm")}
        />
      </div>
      <span className="self-start">
        <SubmitButton>{e.saveBody}</SubmitButton>
      </span>
    </form>
  );
}
