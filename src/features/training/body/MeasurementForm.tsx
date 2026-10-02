/**
 * features/training/body/MeasurementForm.tsx — add a body measurement
 * (ADR-0005): day, weight, optionally body fat and waist. The weight feeds
 * the burn estimates of the sessions from that day on. ADR-0027: also when
 * and how it was taken — the time (now) and three toggles; before 11:00
 * "fasted" and "after the toilet" start ticked (the usual morning weigh-in).
 */
"use client";

import { Plus } from "lucide-react";
import { useActionState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { TimeField } from "@/ui/TimeField";
import { SubmitButton } from "@/ui/SubmitButton";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  today: string;
  /** "HH:MM" now, in the user's zone. */
  now: string;
  /** How many measurements exist: grows after each save, remounting an empty form. */
  count: number;
  t: Pick<Messages, "body" | "errors">;
};

export function MeasurementForm({ action, today, now, count, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const err = (f: string) => fieldError(state, f, t.errors);
  const b = t.body;
  const morning = Number(now.slice(0, 2)) < 11;
  const toggle = (name: string, label: string, on: boolean) => (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        name={name}
        defaultChecked={state.status === "error" ? valueOf(state, name, "") === "on" : on}
        className="h-4 w-4 accent-herb"
      />
      {label}
    </label>
  );
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
      <TimeField
        label={b.time}
        name="time"
        defaultValue={valueOf(state, "time", now)}
        error={err("time")}
        className="flex w-28 flex-col gap-1"
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
      <input type="hidden" name="context" value="1" />
      <fieldset className="flex basis-full flex-wrap gap-x-4 gap-y-2 text-meta">
        <legend className="mb-1 font-semibold">{b.how}</legend>
        {toggle("fasted", b.fasted, morning)}
        {toggle("afterToilet", b.afterToilet, morning)}
        {toggle("afterTraining", b.afterTraining, false)}
      </fieldset>
      <SubmitButton
        variant="subtle"
        size="sm"
        icon={<Plus size={14} aria-hidden="true" />}
      >
        {b.add}
      </SubmitButton>
    </form>
  );
}
