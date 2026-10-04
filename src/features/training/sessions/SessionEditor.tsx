/**
 * features/training/sessions/SessionEditor.tsx — create or edit a training
 * session (ADR-0005): name, day, planned/done, start, duration, notes, then
 * the exercises in order, each with its sets. The fields of a set follow
 * the exercise's kind:
 *
 *   strength     reps, kg, load as written, approximate, warm-up
 *   bodyweight   reps, kg (optional, e.g. a vest), warm-up
 *   cardio       minutes, km (outdoors), km/h, incline % (treadmill)
 *
 * Under each exercise, what was done the last time (from the page). "Add
 * set" copies the previous row, as one does at the gym. Like the meal
 * editor, the variable-length part travels as JSON in one hidden field,
 * `exercises`; core validates it and applies the per-kind rules.
 *
 * ADR-0015: the pinned ui/ActionBar (↺ / Cancel / Save), a draft kept in
 * this browser, Save back to `from` with Undo (ui/useEditFlow); the page
 * header holds the "⋯" Delete. The fields (SessionFields) are rebuilt from
 * the form's own values (`exercises` JSON) by ↺ or a restored draft.
 */
"use client";

import { Dumbbell, FileText, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SESSION_STATUSES, type ExerciseKind } from "@/core/training/kinds";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { pickerSearch } from "@/core/shared/search";
import { fill, type Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { DraftNotice } from "@/ui/DraftNotice";
import { Field } from "@/ui/Field";
import { TimeField } from "@/ui/TimeField";
import { FormAlert } from "@/ui/FormAlert";
import { SearchSelect } from "@/ui/SearchSelect";
import { Section } from "@/ui/Section";
import { SelectField } from "@/ui/SelectField";
import { toFormData, useEditableForm } from "@/ui/useEditableForm";
import { useEditFlow } from "@/ui/useEditFlow";
import type { FormValues } from "@/ui/useFormValues";
import { buttonClass } from "@/ui/button";

export type EditorSet = {
  reps: string;
  loadKg: string;
  loadText: string;
  loadApprox: boolean;
  warmup: boolean;
  minutes: string;
  /** Distance in km (a run outdoors); with the minutes it gives the speed. */
  km: string;
  speedKmh: string;
  inclinePct: string;
  /** Gym mode's tick, kept as is; absent = as the session (done or planned). */
  done?: boolean;
  /** Gym mode's clock (ISO instants), kept as is. */
  startedAt?: string | null;
  endedAt?: string | null;
};
export type EditorExercise = {
  exerciseId: string;
  restS: string;
  notes: string;
  sets: EditorSet[];
};
export type EditorSession = {
  label: string;
  day: string;
  status: string;
  time: string;
  durationMin: string;
  notes: string;
  routineId: string;
  exercises: EditorExercise[];
};

type T = Pick<Messages, "training" | "errors" | "search" | "actions">;
type ExerciseOption = { id: string; name: string; kind: ExerciseKind };

type Props = {
  /** The session being edited; absent for a new one. */
  id?: string;
  /** Where Cancel and "after saving" lead. */
  from: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  exercises: ExerciseOption[];
  initial: EditorSession;
  /** What was done the last time, by exercise id: "28/09: 3×10×40". */
  last: Record<string, string>;
  t: T;
};

export const EMPTY_SET: EditorSet = {
  reps: "",
  loadKg: "",
  loadText: "",
  loadApprox: false,
  warmup: false,
  minutes: "",
  km: "",
  speedKmh: "",
  inclinePct: "",
};

// Exercises added later take keys far above the first render's positions
// (which must be the same on the server and in the browser).
let nextKey = 1_000_000;
const keyed = (list: EditorExercise[]) => list.map((e) => ({ ...e, key: nextKey++ }));
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const int = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v.trim()) : null);
/** "5,2" km -> 5200 m; empty or not a number -> null. */
const kmToM = (v: string) => {
  const n = Number(v.trim().replace(",", "."));
  return v.trim() && Number.isFinite(n) ? Math.round(n * 1000) : null;
};

