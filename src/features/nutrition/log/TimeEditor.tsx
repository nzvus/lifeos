/**
 * features/nutrition/log/TimeEditor.tsx — change an entry's time (ADR-0009),
 * inside the entry's "Details". An empty field clears the time.
 * ui/TimeField gives "HH:MM", on 24 hours.
 */
"use client";

import { useActionState, useId } from "react";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { SubmitButton } from "@/ui/SubmitButton";
import { TimeField } from "@/ui/TimeField";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: string; // "HH:MM" or ""
  t: Pick<Messages, "day" | "errors">;
};

export function TimeEditor({ action, initial, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const id = useId();
  const error = fieldError(state, "time", t.errors);
  return (
    <form action={formAction} className="flex items-end gap-2">
      <TimeField
        label={t.day.time}
        name="time"
        id={`time-${id}`}
        defaultValue={initial}
      />
      <SubmitButton variant="subtle" size="sm">
        {t.day.saveTime}
      </SubmitButton>
      {error && <span className="text-meta text-tomato">{error}</span>}
    </form>
  );
}
