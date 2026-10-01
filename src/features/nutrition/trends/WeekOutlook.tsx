/**
 * features/nutrition/trends/WeekOutlook.tsx — the coming 7 days on the
 * Targets page: day type and goal, training (planned, or from the program),
 * estimated energy and the targets that follow. Each day links to its page.
 * Server component.
 */
import { CalendarRange, Dumbbell, Moon } from "lucide-react";
import Link from "next/link";
import type { OutlookDay } from "@/core/energy/repositories/outlook";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";

const INTL = { it: "it-IT", en: "en-GB" } as const;

export function WeekOutlook({
  days,
  locale,
  t,
}: {
  days: OutlookDay[];
  locale: Locale;
  t: Pick<Messages, "outlook" | "energy" | "programs">;
}) {
  const o = t.outlook;
  const n = (v: number) => formatNumber(String(v), locale, 0);
  const date = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return (
    <ol className="grid gap-2 @2xl:grid-cols-2 @5xl:grid-cols-4">
      {days.map((d) => (
        <li key={d.day}>
          <Link
            href={`/?day=${d.day}`}
            className="tile flex h-full flex-col gap-1.5 px-3 py-2 hover:border-ink"
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="shrink-0 font-display text-item font-semibold whitespace-nowrap">
                {date.format(new Date(`${d.day}T12:00:00Z`))}
              </span>
              <span className="truncate text-meta text-muted">
                {d.dayType ?? o.noDayType}
                {d.goal && d.goal !== "custom" ? ` · ${t.energy.goals[d.goal]}` : ""}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-meta">
              {d.rest ? (
                <span className="inline-flex items-center gap-1 text-muted">
                  <Moon size={14} aria-hidden="true" />
                  {o.rest}
                </span>
              ) : (
                d.training.map((x, i) => (
                  <span key={i} className="inline-flex items-center gap-1">
                    {x.fromProgram ? (
                      <CalendarRange
                        size={14}
                        aria-hidden="true"
                        className="text-muted"
                      />
                    ) : (
                      <Dumbbell size={14} aria-hidden="true" className="text-muted" />
                    )}
                    {x.label}
                    {x.late && <span className="text-warn">({t.programs.late})</span>}
                  </span>
                ))
              )}
            </span>
            <span className="text-meta text-muted tabular-nums">
              {d.energy
                ? fill(o.energy, { lo: n(d.energy.low), hi: n(d.energy.high) })
                : o.noEnergy}
            </span>
            {d.targets && (
              <span className="font-display text-meta tabular-nums">
                {fill(o.targets, {
                  kcal: n(d.targets.kcal),
                  p: n(d.targets.protein),
                  c: n(d.targets.carbs),
                  f: n(d.targets.fat),
                })}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
