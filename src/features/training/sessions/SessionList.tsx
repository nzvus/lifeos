/**
 * features/training/sessions/SessionList.tsx — sessions as rows (the shared
 * ui/ListItem): name and day, then duration, working sets, tonnage and the
 * burn estimate as a range (ADR-0005: never a precise number). Compact: a
 * row of exercise icons in their body region's colour; tapping it opens each
 * exercise with its sets as short text. Planned sessions are drawn muted,
 * like planned food (ADR-0009). An estimated session (ADR-0016, no
 * exercises) shows its intensity and muscle groups instead, marked as an
 * estimate. The whole row opens the session; "⋯" deletes it with Undo; on
 * today's page a planned session has "Start" (gym mode).
 * Used by /training and by the day page.
 * Server component.
 */
import { Circle, CircleCheck, Play } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/ui/button";
import { burnRange, weightAt } from "@/core/training/analysis";
import { sessionSummary, setsText } from "@/core/training/display";
import type { SessionView } from "@/core/training/repositories/sessions";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { isMuscleGroup, MUSCLE_GROUP_REGION, regionOf } from "@/core/training/anatomy";
import { ExerciseIcon } from "@/ui/ExerciseIcon";
import { ListItem } from "@/ui/ListItem";
import { MuscleChips } from "@/ui/MuscleChip";
import { TrashMenu } from "@/ui/TrashMenu";

type Props = {
  sessions: SessionView[];
  measurements: { day: string; weightKg: string | null }[];
  /** Show the day on each row (the list page), not on the day page. */
  showDay: boolean;
  locale: Locale;
  t: Messages["training"];
  /** Muscle group names, for estimated sessions. */
  tx: Messages["exercises"];
  /** The row's "⋯ → Delete" and its Undo (ADR-0015): server actions. */
  trash: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore: (id: string) => Promise<{ ok: boolean; message?: string }>;
  labels: Messages["actions"];
  /** The day page on today: planned sessions with exercises offer gym mode. */
  startable?: boolean;
  /** Shows each session's start time in this zone (the day page). */
  timeZone?: string;
};

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

export function SessionList({
  sessions,
  measurements,
  showDay,
  locale,
  t,
  tx,
  trash,
  restore,
  labels,
  startable = false,
  timeZone,
}: Props) {
  const date = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const n = (v: number, d = 0) => formatNumber(String(v), locale, d);
  const clock = timeZone
    ? new Intl.DateTimeFormat(INTL[locale], {
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
      })
    : null;
  /** One line of numbers, by what the session is (core/training/display.ts). */
  const summary = (s: SessionView) => {
    const x = sessionSummary(s);
    const parts: string[] = [];
    if (x.cardio)
      parts.push(
        [
          fill(t.minutesShort, { n: String(x.cardio.minutes) }),
          x.cardio.km !== null ? `${n(x.cardio.km, 1)} km` : null,
          x.cardio.kmh !== null ? `${n(x.cardio.kmh, 1)} km/h` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
    if (x.strength)
      parts.push(
        [
          fill(t.progress.setsN, { n: String(x.strength.sets) }),
          x.strength.tonnage > 0
            ? x.strength.tonnage >= 1000
              ? `${n(x.strength.tonnage / 1000, 1)} t`
              : `${n(x.strength.tonnage)} kg`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
    if (!x.cardio && s.exercises.some((e) => e.kind === "cardio"))
      // Cardio planned without its numbers yet: the minutes, if any.
      parts.push(x.minutes ? fill(t.minutesShort, { n: String(x.minutes) }) : "");
    if (!x.cardio && !x.strength && s.exercises.length === 0)
      parts.push(
        [
          t.estimate.badge,
          x.minutes ? fill(t.minutesShort, { n: String(x.minutes) }) : null,
          s.intensity ? t.estimate.intensities[s.intensity] : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
    return parts.filter(Boolean).join(" + ");
  };
  return (
    <ul className="grid grid-cols-1 gap-x-8 @3xl:grid-cols-2">
      {sessions.map((s) => {
        const burn = burnRange(s, weightAt(measurements, s.day));
        const kcal = burn ? `~${n(burn.low)}–${n(burn.high)} kcal` : null;
        return (
          <ListItem
            key={s.id}
            muted={s.status === "planned"}
            leading={
              s.status === "done" ? (
                <CircleCheck
                  size={20}
                  aria-label={t.statuses.done}
                  className="text-herb"
                />
              ) : (
                <Circle
                  size={20}
                  aria-label={t.statuses.planned}
                  className="text-muted"
                />
              )
            }
            href={
              showDay
                ? `/training/${s.id}`
                : `/training/${s.id}?from=${encodeURIComponent(`/?day=${s.day}`)}`
            }
            title={
              <span className="flex flex-wrap items-baseline gap-x-2">
                {clock && s.startedAt && (
                  <span className="font-display font-normal text-muted tabular-nums">
                    {clock.format(new Date(s.startedAt))}
                  </span>
                )}
                <span className="min-w-0">{s.label}</span>
              </span>
            }
            action={
              <TrashMenu
                id={s.id}
                name={s.label}
                trash={trash}
                restore={restore}
                labels={labels}
              />
            }
            aside={showDay ? date.format(new Date(`${s.day}T12:00:00Z`)) : kcal}
          >
            {/* One line under the title: the exercises as icons (tap: each with
                its sets), the numbers, and Start on the right. */}
            <div className="-mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 pl-8 text-meta">
              {s.exercises.length > 0 && (
                <details className="relative z-2 min-w-0 open:basis-full">
                  <summary
                    className="flex cursor-pointer list-none items-center gap-1"
                    aria-label={s.exercises.map((e) => e.name).join(", ")}
                  >
                    {s.exercises.map((e) => (
                      <ExerciseIcon
                        key={e.id}
                        pattern={e.pattern}
                        region={regionOf(e.muscleGroups)}
                        size={22}
                      />
                    ))}
                  </summary>
                  <ul className="mt-2 flex flex-col gap-1">
                    {s.exercises.map((e) => (
                      <li
                        key={e.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-3"
                      >
                        <span className="min-w-0">{e.name}</span>
                        <span className="ml-auto font-display text-muted tabular-nums">
                          {setsText(e.sets, locale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <span className="min-w-0 flex-1 text-muted tabular-nums">
                {summary(s)}
                {showDay && kcal ? ` · ${kcal}` : ""}
              </span>
              {startable && s.status === "planned" && s.exercises.length > 0 && (
                <Link
                  href={`/training/${s.id}/live`}
                  aria-label={t.when.startThis}
                  className={`relative z-2 ${buttonClass({ variant: "primary", size: "sm" })}`}
                >
                  <Play size={14} aria-hidden="true" />
                  {t.when.startShort}
                </Link>
              )}
            </div>
            {s.exercises.length === 0 && s.muscleGroups.length > 0 && (
              <MuscleChips
                groups={s.muscleGroups.filter(isMuscleGroup).map((g) => ({
                  label: tx.groups[g],
                  region: MUSCLE_GROUP_REGION[g],
                }))}
              />
            )}
          </ListItem>
        );
      })}
    </ul>
  );
}
