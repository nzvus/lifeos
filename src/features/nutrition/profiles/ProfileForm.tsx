/**
 * features/nutrition/profiles/ProfileForm.tsx — create or edit a day type
 * (ADR-0008): a name and optional daily targets, one field per nutrient.
 *
 * ADR-0015: the pinned ui/ActionBar (↺ / Cancel / Save), a draft kept in
 * this browser, Save back to `from` with Undo (ui/useEditFlow); the page
 * header holds the "⋯" menu (make default, delete). The fields start from
 * text values and are remounted by ↺ or a restored draft.
 */
"use client";

import { FileText, Gauge, Target } from "lucide-react";
import { useState } from "react";
import { GOAL_PRESETS, type Goal } from "@/core/energy/energy";
import { buttonClass } from "@/ui/button";
import { SelectField } from "@/ui/SelectField";
import { NUTRIENT_KEYS, NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { DraftNotice } from "@/ui/DraftNotice";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { Section } from "@/ui/Section";
import { toFormData, useEditableForm } from "@/ui/useEditableForm";
import { useEditFlow } from "@/ui/useEditFlow";

type T = Pick<Messages, "profiles" | "nutrients" | "errors" | "actions" | "energy">;

type Props = {
  /** The day type being edited; absent for a new one. */
  id?: string;
  /** Where Cancel and "after saving" lead. */
  from: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Record<string, string>;
  t: T;
};

export function ProfileForm({ id, from, action, initial, t }: Props) {
  const a = t.actions;
  const { form, base, version, values, saved, dirty, draft, offer, load } =
    useEditableForm(`profile:${id ?? "new"}`, initial);
  const { state, formAction } = useEditFlow({
    id,
    from,
    idle: IDLE,
    action,
    previous: () => toFormData(saved ?? {}),
    name: () => values?.name?.trim() || initial.name || "",
    done: draft.clear,
    labels: a,
  });
  return (
    <form ref={form} action={formAction} className="flex flex-col gap-6">
      {offer && (
        <DraftNotice
          onRestore={() => {
            load(offer);
            draft.clear();
          }}
          onDiscard={draft.clear}
          labels={a}
        />
      )}
      <ProfileFields key={version} state={state} initial={base} t={t} />
      <ActionBar
        dirty={dirty}
        isNew={!id}
        onRestore={() => load(saved ?? initial)}
        cancelHref={from}
        labels={{ save: a.save, cancel: a.cancel, restore: a.restore, saving: a.saving }}
      />
    </form>
  );
}

function ProfileFields({
  state,
  initial,
  t,
}: {
  state: FormState;
  initial: Record<string, string>;
  t: T;
}) {
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: string) => valueOf(state, f, initial[f] ?? "");
  const [mode, setMode] = useState(val("mode") || "fixed");
  return (
    <>
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Section
        as="fieldset"
        title={t.actions.general}
        icon={<FileText size={20} aria-hidden="true" />}
      >
        <Field
          label={t.profiles.name}
          name="name"
          defaultValue={val("name")}
          error={err("name")}
          required
        />
      </Section>
      <DynamicFields state={state} initial={initial} t={t} onMode={setMode} />
      {mode === "dynamic" && (
        <p className="text-meta text-muted">{t.energy.dynamicHint}</p>
      )}
      {/* Dynamic: the written targets are not used; hidden, not lost. */}
      <div className={mode === "dynamic" ? "hidden" : "contents"}>
        <Section
          as="fieldset"
          title={t.profiles.targets}
          icon={<Target size={20} aria-hidden="true" />}
        >
          <p className="text-meta text-muted">{t.profiles.targetsHint}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {NUTRIENT_KEYS.map((k) => (
              <Field
                key={k}
                label={`${t.nutrients[k]} (${NUTRIENT_UNIT[k]})`}
                name={k}
                inputMode="decimal"
                defaultValue={val(k)}
                error={err(k)}
              />
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}

/**
 * ADR-0014: fixed targets, or dynamic ones from the day's energy. A goal
 * preset fills deficit, protein and fat per kg; each stays editable.
 */
function DynamicFields({
  state,
  initial,
  t,
  onMode,
}: {
  state: FormState;
  initial: Record<string, string>;
  t: T;
  onMode: (mode: string) => void;
}) {
  const e = t.energy;
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: string) => valueOf(state, f, initial[f] ?? "");
  const [mode, setMode] = useState(val("mode") || "fixed");
  const [v, setV] = useState({
    deficitKcal: val("deficitKcal") || "0",
    proteinGPerKg: val("proteinGPerKg") || "1.8",
    fatGPerKg: val("fatGPerKg") || "0.8",
  });
  const dynamic = mode === "dynamic";
  return (
    <Section as="fieldset" title={e.mode} icon={<Gauge size={20} aria-hidden="true" />}>
      <SelectField
        label={e.modeLabel}
        name="mode"
        value={mode}
        onChange={(ev) => {
          setMode(ev.target.value);
          onMode(ev.target.value);
        }}
        options={(["fixed", "dynamic"] as const).map((m) => ({
          value: m,
          label: e.modes[m],
        }))}
        error={err("mode")}
      />
      {/* Hidden, not removed, when fixed: the values are kept for later. */}
      <div className={dynamic ? "flex flex-col gap-4" : "hidden"}>
        <div className="flex flex-wrap gap-2" role="group" aria-label={e.goal}>
          {(Object.keys(GOAL_PRESETS) as Goal[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                const p = GOAL_PRESETS[g];
                setV({
                  deficitKcal: String(p.deficitKcal),
                  proteinGPerKg: p.proteinGPerKg,
                  fatGPerKg: p.fatGPerKg,
                });
              }}
              className={buttonClass({ variant: "subtle", size: "sm" })}
            >
              {e.goals[g]}
            </button>
          ))}
        </div>
        <div className="grid gap-4 @lg:grid-cols-3">
          <Field
            label={e.deficit}
            name="deficitKcal"
            inputMode="numeric"
            value={v.deficitKcal}
            onChange={(ev) => setV({ ...v, deficitKcal: ev.target.value })}
            error={err("deficitKcal")}
          />
          <Field
            label={e.proteinPerKg}
            name="proteinGPerKg"
            inputMode="decimal"
            value={v.proteinGPerKg}
            onChange={(ev) => setV({ ...v, proteinGPerKg: ev.target.value })}
            error={err("proteinGPerKg")}
          />
          <Field
            label={e.fatPerKg}
            name="fatGPerKg"
            inputMode="decimal"
            value={v.fatGPerKg}
            onChange={(ev) => setV({ ...v, fatGPerKg: ev.target.value })}
            error={err("fatGPerKg")}
          />
        </div>
      </div>
    </Section>
  );
}
