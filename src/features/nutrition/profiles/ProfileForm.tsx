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
import Link from "next/link";
import { TEXT_LINK } from "@/ui/button";
import { useState } from "react";
import { GOAL_PRESETS, goalOf } from "@/core/energy/energy";
import { SelectField } from "@/ui/SelectField";
import { NUTRIENT_KEYS, NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { DraftNotice } from "@/ui/DraftNotice";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { Section } from "@/ui/Section";
import { Segmented } from "@/ui/Segmented";
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
  /**
   * ADR-0046: the goal in force, by name ("Recomposition"), when there is
   * one. A dynamic type then follows it: its own deficit, protein and fat
   * are not asked (kept, hidden, for days without a goal).
   */
  followsGoal?: string | null;
  t: T;
};

export function ProfileForm({ id, from, action, initial, followsGoal = null, t }: Props) {
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
      <ProfileFields
        key={version}
        state={state}
        initial={base}
        followsGoal={followsGoal}
        t={t}
      />
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
  followsGoal,
  t,
}: {
  state: FormState;
  initial: Record<string, string>;
  followsGoal: string | null;
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
      <DynamicFields
        state={state}
        initial={initial}
        followsGoal={followsGoal}
        t={t}
        onMode={setMode}
      />
      {mode === "dynamic" && !followsGoal && (
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

const GOALS = ["maintain", "recomp", "gain", "cut"] as const;

/** "Deficit of 200 kcal a day", "surplus of 250", "maintenance". */
export function balanceText(deficit: number, e: T["energy"]): string {
  if (!Number.isFinite(deficit) || deficit === 0) return e.balanceMaintain;
  return deficit > 0
    ? fill(e.balanceDeficit, { kcal: String(deficit) })
    : fill(e.balanceSurplus, { kcal: String(-deficit) });
}

/**
 * ADR-0014: fixed targets, or dynamic ones from the day's energy. A goal
 * preset fills deficit, protein and fat per kg; each stays editable.
 */
function DynamicFields({
  state,
  initial,
  followsGoal,
  t,
  onMode,
}: {
  state: FormState;
  initial: Record<string, string>;
  followsGoal: string | null;
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
      {dynamic && followsGoal && (
        <div className="flex flex-col gap-1 rounded-control bg-paper p-3 text-meta">
          <span className="font-semibold">
            {fill(e.followsGoal, { goal: followsGoal })}
          </span>
          <span className="text-muted">{e.followsGoalHint}</span>
          <Link href="/settings#goal" className={TEXT_LINK}>
            {e.openGoal}
          </Link>
        </div>
      )}
      {/* Hidden, not removed, when fixed or following the goal: the values
          are kept for later (ADR-0046). */}
      <div className={dynamic && !followsGoal ? "flex flex-col gap-4" : "hidden"}>
        <Segmented<string>
          label={e.goal}
          value={goalOf({ ...v, deficitKcal: Number(v.deficitKcal) }) ?? "custom"}
          onChange={(g) => {
            const p = GOAL_PRESETS[g as (typeof GOALS)[number]];
            if (!p) return;
            setV({
              deficitKcal: String(p.deficitKcal),
              proteinGPerKg: p.proteinGPerKg,
              fatGPerKg: p.fatGPerKg,
            });
          }}
          options={GOALS.map((g) => ({ value: g, label: e.goals[g] }))}
        />
        <p className="font-semibold">{balanceText(Number(v.deficitKcal), e)}</p>
        <div className="grid grid-cols-1 items-start gap-4 @lg:grid-cols-3">
          <Field
            label={e.deficit}
            hint={e.deficitHint}
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
