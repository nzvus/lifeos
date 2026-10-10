/**
 * features/nutrition/log/ScoreRow.tsx — the day's quality in one line of
 * the day card (ADR-0050): the score, and the week's average furthest from
 * its target (ADR-0047), if any. A link to the Day quality panel, which
 * opens on its hash. Server component.
 */
import { ChevronRight, Gauge } from "lucide-react";
import type { DayScore } from "@/core/nutrition/day-score";
import { weekWatch, type WeekContext } from "@/core/nutrition/week";
import { fill, type Messages } from "@/i18n";

export function ScoreRow({
  score,
  week,
  t,
}: {
  score: DayScore;
  /** The week read, or null on future days. */
  week: WeekContext | null;
  t: Pick<Messages, "dayScore" | "week" | "nutrients">;
}) {
  if (score.score === null) return null;
  const watch = week ? weekWatch(week) : null;
  const tone =
    score.score >= 75 ? "text-herb" : score.score >= 50 ? "text-ink" : "text-warn";
  return (
    <a
      href="#day-score"
      className="flex min-h-11 items-center gap-2 rounded-control text-meta"
    >
      <Gauge size={18} aria-hidden="true" className={`shrink-0 ${tone}`} />
      <span className="min-w-0 flex-1">
        <span className={`font-bold tabular-nums ${tone}`}>
          {fill(t.dayScore.row, { v: String(score.score) })}
        </span>
        {watch && (
          <span className="block text-muted">
            {fill(watch.kind === "max" ? t.week.watchOver : t.week.watchUnder, {
              name: t.nutrients[watch.key].toLowerCase(),
            })}
          </span>
        )}
      </span>
      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-muted" />
    </a>
  );
}
