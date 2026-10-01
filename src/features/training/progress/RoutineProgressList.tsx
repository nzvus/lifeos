/**
 * features/training/progress/RoutineProgressList.tsx — each routine as a
 * tile: name and how many runs, the last run (day, sets, kg lifted) with its
 * change against the run before, and a sparkline of kg per run. A tile links
 * to the last run. Data: core/training/progress.ts routineProgress.
 */
import Link from "next/link";
import type { RoutineProgress } from "@/core/training/progress";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { Change } from "@/ui/Change";
import { Sparkline } from "./Sparkline";

export function RoutineProgressList({
  routines,
  locale,
  t,
}: {
  routines: readonly RoutineProgress[];
  locale: Locale;
  t: Messages["training"]["progress"];
}) {
  const n = (v: number) => formatNumber(String(v), locale, 0);
  const day = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {routines.map((r) => {
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-item font-semibold">{r.name}</span>
              <span className="text-meta text-muted tabular-nums">
                {fill(t.runs, { n: String(r.runs) })}
              </span>
            </div>
            {r.last ? (
              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col text-meta tabular-nums">
                  <span className="text-muted">
                    {`${fill(t.lastRun, { day: day(r.last.day) })} · ${fill(t.setsN, { n: String(r.last.sets) })}`}
                  </span>
                  <span>
                    <span className="font-display text-item font-semibold">
                      {n(r.last.tonnage)}
                    </span>
                    {` ${t.tonnage} `}
                    <Change pct={r.change} />
                  </span>
                </div>
                <Sparkline values={r.series} />
              </div>
            ) : (
              <span className="text-meta text-muted">{t.notYet}</span>
            )}
          </>
        );
        return (
          <li key={r.id}>
            {r.last ? (
              <Link
                href={`/training/${r.last.sessionId}`}
                className="tile flex flex-col gap-1 px-3 py-2 hover:border-ink"
              >
                {body}
              </Link>
            ) : (
              <div className="tile flex flex-col gap-1 px-3 py-2">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
