/**
 * features/training/sessions/SessionList.tsx — sessions as rows (the shared
 * ui/ListItem): name and day, then duration, tonnage and the burn estimate
 * as a range (ADR-0005: never a precise number), then each exercise with its
 * working sets as short text. Planned sessions are drawn muted, like planned
 * food (ADR-0009). Used by /training and by the day page. Server component.
 */
import Link from "next/link";
import { burnRange, sessionTonnage, weightAt } from "@/core/training/analysis";
import { setsText } from "@/core/training/display";
import type { SessionView } from "@/core/training/repositories/sessions";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { ListItem } from "@/ui/ListItem";

type Props = {
  sessions: SessionView[];
  measurements: { day: string; weightKg: string | null }[];
  /** Show the day on each row (the list page), not on the day page. */
  showDay: boolean;
  locale: Locale;
  t: Messages["training"];
};

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

export function SessionList({ sessions, measurements, showDay, locale, t }: Props) {
  const date = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return (
    <ul className="grid gap-x-8 md:grid-cols-2">
      {sessions.map((s) => {
        const burn = burnRange(s, weightAt(measurements, s.day));
        const tonnage = sessionTonnage(s.exercises.filter((e) => e.kind !== "cardio"));
        return (
          <ListItem
            key={s.id}
            muted={s.status === "planned"}
            title={
              <Link
                href={`/training/${s.id}`}
                className="underline-offset-4 hover:underline"
              >
                {s.label}
              </Link>
            }
            aside={
              showDay ? date.format(new Date(`${s.day}T12:00:00Z`)) : t.statuses[s.status]
            }
            footer={[
              s.durationMin ? fill(t.minutesShort, { n: String(s.durationMin) }) : null,
              tonnage > 0
                ? fill(t.tonnage, { v: formatNumber(String(tonnage), locale, 0) })
                : null,
              burn
                ? fill(t.burn, { low: String(burn.low), high: String(burn.high) })
                : t.burnNone,
            ]
              .filter(Boolean)
              .join(" · ")}
          >
            <ul className="flex flex-col text-meta">
              {s.exercises.map((e) => (
                <li key={e.id} className="flex justify-between gap-3">
                  <span className="truncate">{e.name}</span>
                  <span className="shrink-0 font-display text-muted tabular-nums">
                    {setsText(e.sets, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </ListItem>
        );
      })}
    </ul>
  );
}
