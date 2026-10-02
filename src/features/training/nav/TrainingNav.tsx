/**
 * features/training/nav/TrainingNav.tsx — the Training tab's four views
 * (ADR-0033): Sessions | Exercises | Routines | Programs, each with the
 * stats of its own items. The same pattern as Food and Progress.
 */
import { CalendarRange, ClipboardList, Dumbbell, History } from "lucide-react";
import type { Messages } from "@/i18n";
import { SubNav } from "@/ui/SubNav";

export function TrainingNav({
  current,
  t,
}: {
  current: "sessions" | "exercises" | "routines" | "programs";
  t: Pick<Messages, "training">;
}) {
  const n = t.training.tabs;
  return (
    <SubNav
      label={t.training.title}
      current={current}
      items={[
        {
          key: "sessions",
          href: "/training",
          label: n.sessions,
          icon: <History size={16} aria-hidden="true" />,
        },
        {
          key: "exercises",
          href: "/training/exercises",
          label: n.exercises,
          icon: <Dumbbell size={16} aria-hidden="true" />,
        },
        {
          key: "routines",
          href: "/training/routines",
          label: n.routines,
          icon: <ClipboardList size={16} aria-hidden="true" />,
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
