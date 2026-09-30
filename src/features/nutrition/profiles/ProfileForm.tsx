/**
 * features/nutrition/profiles/ProfileForm.tsx — create or edit a day type
 * (ADR-0008): a name and optional daily targets, one field per nutrient.
 * Same server-action pattern as IngredientForm (see its header).
 */
"use client";

import { useActionState } from "react";
import { NUTRIENT_KEYS, NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Record<string, string>;
  submitLabel: string;
  t: Pick<Messages, "profiles" | "nutrients" | "errors">;
};

export function ProfileForm({ action, initial, submitLabel, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: string) => valueOf(state, f, initial[f] ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Field
        label={t.profiles.name}
        name="name"
        defaultValue={val("name")}
        error={err("name")}
        required
      />
      <fieldset className="rule-t-heavy border-ink pt-3">
        <legend className="font-display text-section font-bold">
          {t.profiles.targets}
        </legend>
        <p className="pb-2 text-meta text-muted">{t.profiles.targetsHint}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {NUTRIENT_KEYS.map((k) => (
            <Field
              key={k}
              label={`${t.nutrients[k]} (${NUTRIENT_UNIT[k]})`}
              name={k}
              inputMode="decimal"
              defaultValue={val(k)}
              error={err(k)}
            />
          ))}
        </div>
      </fieldset>
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
