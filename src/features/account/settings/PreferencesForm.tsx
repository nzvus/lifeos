/**
 * features/account/settings/PreferencesForm.tsx — how the app behaves for
 * this user (core/nutrition/preferences.ts): recommended maxima on or off,
 * where lunch, snack and dinner start (ADR-0011), and the views the Targets
 * page and the food lists open with. Same server-action pattern as
 * SettingsForm; saved per user, so every device gets them.
 */
"use client";

import { ArrowUpDown, CalendarRange, ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import { PER, sortChoices } from "@/core/nutrition/metrics";
import { TREND_RANGES } from "@/core/nutrition/preferences";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { TimeField } from "@/ui/TimeField";
import { MomentIcon } from "@/ui/MomentIcon";
import { SelectField } from "@/ui/SelectField";
import { SaveStatus } from "@/ui/SaveStatus";
import { useAutoSave } from "@/ui/useAutoSave";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Record<string, string>;
  t: Pick<
    Messages,
    "preferences" | "moments" | "search" | "trends" | "errors" | "settings"
  >;
};

export function PreferencesForm({ action, initial, t }: Props) {
  const [state, formAction] = useActionState(action, IDLE);
  const autoSave = useAutoSave(); // design review S3: saves itself
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: string) => valueOf(state, f, initial[f] ?? "");
  const p = t.preferences;
  return (
    <form action={formAction} {...autoSave} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-meta font-semibold">
          <input
            type="checkbox"
            name="autoTargets"
            defaultChecked={val("autoTargets") === "on"}
            className="h-4 w-4 accent-herb"
          />
          <ShieldCheck size={16} aria-hidden="true" />
          {p.autoTargets}
        </label>
        <p className="text-meta text-muted">{p.autoTargetsHint}</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-1 text-meta font-semibold">{p.momentsTitle}</legend>
        <div className="grid grid-cols-1 gap-3 @xl:grid-cols-3">
          {(
            [
              ["lunchFrom", "lunch"],
              ["snackFrom", "snack"],
              ["dinnerFrom", "dinner"],
            ] as const
          ).map(([field, moment]) => (
            <TimeField
              key={field}
              label={fill(p.from, { moment: t.moments.names[moment] })}
              icon={<MomentIcon moment={moment} />}
              name={field}
              defaultValue={val(field)}
              error={err(field)}
              required
            />
          ))}
        </div>
        <p className="text-meta text-muted">{p.momentsHint}</p>
      </fieldset>

      <SelectField
        label={p.trendsRange}
        icon={<CalendarRange size={16} aria-hidden="true" />}
        name="trendsRange"
        defaultValue={val("trendsRange")}
        options={TREND_RANGES.map((r) => ({
          value: String(r),
          label: fill(t.trends.days, { n: String(r) }),
        }))}
        error={err("trendsRange")}
      />

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={p.listSort}
          icon={<ArrowUpDown size={16} aria-hidden="true" />}
          name="listSort"
          defaultValue={val("listSort")}
          options={sortChoices().map((c) => ({
            value: c.value,
            label: t.search.sorts[c.value],
          }))}
          error={err("listSort")}
        />
        <SelectField
          label={t.search.perLabel}
          name="listPer"
          defaultValue={val("listPer")}
          options={PER.map((v) => ({ value: v, label: t.search.per[v] }))}
          error={err("listPer")}
        />
      </div>

      <SaveStatus
        saved={state.status === "saved"}
        labels={{ saving: t.settings.autoSaving, saved: t.settings.saved }}
      />
    </form>
  );
}
