/**
 * features/account/settings/DisplayForm.tsx — light / dark / system, the
 * layout (ADR-0010) and the density (ADR-0038). Per device: the action stores them in cookies, not in
 * the user's settings row. Every option is valid, so there are no field
 * errors; the page re-renders with the new attributes on <html>.
 */
"use client";

import { MonitorSmartphone, Rows3, SunMoon } from "lucide-react";
import { useActionState } from "react";
import { IDLE, type FormState } from "@/core/shared/result";
import type { Display } from "@/core/shared/display";
import type { Messages } from "@/i18n";
import { SelectField } from "@/ui/SelectField";
import { SaveStatus } from "@/ui/SaveStatus";
import { useAutoSave } from "@/ui/useAutoSave";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Display;
  t: Messages["settings"]["display"] & { saved: string; saving: string };
};

export function DisplayForm({ action, initial, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const autoSave = useAutoSave(); // design review S3: saves itself
  return (
    <form action={formAction} {...autoSave} className="flex flex-col gap-6">
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
      <SelectField
        label={t.density}
        icon={<Rows3 size={16} aria-hidden="true" />}
        name="density"
        defaultValue={initial.density}
        options={[
          { value: "compact", label: t.densities.compact },
          { value: "comfortable", label: t.densities.comfortable },
        ]}
      />
      <SaveStatus
        saved={state.status === "saved"}
        labels={{ saving: t.saving, saved: t.saved }}
      />
    </form>
  );
}
