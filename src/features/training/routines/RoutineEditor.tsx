/**
 * features/training/routines/RoutineEditor.tsx — create or edit a routine
 * (ADR-0005): a name, notes and its exercises with default sets, reps, kg
 * and rest. The rows travel as JSON in one hidden field, `items`, like the
 * meal editor's lines.
 *
 * ADR-0015: the pinned ui/ActionBar (↺ / Cancel / Save), a draft kept in
 * this browser, Save back to `from` with Undo (ui/useEditFlow); the page
 * header holds the "⋯" Delete. The fields (RoutineFields) start from text
 * values, so ↺ or a draft remount them from the form's own values.
 */
"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { pickerSearch } from "@/core/shared/search";
import type { ExerciseKind } from "@/core/training/kinds";
import type { Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { DraftNotice } from "@/ui/DraftNotice";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SearchSelect } from "@/ui/SearchSelect";
import { Section } from "@/ui/Section";
import { toFormData, useEditableForm } from "@/ui/useEditableForm";
import { useEditFlow } from "@/ui/useEditFlow";
import type { FormValues } from "@/ui/useFormValues";

export type RoutineRow = {
  exerciseId: string;
  sets: string;
  reps: string;
  loadKg: string;
  /** Cardio: minutes instead of reps and kg. */
  minutes: string;
  restS: string;
};

type T = Pick<Messages, "routines" | "training" | "errors" | "search" | "actions">;
type Initial = { name: string; notes: string; items: RoutineRow[] };
type Exercise = { id: string; name: string; kind: ExerciseKind };

type Props = {
  /** The routine being edited; absent for a new one. */
  id?: string;
  /** Where Cancel and "after saving" lead. */
  from: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  exercises: Exercise[];
  initial: Initial;
  t: T;
};

// Rows added later take keys far above the first render's positions (which
// must be the same on the server and in the browser).
let nextKey = 1_000_000;
const int = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v.trim()) : null);
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/** The editor's starting values as the form's own fields (text). */
function toValues(i: Initial): FormValues {
  return { name: i.name, notes: i.notes, items: JSON.stringify(i.items.map(wire)) };
}
/** Form fields back to the editor's rows (a saved version or a draft). */
function fromValues(v: FormValues): Initial {
  let items: Record<string, unknown>[] = [];
  try {
    items = JSON.parse(v.items ?? "[]") as Record<string, unknown>[];
  } catch {}
  return {
    name: v.name ?? "",
    notes: v.notes ?? "",
    items: items.map((x) => ({
      exerciseId: str(x.exerciseId),
      sets: str(x.sets),
      reps: str(x.reps),
      loadKg: str(x.loadKg),
      minutes: x.durationS ? String(Number(x.durationS) / 60) : "",
      restS: str(x.restS),
    })),
  };
}
/** One row as the server reads it. */
const wire = (x: RoutineRow) => ({
  exerciseId: x.exerciseId,
  sets: int(x.sets) ?? 1,
  reps: int(x.reps),
  loadKg: x.loadKg,
  durationS: int(x.minutes) === null ? null : int(x.minutes)! * 60,
  restS: int(x.restS),
});

