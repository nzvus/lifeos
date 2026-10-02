/**
 * features/training/nav/TrainingNav.tsx — the Training tab's views
 * (ADR-0035): the library — Routines | Exercises | Programs. How training
 * goes is in Progress → Training; what is coming is in Plan.
 */
import { CalendarRange, ClipboardList, Dumbbell } from "lucide-react";
import type { Messages } from "@/i18n";
import { SubNav } from "@/ui/SubNav";

export function TrainingNav({
  current,
  t,
}: {
  current: "exercises" | "routines" | "programs";
  t: Pick<Messages, "training">;
}) {
  const n = t.training.tabs;
  return (
    <SubNav
      label={t.training.title}
      current={current}
      items={[
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
        {
          key: "programs",
          href: "/training/programs",
          label: n.programs,
          icon: <CalendarRange size={16} aria-hidden="true" />,
        },
      ]}
    />
  );
}
