/**
 * features/nutrition/log/DayNav.tsx — "‹ previous day · date · next day ›".
 *
 * Days travel in the URL (/?day=2026-09-29), not in hidden state: every day
 * has its own address, so back/forward and bookmarks work, and a reload never
 * silently jumps to "today". Server component: plain links.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { addDays } from "@/core/shared/dates";
import type { Locale } from "@/core/shared/locales";
import type { Messages } from "@/i18n";
import { TEXT_LINK } from "@/ui/button";

type Props = { day: string; today: string; locale: Locale; t: Messages["day"] };

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

export function DayNav({ day, today, locale, t }: Props) {
  // Noon UTC avoids the date shifting when formatted in a far-away time zone.
  const heading = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
  return (
    <nav aria-label={t.backToToday} className="flex items-center justify-between gap-2">
      <Link href={`/?day=${addDays(day, -1)}`} aria-label={t.previous} className="p-2">
        <ChevronLeft size={28} aria-hidden="true" />
      </Link>
      <div className="text-center">
        <h1 className="font-display text-section font-bold first-letter:uppercase">
          {heading}
        </h1>
        {day !== today && (
          <Link href="/" className={`text-meta ${TEXT_LINK}`}>
            {t.backToToday}
          </Link>
        )}
      </div>
      <Link href={`/?day=${addDays(day, 1)}`} aria-label={t.next} className="p-2">
        <ChevronRight size={28} aria-hidden="true" />
      </Link>
    </nav>
  );
}
