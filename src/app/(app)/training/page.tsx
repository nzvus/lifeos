/**
 * app/(app)/training/page.tsx — URL /training: start a session (empty or
 * from a routine at its latest version) and the sessions of the last 90 days, newest first.
 */
import { ClipboardList, Dumbbell, ListOrdered, Scale, Trash2 } from "lucide-react";
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, todayIn } from "@/core/shared/dates";
import { listMeasurements } from "@/core/training/repositories/measurements";
import { listSessions } from "@/core/training/repositories/sessions";
import { MeasurementForm } from "@/features/training/body/MeasurementForm";
import { PresetPicker } from "@/features/training/sessions/PresetPicker";
import { SessionList } from "@/features/training/sessions/SessionList";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import { formatNumber } from "@/core/shared/format";
import { addMeasurementAction, deleteMeasurementAction } from "./actions";
import { presetTiles } from "./preset-tiles";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";

export default async function TrainingPage() {
  const { owner, settings, t } = await requireContext();
  const today = todayIn(settings.timezone);
  const db = getDb();
  const [sessions, presets, measurements] = await Promise.all([
    listSessions(db, owner, addDays(today, -90), addDays(today, 30)),
    presetTiles(owner, today),
    listMeasurements(db, owner),
  ]);
  return (
    <>
      <PageHeader
        title={t.training.title}
        action={{ href: "/training/new", label: t.training.new }}
      />
      <nav className="flex flex-wrap gap-x-4 gap-y-1 text-meta">
        <Link
          href="/training/exercises"
          className="inline-flex items-center gap-1 underline"
        >
          <ListOrdered size={14} aria-hidden="true" />
          {t.exercises.title}
        </Link>
        <Link
          href="/training/routines"
          className="inline-flex items-center gap-1 underline"
        >
          <ClipboardList size={14} aria-hidden="true" />
          {t.routines.title}
        </Link>
      </nav>
      <Section
        title={t.training.startFrom}
        icon={<Dumbbell size={20} aria-hidden="true" />}
      >
        <PresetPicker presets={presets} t={t.training} />
      </Section>
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
      <Section title={t.body.title} icon={<Scale size={20} aria-hidden="true" />}>
        <p className="text-meta text-muted">{t.body.hint}</p>
        <MeasurementForm
          action={addMeasurementAction}
          today={today}
          count={measurements.length}
          t={{ body: t.body, errors: t.errors }}
        />
        {measurements.length === 0 ? (
          <p className="text-meta text-muted">{t.body.none}</p>
        ) : (
          <ul className="flex flex-col text-meta">
            {[...measurements]
              .reverse()
              .slice(0, 10)
              .map((m) => (
                <li
                  key={m.id}
                  className="item flex items-center justify-between gap-3 py-1"
                >
                  <span className="tabular-nums">
                    {`${m.day.slice(8, 10)}/${m.day.slice(5, 7)}/${m.day.slice(0, 4)} · `}
                    <span className="font-display font-semibold">{`${formatNumber(m.weightKg ?? "0", settings.locale, 1)} kg`}</span>
                    {m.bodyFatPct &&
                      ` · ${formatNumber(m.bodyFatPct, settings.locale, 1)} %`}
                    {m.waistCm && ` · ${formatNumber(m.waistCm, settings.locale, 0)} cm`}
                  </span>
                  <ActionButtonForm
                    action={deleteMeasurementAction.bind(null, m.id)}
                    label={t.body.delete}
                    icon={<Trash2 size={14} aria-hidden="true" />}
                    variant="quiet"
                    iconOnly
                  />
                </li>
              ))}
          </ul>
        )}
      </Section>
    </>
  );
}
