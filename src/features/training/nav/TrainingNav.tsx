/**
 * features/training/nav/TrainingNav.tsx — the Training tab's views
 * (ADR-0036/0038): the Body area — Plan (the calendar and the programs) |
 * Routines | Exercises | Progress (training and weight, /profiles).
 */
import { CalendarRange, ClipboardList, Dumbbell, TrendingUp } from "lucide-react";
import type { Messages } from "@/i18n";
import { SubNav } from "@/ui/SubNav";

export function TrainingNav({
  current,
  t,
}: {
  current: "plan" | "exercises" | "routines" | "progress";
  t: Pick<Messages, "training" | "nav" | "progress">;
}) {
  const n = t.training.tabs;
  return (
    <SubNav
      label={t.nav.body}
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
        {
          key: "progress",
          href: "/profiles?view=training",
          label: t.progress.title,
          icon: <TrendingUp size={16} aria-hidden="true" />,
        },
      ]}
    />
  );
}
