/**
 * features/nutrition/trends/Analysis.tsx — the period in numbers, above the
 * charts: adherence per nutrient, averages per day type, eating times, and
 * plans never confirmed. Every number is computed by core/nutrition/
 * analysis.ts and shown with what it counts — no hidden score.
 */
import { CalendarDays, Clock, ListChecks, Target } from "lucide-react";
import type { ReactNode } from "react";
import type { DaySummary } from "@/core/nutrition/repositories/history";
import {
  adherence,
  byDayType,
  DAY_PARTS,
  eatingTimes,
  plansLeft,
} from "@/core/nutrition/analysis";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import type { Targets } from "@/core/nutrition/targets";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { NutrientIcon } from "@/ui/NutrientIcon";

type Props = {
  history: DaySummary[];
  targets: Targets[];
  today: string;
  timeZone: string;
  locale: Locale;
  t: Pick<Messages, "analysis" | "nutrients">;
};

/** Minutes after midnight as "08:05"; a duration as "12 h 28 min". */
const clock = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const duration = (m: number, t: Messages["analysis"]) =>
  fill(t.duration, { h: String(Math.floor(m / 60)), m: String(m % 60) });

/** Morning → night as a light → dark scale of the ink colour. */
const PART_SHADE = [
  "opacity-20",
  "opacity-40",
  "opacity-60",
  "opacity-80",
  "opacity-100",
];

function Block({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-1.5 font-display text-item font-bold">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

export function Analysis({ history, targets, today, timeZone, locale, t }: Props) {
  const a = t.analysis;
  const adh = adherence(history, targets).filter((r) => r.withTarget > 0);
  const types = byDayType(history);
  const times = eatingTimes(history, timeZone);
  const left = plansLeft(history, today);
  const n0 = (v: string) => formatNumber(v, locale, 0);

  return (
    <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
      <Block title={a.adherenceTitle} icon={<Target size={16} aria-hidden="true" />}>
        {adh.length === 0 ? (
          <p className="text-meta text-muted">{a.noTargets}</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-meta">
            {adh.map((r) => (
              <li key={r.nutrient} className="flex items-center gap-2">
                <span className="flex w-32 shrink-0 items-center gap-1.5">
                  <NutrientIcon name={r.nutrient} size={14} />
                  {t.nutrients[r.nutrient]}
                </span>
                <span
                  className="h-1.5 flex-1 overflow-hidden bg-hairline"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full bg-herb"
                    style={{ width: `${(r.onTarget / r.withTarget) * 100}%` }}
                  />
                </span>
                <span className="w-24 shrink-0 text-right font-display tabular-nums">
                  {fill(a.daysOf, { n: String(r.onTarget), of: String(r.withTarget) })}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-meta text-muted">{a.adherenceHint}</p>
      </Block>

      <Block title={a.dayTypesTitle} icon={<CalendarDays size={16} aria-hidden="true" />}>
        {types.length === 0 ? (
          <p className="text-meta text-muted">{a.noDays}</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-meta">
            {types.map((r) => (
              <li key={r.dayType} className="flex flex-col">
                <span>
                  <span className="font-semibold">{r.dayType}</span>
                  <span className="pl-2 text-muted">
                    {fill(a.days, { n: String(r.days) })}
                  </span>
                </span>
                <span className="font-display text-muted tabular-nums">
                  {[
                    fill(a.avg, { v: n0(r.kcal), unit: NUTRIENT_UNIT.kcal }),
                    fill(a.avg, {
                      v: n0(r.protein),
                      unit: `${NUTRIENT_UNIT.protein} ${t.nutrients.protein.toLowerCase()}`,
                    }),
                    fill(a.energyOnTarget, {
                      n: String(r.kcalOnTarget),
                      of: String(r.days),
                    }),
                  ].join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      <Block title={a.timesTitle} icon={<Clock size={16} aria-hidden="true" />}>
        {times.days === 0 ? (
          <p className="text-meta text-muted">{a.noTimes}</p>
        ) : (
          <>
            <p className="font-display text-meta tabular-nums">
              {[
                fill(a.first, { v: clock(times.first!) }),
                fill(a.last, { v: clock(times.last!) }),
                fill(a.window, { v: duration(times.window!, a) }),
              ].join(" · ")}
            </p>
            <span
              className="flex h-2 w-full overflow-hidden bg-hairline"
              role="img"
              aria-label={a.partsLabel}
            >
              {times.parts.map((p, i) =>
                p.share > 0 ? (
                  <span
                    key={p.part}
                    className={`bg-ink ${PART_SHADE[i]}`}
                    style={{ width: `${p.share}%` }}
                  />
                ) : null,
              )}
            </span>
            <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-meta text-muted">
              {DAY_PARTS.map((part, i) => {
                const p = times.parts[i]!;
                return (
                  <li key={part} className="inline-flex items-center gap-1 tabular-nums">
                    <span
                      className={`inline-block h-2 w-2 bg-ink ${PART_SHADE[i]}`}
                      aria-hidden="true"
                    />
                    {`${a.parts[part]} ${p.share}%`}
                  </li>
                );
              })}
            </ul>
            <p className="text-meta text-muted">
              {fill(a.timesBase, { n: String(times.days) })}
              {times.untimed > 0 && ` ${fill(a.untimed, { n: String(times.untimed) })}`}
            </p>
          </>
        )}
      </Block>

      <Block title={a.plansTitle} icon={<ListChecks size={16} aria-hidden="true" />}>
        <p className="text-meta text-muted">
          {left === 0 ? a.plansNone : fill(a.plansLeft, { n: String(left) })}
        </p>
      </Block>
    </div>
  );
}
