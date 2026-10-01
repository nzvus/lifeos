/**
 * features/training/exercises/ExerciseForm.tsx — create or edit an exercise
 * (ADR-0005): name, kind, movement pattern, muscle groups, equipment,
 * unilateral, notes. Same server-action pattern as the other forms.
 *
 * Muscle groups are chips grouped by body region, tapped in order: the first
 * is the main group (anatomy.ts). They travel as one hidden "a,b,c" field.
 * "Suggest from the name" fills pattern and groups from core's guess; a new
 * exercise gets the guess as soon as its name is typed, unless something was
 * already chosen.
 *
 * ADR-0015: the pinned ui/ActionBar (↺ / Cancel / Save), a draft kept in
 * this browser, Save back to `from` with Undo (ui/useEditFlow). The page
 * header (with its "⋯" Delete) belongs to the page, which also shows the
 * progress. The fields live in ExerciseFields, remounted by ↺ or a draft.
 */
"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  MOVEMENT_PATTERNS,
  MUSCLE_GROUP_REGION,
  MUSCLE_GROUPS,
  MUSCLE_REGIONS,
  regionOf,
  suggestAnatomy,
} from "@/core/training/anatomy";
import { EXERCISE_KINDS } from "@/core/training/kinds";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import type { Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { DraftNotice } from "@/ui/DraftNotice";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { ExerciseIcon } from "@/ui/ExerciseIcon";
import { MuscleChip } from "@/ui/MuscleChip";
import { SelectField } from "@/ui/SelectField";
import { toFormData, useEditableForm } from "@/ui/useEditableForm";
import { useEditFlow } from "@/ui/useEditFlow";

type T = Pick<Messages, "exercises" | "training" | "errors" | "actions">;

type Props = {
  /** The exercise being edited; absent for a new one. */
  id?: string;
  /** Where Cancel and "after saving" lead. */
  from: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: Record<string, string>;
  t: T;
};

export function ExerciseForm({ id, from, action, initial, t }: Props) {
  const a = t.actions;
  const { form, base, version, values, saved, dirty, draft, offer, load } =
    useEditableForm(`exercise:${id ?? "new"}`, initial);
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
    <form ref={form} action={formAction} className="flex flex-col gap-5">
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
      <ExerciseFields key={version} state={state} initial={base} isNew={!id} t={t} />
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

function ExerciseFields({
  state,
  initial,
  isNew,
  t,
}: {
  state: FormState;
  initial: Record<string, string>;
  isNew: boolean;
  t: T;
}) {
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: string) => valueOf(state, f, initial[f] ?? "");
  const x = t.exercises;
  const [groups, setGroups] = useState<string[]>(
    val("muscleGroups").split(",").filter(Boolean),
  );
  const [pattern, setPattern] = useState(val("pattern"));
  const suggest = (name: string) => {
    const s = suggestAnatomy(name);
    if (s.pattern) setPattern(s.pattern);
    if (s.muscleGroups.length) setGroups(s.muscleGroups);
  };
  const toggle = (g: string) =>
    setGroups((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));
  return (
    <>
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Field
        label={x.name}
        name="name"
        defaultValue={val("name")}
        error={err("name")}
        required
        onBlur={(e) => {
          if (isNew && !pattern && groups.length === 0) suggest(e.currentTarget.value);
        }}
      />
      <SelectField
        label={x.kind}
        name="kind"
        defaultValue={val("kind") || "strength"}
        options={EXERCISE_KINDS.map((k) => ({ value: k, label: t.training.kinds[k] }))}
        error={err("kind")}
      />
      <SelectField
        label={x.pattern}
        icon={
          <ExerciseIcon pattern={pattern || null} region={regionOf(groups)} size={24} />
        }
        name="pattern"
        value={pattern}
        onChange={(e) => setPattern(e.currentTarget.value)}
        placeholder={x.patternNone}
        options={MOVEMENT_PATTERNS.map((p) => ({ value: p, label: x.patterns[p] }))}
        error={err("pattern")}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-meta font-semibold">{x.muscles}</legend>
        <p className="text-meta text-muted">{x.musclesHint}</p>
        <input type="hidden" name="muscleGroups" value={groups.join(",")} />
        {MUSCLE_REGIONS.map((r) => (
          <div key={r} className="flex flex-col gap-1">
            <span className="text-meta text-muted">{x.regions[r]}</span>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.filter((g) => MUSCLE_GROUP_REGION[g] === r).map((g) => {
                const at = groups.indexOf(g);
                return (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={at >= 0}
                    onClick={() => toggle(g)}
                    className={`inline-flex items-center gap-1 rounded-control border px-2 py-1 ${
                      at >= 0
                        ? "border-ink bg-sheet"
                        : "border-hairline opacity-60 hover:opacity-100"
                    }`}
                  >
                    <MuscleChip label={x.groups[g]} region={r} main={at === 0} />
                    {at === 0 && (
                      <span className="text-meta text-muted">{x.primary}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {err("muscleGroups") && (
          <p className="text-meta font-semibold text-tomato">{err("muscleGroups")}</p>
        )}
        <div>
          <button
            type="button"
            onClick={(e) =>
              suggest(
                (
                  e.currentTarget.form?.elements.namedItem(
                    "name",
                  ) as HTMLInputElement | null
                )?.value ?? "",
              )
            }
            className="inline-flex items-center gap-1.5 text-meta font-semibold text-herb underline-offset-4 hover:underline"
          >
            <Sparkles size={14} aria-hidden="true" />
            {x.suggest}
          </button>
        </div>
      </fieldset>
      <Field
        label={x.equipment}
        name="equipment"
        defaultValue={val("equipment")}
        error={err("equipment")}
      />
      <label className="flex items-center gap-2 text-meta font-semibold">
        <input
          type="checkbox"
          name="unilateral"
          defaultChecked={val("unilateral") === "on"}
          className="h-4 w-4 accent-herb"
        />
        {x.unilateral}
      </label>
      <Field
        label={x.notes}
        name="notes"
        defaultValue={val("notes")}
        error={err("notes")}
      />
    </>
  );
}
