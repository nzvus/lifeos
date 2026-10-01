/**
 * features/training/progress/ExerciseTrendList.tsx — the most recently done
 * exercises: icon in the body region's colour, name, estimated 1RM with its
 * change over about four weeks, and a sparkline of e1RM per session.
 * Cardio and exercises without an e1RM show how many sessions instead.
 * Data: core/training/progress.ts exerciseTrends.
 */
import Link from "next/link";
import { regionOf } from "@/core/training/anatomy";
import type { ExerciseTrend } from "@/core/training/progress";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { ExerciseIcon } from "@/ui/ExerciseIcon";
import { REGION_TEXT } from "@/ui/MuscleChip";
import { Change } from "@/ui/Change";
import { Sparkline } from "./Sparkline";

export function ExerciseTrendList({
  trends,
  exercises,
  locale,
  t,
}: {
  trends: readonly ExerciseTrend[];
  exercises: ReadonlyMap<
    string,
    { name: string; pattern: string | null; muscleGroups: string[] }
  >;
  locale: Locale;
  t: Messages["training"]["progress"];
}) {
  return (
    <ul className="grid gap-x-8 md:grid-cols-2">
      {trends.map((tr) => {
        const e = exercises.get(tr.exerciseId);
        if (!e) return null;
        const region = regionOf(e.muscleGroups);
        return (
          <li key={tr.exerciseId} className="item flex min-w-0 items-center gap-3 py-2">
            <ExerciseIcon pattern={e.pattern} region={region} size={24} />
            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/training/exercises/${tr.exerciseId}`}
                className="truncate font-semibold underline-offset-4 hover:underline"
              >
                {e.name}
              </Link>
              <span className="text-meta text-muted tabular-nums">
                {tr.e1rm !== null ? (
                  <>
                    {fill(t.e1rm, { kg: formatNumber(String(tr.e1rm), locale, 1) })}
                    {tr.change !== null && (
                      <>
                        {" · "}
                        <Change pct={tr.change} />
                        {` ${t.in4w}`}
                      </>
                    )}
                  </>
                ) : (
                  fill(t.sessionsN, { n: String(tr.sessions) })
                )}
              </span>
            </div>
            <Sparkline
              values={tr.series}
              className={(region && REGION_TEXT[region]) || "text-herb"}
            />
          </li>
        );
      })}
    </ul>
  );
}
