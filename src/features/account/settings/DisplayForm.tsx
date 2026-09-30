/**
 * features/account/settings/DisplayForm.tsx — light / dark / system and the
 * layout (ADR-0010). Per device: the action stores them in cookies, not in
 * the user's settings row. Every option is valid, so there are no field
 * errors; the page re-renders with the new attributes on <html>.
 */
"use client";

import { MonitorSmartphone, SunMoon } from "lucide-react";
import { useActionState } from "react";
import { IDLE, type FormState } from "@/core/shared/result";
import type { Display } from "@/core/shared/display";
import type { Messages } from "@/i18n";
import { FormAlert } from "@/ui/FormAlert";
import { SelectField } from "@/ui/SelectField";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Display;
  t: Messages["settings"]["display"] & { saved: string };
};

export function DisplayForm({ action, initial, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.status === "saved" && <FormAlert tone="success">{t.saved}</FormAlert>}
      <SelectField
        label={t.mode}
        icon={<SunMoon size={16} aria-hidden="true" />}
        name="mode"
        defaultValue={initial.mode}
        options={[
          { value: "system", label: t.modes.system },
          { value: "light", label: t.modes.light },
          { value: "dark", label: t.modes.dark },
        ]}
      />
      <SelectField
        label={t.layout}
        icon={<MonitorSmartphone size={16} aria-hidden="true" />}
        name="layout"
        defaultValue={initial.layout}
        options={[
          { value: "auto", label: t.layouts.auto },
          { value: "desktop", label: t.layouts.desktop },
          { value: "phone", label: t.layouts.phone },
        ]}
      />
      <div>
        <SubmitButton>{t.save}</SubmitButton>
      </div>
    </form>
  );
}
