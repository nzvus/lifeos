/**
 * features/nutrition/log/DayNav.tsx — "‹ previous day · date 📅 · next day ›":
 * one row, the calendar (DayPicker) jumps anywhere. The links go through
 * DayGo, so the new day is marked at once while it loads.
 *
 * Days travel in the URL (/?day=2026-09-29), not in hidden state: every day
 * has its own address, so back/forward and bookmarks work, and a reload never
 * silently jumps to "today". The open view (ADR-0033) goes along: the links
 * are ui/ViewAwareLink, which add it in the browser.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays } from "@/core/shared/dates";
import type { Locale } from "@/core/shared/locales";
import type { Messages } from "@/i18n";
import { buttonClass, TEXT_LINK } from "@/ui/button";
import { DayLink } from "./DayGo";
import { DayPicker } from "./DayPicker";

type Props = {
  day: string;
  today: string;
  locale: Locale;
  t: Messages["day"];
};

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

export function DayNav({ day, today, locale, t }: Props) {
  // Noon UTC avoids the date shifting when formatted in a far-away time zone.
  const heading = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
  // Narrow cards (small phones, large system text): "ven 2 ott". The query
  // is in rem, so it follows the text size too.
  const short = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
  return (
    <nav aria-label={t.backToToday} className="flex items-center justify-between gap-2">
      <DayLink
        day={addDays(day, -1)}
        aria-label={t.previous}
        className={buttonClass({ variant: "quiet", iconOnly: true })}
      >
        <ChevronLeft size={24} aria-hidden="true" />
      </DayLink>
      <div className="flex min-w-0 flex-col items-center">
        <div className="flex min-w-0 items-center gap-1">
          <h1 className="font-heading text-section font-bold whitespace-nowrap first-letter:uppercase">
            <span className="hidden @xs:inline">{heading}</span>
            <span className="@xs:hidden">{short}</span>
          </h1>
          <DayPicker label={t.calendar} />
        </div>
        {day !== today && (
          <DayLink day={today} className={`text-meta ${TEXT_LINK}`}>
            {t.backToToday}
          </DayLink>
        )}
      </div>
      <DayLink
        day={addDays(day, 1)}
        aria-label={t.next}
        className={buttonClass({ variant: "quiet", iconOnly: true })}
      >
        <ChevronRight size={24} aria-hidden="true" />
      </DayLink>
    </nav>
  );
}
