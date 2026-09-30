/**
 * features/nutrition/log/TimeEditor.tsx — change an entry's time (ADR-0009),
 * inside the entry's "Details". An empty field clears the time.
 * The browser's own time picker (<input type="time">) gives "HH:MM".
 */
"use client";

import { useActionState } from "react";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: string; // "HH:MM" or ""
  t: Pick<Messages, "day" | "errors">;
};

export function TimeEditor({ action, initial, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const error = fieldError(state, "time", t.errors);
  return (
    <form action={formAction} className="flex items-end gap-2">
      <label className="flex flex-col gap-1 text-meta">
        <span className="font-semibold">{t.day.time}</span>
        <input
          type="time"
          name="time"
          defaultValue={initial}
          className="rule-b-medium border-ink bg-sheet px-2 py-1"
        />
      </label>
      <SubmitButton variant="subtle" size="small">
        {t.day.saveTime}
      </SubmitButton>
      {error && <span className="text-meta text-tomato">{error}</span>}
    </form>
  );
}
