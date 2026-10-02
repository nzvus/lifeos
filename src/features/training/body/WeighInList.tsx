/**
 * features/training/body/WeighInList.tsx — the latest weigh-ins, read
 * (ADR-0027): on top the trend and the body indices of the latest one; each
 * row its weight and, when it counts less, why in words ("after eating ·
 * more carbs than usual yesterday: likely water"). The weight on the scale
 * is never changed, only explained.
 *
 * Server component; "⋯" deletes with Undo (ADR-0015).
 */
import type { WeighInView } from "@/core/energy/repositories/energy";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import type { Measurement } from "@/core/training/repositories/measurements";
import { fill, type Messages } from "@/i18n";
import { TrashMenu } from "@/ui/TrashMenu";

type Props = {
  measurements: Measurement[];
  readings: WeighInView[];
  locale: Locale;
  trash: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore: (id: string) => Promise<{ ok: boolean; message?: string }>;
  t: Pick<Messages, "body" | "actions">;
};

const ROWS = 10;

export function WeighInList({
  measurements,
  readings,
  locale,
  trash,
  restore,
  t,
}: Props) {
  const b = t.body;
  const n = (v: number | string, d = 1) => formatNumber(String(v), locale, d);
  const date = (day: string) =>
    `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;
  const byId = new Map(readings.map((r) => [r.id, r]));
  const latest = readings.at(-1);
  const indices = latest?.indices;
  return (
    <div className="flex flex-col gap-3">
      {latest && (
        <div className="flex flex-col gap-1">
          <p className="flex flex-wrap gap-x-3 font-display tabular-nums">
            <span className="font-semibold">{fill(b.trend, { v: n(latest.trend) })}</span>
            {indices?.bmi && (
              <span>
                {fill(b.bmi, {
                  v: n(indices.bmi.value),
                  c: b.bmiCategories[indices.bmi.category],
                })}
              </span>
            )}
            {indices?.waistToHeight != null && (
              <span>{fill(b.waistToHeight, { v: n(indices.waistToHeight, 2) })}</span>
            )}
            {indices?.ffmi != null && <span>{fill(b.ffmi, { v: n(indices.ffmi) })}</span>}
          </p>
          <p className="text-meta text-muted">
            {indices?.bmi ? b.indicesNote : b.noHeight}
          </p>
        </div>
      )}
      <ul className="flex flex-col text-meta">
        {[...measurements]
          .reverse()
          .slice(0, ROWS)
          .map((m) => {
            const r = byId.get(m.id);
            return (
              <li
                key={m.id}
                className="item flex items-center justify-between gap-3 py-1.5"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="tabular-nums">
                    {`${date(m.day)} · `}
                    <span className="font-display font-semibold">{`${n(m.weightKg ?? "0")} kg`}</span>
                    {m.bodyFatPct && ` · ${n(m.bodyFatPct)} %`}
                    {m.waistCm && ` · ${n(m.waistCm, 0)} cm`}
                  </span>
                  {r && (
                    <span className="text-muted">
                      {r.clues.length
                        ? `${r.clues.map((c) => b.clues[c]).join(" · ")} — ${fill(b.countsLess, { p: String(Math.round(r.reliability * 100)) })}`
                        : r.reliability === 1
                          ? b.standard
                          : null}
                    </span>
                  )}
                </span>
                <TrashMenu
                  id={m.id}
                  name={date(m.day)}
                  trash={trash}
                  restore={restore}
                  labels={t.actions}
                />
              </li>
            );
          })}
      </ul>
    </div>
  );
}
