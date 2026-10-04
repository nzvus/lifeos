/**
 * app/(app)/day-supplements.tsx — the day page's compounds card (ADR-0039):
 * loads the last 90 days' doses (creatine's stores remember), then
 * core/supplements/day.ts. Shown only when something was taken in the last
 * 30 days. Split out of page.tsx (800-line limit).
 */
import type { Owner } from "@/core/identity/owner";
import { addDays, instantFor, timeIn } from "@/core/shared/dates";
import type { Locale } from "@/core/shared/locales";
import { supplementsDay } from "@/core/supplements/day";
import { dosesBetween } from "@/core/supplements/repositories/doses";
import { SupplementsCard } from "@/features/supplements/SupplementsCard";
import type { Messages } from "@/i18n";
import { getDb } from "@/app/_server/runtime";

export async function DaySupplements({
  owner,
  day,
  today,
  timeZone,
  lastBed,
  locale,
  t,
}: {
  owner: Owner;
  day: string;
  today: string;
  timeZone: string;
  /** The last night's bedtime, its clock time used for tonight; else 23:00. */
  lastBed: Date | null;
  locale: Locale;
  t: Messages["supplements"];
}) {
  const doses = await dosesBetween(getDb(), owner, addDays(day, -89), day);
  const bed = instantFor(day, lastBed ? timeIn(lastBed, timeZone) : "23:00", timeZone);
  const s = supplementsDay({
    doses,
    day,
    now: (day === today ? new Date() : instantFor(day, "23:59", timeZone)).getTime(),
    bedtime: bed.getTime(),
  });
  if (!s.any) return null;
  return <SupplementsCard s={s} locale={locale} t={t} />;
}
