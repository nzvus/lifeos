/**
 * features/training/sessions/AddTraining.tsx — "Add training" on the day
 * page, the way food is added (ADR-0016). First WHEN, like food:
 *   Start now   (today only) the session opens in gym mode
 *   Plan        a planned session at the time given, added in place
 *   Done        the editor opens prefilled, to write what was done
 * then WHAT, in four tabs: a routine (at its latest version), one exercise
 * (with its sets of last time), a past session as it was (ADR-0035), or an
 * estimate (no sets).
 */
"use client";

import {
  CalendarClock,
  Check,
  ClipboardList,
  Dumbbell,
  History,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { pickerSearch } from "@/core/shared/search";
import type { FormState } from "@/core/shared/result";
import type { ExerciseKind } from "@/core/training/kinds";
import type { Messages } from "@/i18n";
import { SearchSelect } from "@/ui/SearchSelect";
import { Sheet } from "@/ui/Sheet";
import { TimeField } from "@/ui/TimeField";
import { Segmented } from "@/ui/Segmented";
import { Tabs } from "@/ui/Tabs";
import { EstimateAdd } from "./EstimateForm";
import { PresetPicker, type PresetTile } from "./PresetPicker";

type Kind = "routine" | "exercise" | "past" | "estimate";
type Mode = "start" | "plan" | "done";

export function AddTraining({
  day,
  today,
  presets,
  exercises,
  past,
  estimate,
  startOrPlan,
  t,
}: {
  day: string;
  today: string;
  presets: readonly PresetTile[];
  exercises: readonly { id: string; name: string; kind: ExerciseKind }[];
  /** Recent sessions done, newest first, to start from ("like a past session"). */
  past: readonly { id: string; label: string; when: string }[];
  estimate: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Server action: a routine or exercise started now (gym mode) or planned. */
  startOrPlan: (formData: FormData) => Promise<void>;
  t: Pick<Messages, "training" | "exercises" | "errors" | "actions" | "search">;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("routine");
  const e = t.training.estimate;
  const w = t.training.when;
  const modes: Mode[] =
    day === today ? ["start", "plan", "done"] : day > today ? ["plan"] : ["done", "plan"];
  const [mode, setMode] = useState<Mode>(modes[0]!);
  const [time, setTime] = useState("");
  const [pending, startTransition] = useTransition();
  const fromDay = `day=${day}&from=${encodeURIComponent(`/?day=${day}`)}`;
  /** A routine or an exercise, by the chosen mode. */
  const add = (field: "routineId" | "exerciseId" | "fromSessionId", id: string) => {
    if (mode === "done") {
      const param = {
        routineId: "routine",
        exerciseId: "exercise",
        fromSessionId: "session",
      };
      router.push(`/training/new?${param[field]}=${id}&${fromDay}`);
      return;
    }
    const fd = new FormData();
    fd.set(field, id);
    fd.set("mode", mode === "start" ? "live" : "plan");
    fd.set("day", day);
    fd.set("time", time);
    startTransition(async () => {
      await startOrPlan(fd);
      router.refresh();
    });
  };
  const picker = pickerSearch(
    exercises.map((x) => ({
      id: x.id,
      name: x.name,
      notes: t.training.kinds[x.kind],
      uses: 0,
      lastUsed: null,
    })),
    (x) => x.notes,
  );
  return (
    // Shown only when asked (the "+"; 2026-10-02): a sheet, not a section.
    <Sheet
      id="day-add-training"
      title={e.addTitle}
      icon={<Plus size={20} aria-hidden="true" />}
      closeLabel={t.actions.close}
    >
      <div className="flex flex-col gap-3 pb-3">
        {modes.length > 1 && (
          <Segmented
            label={w.label}
            value={mode}
            onChange={setMode}
            options={modes.map((m) => ({
              value: m,
              label: w[m],
              icon:
                m === "start" ? (
                  <Play size={16} aria-hidden="true" />
                ) : m === "plan" ? (
                  <CalendarClock size={16} aria-hidden="true" />
                ) : (
                  <Check size={16} aria-hidden="true" />
                ),
            }))}
          />
        )}
        {mode !== "start" && (
          <div className="grid grid-cols-2 items-end gap-3">
            <TimeField
              label={w.time}
              name="add-training-time"
              value={time}
              onChange={setTime}
            />
          </div>
        )}
        <p className="text-meta text-muted">{w.hints[mode]}</p>
      </div>
      <Tabs
        id="add-training"
        label={e.addTitle}
        selected={kind}
        onSelect={setKind}
        tabs={[
          {
            key: "routine",
            label: e.tabRoutine,
            icon: <ClipboardList size={16} aria-hidden="true" />,
          },
          {
            key: "exercise",
            label: e.tabExercise,
            icon: <Dumbbell size={16} aria-hidden="true" />,
          },
          {
            key: "past",
            label: e.tabPast,
            icon: <History size={16} aria-hidden="true" />,
          },
          {
            key: "estimate",
            label: e.tabEstimate,
            icon: <Sparkles size={16} aria-hidden="true" />,
          },
        ]}
      >
        <div className="flex flex-col gap-3 pt-3">
          {kind === "routine" && (
            <PresetPicker
              presets={presets}
              onPick={(id) => add("routineId", id)}
              emptyHref={`/training/new?${fromDay}`}
              disabled={pending}
              t={t.training}
            />
          )}
          {kind === "exercise" && (
            <>
              <p className="text-meta text-muted">{e.exerciseHint}</p>
              <SearchSelect
                label={t.training.exercise}
                name="add-exercise"
                value=""
                onChange={(id) => {
                  if (id) add("exerciseId", id);
                }}
                search={picker.search}
                find={picker.find}
                placeholder={t.search.typeToSearch}
                noResults={t.search.noMatches}
              />
            </>
          )}
          {kind === "past" &&
            (past.length === 0 ? (
              <p className="text-meta text-muted">{e.pastEmpty}</p>
            ) : (
              <>
                <p className="text-meta text-muted">{e.pastHint}</p>
                <ul className="flex flex-col gap-1">
                  {past.map((x) => (
                    <li key={x.id}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => add("fromSessionId", x.id)}
                        className="tile flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:border-ink disabled:opacity-50"
                      >
                        <span className="truncate font-semibold">{x.label}</span>
                        <span className="shrink-0 text-meta text-muted">{x.when}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ))}
          {kind === "estimate" && (
            <EstimateAdd
              day={day}
              when={{ status: mode === "plan" ? "planned" : "done", time }}
              action={estimate}
              t={t}
            />
          )}
        </div>
      </Tabs>
    </Sheet>
  );
}
