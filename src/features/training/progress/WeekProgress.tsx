/**
 * features/training/progress/WeekProgress.tsx — one week of training
 * (core/training/progress.ts weekSummary): arrows to move between weeks,
 * four centred numbers (sessions, working sets, kg lifted, estimated kcal)
 * each with the previous week's value, then the sets per muscle group as
 * bars in the body region's colour over the 10–20 reference band. Groups
 * appear when trained this week or the one before, in anatomy order.
 * Server component.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  MUSCLE_GROUP_REGION,
  MUSCLE_GROUPS,
  type MuscleGroup,
} from "@/core/training/anatomy";
import { VOLUME_RANGE, volumeAdvice, type WeekSummary } from "@/core/training/progress";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { MuscleChip, REGION_BG } from "@/ui/MuscleChip";
import { StatTiles } from "@/ui/StatTiles";

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

export function WeekProgress({
  week,
  prev,
  prevHref,
  nextHref,
  locale,
  t,
}: {
  week: WeekSummary;
  prev: WeekSummary;
  prevHref: string;
  /** null on the current week. */
  nextHref: string | null;
  locale: Locale;
  t: {
    progress: Messages["training"]["progress"];
    groups: Messages["exercises"]["groups"];
  };
}) {
  const p = t.progress;
  const n = (v: number, d = 0) => formatNumber(String(v), locale, d);
  const burn = (w: WeekSummary) => (w.burn ? `${n(w.burn.low)}–${n(w.burn.high)}` : "–");
  const date = new Intl.DateTimeFormat(INTL[locale], {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const d = (day: string) => date.format(new Date(`${day}T12:00:00Z`));
  const groups = MUSCLE_GROUPS.filter((g) => week.byGroup.has(g) || prev.byGroup.has(g));
  const scale = Math.max(VOLUME_RANGE.high + 5, ...week.byGroup.values());
  const pct = (v: number) => `${(v / scale) * 100}%`;
  const arrow = "inline-flex h-9 w-9 items-center justify-center rounded-control tile";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link href={prevHref} className={arrow} aria-label={p.prevWeek}>
          <ChevronLeft size={18} aria-hidden="true" />
        </Link>
        <span className="font-display text-item font-semibold tabular-nums">
          {fill(p.range, { from: d(week.from), to: d(week.to) })}
        </span>
        {nextHref ? (
          <Link href={nextHref} className={arrow} aria-label={p.nextWeek}>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        ) : (
          <span className="h-9 w-9" />
        )}
      </div>

      <StatTiles
        stats={[
          {
            value: n(week.sessions),
            label: p.sessions,
            note: fill(p.before, { v: n(prev.sessions) }),
          },
          {
            value: n(week.sets),
            label: p.sets,
            note: fill(p.before, { v: n(prev.sets) }),
          },
          {
            value: n(week.tonnage),
            label: p.tonnage,
            note: fill(p.before, { v: n(prev.tonnage) }),
          },
          { value: burn(week), label: p.burn, note: fill(p.before, { v: burn(prev) }) },
        ]}
      />

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-item font-semibold">{p.volume}</h3>
        {groups.length === 0 ? (
          <p className="text-meta text-muted">{p.volumeEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {groups.map((g) => {
              const v = week.byGroup.get(g) ?? 0;
              const region = MUSCLE_GROUP_REGION[g];
              return (
                <li key={g} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate">
                    <MuscleChip label={t.groups[g]} region={region} />
                  </span>
                  <span className="relative h-3 flex-1 overflow-hidden rounded-control bg-paper">
                    <span
                      className="absolute inset-y-0 bg-hairline"
                      style={{
                        left: pct(VOLUME_RANGE.low),
                        width: pct(VOLUME_RANGE.high - VOLUME_RANGE.low),
                      }}
                    />
                    <span
                      className={`absolute inset-y-0 left-0 rounded-control ${REGION_BG[region]}`}
                      style={{ width: pct(v) }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right font-display font-semibold tabular-nums">
                    {n(v, Number.isInteger(v) ? 0 : 1)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-meta text-muted">{p.volumeHint}</p>
        {/* ADR-0049: a note per band, never a rule. */}
        {(() => {
          const a = volumeAdvice(week.byGroup);
          const names = (gs: readonly MuscleGroup[]) =>
            gs.map((g) => t.groups[g]).join(", ");
          return (
            <>
              {a.low.length > 0 && (
                <p className="text-meta">{fill(p.volumeLow, { groups: names(a.low) })}</p>
              )}
              {a.high.length > 0 && (
                <p className="text-meta">
                  {fill(p.volumeHigh, { groups: names(a.high) })}
                </p>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
