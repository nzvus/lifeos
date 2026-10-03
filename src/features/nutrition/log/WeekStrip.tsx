/**
 * features/nutrition/log/WeekStrip.tsx — the week of the shown day, Monday
 * to Sunday, to move between days: each day is a link with its weekday, its
 * date, a thin bar of the energy eaten against its target coloured by state
 * like the day panel's Energy row (core/nutrition/bands bandState), and the
 * difference from the target in kcal ("−340", "+120") on days that have
 * come. A number, not a hover box: phones have no hover. The day arrows and the calendar (DayNav) move further,
 * so the strip is just the seven days (S20: one row of controls). Charts over longer
 * ranges live on the Targets page (features/nutrition/trends).
 *
 * Server component; the links (ui/ViewAwareLink) keep the open view (ADR-0033).
 */
import { bandFor, bandState } from "@/core/nutrition/bands";
import type { DaySummary } from "@/core/nutrition/repositories/history";
import { TARGET_KIND } from "@/core/nutrition/targets";
import type { Locale } from "@/core/shared/locales";
import { fill as format, type Messages } from "@/i18n";
import { STATE_FILL } from "@/ui/NutrientRow";
import { ViewAwareLink } from "@/ui/ViewSwitch";

type Props = {
  week: DaySummary[]; // Monday … Sunday
  day: string;
  today: string;
  locale: Locale;
  t: Pick<Messages["day"], "weekBalance">;
};

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

export function WeekStrip({ week, day, today, locale, t }: Props) {
  const weekday = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "short",
    timeZone: "UTC",
  });
  const signed = new Intl.NumberFormat(INTL[locale], { signDisplay: "exceptZero" });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-1">
        <ol className="grid flex-1 grid-cols-7 gap-1">
          {week.map((d) => {
            const kcal = Number(d.totals.nutrients.kcal);
            const target = d.targets?.kcal ? Number(d.targets.kcal) : null;
            const state = bandState(kcal, bandFor(undefined, target, TARGET_KIND.kcal));
            const fill = target ? Math.min(1, kcal / target) : d.logged ? 1 : 0;
            // The difference only once the day has come and something is logged.
            const delta =
              target && d.logged && d.day <= today ? Math.round(kcal - target) : null;
            const selected = d.day === day;
            const date = new Date(`${d.day}T12:00:00Z`);
            return (
              <li key={d.day}>
                <ViewAwareLink
                  href={`/?day=${d.day}`}
                  title={
                    delta === null
                      ? undefined
                      : format(t.weekBalance, {
                          kcal: String(Math.round(kcal)),
                          target: String(Math.round(target!)),
                          delta: signed.format(delta),
                        })
                  }
                  aria-current={selected ? "date" : undefined}
                  className={`flex flex-col items-center gap-0.5 rounded-control px-1 py-1.5 ${
                    selected
                      ? "rule-medium border-ink bg-sheet"
                      : "border border-transparent hover:bg-sheet"
                  }`}
                >
                  <span className="text-meta text-muted first-letter:uppercase">
                    {weekday.format(date)}
                  </span>
                  <span
                    className={`font-display text-item tabular-nums ${d.day === today ? "font-bold text-herb" : ""}`}
                  >
                    {date.getUTCDate()}
                  </span>
                  <span
                    className="h-1 w-full overflow-hidden bg-hairline"
                    aria-hidden="true"
                  >
                    <span
                      className={`block h-full ${STATE_FILL[state]}`}
                      style={{ width: `${fill * 100}%` }}
                    />
                  </span>
                  <span className="text-meta leading-none tabular-nums text-muted">
                    {delta === null ? "\u00a0" : signed.format(delta)}
                  </span>
                </ViewAwareLink>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
