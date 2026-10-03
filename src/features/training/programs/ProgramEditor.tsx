/**
 * features/training/programs/ProgramEditor.tsx — a training program
 * (ADR-0024): name, start day, active, and its days in order. A day is a
 * LIST (ADR-0035): routines and/or single exercises, each a row with its
 * drawing in its muscle region's colour; a day with nothing is a rest day,
 * with a name. Days move up and down, are added and removed. The cycle
 * repeats; a missed day slips it (core/training/program.ts). Same edit
 * model as the other editors (ADR-0015). Client component.
 */
"use client";

import {
  ArrowDown,
  ArrowUp,
  CalendarRange,
  FileText,
  Moon,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Look } from "@/core/training/calendar";
import { fieldError, IDLE, type FormState } from "@/core/shared/result";
import { fill, type Messages } from "@/i18n";
import { ActionBar } from "@/ui/ActionBar";
import { buttonClass } from "@/ui/button";
import { ExerciseIcon } from "@/ui/ExerciseIcon";
import { Field } from "@/ui/Field";
import { FormAlert } from "@/ui/FormAlert";
import { REGION_BORDER } from "@/ui/MuscleChip";
import { Section } from "@/ui/Section";
import { SelectField } from "@/ui/SelectField";
import { useEditFlow } from "@/ui/useEditFlow";

/** An item's value: "r:<routine id>" or "e:<exercise id>". */
type ItemRow = { key: number; value: string };
type DayRow = { key: number; items: ItemRow[]; label: string };
type Choice = { id: string; name: string; look: Look };
export type ProgramInitial = {
  name: string;
  notes: string;
  startDay: string;
  active: boolean;
  slots: {
    label: string;
    items: { routineId: string | null; exerciseId: string | null }[];
  }[];
};

