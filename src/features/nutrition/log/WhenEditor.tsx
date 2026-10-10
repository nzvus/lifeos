/**
 * features/nutrition/log/WhenEditor.tsx — an entry's time and moment,
 * edited in place inside its "Details" (2026-10-10: "editing shouldn't be a
 * page of its own"). Saves itself as soon as either changes (ui/useAutoSave:
 * the time's selects and the moment's select save at once); an empty time
 * clears it.
 */
"use client";

import { useActionState, useId } from "react";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { MomentIcon } from "@/ui/MomentIcon";
import { SaveStatus } from "@/ui/SaveStatus";
import { SelectField } from "@/ui/SelectField";
import { TimeField } from "@/ui/TimeField";
import { useAutoSave } from "@/ui/useAutoSave";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** "HH:MM" or "". */
  time: string;
  moment: string;
  /** The moments an entry may have (core/nutrition/moments MOMENTS). */
  moments: readonly string[];
  t: Pick<Messages, "day" | "errors" | "moments" | "settings">;
};

export function WhenEditor({ action, time, moment, moments, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const autoSave = useAutoSave();
  const id = useId();
  const names = t.moments.names as Record<string, string>;
  const error =
    fieldError(state, "time", t.errors) ?? fieldError(state, "moment", t.errors);
  return (
    <form action={formAction} {...autoSave} className="flex flex-wrap items-end gap-3">
      <TimeField label={t.day.time} name="time" id={`time-${id}`} defaultValue={time} />
      <SelectField
        label={t.moments.label}
        icon={<MomentIcon moment={moment} />}
        name="moment"
        id={`moment-${id}`}
        defaultValue={moment}
        options={moments.map((m) => ({ value: m, label: names[m] ?? m }))}
        className="flex min-w-36 flex-col gap-1"
      />
      <SaveStatus
        saved={state.status === "saved"}
        labels={{ saving: t.settings.autoSaving, saved: t.settings.saved }}
      />
      {error && <span className="text-meta text-tomato">{error}</span>}
    </form>
  );
}
