/**
 * features/training/routines/RoutineEditor.tsx — create or edit a routine
 * (ADR-0005): a name, notes and its exercises with default sets, reps, kg
 * and rest. The rows travel as JSON in one hidden field, `items`, like the
 * meal editor's lines.
 */
"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { fieldError, IDLE, valueOf, type FormState } from "@/core/shared/result";
import { pickerSearch } from "@/core/shared/search";
import type { ExerciseKind } from "@/core/training/kinds";
import type { Messages } from "@/i18n";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { SearchSelect } from "@/ui/SearchSelect";
import { Section } from "@/ui/Section";
import { SubmitButton } from "@/ui/SubmitButton";

export type RoutineRow = {
  exerciseId: string;
  sets: string;
  reps: string;
  loadKg: string;
  restS: string;
};

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  exercises: { id: string; name: string; kind: ExerciseKind }[];
  initial: { name: string; notes: string; items: RoutineRow[] };
  submitLabel: string;
  t: Pick<Messages, "routines" | "training" | "errors" | "search">;
};

let nextKey = 0;
const int = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v.trim()) : null);

export function RoutineEditor({ action, exercises, initial, submitLabel, t }: Props) {
  const r = t.routines;
  const [state, formAction] = useActionState(action, IDLE);
  const [rows, setRows] = useState(() =>
    initial.items.map((i) => ({ ...i, key: nextKey++ })),
  );
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
    <form action={formAction} className="flex flex-col gap-6">
      {state.status === "saved" && <FormAlert tone="success">{r.save}</FormAlert>}
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
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          rows.map((x) => ({
            exerciseId: x.exerciseId,
            sets: int(x.sets) ?? 1,
            reps: int(x.reps),
            loadKg: x.loadKg,
            durationS: null,
            restS: int(x.restS),
          })),
        )}
      />
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
