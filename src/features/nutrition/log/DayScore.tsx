/**
 * features/nutrition/log/DayScore.tsx — the day's quality score with its
 * whole breakdown (core/nutrition/day-score.ts): each part's value, weight
 * and what it counts, or why it is not available; then the fibre eaten by
 * type (ADR-0012), with the untyped rest said out loud. With planned food,
 * also the score the day reaches if the plan is followed. Server component.
 */
import { Gauge } from "lucide-react";
import type { DayScore as Score } from "@/core/nutrition/day-score";
import { FIBER_TYPES } from "@/core/nutrition/quality";
import type { QualitySummary } from "@/core/nutrition/quality-summary";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { FiberTypeIcon } from "@/ui/QualityIcons";
import { Collapsible } from "@/ui/Collapsible";

type Props = {
  score: Score;
  /** The score with the planned entries too; null when nothing is planned. */
  planned: Score | null;
  quality: QualitySummary;
  /** Nothing eaten yet: say so instead of showing zeros. */
  empty: boolean;
  locale: Locale;
  t: Pick<Messages, "dayScore" | "quality">;
};

/** Score colour: the same meaning as everywhere (herb good → tomato poor). */
const tone = (v: number) =>
  v >= 75 ? "text-herb" : v >= 50 ? "text-ink" : v >= 25 ? "text-warn" : "text-tomato";
const bar = (v: number) =>
  v >= 75 ? "bg-herb" : v >= 50 ? "bg-muted" : v >= 25 ? "bg-warn" : "bg-tomato";

export function DayScore({ score, planned, quality, empty, locale, t }: Props) {
  const d = t.dayScore;
  const fibers = FIBER_TYPES.filter((f) => Number(quality.fiber[f]) > 0);
  const maxFiber = Math.max(1, ...fibers.map((f) => Number(quality.fiber[f])));
  const plannedLine = planned?.score != null && (
    <p className={`font-display text-item font-bold tabular-nums ${tone(planned.score)}`}>
      {fill(d.withPlanned, { v: String(planned.score) })}
    </p>
  );
  return (
    <Collapsible
      id="day-score"
      title={d.title}
      icon={<Gauge size={20} aria-hidden="true" />}
      aside={
        !empty && score.score !== null ? (
          <span className={`font-bold ${tone(score.score)}`}>
            {score.score}
            {d.outOf}
          </span>
        ) : undefined
      }
      // Closed, still informative (2026-10-02): each part as a coloured bar.
      summary={
        !empty && score.score !== null ? (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-meta @md:grid-cols-2">
            {score.parts
              .filter((p) => p.value !== null)
              .map((p) => (
                <li key={p.key} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 truncate text-muted">
                    {d.parts[p.key]}
                  </span>
                  <span
                    className="h-2 flex-1 overflow-hidden rounded-badge bg-hairline"
                    aria-hidden="true"
                  >
                    <span
                      className={`block h-full ${bar(p.value!)}`}
                      style={{ width: `${p.value}%` }}
                    />
                  </span>
                  <span
                    className={`w-8 shrink-0 text-right font-display font-bold tabular-nums ${tone(p.value!)}`}
                  >
                    {p.value}
                  </span>
                </li>
              ))}
          </ul>
        ) : undefined
      }
      defaultOpen={false}
    >
      {empty || score.score === null ? (
        <>
          <p className="text-meta text-muted">{d.none}</p>
          {plannedLine}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6 @2xl:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="font-display tabular-nums">
              <span className={`text-title font-extrabold ${tone(score.score)}`}>
                {score.score}
              </span>
              <span className="text-item text-muted">{d.outOf}</span>
            </p>
            {planned?.score !== score.score && plannedLine}
            <ul className="flex flex-col gap-2 text-meta">
              {score.parts.map((p) => (
                <li key={p.key} className="flex flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{d.parts[p.key]}</span>
                    <span className="font-display text-muted tabular-nums">
                      {p.value === null
                        ? "—"
                        : `${p.value}/100 · ${fill(d.weight, { w: String(p.weight) })}`}
                    </span>
                  </span>
                  {p.value !== null && (
                    <span
                      className="h-1.5 w-full overflow-hidden bg-hairline"
                      aria-hidden="true"
                    >
                      <span
                        className={`block h-full ${bar(p.value)}`}
                        style={{ width: `${p.value}%` }}
                      />
                    </span>
                  )}
                  <span className="text-muted">
                    {p.reason === "no_targets"
                      ? d.noTargets
                      : p.reason === "no_sleep"
                        ? d.noSleep
                        : p.key === "sleep"
                          ? fill(d.sleep, {
                              hours: formatNumber(String(p.detail.hours), locale, 1),
                            })
                          : p.reason === "not_classified"
                            ? d.notClassified
                            : p.key === "targets"
                              ? fill(d.targets, {
                                  on: String(p.detail.on),
                                  of: String(p.detail.of),
                                })
                              : p.key === "processing"
                                ? d.processing
                                : fill(d.fiberVariety, { types: String(p.detail.types) })}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-meta text-muted">{d.howTo}</p>
          </div>
          {/* Only when there is something to show: an empty heading reads as broken. */}
          {(fibers.length > 0 || Number(quality.fiber.unknown) > 0) && (
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-item font-bold">{d.fiberTitle}</h3>
              <ul className="flex flex-col gap-1 text-meta">
                {fibers.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="inline-flex w-44 shrink-0 items-center gap-1 text-macro-fiber">
                      <FiberTypeIcon type={f} />
                      {t.quality.fiberNames[f]}
                    </span>
                    <span className="w-14 shrink-0 text-right font-display tabular-nums">
                      {`${formatNumber(quality.fiber[f], locale, 1)} g`}
                    </span>
                    <span
                      className="h-1.5 flex-1 overflow-hidden bg-hairline"
                      aria-hidden="true"
                    >
                      <span
                        className="block h-full bg-macro-fiber"
                        style={{
                          width: `${(Number(quality.fiber[f]) / maxFiber) * 100}%`,
                        }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
              {Number(quality.fiber.unknown) > 0 && (
                <p className="text-meta text-muted">
                  {fill(d.fiberUnknown, {
                    v: formatNumber(quality.fiber.unknown, locale, 1),
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Collapsible>
  );
}