let nextKey = 1_000_000;
const valueOf = (it: { routineId: string | null; exerciseId: string | null }) =>
  it.routineId ? `r:${it.routineId}` : `e:${it.exerciseId}`;

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
  routines: Choice[];
  /** Single exercises can fill a day too (a run, the treadmill). */
  exercises: Choice[];
  initial: ProgramInitial;
  t: Pick<Messages, "programs" | "errors" | "actions">;
}) {
  const p = t.programs;
  const a = t.actions;
  const [name, setName] = useState(initial.name);
  const [notes, setNotes] = useState(initial.notes);
  const [startDay, setStartDay] = useState(initial.startDay);
  const [active, setActive] = useState(initial.active);
  const first = (): DayRow[] =>
    initial.slots.map((s, key) => ({
      key,
      label: s.label,
      items: s.items.map((it, i) => ({ key: key * 100 + i, value: valueOf(it) })),
    }));
  const [days, setDays] = useState<DayRow[]>(first);
  const json = (rows: DayRow[]) =>
    JSON.stringify(
      rows.map((d) => ({
        label: d.items.length ? "" : d.label || p.rest,
        items: d.items.map((it) => ({
          routineId: it.value.startsWith("r:") ? it.value.slice(2) : null,
          exerciseId: it.value.startsWith("e:") ? it.value.slice(2) : null,
        })),
      })),
    );
  const snap = { name, notes, startDay, active, slots: json(days) };
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
    setDays((rows) => {
      const next = [...rows];
      const [row] = next.splice(i, 1);
      next.splice(i + by, 0, row!);
      return next;
    });
  const change = (key: number, f: (d: DayRow) => DayRow) =>
    setDays((rows) => rows.map((r) => (r.key === key ? f(r) : r)));
  const lookOf = (value: string): Look | undefined =>
    value.startsWith("r:")
      ? routines.find((r) => `r:${r.id}` === value)?.look
      : exercises.find((e) => `e:${e.id}` === value)?.look;
  const stripe = (d: DayRow) => {
    const look = d.items[0] && lookOf(d.items[0].value);
    return look
      ? look.region
        ? REGION_BORDER[look.region]
        : "border-herb"
      : "border-hairline";
  };
  const options = [
    ...routines.map((r) => ({
      value: `r:${r.id}`,
      label: fill(p.routineOption, { name: r.name }),
    })),
    ...exercises.map((e) => ({
      value: `e:${e.id}`,
      label: fill(p.exerciseOption, { name: e.name }),
    })),
  ];
  const newItem = (): ItemRow => ({
    key: nextKey++,
    value: routines[0]
      ? `r:${routines[0].id}`
      : exercises[0]
        ? `e:${exercises[0].id}`
        : "",
  });
  const small = buttonClass({ variant: "quiet", size: "sm", iconOnly: true });

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
          {days.map((d, i) => (
            <li
              key={d.key}
              className={`tile flex flex-col gap-2 rule-l-heavy p-3 ${stripe(d)}`}
            >
              <div className="flex items-center gap-1">
                <span className="flex-1 font-display text-item font-semibold tabular-nums">
                  {fill(p.dayN, { n: String(i + 1) })}
                </span>
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={p.up}
                  className={small}
                >
                  <ArrowUp size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={i === days.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={p.down}
                  className={small}
                >
                  <ArrowDown size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setDays((rows) => rows.filter((r) => r.key !== d.key))}
                  aria-label={p.remove}
                  className={small}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
              {d.items.length === 0 ? (
                <div className="flex items-end gap-2">
                  <Moon
                    size={20}
                    aria-hidden="true"
                    className="mb-3 shrink-0 text-muted"
                  />
                  <Field
                    label={p.restName}
                    name={`rest-${d.key}`}
                    value={d.label}
                    placeholder={p.rest}
                    onChange={(e) =>
                      change(d.key, (r) => ({ ...r, label: e.target.value }))
                    }
                    className="flex min-w-0 flex-1 flex-col gap-1"
                  />
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {d.items.map((it, j) => {
                    const look = lookOf(it.value);
                    return (
                      <li key={it.key} className="flex items-end gap-2">
                        <span className="mb-2.5 shrink-0">
                          <ExerciseIcon
                            pattern={look?.pattern ?? null}
                            region={look?.region}
                            size={22}
                          />
                        </span>
                        <SelectField
                          label={j === 0 ? p.slot : p.alsoSlot}
                          name={`item-${it.key}`}
                          value={it.value}
                          onChange={(e) =>
                            change(d.key, (r) => ({
                              ...r,
                              items: r.items.map((x) =>
                                x.key === it.key ? { ...x, value: e.target.value } : x,
                              ),
                            }))
                          }
                          options={options}
                          error={err(`slots.${i}.items.${j}`)}
                          className="flex min-w-0 flex-1 flex-col gap-1"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            change(d.key, (r) => ({
                              ...r,
                              items: r.items.filter((x) => x.key !== it.key),
                            }))
                          }
                          aria-label={p.removeItem}
                          title={p.removeItem}
                          className={`mb-1 ${small}`}
                        >
                          <X size={16} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={options.length === 0}
                  onClick={() =>
                    change(d.key, (r) => ({ ...r, items: [...r.items, newItem()] }))
                  }
                  className={buttonClass({ variant: "subtle", size: "sm" })}
                >
                  <Plus size={16} aria-hidden="true" />
                  {d.items.length ? p.addToDay : p.trainThisDay}
                </button>
                {d.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => change(d.key, (r) => ({ ...r, items: [] }))}
                    className={buttonClass({ variant: "quiet", size: "sm" })}
                  >
                    <Moon size={16} aria-hidden="true" />
                    {p.makeRest}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() =>
            setDays((rows) => [
              ...rows,
              { key: nextKey++, items: options.length ? [newItem()] : [], label: "" },
            ])
          }
          className={`self-start ${buttonClass()}`}
        >
          <Plus size={16} aria-hidden="true" />
          {p.addSlot}
        </button>
      </Section>
      <input type="hidden" name="slots" value={json(days)} />
      <ActionBar
        dirty={dirty}
        isNew={!id}
        onRestore={() => {
          setName(initial.name);
          setNotes(initial.notes);
          setStartDay(initial.startDay);
          setActive(initial.active);
          setDays(first());
        }}
        cancelHref={from}
        labels={{ save: a.save, cancel: a.cancel, restore: a.restore, saving: a.saving }}
      />
    </form>
  );
}
