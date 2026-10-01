/**
 * features/training/programs/ProgramDay.tsx — on the day page, what the
 * active program (ADR-0024) puts on this day: a routine to plan or start
 * now, or a rest day; "late" when the cycle slipped. Server component; the
 * buttons are forms posting to the start-or-plan action.
 */
import { CalendarRange, CalendarClock, Play } from "lucide-react";
import { fill, type Messages } from "@/i18n";
import { Badge } from "@/ui/Badge";
import { buttonClass } from "@/ui/button";

export function ProgramDay({
  program,
  routineName,
  restLabel,
  late,
  routineId,
  day,
  isToday,
  action,
  t,
}: {
  program: string;
  /** null = a rest day. */
  routineName: string | null;
  restLabel: string;
  late: boolean;
  routineId: string | null;
  day: string;
  isToday: boolean;
  action: (formData: FormData) => Promise<void>;
  t: Messages["programs"];
}) {
  const form = (
    mode: "plan" | "live",
    label: string,
    icon: React.ReactNode,
    primary: boolean,
  ) => (
    <form action={action}>
      <input type="hidden" name="routineId" value={routineId ?? ""} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="time" value="" />
      <button
        type="submit"
        className={buttonClass({ variant: primary ? "primary" : "subtle", size: "sm" })}
      >
        {icon}
        {label}
      </button>
    </form>
  );
  return (
    <div className="tile flex flex-wrap items-center justify-between gap-3 px-3 py-2">
      <div className="flex min-w-0 flex-col">
        <span className="inline-flex items-center gap-1.5 text-meta text-muted">
          <CalendarRange size={14} aria-hidden="true" />
          {fill(t.fromProgram, { name: program })}
        </span>
        <span className="flex items-center gap-2 font-display text-item font-semibold">
          {routineName ?? restLabel}
          {late && <Badge tone="planned">{t.late}</Badge>}
        </span>
      </div>
      {routineId && (
        <div className="flex gap-2">
          {form("plan", t.plan, <CalendarClock size={16} aria-hidden="true" />, !isToday)}
          {isToday && form("live", t.start, <Play size={16} aria-hidden="true" />, true)}
        </div>
      )}
    </div>
  );
}
