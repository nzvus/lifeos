/**
 * app/(app)/profiles/page.tsx — URL /profiles, the "Targets" tab: how the
 * days went over a period (every nutrient, 7 / 30 / 90 days, scrollable back
 * in time), training over the same days (ADR-0005), and the day types that
 * define the targets (ADR-0008).
 *
 * The period is in the URL (?range=30&to=2026-09-30); without it (or when
 * invalid), the user's default period (preferences) up to today.
 */
import { CalendarRange, TrendingUp } from "lucide-react";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getHistory } from "@/core/nutrition/repositories/history";
import { listProfiles } from "@/core/nutrition/repositories/profiles";
import { daysEnding, isValidDay, todayIn } from "@/core/shared/dates";
import { ProfileList } from "@/features/nutrition/profiles/ProfileList";
import { TREND_RANGES, type TrendRange } from "@/core/nutrition/preferences";
import { RangeNav } from "@/features/nutrition/trends/RangeNav";
import { TrainingChart } from "@/features/training/progress/TrainingChart";
import { trainingByDay } from "@/core/training/analysis";
import { listMeasurements } from "@/core/training/repositories/measurements";
import { listSessions } from "@/core/training/repositories/sessions";
import { Trends } from "@/features/nutrition/trends/Trends";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";

type Props = { searchParams: Promise<{ range?: string; to?: string }> };

export default async function ProfilesPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const params = await searchParams;
  const today = todayIn(settings.timezone);
  // No period in the URL: the user's default (preferences).
  const range: TrendRange =
    TREND_RANGES.find((r) => String(r) === params.range) ??
    settings.preferences.trendsRange;
  const to = params.to && isValidDay(params.to) && params.to <= today ? params.to : today;
  const days = daysEnding(to, range);
  const db = getDb();
  const [profiles, history, sessions, measurements] = await Promise.all([
    listProfiles(db, owner),
    getHistory(db, owner, days[0]!, to),
    listSessions(db, owner, days[0]!, to),
    listMeasurements(db, owner),
  ]);
  return (
    <>
      <PageHeader
        title={t.profiles.title}
        action={{ href: "/profiles/new", label: t.profiles.newTitle }}
      />
      <Section title={t.trends.title} icon={<TrendingUp size={20} aria-hidden="true" />}>
        <RangeNav
          range={range}
          from={days[0]!}
          to={to}
          today={today}
          locale={settings.locale}
          t={t.trends}
        />
        <Trends
          history={history}
          today={today}
          timeZone={settings.timezone}
          autoTargets={settings.preferences.autoTargets}
          locale={settings.locale}
          beside={
            <TrainingChart
              days={trainingByDay(days, sessions, measurements)}
              locale={settings.locale}
              t={t.training}
            />
          }
          t={t}
        />
      </Section>
      <Section
        title={t.trends.dayTypes}
        icon={<CalendarRange size={20} aria-hidden="true" />}
      >
        <p className="text-muted">{t.profiles.intro}</p>
        <ProfileList profiles={profiles} locale={settings.locale} t={t} />
      </Section>
    </>
  );
}
