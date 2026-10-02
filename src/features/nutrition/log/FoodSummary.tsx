/**
 * features/nutrition/log/FoodSummary.tsx — the day's food on Today →
 * Summary (ADR-0033): one row per moment with what is in it and its eaten
 * kcal; a moment with only planned food says so. The whole list lives in
 * Today → Food, one tap away. Server component.
 */
import type { Moment, MomentGroup } from "@/core/nutrition/moments";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { Badge } from "@/ui/Badge";
import { MOMENT_TEXT, MomentIcon } from "@/ui/MomentIcon";

type Entry = { label: string; status: "planned" | "eaten" };

export function FoodSummary({
  groups,
  locale,
  t,
}: {
  groups: MomentGroup<Entry & { moment: Moment | null }>[];
  locale: Locale;
  t: Pick<Messages, "day" | "moments">;
}) {
  if (groups.length === 0) return <p className="text-muted">{t.day.views.noFood}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {groups.map((g) => {
        const eaten = g.entries.some((e) => e.status === "eaten");
        return (
          <li key={g.moment ?? "none"} className="flex items-center gap-3">
            <MomentIcon moment={g.moment} size={20} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span
                className={`font-display text-item font-semibold ${(g.moment && MOMENT_TEXT[g.moment]) || ""}`}
              >
                {g.moment ? t.moments.names[g.moment] : t.moments.none}
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
