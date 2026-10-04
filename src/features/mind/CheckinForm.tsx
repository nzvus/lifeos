/**
 * features/mind/CheckinForm.tsx — the day as it felt (ADR-0038): mood,
 * energy and stress as five taps each (icons at the ends, numbers between),
 * and a note. It saves itself (ui/useAutoSave): a tap is enough. Tapping the
 * chosen value again clears it. Client component.
 */
"use client";

import { BatteryFull, BatteryLow, Frown, Laugh, Waves, Wind } from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";
import { IDLE, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { SaveStatus } from "@/ui/SaveStatus";
import { useAutoSave } from "@/ui/useAutoSave";

type Values = {
  mood: number | null;
  energy: number | null;
  stress: number | null;
  note: string;
};

function Scale({
  name,
  label,
  value,
  low,
  high,
  onPick,
}: {
  name: string;
  label: string;
  value: number | null;
  /** The icons at 1 and at 5. */
  low: ReactNode;
  high: ReactNode;
  onPick: (v: number | null, form: HTMLFormElement | null) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="pb-1 text-meta font-semibold">{label}</legend>
      <input type="hidden" name={name} value={value ?? ""} />
      <div className="flex items-center gap-1">
        <span className="text-muted">{low}</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            aria-label={`${label}: ${n}`}
            onClick={(e) => onPick(value === n ? null : n, e.currentTarget.form)}
            className={`h-10 flex-1 rounded-control font-display text-item font-semibold tabular-nums ${
              value === n
                ? "bg-herb text-sheet"
                : value !== null && n < value
                  ? "bg-herb/20"
                  : "tile"
            }`}
          >
            {n}
          </button>
        ))}
        <span className="text-muted">{high}</span>
      </div>
    </fieldset>
  );
}

export function CheckinForm({
  day,
  initial,
  action,
  t,
}: {
  day: string;
  initial: Values;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  t: Messages["mind"] & { saved: string; saving: string };
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const autoSave = useAutoSave();
  const [v, setV] = useState(initial);
  // A tap changes a hidden input (no change event): save on the next frame,
  // once React has written the new value.
  const pick =
    (k: "mood" | "energy" | "stress") =>
    (n: number | null, form: HTMLFormElement | null) => {
      setV((x) => ({ ...x, [k]: n }));
      requestAnimationFrame(() => form?.requestSubmit());
    };
  return (
    <form action={formAction} {...autoSave} className="flex flex-col gap-4">
      <input type="hidden" name="day" value={day} />
      <Scale
        name="mood"
        label={t.mood}
        value={v.mood}
        low={<Frown size={18} aria-hidden="true" />}
        high={<Laugh size={18} aria-hidden="true" />}
        onPick={pick("mood")}
      />
      <Scale
        name="energy"
        label={t.energy}
        value={v.energy}
        low={<BatteryLow size={18} aria-hidden="true" />}
        high={<BatteryFull size={18} aria-hidden="true" />}
        onPick={pick("energy")}
      />
      <Scale
        name="stress"
        label={t.stress}
        value={v.stress}
        low={<Wind size={18} aria-hidden="true" />}
        high={<Waves size={18} aria-hidden="true" />}
        onPick={pick("stress")}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor={`note-${day}`} className="text-meta font-semibold">
          {t.note}
        </label>
        <textarea
          id={`note-${day}`}
          name="note"
          rows={3}
          defaultValue={initial.note}
          placeholder={t.notePlaceholder}
          className="w-full rounded-control rule-b-medium border-ink bg-sheet px-2 py-2 text-body"
        />
      </div>
      <SaveStatus
        saved={state.status === "saved"}
        labels={{ saving: t.saving, saved: t.saved }}
      />
    </form>
  );
}