/** The editor's rows as the JSON core validates (core/training/validation.ts). */
function serialize(list: EditorExercise[]) {
  return JSON.stringify(
    list.map((e) => ({
      exerciseId: e.exerciseId,
      restS: int(e.restS),
      notes: e.notes,
      sets: e.sets.map((s) => ({
        reps: int(s.reps),
        loadKg: s.loadKg,
        loadText: s.loadText,
        loadApprox: s.loadApprox,
        durationS: int(s.minutes) === null ? null : int(s.minutes)! * 60,
        distanceM: kmToM(s.km),
        speedKmh: s.speedKmh,
        inclinePct: s.inclinePct,
        warmup: s.warmup,
        done: s.done,
        startedAt: s.startedAt ?? null,
        endedAt: s.endedAt ?? null,
      })),
    })),
  );
}

/** The session as the form's own fields (text). */
function toValues(i: EditorSession): FormValues {
  return {
    label: i.label,
    day: i.day,
    status: i.status,
    time: i.time,
    durationMin: i.durationMin,
    notes: i.notes,
    routineId: i.routineId,
    exercises: serialize(i.exercises),
  };
}

/** Form fields back to the editor's rows (a saved version or a draft). */
function fromValues(v: FormValues): EditorSession {
  let list: Record<string, unknown>[] = [];
  try {
    list = JSON.parse(v.exercises ?? "[]") as Record<string, unknown>[];
  } catch {}
  return {
    label: v.label ?? "",
    day: v.day ?? "",
    status: v.status ?? "done",
    time: v.time ?? "",
    durationMin: v.durationMin ?? "",
    notes: v.notes ?? "",
    routineId: v.routineId ?? "",
    exercises: list.map((e) => ({
      exerciseId: str(e.exerciseId),
      restS: str(e.restS),
      notes: str(e.notes),
      sets: ((e.sets as Record<string, unknown>[] | undefined) ?? []).map((x) => ({
        reps: str(x.reps),
        loadKg: str(x.loadKg),
        loadText: str(x.loadText),
        loadApprox: x.loadApprox === true,
        warmup: x.warmup === true,
        minutes: x.durationS ? String(Number(x.durationS) / 60) : "",
        km: x.distanceM ? String(Number(x.distanceM) / 1000) : "",
        speedKmh: str(x.speedKmh),
        inclinePct: str(x.inclinePct),
        ...(typeof x.done === "boolean" ? { done: x.done } : {}),
        startedAt: typeof x.startedAt === "string" ? x.startedAt : null,
        endedAt: typeof x.endedAt === "string" ? x.endedAt : null,
      })),
    })),
  };
}

