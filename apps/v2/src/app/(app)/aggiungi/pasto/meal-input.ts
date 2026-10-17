/** A composer's form as the meal entry's input (status, time, role, note): saved and edited alike. */
import type { EntryInput } from "@/core/entries";
import type { IsoDate } from "@/core/engines/time";
import { clockToDayMin } from "@/features/day/entry-form";

export function mealInput(
  day: IsoDate,
  form: Record<string, string>,
  boundaryMin: number,
): EntryInput {
  return {
    day,
    status: form["status"] === "planned" ? "planned" : "done",
    startMin: clockToDayMin(form["start"] ?? "", boundaryMin),
    endMin: null,
    values: { role: form["role"] ?? "" },
    note: form["note"] ?? "",
  };
}
