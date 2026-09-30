/**
 * features/account/settings/SettingsForm.tsx — time zone, language and
 * theme (ADR-0010). Same server-action pattern as IngredientForm. (Daily targets live in day
 * profiles since ADR-0008: features/nutrition/profiles/.)
 *
 * Time zone: a text field with suggestions (<datalist>) from the list the
 * server's JavaScript runtime knows (passed in as `timeZones`), because a
 * <select> of ~400 zones is unusable on a phone.
 */
"use client";

import { Globe, Languages, Palette } from "lucide-react";
import { useActionState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { THEMES } from "@/core/shared/themes";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Record<string, string>;
  timeZones: string[];
  t: Pick<Messages, "settings" | "errors">;
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
        icon={<Globe size={16} aria-hidden="true" />}
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
        icon={<Languages size={16} aria-hidden="true" />}
        name="locale"
        defaultValue={val("locale")}
        options={[
          { value: "it", label: t.settings.localeNames.it },
          { value: "en", label: t.settings.localeNames.en },
        ]}
        error={err("locale")}
      />
      <SelectField
        label={t.settings.theme}
        icon={<Palette size={16} aria-hidden="true" />}
        name="theme"
        defaultValue={val("theme")}
        options={THEMES.map((id) => ({ value: id, label: t.settings.themeNames[id] }))}
        error={err("theme")}
      />
      <p className="-mt-4 text-meta text-muted">{t.settings.themeHint}</p>
      <div>
        <SubmitButton>{t.settings.save}</SubmitButton>
      </div>
    </form>
  );
}
