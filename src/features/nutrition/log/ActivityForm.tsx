/**
 * features/nutrition/log/ActivityForm.tsx — the day's movement besides
 * training (ADR-0051): the steps first, added a bit at a time if you like
 * (+1,000 / +2,500), with what they cost as you type; then how long you are
 * on your feet besides walking, as three choices; walking minutes only for
 * a day without steps. Saves itself (ui/useAutoSave): a choice or a "+" at
 * once, a typed number when you leave the field.
 */
"use client";

import { Armchair, ChevronRight, PersonStanding, Shuffle } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { LEVEL_STEPS, STEPS_PER_MIN, walkingKcal } from "@/core/energy/energy";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { Field } from "@/ui/Field";
import { SaveStatus } from "@/ui/SaveStatus";
import { useAutoSave } from "@/ui/useAutoSave";

const LEVELS = ["sitting", "mixed", "on_feet"] as const;
const LEVEL_ICON = {
  sitting: Armchair,
  mixed: Shuffle,
  on_feet: PersonStanding,
} as const;
const QUICK = [1000, 2500] as const;

export function ActivityForm({
  action,
  initial,
  kg,
  locale,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: { level: string; walkingMin: number | null; steps: number | null };
  /** The day's weight, for what the steps cost; null without body data. */
  kg: number | null;
  locale: Locale;
  t: Pick<Messages, "energy" | "errors">;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const autoSave = useAutoSave();
  const form = useRef<HTMLFormElement>(null);
  const e = t.energy;
  const err = (f: string) => fieldError(state, f, t.errors);
  const [level, setLevel] = useState(valueOf(state, "level", initial.level));
  const [steps, setSteps] = useState(
    valueOf(state, "steps", initial.steps?.toString() ?? ""),
  );
  const n = (v: number) => formatNumber(String(Math.round(v)), locale, 0);
  const typed = Number(steps.replace(/\D/g, "")) || 0;
  const usual = LEVEL_STEPS[level as (typeof LEVELS)[number]] ?? LEVEL_STEPS.mixed;
  const cost = kg && typed > 0 ? walkingKcal(typed / STEPS_PER_MIN, kg) : null;

  const addSteps = (by: number) => {
    setSteps(String(typed + by));
    // After React has put the new value in the field.
    requestAnimationFrame(() => form.current?.requestSubmit());
  };

  return (
    <form ref={form} action={formAction} {...autoSave} className="flex flex-col gap-5">
      <p className="text-meta text-muted">{e.activityHint}</p>

      <div className="flex flex-col gap-2">
        <label htmlFor="move-steps" className="font-semibold">
          {e.stepsTitle}
        </label>
        <div className="flex items-center gap-2">
          <input
            id="move-steps"
            name="steps"
            inputMode="numeric"
            value={steps}
            onChange={(ev) => setSteps(ev.currentTarget.value)}
            placeholder={n(usual)}
            className="min-h-11 w-32 min-w-0 rounded-control rule-b-medium border-ink bg-sheet px-3 font-display text-item font-semibold tabular-nums outline-none focus-visible:border-focus"
          />
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => addSteps(q)}
              aria-label={fill(e.stepsAddLabel, { n: n(q) })}
              className={buttonClass({ variant: "secondary", size: "sm" })}
            >
              {fill(e.stepsAdd, { n: n(q) })}
            </button>
          ))}
        </div>
        <p className="text-meta text-muted tabular-nums">
          {cost
            ? fill(e.stepsKcal, { low: n(cost.low), high: n(cost.high) })
            : fill(e.stepsUsual, { n: n(usual) })}
        </p>
        {err("steps") && <p className="text-meta text-tomato">{err("steps")}</p>}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">{e.feetTitle}</legend>
        {LEVELS.map((l) => {
          const Icon = LEVEL_ICON[l];
          const on = level === l;
          return (
            <label
              key={l}
              className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-control bg-sheet p-3 ${
                on ? "rule-strong border-herb" : "rule-medium border-hairline"
              }`}
            >
              <input
                type="radio"
                name="level"
                value={l}
                checked={on}
                onChange={() => setLevel(l)}
                className="sr-only"
              />
              <Icon
                size={22}
                aria-hidden="true"
                className={`shrink-0 ${on ? "text-herb" : "text-muted"}`}
              />
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{e.levels[l]}</span>
                <span className="text-meta text-muted">{e.levelHours[l]}</span>
              </span>
            </label>
          );
        })}
        {err("level") && <p className="text-meta text-tomato">{err("level")}</p>}
      </fieldset>

      <details className="group" open={initial.walkingMin !== null && !initial.steps}>
        <summary className="flex min-h-11 cursor-pointer items-center gap-1 text-meta text-muted">
          <ChevronRight
            size={16}
            aria-hidden="true"
            className="transition-transform group-open:rotate-90"
          />
          {e.noSteps}
        </summary>
        <Field
          label={e.walkingMin}
          name="walkingMin"
          inputMode="numeric"
          defaultValue={valueOf(
            state,
            "walkingMin",
            initial.walkingMin?.toString() ?? "",
          )}
          error={err("walkingMin")}
          className="flex w-40 flex-col gap-1"
        />
      </details>

      <SaveStatus
        saved={state.status === "saved"}
        labels={{ saving: e.activitySaving, saved: e.activitySaved }}
      />
    </form>
  );
}
