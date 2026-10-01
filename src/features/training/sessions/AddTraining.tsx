/**
 * features/training/sessions/AddTraining.tsx — "Add training" on the day
 * page, the way food is added (ADR-0016): three tabs.
 *   Routine   the routines at their latest version (PresetPicker): the
 *             editor opens prefilled for this day.
 *   Exercise  one exercise: the editor opens with its sets of last time.
 *   Estimate  anything without sets (EstimateAdd), added in place.
 */
"use client";

import { ClipboardList, Dumbbell, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { pickerSearch } from "@/core/shared/search";
import type { FormState } from "@/core/shared/result";
import type { ExerciseKind } from "@/core/training/kinds";
import type { Messages } from "@/i18n";
import { SearchSelect } from "@/ui/SearchSelect";
import { Section } from "@/ui/Section";
import { Tabs } from "@/ui/Tabs";
import { EstimateAdd } from "./EstimateForm";
import { PresetPicker, type PresetTile } from "./PresetPicker";

type Kind = "routine" | "exercise" | "estimate";

export function AddTraining({
  day,
  plannedByDefault,
  presets,
  exercises,
  estimate,
  t,
}: {
  day: string;
  plannedByDefault: boolean;
  presets: readonly PresetTile[];
  exercises: readonly { id: string; name: string; kind: ExerciseKind }[];
  estimate: (prev: FormState, formData: FormData) => Promise<FormState>;
  t: Pick<Messages, "training" | "exercises" | "errors" | "actions" | "search">;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("routine");
  const e = t.training.estimate;
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
    <Section title={e.addTitle} icon={<Plus size={20} aria-hidden="true" />}>
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
            key: "estimate",
            label: e.tabEstimate,
            icon: <Sparkles size={16} aria-hidden="true" />,
          },
        ]}
      >
        <div className="flex flex-col gap-3 pt-3">
          {kind === "routine" && (
            <PresetPicker presets={presets} day={day} t={t.training} />
          )}
          {kind === "exercise" && (
            <>
              <p className="text-meta text-muted">{e.exerciseHint}</p>
              <SearchSelect
                label={t.training.exercise}
                name="add-exercise"
                value=""
                onChange={(id) => {
                  if (id)
                    router.push(
                      `/training/new?exercise=${id}&day=${day}&from=${encodeURIComponent(`/?day=${day}`)}`,
                    );
                }}
                search={picker.search}
                find={picker.find}
                placeholder={t.search.typeToSearch}
                noResults={t.search.noMatches}
              />
            </>
          )}
          {kind === "estimate" && (
            <EstimateAdd
              day={day}
              plannedByDefault={plannedByDefault}
              action={estimate}
              t={t}
            />
          )}
        </div>
      </Tabs>
    </Section>
  );
}
