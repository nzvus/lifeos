/**
 * features/account/settings/GoalForm.tsx — the goal (ADR-0043): the rate
 * as % of body weight a week, an optional target weight, the calorie
 * floor, protein, the diet split and the check-in day. Saves itself; each
 * save is the goal from today on (past days keep theirs).
 */
"use client";

import { useActionState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { SelectField } from "@/ui/SelectField";
import { SaveStatus } from "@/ui/SaveStatus";
import { useAutoSave } from "@/ui/useAutoSave";

type Initial = {
  ratePctWeek: string;
  targetKg: string;
  kcalFloor: string;
  protein: string;
  split: string;
  checkInWeekday: string;
};

export function GoalForm({
  action,
  initial,
  choices,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Initial;
  /** The allowed values, from the server (core/db/schema/goals). */
  choices: {
    kcalFloor: readonly string[];
    protein: readonly string[];
    split: readonly string[];
  };
  t: Pick<Messages, "energy" | "errors" | "settings">;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const autoSave = useAutoSave();
  const g = t.energy.weightGoal;
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: keyof Initial) => valueOf(state, f, initial[f]);
  const options = (values: readonly string[], labels: Record<string, string>) =>
    values.map((value) => ({ value, label: labels[value] ?? value }));
  return (
    <form action={formAction} {...autoSave} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field
          label={g.rate}
          name="ratePctWeek"
          inputMode="decimal"
          defaultValue={val("ratePctWeek")}
          error={err("ratePctWeek")}
          hint={g.rateHint}
        />
        <Field
          label={g.targetKg}
          name="targetKg"
          inputMode="decimal"
          defaultValue={val("targetKg")}
          error={err("targetKg")}
          hint={g.targetKgHint}
        />
      </div>
      <SelectField
        label={g.protein}
        name="protein"
        defaultValue={val("protein")}
        options={options(choices.protein, g.proteins)}
        error={err("protein")}
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label={g.split}
          name="split"
          defaultValue={val("split")}
          options={options(choices.split, g.splits)}
          error={err("split")}
        />
        <SelectField
          label={g.floor}
          name="kcalFloor"
          defaultValue={val("kcalFloor")}
          options={options(choices.kcalFloor, g.floors)}
          error={err("kcalFloor")}
        />
      </div>
      <SelectField
        label={g.weekday}
        name="checkInWeekday"
        defaultValue={val("checkInWeekday")}
        options={g.weekdays.map((label, i) => ({ value: String(i), label }))}
        error={err("checkInWeekday")}
      />
      <p className="text-meta text-muted">{g.changed}</p>
      <SaveStatus
        saved={state.status === "saved"}
        labels={{ saving: t.settings.autoSaving, saved: t.settings.saved }}
      />
    </form>
  );
}