export function RoutineEditor({ id, from, action, exercises, initial, t }: Props) {
  const a = t.actions;
  const start = toValues(initial);
  const { form, base, version, values, saved, dirty, draft, offer, load } =
    useEditableForm(`routine:${id ?? "new"}`, start);
  const { state, formAction } = useEditFlow({
    id,
    from,
    idle: IDLE,
    action,
    previous: () => toFormData(saved ?? start),
    name: () => values?.name?.trim() || initial.name,
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
      <RoutineFields
        key={version}
        state={state}
        initial={fromValues(base)}
        exercises={exercises}
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

function RoutineFields({
  state,
  initial,
  exercises,
  t,
}: {
  state: FormState;
  initial: Initial;
  exercises: Exercise[];
  t: T;
}) {
  const r = t.routines;
  const kindOf = (id: string) => exercises.find((e) => e.id === id)?.kind;
  const [rows, setRows] = useState(() => initial.items.map((i, key) => ({ ...i, key })));
  const err = (f: string) => fieldError(state, f, t.errors);
  const picker = useMemo(
    () =>
      pickerSearch(
        exercises.map((e) => ({
          id: e.id,
          name: e.name,
          notes: t.training.kinds[e.kind],
          uses: 0,
          lastUsed: null,
        })),
        (e) => e.notes,
      ),
    [exercises, t],
  );
  const update = (key: number, patch: Partial<RoutineRow>) =>
    setRows((l) => l.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  return (
    <>
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Field
        label={r.name}
        name="name"
        defaultValue={valueOf(state, "name", initial.name)}
        error={err("name")}
        required
      />
      <Field
        label={r.notes}
        name="notes"
        defaultValue={valueOf(state, "notes", initial.notes)}
        error={err("notes")}
      />
      <Section as="fieldset" title={r.items}>
        {rows.map((row, i) => (
          <div key={row.key} className="tile flex flex-wrap items-end gap-2 p-2">
            <SearchSelect
              label={t.training.exercise}
              name={`it-${row.key}`} // not read by the server; `items` is
              value={row.exerciseId}
              onChange={(id) => update(row.key, { exerciseId: id })}
              search={picker.search}
              find={picker.find}
              placeholder={t.search.typeToSearch}
              noResults={t.search.noMatches}
              error={err(`items.${i}.exerciseId`)}
              className="flex min-w-48 flex-1 flex-col gap-1"
            />
            <Field
              label={r.sets}
              name={`it-${row.key}-s`}
              inputMode="numeric"
              value={row.sets}
              onChange={(e) => update(row.key, { sets: e.target.value })}
              error={err(`items.${i}.sets`)}
              className="flex w-16 flex-col gap-1"
            />
            {kindOf(row.exerciseId) === "cardio" ? (
              <Field
                label={t.training.minutes}
                name={`it-${row.key}-m`}
                inputMode="numeric"
                value={row.minutes}
                onChange={(e) => update(row.key, { minutes: e.target.value })}
                className="flex w-20 flex-col gap-1"
              />
            ) : (
              <>
                <Field
                  label={r.reps}
                  name={`it-${row.key}-r`}
                  inputMode="numeric"
                  value={row.reps}
                  onChange={(e) => update(row.key, { reps: e.target.value })}
                  className="flex w-20 flex-col gap-1"
                />
                <Field
                  label={r.load}
                  name={`it-${row.key}-k`}
                  inputMode="decimal"
                  value={row.loadKg}
                  onChange={(e) => update(row.key, { loadKg: e.target.value })}
                  error={err(`items.${i}.loadKg`)}
                  className="flex w-20 flex-col gap-1"
                />
              </>
            )}
            <Field
              label={r.rest}
              name={`it-${row.key}-p`}
              inputMode="numeric"
              value={row.restS}
              onChange={(e) => update(row.key, { restS: e.target.value })}
              className="flex w-20 flex-col gap-1"
            />
            <button
              type="button"
              onClick={() => setRows((l) => l.filter((x) => x.key !== row.key))}
              aria-label={r.removeItem}
              title={r.removeItem}
              className="p-2 text-muted hover:text-tomato"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setRows((l) => [
              ...l,
              {
                exerciseId: "",
                sets: "3",
                reps: "10",
                loadKg: "",
                minutes: "",
                restS: "",
                key: nextKey++,
              },
            ])
          }
          className="inline-flex items-center gap-1 self-start rounded-control border border-hairline px-2 py-1 text-meta hover:border-ink"
        >
          <Plus size={14} aria-hidden="true" />
          {r.addItem}
        </button>
      </Section>
      <input type="hidden" name="items" value={JSON.stringify(rows.map(wire))} />
    </>
  );
}
