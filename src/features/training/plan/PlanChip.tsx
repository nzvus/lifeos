/**
 * features/training/plan/PlanChip.tsx — one training item of a day, as the
 * Plan tab shows it (ADR-0035): its colour is the main muscle region (green
 * for cardio), its icon the main movement. Done is filled; planned or from
 * the program is outlined; a rest day is a quiet moon.
 */
import { Moon } from "lucide-react";
import type { Look } from "@/core/training/calendar";
import { ExerciseIcon } from "@/ui/ExerciseIcon";
import { REGION_BG, REGION_BORDER, REGION_TEXT } from "@/ui/MuscleChip";

export type PlanState = "done" | "planned" | "program" | "rest";

export function PlanChip({
  look,
  state,
  label,
  size = 16,
}: {
  look: Look;
  state: PlanState;
  /** Shown next to the icon (the agenda); the month grid shows the icon only. */
  label?: string;
  size?: number;
}) {
  if (state === "rest")
    return (
      <span className="inline-flex items-center gap-1 text-muted">
        <Moon size={size - 2} aria-hidden="true" />
        {label}
      </span>
    );
  const bg = look.region ? REGION_BG[look.region] : "bg-herb";
  const border = look.region ? REGION_BORDER[look.region] : "border-herb";
  const text = look.region ? REGION_TEXT[look.region] : "text-herb";
  return (
    <span
      className={`inline-flex max-w-full min-w-0 items-center gap-1 rounded-badge rule-strong px-1 py-0.5 ${border} ${
        state === "done" ? `${bg} text-sheet` : `border-dashed ${text}`
      }`}
    >
      <ExerciseIcon pattern={look.pattern} size={size} />
      {label && <span className="truncate font-semibold">{label}</span>}
    </span>
  );
}
