/**
 * features/training/body/SleepCard.tsx — the night that ended on this day
 * (ADR-0031): bedtime, wake time, an optional quality 1–5, in a sheet
 * (ui/Sheet, #day-sleep) opened by the "+" or the day's chips; the form
 * saves itself (ui/useAutoSave) once both times are there.
 */
"use client";

import { Moon, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";
import { Field } from "@/ui/Field";
import { SaveStatus } from "@/ui/SaveStatus";
import { SelectField } from "@/ui/SelectField";
import { useAutoSave } from "@/ui/useAutoSave";

export function SleepCard({
  day,
  night,
  action,
  clear,
  t,
}: {
  day: string;
  /** Formatted by the page: hours, "23:40", "07:00", quality. */
  night: { hours: string; bed: string; wake: string; quality: number | null } | null;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  clear: (day: string) => Promise<void>;
  t: Pick<Messages, "sleep" | "errors" | "actions">;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const autoSave = useAutoSave();
  const s = t.sleep;
  const err = (f: string) => fieldError(state, f, t.errors);
  return (
    <Sheet
      id="day-sleep"
      title={s.title}
      icon={<Moon size={20} aria-hidden="true" />}
      closeLabel={t.actions.close}
    >
      <p className="text-meta text-muted">{s.hint}</p>
      <form
        action={formAction}
        {...autoSave}
        className="grid grid-cols-2 items-end gap-3"
      >
        <input type="hidden" name="day" value={day} />
        <Field
          label={s.bed}
          name="bed"
          type="time"
          defaultValue={valueOf(state, "bed", night?.bed ?? "")}
          error={err("bed")}
        />
        <Field
          label={s.wake}
          name="wake"
          type="time"
          defaultValue={valueOf(state, "wake", night?.wake ?? "")}
          error={err("wake")}
        />
        <SelectField
          label={s.quality}
          name="quality"
          defaultValue={valueOf(
            state,
            "quality",
            night?.quality ? String(night.quality) : "",
          )}
          options={[
            { value: "", label: s.qualityNone },
            ...[1, 2, 3, 4, 5].map((q) => ({
              value: String(q),
              label: s.qualities[q - 1]!,
            })),
          ]}
          error={err("quality")}
        />
        <div className="flex items-center justify-between gap-2">
          <SaveStatus
            saved={state.status === "saved"}
            labels={{ saving: s.saving, saved: s.saved }}
          />
          {night && (
            <button
              type="button"
              onClick={() => void clear(day)}
              aria-label={s.clear}
              title={s.clear}
              className={`${buttonClass({ variant: "quiet", iconOnly: true })} text-tomato`}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>
    </Sheet>
  );
}