export function SessionEditor({ id, from, action, exercises, initial, last, t }: Props) {
  const a = t.actions;
  const start = toValues(initial);
  const { form, base, version, values, saved, dirty, draft, offer, load } =
    useEditableForm(`session:${id ?? "new"}`, start);
  const { state, formAction } = useEditFlow({
    id,
    from,
    idle: IDLE,
    action,
    previous: () => toFormData(saved ?? start),
    name: () => values?.label?.trim() || initial.label,
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
      <SessionFields
        key={version}
        state={state}
        initial={fromValues(base)}
        exercises={exercises}
        last={last}
        t={t}
      />
      <ActionBar
        dirty={dirty}
        isNew={!id}
        onRestore={() => load(saved ?? start)}
        cancelHref={from}
        labels={{ save: a.save, cancel: a.cancel, restore: a.restore, saving: a.saving }}
      />
    </form>
  );
}

function SessionFields({
  state,
  exercises,
  initial,
  last,
  t,
}: {
  state: FormState;
  exercises: ExerciseOption[];
  initial: EditorSession;
  last: Record<string, string>;
  t: T;
}) {
  const tr = t.training;
  const [list, setList] = useState(() =>
    initial.exercises.map((e, key) => ({ ...e, key })),
  );
  const err = (f: string) => fieldError(state, f, t.errors);
  const kindOf = (id: string) => exercises.find((e) => e.id === id)?.kind ?? "strength";
  const picker = useMemo(
    () =>
      pickerSearch(
        exercises.map((e) => ({
          id: e.id,
          name: e.name,
          notes: tr.kinds[e.kind],
          uses: 0,
          lastUsed: null,
        })),
        (e) => e.notes,
      ),
    [exercises, tr],
  );
  const update = (key: number, patch: Partial<EditorExercise>) =>
    setList((l) => l.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  const updateSet = (key: number, j: number, patch: Partial<EditorSet>) =>
    setList((l) =>
      l.map((e) =>
        e.key === key
          ? { ...e, sets: e.sets.map((s, k) => (k === j ? { ...s, ...patch } : s)) }
          : e,
      ),
    );

  return (
    <>
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Section
        as="fieldset"
        title={t.actions.general}
        icon={<FileText size={20} aria-hidden="true" />}
      >
        <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
          <Field
            label={tr.label}
            name="label"
            defaultValue={valueOf(state, "label", initial.label)}
            error={err("label")}
            required
          />
          <Field
            label={tr.day}
            name="day"
            type="date"
            defaultValue={valueOf(state, "day", initial.day)}
            error={err("day")}
            required
          />
          <SelectField
            label={tr.status}
            name="status"
            defaultValue={valueOf(state, "status", initial.status)}
            options={SESSION_STATUSES.map((s) => ({ value: s, label: tr.statuses[s] }))}
            error={err("status")}
          />
          <div className="grid grid-cols-2 gap-3">
            <TimeField
              label={tr.time}
              name="time"
              defaultValue={valueOf(state, "time", initial.time)}
              error={err("time")}
            />
            <Field
              label={tr.duration}
              name="durationMin"
              inputMode="numeric"
              defaultValue={valueOf(state, "durationMin", initial.durationMin)}
              error={err("durationMin")}
            />
          </div>
        </div>
        <label className="flex flex-col gap-1 text-meta">
          <span className="font-semibold">{tr.notes}</span>
          <textarea
            name="notes"
            rows={2}
            defaultValue={valueOf(state, "notes", initial.notes)}
            className="rounded-control rule-b-medium border-ink bg-sheet px-2 py-1.5 text-body"
          />
        </label>
      </Section>
      <input type="hidden" name="routineId" value={initial.routineId} />

      {list.map((e, i) => {
        const kind = kindOf(e.exerciseId);
        return (
          <Section
            key={e.key}
            as="fieldset"
            icon={<Dumbbell size={20} aria-hidden="true" />}
            title={`${i + 1}. ${exercises.find((x) => x.id === e.exerciseId)?.name ?? tr.exercise}`}
          >
            <div className="flex items-end gap-2">
              <SearchSelect
                label={tr.exercise}
                name={`ex-${e.key}`} // not read by the server; `exercises` is
                value={e.exerciseId}
                onChange={(id) => update(e.key, { exerciseId: id })}
                search={picker.search}
                find={picker.find}
                placeholder={t.search.typeToSearch}
                noResults={t.search.noMatches}
                error={err(`exercises.${i}.exerciseId`)}
                className="flex min-w-0 flex-1 flex-col gap-1"
              />
              <button
                type="button"
                onClick={() => setList((l) => l.filter((x) => x.key !== e.key))}
                aria-label={tr.removeExercise}
                title={tr.removeExercise}
                className="p-2 text-muted hover:text-tomato"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
            {e.exerciseId && last[e.exerciseId] && (
              <p className="text-meta text-muted">{last[e.exerciseId]}</p>
            )}
            <ol className="flex flex-col gap-2">
              {e.sets.map((s, j) => {
                const at = `exercises.${i}.sets.${j}`;
                return (
                  <li key={j} className="tile flex flex-wrap items-end gap-2 p-2">
                    <span className="w-full text-meta font-semibold text-muted">
                      {fill(tr.set, { n: String(j + 1) })}
                    </span>
                    {kind === "cardio" ? (
                      <>
                        <Field
                          label={tr.minutes}
                          name={`${at}.m`}
                          inputMode="numeric"
                          value={s.minutes}
                          onChange={(ev) =>
                            updateSet(e.key, j, { minutes: ev.target.value })
                          }
                          error={err(`${at}.durationS`)}
                          className="flex w-20 flex-col gap-1"
                        />
                        <Field
                          label={tr.distance}
                          name={`${at}.k`}
                          inputMode="decimal"
                          value={s.km}
                          onChange={(ev) => updateSet(e.key, j, { km: ev.target.value })}
                          error={err(`${at}.distanceM`)}
                          className="flex w-20 flex-col gap-1"
                        />
                        <Field
                          label={tr.speed}
                          name={`${at}.s`}
                          inputMode="decimal"
                          value={s.speedKmh}
                          onChange={(ev) =>
                            updateSet(e.key, j, { speedKmh: ev.target.value })
                          }
                          error={err(`${at}.speedKmh`)}
                          className="flex w-20 flex-col gap-1"
                        />
                        <Field
                          label={tr.incline}
                          name={`${at}.i`}
                          inputMode="decimal"
                          value={s.inclinePct}
                          onChange={(ev) =>
                            updateSet(e.key, j, { inclinePct: ev.target.value })
                          }
                          error={err(`${at}.inclinePct`)}
                          className="flex w-24 flex-col gap-1"
                        />
                      </>
                    ) : (
                      <>
                        <Field
                          label={tr.reps}
                          name={`${at}.r`}
                          inputMode="numeric"
                          value={s.reps}
                          onChange={(ev) =>
                            updateSet(e.key, j, { reps: ev.target.value })
                          }
                          error={err(`${at}.reps`)}
                          className="flex w-20 flex-col gap-1"
                        />
                        <Field
                          label={tr.load}
                          name={`${at}.k`}
                          inputMode="decimal"
                          value={s.loadKg}
                          onChange={(ev) =>
                            updateSet(e.key, j, { loadKg: ev.target.value })
                          }
                          error={err(`${at}.loadKg`)}
                          className="flex w-20 flex-col gap-1"
                        />
                        {kind === "strength" && (
                          <Field
                            label={tr.loadText}
                            name={`${at}.t`}
                            value={s.loadText}
                            onChange={(ev) =>
                              updateSet(e.key, j, { loadText: ev.target.value })
                            }
                            error={err(`${at}.loadText`)}
                            className="flex min-w-32 flex-1 flex-col gap-1"
                          />
                        )}
                        <label className="flex items-center gap-1 pb-2 text-meta">
                          <input
                            type="checkbox"
                            checked={s.loadApprox}
                            onChange={(ev) =>
                              updateSet(e.key, j, { loadApprox: ev.target.checked })
                            }
                            className="h-4 w-4 accent-herb"
                          />
                          {tr.approx}
                        </label>
                        <label className="flex items-center gap-1 pb-2 text-meta">
                          <input
                            type="checkbox"
                            checked={s.warmup}
                            onChange={(ev) =>
                              updateSet(e.key, j, { warmup: ev.target.checked })
                            }
                            className="h-4 w-4 accent-herb"
                          />
                          {tr.warmup}
                        </label>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        update(e.key, { sets: e.sets.filter((_, k) => k !== j) })
                      }
                      aria-label={tr.removeSet}
                      title={tr.removeSet}
                      className="ml-auto p-2 text-muted hover:text-tomato"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap items-end gap-3">
              <button
                type="button"
                onClick={() =>
                  update(e.key, {
                    sets: [...e.sets, { ...(e.sets.at(-1) ?? EMPTY_SET), warmup: false }],
                  })
                }
                className={buttonClass({ variant: "subtle", size: "sm" })}
              >
                <Plus size={14} aria-hidden="true" />
                {tr.addSet}
              </button>
              <Field
                label={tr.rest}
                name={`ex-${e.key}-rest`}
                inputMode="numeric"
                value={e.restS}
                onChange={(ev) => update(e.key, { restS: ev.target.value })}
                className="flex w-24 flex-col gap-1"
              />
              <Field
                label={tr.exerciseNotes}
                name={`ex-${e.key}-notes`}
                value={e.notes}
                onChange={(ev) => update(e.key, { notes: ev.target.value })}
                className="flex min-w-40 flex-1 flex-col gap-1"
              />
            </div>
          </Section>
        );
      })}
      {err("exercises") && <FormAlert tone="error">{err("exercises")!}</FormAlert>}
      <button
        type="button"
        onClick={() =>
          setList((l) => [
            ...l,
            ...keyed([{ exerciseId: "", restS: "", notes: "", sets: [EMPTY_SET] }]),
          ])
        }
        className={`self-start ${buttonClass()}`}
      >
        <Plus size={16} aria-hidden="true" />
        {tr.addExercise}
      </button>

      <input type="hidden" name="exercises" value={serialize(list)} />
    </>
  );
}
