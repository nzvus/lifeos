/**
 * features/nutrition/log/WeekStrip.tsx — the week of the shown day, Monday
 * to Sunday, to move between days: each day is a link with its weekday, its
 * date and a thin bar of the energy eaten against its target (coloured like
 * the day panel). Arrows jump a week; a date field jumps anywhere (a plain
 * GET form to "/?day=…": works without JavaScript). Charts over longer
 * ranges live on the Targets page (features/nutrition/trends).
 *
 * Server component: links and a form, nothing interactive in the browser.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { DaySummary } from "@/core/nutrition/repositories/history";
import { assessTarget, TARGET_KIND } from "@/core/nutrition/targets";
import { addDays } from "@/core/shared/dates";
import type { Locale } from "@/core/shared/locales";
import type { Messages } from "@/i18n";
import { NUTRIENT_VAR } from "@/ui/NutrientIcon";
import { targetTone } from "@/ui/targetTone";

type Props = {
  week: DaySummary[]; // Monday … Sunday
  day: string;
  today: string;
  locale: Locale;
  t: Messages["day"];
};

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

export function WeekStrip({ week, day, today, locale, t }: Props) {
  const weekday = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "short",
    timeZone: "UTC",
  });
  const monday = week[0]!.day;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-stretch gap-1">
        <Link
          href={`/?day=${addDays(day, -7)}`}
          aria-label={t.previousWeek}
          className="flex items-center px-1"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <ol className="grid flex-1 grid-cols-7 gap-1">
          {week.map((d) => {
            const kcal = d.totals.nutrients.kcal;
            const a = assessTarget(kcal, d.targets?.kcal ?? null, TARGET_KIND.kcal);
            const tone = targetTone({
              kind: TARGET_KIND.kcal,
              status: a.status,
              ratio: a.status === "none" ? 0 : a.ratio,
              base: NUTRIENT_VAR.kcal!,
            });
            const fill = a.status === "none" ? (d.logged ? 1 : 0) : Math.min(1, a.ratio);
            const selected = d.day === day;
            const date = new Date(`${d.day}T12:00:00Z`);
            return (
              <li key={d.day}>
                <Link
                  href={`/?day=${d.day}`}
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
                      className="block h-full"
                      style={{
                        width: `${fill * 100}%`,
                        background: tone.color,
                        opacity: tone.opacity,
                      }}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <Link
          href={`/?day=${addDays(day, 7)}`}
          aria-label={t.nextWeek}
          className="flex items-center px-1"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </Link>
      </div>
      <form action="/" className="flex items-center justify-center gap-2 text-meta">
        <label className="flex items-center gap-2">
          <span className="text-muted">{t.goTo}</span>
          <input
            type="date"
            name="day"
            defaultValue={day}
            className="rounded-control rule-b-medium border-ink bg-sheet px-2 py-1"
          />
        </label>
        <button
          type="submit"
          className="rounded-control border border-hairline px-2 py-1 hover:border-ink"
        >
          {t.go}
        </button>
        {monday > today || addDays(monday, 6) < today ? (
          <Link href="/" className="underline">
            {t.thisWeek}
          </Link>
        ) : null}
      </form>
    </div>
  );
}
