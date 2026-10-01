/**
 * features/training/programs/ProgramEditor.tsx — a training program
 * (ADR-0024): name, start day, active, and the ordered slots — a routine
 * or a rest day each — moved up and down, added and removed. The cycle
 * repeats; a missed day slips it (core/training/program.ts). Same edit
 * model as the other editors (ADR-0015). Client component.
 */
"use client";

import { ArrowDown, ArrowUp, CalendarRange, FileText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { buttonClass } from "@/ui/button";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { Section } from "@/ui/Section";
import { SelectField } from "@/ui/SelectField";
import { useEditFlow } from "@/ui/useEditFlow";

/** "r:<routine id>", "e:<exercise id>", or "" for a rest day. */
type SlotRow = { key: number; value: string; label: string };
export type ProgramInitial = {
  name: string;
  notes: string;
  startDay: string;
  active: boolean;
  slots: { routineId: string | null; exerciseId: string | null; label: string }[];
};

const REST = "";
let nextKey = 1_000_000;

export function ProgramEditor({
  id,
  from,
  action,
  routines,
  exercises,
  initial,
  t,
}: {
  id?: string;
  from: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  routines: { id: string; name: string }[];
  /** Single exercises can fill a day too (a run, the treadmill). */
  exercises: { id: string; name: string }[];
  initial: ProgramInitial;
  t: Pick<Messages, "programs" | "errors" | "actions">;
}) {
  const p = t.programs;
  const a = t.actions;
  const [name, setName] = useState(initial.name);
  const [notes, setNotes] = useState(initial.notes);
  const [startDay, setStartDay] = useState(initial.startDay);
  const [active, setActive] = useState(initial.active);
  const first = () =>
    initial.slots.map((s, key) => ({
      key,
      value: s.routineId ? `r:${s.routineId}` : s.exerciseId ? `e:${s.exerciseId}` : REST,
      label: s.label,
    }));
  const [slots, setSlots] = useState<SlotRow[]>(first);
  const json = (rows: SlotRow[]) =>
    JSON.stringify(
      rows.map((s) => ({
        routineId: s.value.startsWith("r:") ? s.value.slice(2) : null,
        exerciseId: s.value.startsWith("e:") ? s.value.slice(2) : null,
        label: s.value === REST ? s.label || p.rest : "",
      })),
    );
  const snap = { name, notes, startDay, active, slots: json(slots) };
  const base = { ...initial, slots: json(first()) };
  const dirty = JSON.stringify(snap) !== JSON.stringify(base);
  const { state, formAction } = useEditFlow({
    id,
    from,
    idle: IDLE,
    action,
    previous: () => {
      const fd = new FormData();
      fd.set("name", initial.name);
      fd.set("notes", initial.notes);
      fd.set("startDay", initial.startDay);
      fd.set("active", String(initial.active));
      fd.set("slots", json(first()));
      return fd;
    },
    name: () => name.trim() || initial.name,
    labels: a,
  });
  const err = (f: string) => fieldError(state, f, t.errors);
  const move = (i: number, by: number) =>
    setSlots((rows) => {
      const next = [...rows];
      const [row] = next.splice(i, 1);
      next.splice(i + by, 0, row!);
      return next;
    });
  const options = [
    { value: REST, label: p.rest },
    ...routines.map((r) => ({
      value: `r:${r.id}`,
      label: fill(p.routineOption, { name: r.name }),
    })),
    ...exercises.map((e) => ({
      value: `e:${e.id}`,
      label: fill(p.exerciseOption, { name: e.name }),
    })),
  ];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {err("_form") && <FormAlert tone="error">{err("_form")!}</FormAlert>}
      <Section
        as="fieldset"
        title={a.general}
        icon={<FileText size={20} aria-hidden="true" />}
      >
        <Field
          label={p.name}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={err("name")}
          required
        />
        <div className="grid grid-cols-2 items-end gap-3">
          <Field
            label={p.startDay}
            name="startDay"
            type="date"
            value={startDay}
            onChange={(e) => setStartDay(e.target.value)}
            error={err("startDay")}
          />
          <label className="flex h-11 items-center gap-2 text-meta font-semibold">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 accent-herb"
            />
            {p.active}
          </label>
        </div>
        <input type="hidden" name="active" value={String(active)} />
        <Field
          label={p.notes}
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          error={err("notes")}
        />
      </Section>
      <Section
        as="fieldset"
        title={p.slots}
        subtitle={p.slotsHint}
        icon={<CalendarRange size={20} aria-hidden="true" />}
      >
        {err("slots") && <FormAlert tone="error">{err("slots")!}</FormAlert>}
        <ol className="flex flex-col gap-3">
          {slots.map((s, i) => (
            <li
              key={s.key}
              className="flex items-end gap-2 rule-b-medium border-hairline pb-3"
            >
              <span className="w-12 shrink-0 pb-2 font-display text-meta text-muted tabular-nums">
                {fill(p.dayN, { n: String(i + 1) })}
              </span>
              <SelectField
                label={p.slot}
                name={`slot-${s.key}`}
                value={s.value}
                onChange={(e) =>
                  setSlots((rows) =>
                    rows.map((r) =>
                      r.key === s.key ? { ...r, value: e.target.value } : r,
                    ),
                  )
                }
                options={options}
                error={err(`slots.${i}.routineId`) ?? err(`slots.${i}.exerciseId`)}
                className="flex min-w-0 flex-1 flex-col gap-1"
              />
              <button
                type="button"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label={p.up}
                className={buttonClass({ variant: "quiet", size: "sm", iconOnly: true })}
              >
                <ArrowUp size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={i === slots.length - 1}
                onClick={() => move(i, 1)}
                aria-label={p.down}
                className={buttonClass({ variant: "quiet", size: "sm", iconOnly: true })}
              >
                <ArrowDown size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setSlots((rows) => rows.filter((r) => r.key !== s.key))}
                aria-label={p.remove}
                className={buttonClass({ variant: "quiet", size: "sm", iconOnly: true })}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() =>
            setSlots((rows) => [
              ...rows,
              {
                key: nextKey++,
                value: routines[0] ? `r:${routines[0].id}` : REST,
                label: "",
              },
            ])
          }
          className={`self-start ${buttonClass()}`}
        >
          <Plus size={16} aria-hidden="true" />
          {p.addSlot}
        </button>
      </Section>
      <input type="hidden" name="slots" value={json(slots)} />
      <ActionBar
        dirty={dirty}
        isNew={!id}
        onRestore={() => {
          setName(initial.name);
          setNotes(initial.notes);
          setStartDay(initial.startDay);
          setActive(initial.active);
          setSlots(first());
        }}
        cancelHref={from}
        labels={{ save: a.save, cancel: a.cancel, restore: a.restore, saving: a.saving }}
      />
    </form>
  );
}
