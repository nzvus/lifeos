/**
 * features/nutrition/log/FoodSummary.tsx — the day's food on Today →
 * Summary (ADR-0033): one row per moment with what is in it and its eaten
 * kcal; a moment with only planned food says so. With a program (ADR-0044),
 * a slot with no food yet shows at its time, muted. The whole list lives in
 * Today → Food, one tap away. Server component.
 */
import type { Moment } from "@/core/nutrition/moments";
import type { DayItem } from "@/core/nutrition/slots";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { Badge } from "@/ui/Badge";
import { MOMENT_TEXT, MomentIcon } from "@/ui/MomentIcon";
import { SlotLine } from "./SlotLine";

type Entry = {
  label: string;
  status: "planned" | "eaten";
  moment: Moment | null;
  totals: { nutrients: { protein: string } };
};

export function FoodSummary({
  items,
  locale,
  t,
}: {
  items: DayItem<Entry>[];
  locale: Locale;
  t: Pick<Messages, "day" | "moments" | "dayProgram">;
}) {
  if (items.length === 0) return <p className="text-muted">{t.day.views.noFood}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        if (item.type === "empty")
          return (
            <li key={item.key} className="flex items-center gap-3 opacity-70">
              <MomentIcon moment={item.moment} size={20} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-item font-semibold">
                  {t.moments.names[item.moment]}
                </span>
                <SlotLine
                  slot={item.slot}
                  eatenProtein={null}
                  locale={locale}
                  t={t.dayProgram}
                />
              </div>
            </li>
          );
        const g = item.group;
        const eaten = g.entries.some((e) => e.status === "eaten");
        return (
          <li key={g.key} className="flex items-center gap-3">
            <MomentIcon moment={g.moment} size={20} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className={`font-display text-item font-semibold ${(g.moment && MOMENT_TEXT[g.moment]) || ""}`}
              >
                {g.part
                  ? t.moments.snackParts[g.part]
                  : g.moment
                    ? t.moments.names[g.moment]
                    : t.moments.none}
              </span>
              <span className="truncate text-meta text-muted">
                {g.entries.map((e) => e.label).join(", ")}
              </span>
            </div>
            {eaten ? (
              <span className="shrink-0 font-display text-item font-semibold tabular-nums">
                {fill(t.moments.subtotal, { v: formatNumber(g.eatenKcal, locale, 0) })}
              </span>
            ) : (
              <Badge tone="planned">{t.day.views.planned}</Badge>
            )}
          </li>
        );
      })}
    </ul>
  );
}
