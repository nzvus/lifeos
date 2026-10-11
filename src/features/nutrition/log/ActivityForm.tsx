/**
 * features/nutrition/log/ActivityForm.tsx — the day's movement besides
 * training (ADR-0014): everyday level, walking minutes, total steps. Fill
 * in what you have (ADR-0032): steps decide when given; the others show
 * what the model filled in, as placeholders. Saves itself (ui/useAutoSave).
 */
"use client";

import { useActionState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { SelectField } from "@/ui/SelectField";
import { SaveStatus } from "@/ui/SaveStatus";
import { useAutoSave } from "@/ui/useAutoSave";
import { fill } from "@/i18n";

const LEVELS = ["sitting", "mixed", "on_feet"] as const;

export function ActivityForm({
  action,
  initial,
  estimate,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: { level: string; walkingMin: number | null; steps: number | null };
  /** ADR-0032: what the model filled in for the empty fields. */
  estimate?: { steps: number | null; walkingMin: number | null };
  t: Pick<Messages, "energy" | "errors">;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const autoSave = useAutoSave();
  const e = t.energy;
  const err = (f: string) => fieldError(state, f, t.errors);
  return (
    <form action={formAction} {...autoSave} className="flex flex-col gap-3">
      <p className="text-meta text-muted">{e.activityHint}</p>
      <SelectField
        label={e.level}
        name="level"
        defaultValue={valueOf(state, "level", initial.level)}
        options={LEVELS.map((l) => ({
          value: l,
          label: `${e.levels[l]} · ${e.levelHours[l]}`,
        }))}
        error={err("level")}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={e.walkingMin}
          name="walkingMin"
          inputMode="numeric"
          defaultValue={valueOf(
            state,
            "walkingMin",
            initial.walkingMin?.toString() ?? "",
          )}
          placeholder={
            estimate?.walkingMin
              ? fill(e.estimated, { v: String(estimate.walkingMin) })
              : undefined
          }
          error={err("walkingMin")}
        />
        <Field
          label={e.steps}
          name="steps"
          inputMode="numeric"
          defaultValue={valueOf(state, "steps", initial.steps?.toString() ?? "")}
          placeholder={
            estimate?.steps ? fill(e.estimated, { v: String(estimate.steps) }) : undefined
          }
          error={err("steps")}
        />
      </div>
      <SaveStatus
        saved={state.status === "saved"}
        labels={{ saving: e.activitySaving, saved: e.activitySaved }}
      />
    </form>
  );
}
