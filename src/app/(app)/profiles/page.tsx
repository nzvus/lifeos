/**
 * app/(app)/profiles/page.tsx — URL /profiles, the "Targets" tab: how the
 * days went over a period (every nutrient, 7 / 30 / 90 days, scrollable back
 * in time) and the day types that define the targets (ADR-0008).
 *
 * The period is in the URL (?range=30&to=2026-09-30); anything invalid falls
 * back to the last 7 days up to today.
 */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getHistory } from "@/core/nutrition/repositories/history";
import { listProfiles } from "@/core/nutrition/repositories/profiles";
import { daysEnding, isValidDay, todayIn } from "@/core/shared/dates";
import { ProfileList } from "@/features/nutrition/profiles/ProfileList";
import { RangeNav, RANGES, type Range } from "@/features/nutrition/trends/RangeNav";
import { Trends } from "@/features/nutrition/trends/Trends";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";

type Props = { searchParams: Promise<{ range?: string; to?: string }> };

export default async function ProfilesPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const params = await searchParams;
  const today = todayIn(settings.timezone);
  const range: Range = RANGES.find((r) => String(r) === params.range) ?? 7;
  const to = params.to && isValidDay(params.to) && params.to <= today ? params.to : today;
  const days = daysEnding(to, range);
  const db = getDb();
  const [profiles, history] = await Promise.all([
    listProfiles(db, owner),
    getHistory(db, owner, days[0]!, to),
  ]);
  return (
    <>
      <PageHeader
        title={t.profiles.title}
        action={{ href: "/profiles/new", label: t.profiles.newTitle }}
      />
      <Section title={t.trends.title}>
        <RangeNav
          range={range}
          from={days[0]!}
          to={to}
          today={today}
          locale={settings.locale}
          t={t.trends}
        />
        <Trends history={history} locale={settings.locale} t={t} />
      </Section>
      <Section title={t.trends.dayTypes}>
        <p className="text-muted">{t.profiles.intro}</p>
        <ProfileList profiles={profiles} locale={settings.locale} t={t} />
      </Section>
    </>
  );
}
