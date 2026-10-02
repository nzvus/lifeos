/**
 * features/training/body/SleepCard.tsx — the night that ended on this day
 * (ADR-0031): bedtime, wake time, an optional quality 1–5. Closed, it shows
 * "7.3 h · 23:40–07:00 · 4/5"; open, the form, which saves itself
 * (ui/useAutoSave) once both times are there. The day page's "+" → Sleep
 * opens it (#day-sleep).
 */
"use client";

import { Moon, Trash2 } from "lucide-react";
import { useActionState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { Collapsible } from "@/ui/Collapsible";
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
  t: Pick<Messages, "sleep" | "errors">;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const autoSave = useAutoSave();
  const s = t.sleep;
  const err = (f: string) => fieldError(state, f, t.errors);
  const summary = night
    ? [
        fill(s.hours, { h: night.hours }),
        `${night.bed}–${night.wake}`,
        night.quality ? fill(s.qualityShort, { q: String(night.quality) }) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : s.none;
  return (
    <Collapsible
      id="day-sleep"
      title={s.title}
      icon={<Moon size={20} aria-hidden="true" />}
      aside={night ? fill(s.hours, { h: night.hours }) : undefined}
      summary={<p className="text-meta text-muted">{summary}</p>}
      defaultOpen={false}
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
    </Collapsible>
  );
}
