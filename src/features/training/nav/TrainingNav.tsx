/**
 * features/training/nav/TrainingNav.tsx — the Training tab's views
 * (ADR-0036): Plan (the calendar and the programs) | Routines | Exercises.
 * How training goes is in Progress → Training.
 */
import { CalendarRange, ClipboardList, Dumbbell } from "lucide-react";
import type { Messages } from "@/i18n";
import { SubNav } from "@/ui/SubNav";

export function TrainingNav({
  current,
  t,
}: {
  current: "plan" | "exercises" | "routines";
  t: Pick<Messages, "training">;
}) {
  const n = t.training.tabs;
  return (
    <SubNav
      label={t.training.title}
      current={current}
      items={[
        {
          key: "plan",
          href: "/training/plan",
          label: n.plan,
          icon: <CalendarRange size={16} aria-hidden="true" />,
        },
        {
          key: "routines",
          href: "/training/routines",
          label: n.routines,
          icon: <ClipboardList size={16} aria-hidden="true" />,
        },
        {
          key: "exercises",
          href: "/training/exercises",
          label: n.exercises,
          icon: <Dumbbell size={16} aria-hidden="true" />,
        },
      ]}
    />
  );
}
