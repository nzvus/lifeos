/**
 * app/(app)/mind/page.tsx — URL /mind, the Mind area (ADR-0038): today's
 * check-in (mood, energy, stress, a line of diary), the last 30 days'
 * averages and the days one per row — three small bars and the note.
 */
import { Brain, CalendarDays } from "lucide-react";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listCheckins } from "@/core/mind/repositories/checkins";
import { mindSummary } from "@/core/mind/summary";
import { addDays, todayIn } from "@/core/shared/dates";
import { formatNumber } from "@/core/shared/format";
import { CheckinForm } from "@/features/mind/CheckinForm";
import { MindDays } from "@/features/mind/MindDays";
import { fill } from "@/i18n";
import { InfoTip } from "@/ui/InfoTip";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import { StatTiles } from "@/ui/StatTiles";
import { saveCheckinAction } from "./actions";

const INTL = { it: "it-IT", en: "en-GB" } as const;
const PERIOD = 30;

export default async function MindPage() {
  const { owner, settings, t } = await requireContext();
  const m = t.mind;
  const today = todayIn(settings.timezone);
  const list = await listCheckins(getDb(), owner, addDays(today, -(PERIOD - 1)), today);
  const now = list.find((c) => c.day === today) ?? null;
  const s = mindSummary(list);
  const n = (v: number | null) =>
    v === null ? "—" : formatNumber(String(v), settings.locale, 1);
  const date = new Intl.DateTimeFormat(INTL[settings.locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={m.title} quiet />
      <Section
        title={m.checkin}
        icon={<Brain size={20} aria-hidden="true" />}
        aside={<InfoTip label={m.infoLabel}>{m.info}</InfoTip>}
      >
        <CheckinForm
          day={today}
          initial={{
            mood: now?.mood ?? null,
            energy: now?.energy ?? null,
            stress: now?.stress ?? null,
            note: now?.note ?? "",
          }}
          action={saveCheckinAction}
          t={{ ...m, saved: t.settings.saved, saving: t.actions.saving }}
        />
      </Section>
      <Section
        title={fill(m.period, { n: String(PERIOD) })}
        icon={<CalendarDays size={20} aria-hidden="true" />}
      >
        <StatTiles
          stats={[
            { label: m.avgMood, value: n(s.mood) },
            { label: m.avgEnergy, value: n(s.energy) },
            { label: m.avgStress, value: n(s.stress) },
            { label: m.days, value: String(s.days) },
          ]}
        />
        {list.length === 0 ? (
          <p className="text-meta text-muted">{m.none}</p>
        ) : (
          <MindDays
            days={[...list].reverse().map((c) => ({
              ...c,
              label: date.format(new Date(`${c.day}T12:00:00Z`)),
            }))}
            t={m}
          />
        )}
      </Section>
    </div>
  );
}
