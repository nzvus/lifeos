/**
 * features/training/body/MeasurementForm.tsx — add a body measurement
 * (ADR-0005): day, weight, optionally body fat and waist. The weight feeds
 * the burn estimates of the sessions from that day on.
 */
"use client";

import { Plus } from "lucide-react";
import { useActionState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  today: string;
  /** How many measurements exist: grows after each save, remounting an empty form. */
  count: number;
  t: Pick<Messages, "body" | "errors">;
};

export function MeasurementForm({ action, today, count, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const err = (f: string) => fieldError(state, f, t.errors);
  const b = t.body;
  return (
    // key: the count grows after each save, so an empty form comes back
    <form key={count} action={formAction} className="flex flex-wrap items-end gap-2">
      <Field
        label={b.day}
        name="day"
        type="date"
        defaultValue={valueOf(state, "day", today)}
        error={err("day")}
        className="flex w-40 flex-col gap-1"
        required
      />
      <Field
        label={b.weight}
        name="weightKg"
        inputMode="decimal"
        defaultValue={valueOf(state, "weightKg", "")}
        error={err("weightKg")}
        className="flex w-28 flex-col gap-1"
        required
      />
      <Field
        label={b.fat}
        name="bodyFatPct"
        inputMode="decimal"
        defaultValue={valueOf(state, "bodyFatPct", "")}
        error={err("bodyFatPct")}
        className="flex w-24 flex-col gap-1"
      />
      <Field
        label={b.waist}
        name="waistCm"
        inputMode="decimal"
        defaultValue={valueOf(state, "waistCm", "")}
        error={err("waistCm")}
        className="flex w-24 flex-col gap-1"
      />
      <SubmitButton
        variant="subtle"
        size="small"
        icon={<Plus size={14} aria-hidden="true" />}
      >
        {b.add}
      </SubmitButton>
    </form>
  );
}
