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
import { Play } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/ui/button";
import { burnRange, sessionTonnage, weightAt } from "@/core/training/analysis";
import { setsText } from "@/core/training/display";
import type { SessionView } from "@/core/training/repositories/sessions";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { isMuscleGroup, MUSCLE_GROUP_REGION, regionOf } from "@/core/training/anatomy";
import { ExerciseIcon } from "@/ui/ExerciseIcon";
import { ListItem } from "@/ui/ListItem";
import { MuscleChips } from "@/ui/MuscleChip";
import { TrashMenu } from "@/ui/TrashMenu";
import { Badge } from "@/ui/Badge";

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
}: Props) {
  const date = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return (
    <ul className="grid gap-x-8 @3xl:grid-cols-2">
      {sessions.map((s) => {
        const burn = burnRange(s, weightAt(measurements, s.day));
        const strength = s.exercises.filter((e) => e.kind !== "cardio");
        const tonnage = sessionTonnage(strength);
        const sets = strength.reduce(
          (a, e) => a + e.sets.filter((x) => !x.warmup).length,
          0,
        );
        return (
          <ListItem
            key={s.id}
            muted={s.status === "planned"}
            href={
              showDay
                ? `/training/${s.id}`
                : `/training/${s.id}?from=${encodeURIComponent(`/?day=${s.day}`)}`
            }
            title={s.label}
            action={
              <TrashMenu
                id={s.id}
                name={s.label}
                trash={trash}
                restore={restore}
                labels={labels}
              />
            }
            aside={
              showDay ? (
                date.format(new Date(`${s.day}T12:00:00Z`))
              ) : (
                <Badge tone={s.status === "done" ? "done" : "planned"}>
                  {t.statuses[s.status]}
                </Badge>
              )
            }
            footer={[
              s.durationMin ? fill(t.minutesShort, { n: String(s.durationMin) }) : null,
              sets > 0 ? fill(t.progress.setsN, { n: String(sets) }) : null,
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
            {s.exercises.length === 0 ? (
              <div className="flex flex-col gap-1 text-meta">
                <span className="text-muted">
                  {[
                    t.estimate.badge,
                    s.intensity ? t.estimate.intensities[s.intensity] : null,
                    s.notes || null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <MuscleChips
                  groups={s.muscleGroups.filter(isMuscleGroup).map((g) => ({
                    label: tx.groups[g],
                    region: MUSCLE_GROUP_REGION[g],
                  }))}
                />
              </div>
            ) : (
              <details className="relative z-2 text-meta">
                <summary
                  className="flex cursor-pointer list-none flex-wrap items-center gap-1.5"
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
                <ul className="mt-2 flex flex-col">
                  {s.exercises.map((e) => (
                    <li key={e.id} className="flex justify-between gap-3">
                      <span className="truncate">{e.name}</span>
                      <span className="shrink-0 font-display text-muted tabular-nums">
                        {setsText(e.sets, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {startable && s.status === "planned" && s.exercises.length > 0 && (
              <Link
                href={`/training/${s.id}/live`}
                className={`relative z-2 self-start ${buttonClass({ variant: "primary", size: "sm" })}`}
              >
                <Play size={16} aria-hidden="true" />
                {t.when.startThis}
              </Link>
            )}
          </ListItem>
        );
      })}
    </ul>
  );
}
