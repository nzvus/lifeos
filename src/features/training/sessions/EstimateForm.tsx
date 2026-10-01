/**
 * features/training/sessions/EstimateForm.tsx — an estimated session
 * (ADR-0016): training without sets (a match, a hike, a session not written
 * down). Name, minutes, how hard (a MET band), kcal if known, roughly which
 * muscle groups, notes, and whether it is already done. The burn is
 * always shown as a range (core/training/analysis.ts burnRange).
 *
 *   EstimateAdd     inline on the day page, under "Add training · Estimate":
 *                   adds and clears itself, "«Calcetto» created".
 *   EstimateEditor  the session's page: the ADR-0015 edit model (ActionBar,
 *                   draft, Save + Undo back to `from`).
 */
"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { groupsByRegion } from "@/core/training/anatomy";
import { INTENSITIES } from "@/core/training/kinds";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { DraftNotice } from "@/ui/DraftNotice";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { MuscleGroupPicker } from "@/ui/MuscleGroupPicker";
import { Segmented } from "@/ui/Segmented";
import { SubmitButton } from "@/ui/SubmitButton";
import { toast } from "@/ui/Toast";
import { toFormData, useEditableForm } from "@/ui/useEditableForm";
import { useEditFlow } from "@/ui/useEditFlow";

type T = Pick<Messages, "training" | "exercises" | "errors" | "actions">;
type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** The fields; `initial` holds them as text (day, label, durationMin…). */
function EstimateFields({
  state,
  initial,
  when,
  t,
}: {
  state: FormState;
  /** Set by the day page's "When" (status and time); else the done checkbox. */
  when?: { status: "done" | "planned"; time: string };
  initial: Record<string, string>;
  t: T;
}) {
  const e = t.training.estimate;
  const x = t.exercises;
  const err = (f: string) => fieldError(state, f, t.errors);
  const val = (f: string) => valueOf(state, f, initial[f] ?? "");
  const [intensity, setIntensity] = useState(val("intensity") || "moderate");
  const [groups, setGroups] = useState(val("muscleGroups").split(",").filter(Boolean));
  const [done, setDone] = useState(val("status") !== "planned");
  return (
    <>
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <input type="hidden" name="day" value={val("day")} />
      <input type="hidden" name="time" value={when ? when.time : val("time")} />
      <input type="hidden" name="routineId" value="" />
      <input type="hidden" name="intensity" value={intensity} />
      <input type="hidden" name="muscleGroups" value={groups.join(",")} />
      <input
        type="hidden"
        name="status"
        value={when ? when.status : done ? "done" : "planned"}
      />
      <Field
        label={e.name}
        name="label"
        defaultValue={val("label")}
        error={err("label")}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label={e.minutes}
          name="durationMin"
          inputMode="numeric"
          defaultValue={val("durationMin")}
          error={err("durationMin")}
        />
        <Field
          label={e.kcal}
          name="kcalEstimate"
          inputMode="numeric"
          defaultValue={val("kcalEstimate")}
          error={err("kcalEstimate")}
        />
      </div>
      <Segmented
        label={e.intensity}
        value={intensity}
        onChange={setIntensity}
        options={INTENSITIES.map((i) => ({ value: i, label: e.intensities[i] }))}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-meta font-semibold">{e.groups}</legend>
        <MuscleGroupPicker
          regions={groupsByRegion().map(({ region, groups: gs }) => ({
            region,
            label: x.regions[region],
            groups: gs.map((g) => ({ key: g, label: x.groups[g] })),
          }))}
          value={groups}
          onChange={setGroups}
          primaryLabel={x.primary}
        />
      </fieldset>
      <Field
        label={e.notes}
        name="notes"
        defaultValue={val("notes")}
        error={err("notes")}
      />
      {!when && (
        <label className="flex items-center gap-2 text-meta font-semibold">
          <input
            type="checkbox"
            checked={done}
            onChange={(ev) => setDone(ev.target.checked)}
            className="h-4 w-4 accent-herb"
          />
          {e.done}
        </label>
      )}
    </>
  );
}

/** Inline on the day page: add, then start over empty. */
export function EstimateAdd({
  day,
  when,
  action,
  t,
}: {
  day: string;
  /** Done or planned, and at what time: the day page's "When". */
  when: { status: "done" | "planned"; time: string };
  action: Action;
  t: T;
}) {
  const router = useRouter();
  const [round, setRound] = useState(0);
  const empty = { day };
  const [state, formAction] = useActionState(async (prev: FormState, fd: FormData) => {
    const r = await action(prev, fd);
    if (r.status === "saved") {
      toast({
        message: fill(t.actions.created, { name: String(fd.get("label") ?? "") }),
      });
      setRound((n) => n + 1);
      router.refresh();
      return IDLE;
    }
    return r;
  }, IDLE);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-meta text-muted">{t.training.estimate.estimateHint}</p>
      <EstimateFields key={round} state={state} initial={empty} when={when} t={t} />
      <div>
        <SubmitButton>{t.training.estimate.add}</SubmitButton>
      </div>
    </form>
  );
}

/** The estimated session's own page (ADR-0015 edit model). */
export function EstimateEditor({
  id,
  from,
  action,
  initial,
  t,
}: {
  id: string;
  from: string;
  action: Action;
  initial: Record<string, string>;
  t: T;
}) {
  const a = t.actions;
  const { form, base, version, values, saved, dirty, draft, offer, load } =
    useEditableForm(`estimate:${id}`, initial);
  const { state, formAction } = useEditFlow({
    id,
    from,
    idle: IDLE,
    action,
    previous: () => toFormData(saved ?? {}),
    name: () => values?.label?.trim() || initial.label || "",
    done: draft.clear,
    labels: a,
  });
  return (
    <form ref={form} action={formAction} className="flex flex-col gap-4">
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
      <EstimateFields key={version} state={state} initial={base} t={t} />
      <ActionBar
        dirty={dirty}
        onRestore={() => load(saved ?? initial)}
        cancelHref={from}
        labels={{ save: a.save, cancel: a.cancel, restore: a.restore, saving: a.saving }}
      />
    </form>
  );
}
