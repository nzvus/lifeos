/**
 * features/nutrition/log/WeekContextCard.tsx — the day read in its week
 * (ADR-0047): the days before against their targets and, if the user
 * wants, what this day could eat to bring the week back; protein day by
 * day; fibre, salt, sugars and saturated fat as the week's average; a
 * note when the days swing. Information, never a verdict in red.
 * Server component.
 */
import { CalendarRange } from "lucide-react";
import type { NutrientKey } from "@/core/nutrition/nutrients";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import type { WeekContext } from "@/core/nutrition/week";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { InfoTip } from "@/ui/InfoTip";
import { Section } from "@/ui/Section";

/** Within this many kcal the days before are "on target". */
const EVEN_KCAL = 150;

export function WeekContextCard({
  w,
  locale,
  t,
}: {
  w: WeekContext;
  locale: Locale;
  t: Pick<Messages, "week" | "nutrients">;
}) {
  const k = t.week;
  const n = (v: number, d = 0) =>
    formatNumber(String(Math.round(v * 10 ** d) / 10 ** d), locale, d);
  const unit = (key: NutrientKey, v: number) =>
    `${n(v, key === "salt" ? 1 : 0)} ${NUTRIENT_UNIT[key]}`;
  const b = w.pastBalance;
  return (
    <Section
      title={k.title}
      icon={<CalendarRange size={20} aria-hidden="true" />}
      aside={
        <InfoTip label={k.info}>
          <p>{k.infoNote}</p>
        </InfoTip>
      }
    >
      <ul className="flex flex-col gap-1.5 text-meta">
        {w.pastDays === 0 || b === null ? (
          <li className="text-muted">{k.nothing}</li>
        ) : (
          <li>
            {fill(
              Math.abs(b) <= EVEN_KCAL
                ? k.balanceEven
                : b > 0
                  ? k.balanceOver
                  : k.balanceUnder,
              { kcal: n(Math.abs(b)), n: String(w.pastDays) },
            )}
            {w.today && Math.abs(b) > EVEN_KCAL && (
              <span className="block text-muted tabular-nums">
                {fill(k.adjusted, {
                  adjusted: n(w.today.adjusted),
                  target: n(w.today.target),
                })}
                {w.today.capped && ` ${k.capped}`}
              </span>
            )}
          </li>
        )}
        {w.protein && (
          <li>
            {fill(k.protein, { in: String(w.protein.inZone), of: String(w.protein.of) })}
          </li>
        )}
        {w.averages.map((a) => {
          const off = a.kind === "max" ? a.average > a.target : a.average < a.target;
          return (
            <li key={a.key} className={off ? "font-semibold" : ""}>
              {fill(k.average, {
                name: t.nutrients[a.key],
                avg: unit(a.key, a.average),
                target: unit(a.key, a.target),
              })}
            </li>
          );
        })}
        {w.irregular && <li className="text-muted">{k.irregular}</li>}
      </ul>
    </Section>
  );
}
