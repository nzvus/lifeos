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
import { SelectField } from "@/ui/SelectField";
import { SaveStatus } from "@/ui/SaveStatus";
import { useAutoSave } from "@/ui/useAutoSave";

type Props = {
  /** Which fields this copy shows: general (time zone, language) or the theme. */
  part?: "general" | "theme";
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Record<string, string>;
  timeZones: string[];
  t: Pick<Messages, "settings" | "errors">;
};

export function SettingsForm({ action, initial, timeZones, part = "general", t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const autoSave = useAutoSave(); // design review S3: saves itself
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: string) => valueOf(state, f, initial[f] ?? "");

  return (
    <form action={formAction} {...autoSave} className="flex flex-col gap-6">
      {/* Design review S3: the theme sits in Appearance, next to light/dark.
          Both parts post all three fields; the other part's go hidden. */}
      {part === "theme" ? (
        <>
          <input type="hidden" name="timezone" value={val("timezone")} />
          <input type="hidden" name="locale" value={val("locale")} />
        </>
      ) : (
        <input type="hidden" name="theme" value={val("theme")} />
      )}
      {part === "general" && (
        <>
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
        </>
      )}
      {part === "theme" && (
        <>
          <SelectField
            label={t.settings.theme}
            icon={<Palette size={16} aria-hidden="true" />}
            name="theme"
            defaultValue={val("theme")}
            options={THEMES.map((id) => ({
              value: id,
              label: t.settings.themeNames[id],
            }))}
            error={err("theme")}
          />
          <p className="-mt-4 text-meta text-muted">{t.settings.themeHint}</p>
        </>
      )}
      <SaveStatus
        saved={state.status === "saved"}
        labels={{ saving: t.settings.autoSaving, saved: t.settings.saved }}
      />
    </form>
  );
}
