/**
 * features/account/settings/SettingsForm.tsx — time zone, language, daily
 * targets. Same server-action pattern as IngredientForm.
 *
 * Time zone: a text field with suggestions (<datalist>) from the list the
 * server's JavaScript runtime knows (passed in as `timeZones`), because a
 * <select> of ~400 zones is unusable on a phone.
 */
"use client";

import { useActionState } from "react";
import { NUTRIENT_KEYS, NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Record<string, string>;
  timeZones: string[];
  t: Pick<Messages, "settings" | "nutrients" | "errors">;
};

export function SettingsForm({ action, initial, timeZones, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: string) => valueOf(state, f, initial[f] ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.status === "saved" && (
        <FormAlert tone="success">{t.settings.saved}</FormAlert>
      )}
      <Field
        label={t.settings.timezone}
        name="timezone"
        list="time-zones"
        defaultValue={val("timezone")}
        hint={t.settings.timezoneHint}
        error={err("timezone")}
        required
      />
      <datalist id="time-zones">
        {timeZones.map((z) => (
          <option key={z} value={z} />
        ))}
      </datalist>
      <SelectField
        label={t.settings.locale}
        name="locale"
        defaultValue={val("locale")}
        options={[
          { value: "it", label: t.settings.localeNames.it },
          { value: "en", label: t.settings.localeNames.en },
        ]}
        error={err("locale")}
      />
      <fieldset className="border-t-6 border-ink pt-3">
        <legend className="font-display text-xl font-bold">{t.settings.targets}</legend>
        <p className="pb-2 text-sm text-muted">{t.settings.targetsHint}</p>
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
        <SubmitButton>{t.settings.save}</SubmitButton>
      </div>
    </form>
  );
}
