/**
 * features/account/settings/GoalForm.tsx — the goal (ADR-0043, ADR-0045):
 * what it is for, an optional target weight and day, then protein, split,
 * floor and the check-in day. The pace is not asked: the server plans it
 * (core/energy/goal.ts planGoal) and the box below explains it. Saves
 * itself; each save is the goal from today on.
 */
"use client";

import { useActionState } from "react";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { SelectField } from "@/ui/SelectField";
import { SaveStatus } from "@/ui/SaveStatus";
import { useAutoSave } from "@/ui/useAutoSave";

type Initial = {
  kind: string;
  targetKg: string;
  targetDay: string;
  kcalFloor: string;
  protein: string;
  split: string;
  checkInWeekday: string;
};

/** The plan as the server computed it (GoalPlan, plus what it means in kg and kcal). */
export type PlanView = {
  status: "optimal" | "fast" | "slow" | "reached" | "steady";
  kind: string;
  ratePctWeek: number;
  kgPerWeek: number;
  kcalPerDay: number;
  targetKg: number | null;
  expectedDay: string | null;
  range: { low: number; high: number } | null;
} | null;

export function GoalForm({
  action,
  initial,
  choices,
  kindProtein,
  plan,
  locale,
  t,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Initial;
  /** The allowed values, from the server (core/db/schema/goals). */
  choices: {
    kind: readonly string[];
    kcalFloor: readonly string[];
    protein: readonly string[];
    split: readonly string[];
  };
  /** The protein each kind suggests: picking a kind prefills it. */
  kindProtein: Record<string, string>;
  /** Null without a goal or without a weigh-in. */
  plan: PlanView;
  locale: Locale;
  t: Pick<Messages, "energy" | "errors" | "settings">;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const autoSave = useAutoSave();
  const g = t.energy.weightGoal;
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: keyof Initial) => valueOf(state, f, initial[f]);
  const options = (values: readonly string[], labels: Record<string, string>) =>
    values.map((value) => ({ value, label: labels[value] ?? value }));
  const n = (v: number, d = 0) => formatNumber(String(v), locale, d);
  const pct = (v: number) => n(Math.abs(v), 2);
  const date = (d: string) =>
    new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${d}T00:00:00Z`));

  return (
    <form action={formAction} {...autoSave} className="flex flex-col gap-4">
      <SelectField
        label={g.kind}
        name="kind"
        defaultValue={val("kind")}
        options={options(choices.kind, g.kinds)}
        error={err("kind")}
        // A kind suggests its protein; set before the form saves (useAutoSave
        // submits on the change, before React re-renders).
        onChange={(e) => {
          const p = kindProtein[e.target.value];
          const field = e.target.form?.elements.namedItem("protein");
          if (p && field instanceof HTMLSelectElement) field.value = p;
        }}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label={g.targetKg}
          name="targetKg"
          inputMode="decimal"
          defaultValue={val("targetKg")}
          error={err("targetKg")}
          hint={g.targetKgHint}
        />
        <Field
          label={g.targetDay}
          name="targetDay"
          type="date"
          defaultValue={val("targetDay")}
          error={err("targetDay")}
          hint={g.targetDayHint}
        />
      </div>
      <div
        className="flex flex-col gap-1 rounded-control bg-paper p-3 text-meta"
        aria-live="polite"
      >
        <span className="font-semibold">{g.planTitle}</span>
        {!plan ? (
          <p className="text-muted">{g.planNoWeight}</p>
        ) : plan.status === "reached" ? (
          <p>{g.planReached}</p>
        ) : plan.status === "steady" ? (
          <p>{plan.kind === "recomp" ? g.planRecomp : g.planMaintain}</p>
        ) : (
          <>
            <p className="tabular-nums">
              {fill(g.planRate, {
                rate: pct(plan.ratePctWeek),
                kg: n(Math.abs(plan.kgPerWeek), 2),
                kcal: n(Math.abs(plan.kcalPerDay)),
                dir: plan.ratePctWeek < 0 ? g.planBelow : g.planAbove,
              })}
            </p>
            {plan.range && (
              <p
                className={
                  plan.status === "fast" ? "font-semibold text-warn" : "text-muted"
                }
              >
                {fill(
                  plan.status === "fast"
                    ? plan.ratePctWeek > 0
                      ? g.planFastGain
                      : g.planFastLose
                    : plan.status === "slow"
                      ? g.planSlow
                      : g.planOptimal,
                  {
                    low: pct(plan.range.low),
                    high: pct(plan.range.high),
                    day: plan.expectedDay ? date(plan.expectedDay) : "",
                  },
                )}
              </p>
            )}
            {plan.targetKg !== null && plan.expectedDay && plan.status !== "fast" && (
              <p>
                {fill(g.planWhen, {
                  kg: n(plan.targetKg, 1),
                  day: date(plan.expectedDay),
                })}
              </p>
            )}
            <p className="text-muted">{g.planUpdates}</p>
          </>
        )}
      </div>
      <SelectField
        label={g.protein}
        name="protein"
        defaultValue={val("protein")}
        options={options(choices.protein, g.proteins)}
        error={err("protein")}
      />
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
