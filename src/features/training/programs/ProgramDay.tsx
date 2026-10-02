/**
 * features/training/programs/ProgramDay.tsx — on the day page, what the
 * active program (ADR-0024) puts on this day: its items (ADR-0035: one or
 * more routines or exercises), each to plan or start now unless done; a
 * rest day; "late" when the cycle slipped, "skipped" when skipped on
 * purpose. Server component; the buttons post to the start-or-plan action.
 */
import { CalendarClock, CalendarRange, Check, Play } from "lucide-react";
import { fill, type Messages } from "@/i18n";
import { Badge } from "@/ui/Badge";
import { buttonClass } from "@/ui/button";

export type ProgramDayItem = {
  routineId: string | null;
  exerciseId: string | null;
  name: string;
  /** A session of the day already stands for it. */
  done: boolean;
};

export function ProgramDay({
  program,
  items,
  restLabel,
  late,
  skipped,
  day,
  isToday,
  action,
  t,
}: {
  program: string;
  /** Empty: a rest day. */
  items: ProgramDayItem[];
  restLabel: string;
  late: boolean;
  skipped: boolean;
  day: string;
  isToday: boolean;
  action: (formData: FormData) => Promise<void>;
  t: Messages["programs"];
}) {
  const form = (
    it: ProgramDayItem,
    mode: "plan" | "live",
    label: string,
    icon: React.ReactNode,
    primary: boolean,
  ) => (
    <form action={action}>
      <input type="hidden" name="routineId" value={it.routineId ?? ""} />
      <input type="hidden" name="exerciseId" value={it.exerciseId ?? ""} />
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
    <div className="tile flex flex-col gap-2 px-3 py-2">
      <span className="inline-flex items-center gap-1.5 text-meta text-muted">
        <CalendarRange size={14} aria-hidden="true" />
        {fill(t.fromProgram, { name: program })}
        {late && <Badge tone="planned">{t.late}</Badge>}
        {skipped && <Badge>{t.skipped}</Badge>}
      </span>
      {items.length === 0 ? (
        <span className="font-display text-item font-semibold">{restLabel}</span>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((it) => (
            <li
              key={`${it.routineId ?? ""}${it.exerciseId ?? ""}`}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span
                className={`flex items-center gap-2 font-display text-item font-semibold ${skipped ? "text-muted line-through" : ""}`}
              >
                {it.done && <Check size={16} aria-hidden="true" className="text-herb" />}
                {it.name}
              </span>
              {!it.done && !skipped && (
                <div className="flex gap-2">
                  {form(
                    it,
                    "plan",
                    t.plan,
                    <CalendarClock size={16} aria-hidden="true" />,
                    !isToday,
                  )}
                  {isToday &&
                    form(
                      it,
                      "live",
                      t.start,
                      <Play size={16} aria-hidden="true" />,
                      true,
                    )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
