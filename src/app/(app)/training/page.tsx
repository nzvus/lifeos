/**
 * app/(app)/training/page.tsx — URL /training: start a session (empty or
 * from a routine) and the sessions of the last 90 days, newest first.
 */
import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, todayIn } from "@/core/shared/dates";
import { listMeasurements } from "@/core/training/repositories/measurements";
import { listRoutines } from "@/core/training/repositories/routines";
import { listSessions } from "@/core/training/repositories/sessions";
import { SessionList } from "@/features/training/sessions/SessionList";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";

export default async function TrainingPage() {
  const { owner, settings, t } = await requireContext();
  const today = todayIn(settings.timezone);
  const db = getDb();
  const [sessions, routines, measurements] = await Promise.all([
    listSessions(db, owner, addDays(today, -90), addDays(today, 30)),
    listRoutines(db, owner),
    listMeasurements(db, owner),
  ]);
  return (
    <>
      <PageHeader
        title={t.training.title}
        action={{ href: "/training/new", label: t.training.new }}
      />
      {routines.length > 0 && (
        <Section
          title={t.training.startFrom}
          icon={<Dumbbell size={20} aria-hidden="true" />}
        >
          <ul className="flex flex-wrap gap-2">
            {routines.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/training/new?routine=${r.id}`}
                  className="tile inline-flex items-center gap-1.5 px-3 py-1.5 font-display text-item font-semibold hover:border-ink"
                >
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title={t.training.recent}>
        {sessions.length === 0 ? (
          <p className="text-muted">{t.training.empty}</p>
        ) : (
          <SessionList
            sessions={[...sessions].reverse()}
            measurements={measurements}
            showDay
            locale={settings.locale}
            t={t.training}
          />
        )}
      </Section>
    </>
  );
}
