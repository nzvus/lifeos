/**
 * app/(app)/training/routines/page.tsx — URL /training/routines, Training →
 * Routines (ADR-0033): how each routine is going (runs, kg per run, change,
 * sparkline), then every routine with its items.
 */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { setsText } from "@/core/training/display";
import { listRoutines } from "@/core/training/repositories/routines";
import { listSessions } from "@/core/training/repositories/sessions";
import { routineProgress } from "@/core/training/progress";
import { todayIn } from "@/core/shared/dates";
import { TrendingUp } from "lucide-react";
import { RoutineProgressList } from "@/features/training/progress/RoutineProgressList";
import { TrainingNav } from "@/features/training/nav/TrainingNav";
import { Section } from "@/ui/Section";
import { fill } from "@/i18n";
import { ListItem } from "@/ui/ListItem";
import { PageHeader } from "@/ui/PageHeader";
import { TrashMenu } from "@/ui/TrashMenu";
import { deleteRoutineAction, restoreRoutineAction } from "../actions";
import { CARD } from "@/ui/Card";

export default async function RoutinesPage() {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const [routines, sessions] = await Promise.all([
    listRoutines(db, owner),
    listSessions(db, owner, "2000-01-01", todayIn(settings.timezone)),
  ]);
  const progress = routineProgress(routines, sessions).sort((a, b) =>
    (b.last?.day ?? "").localeCompare(a.last?.day ?? ""),
  );
  const r = t.routines;
  return (
    <>
      <PageHeader title={t.training.title} />
      <TrainingNav current="routines" t={t} />
      {progress.some((p) => p.last) && (
        <Section
          title={t.training.progress.routines}
          icon={<TrendingUp size={20} aria-hidden="true" />}
        >
          <RoutineProgressList
            routines={progress}
            locale={settings.locale}
            t={t.training.progress}
          />
        </Section>
      )}
      {routines.length === 0 ? (
        <p className="text-muted">{r.empty}</p>
      ) : (
        <div className={CARD}>
          <ul className="grid grid-cols-1 gap-x-8 @3xl:grid-cols-2">
            {routines.map((routine) => (
              <ListItem
                key={routine.id}
                href={`/training/routines/${routine.id}`}
                title={routine.name}
                action={
                  <TrashMenu
                    id={routine.id}
                    name={routine.name}
                    trash={deleteRoutineAction}
                    restore={restoreRoutineAction}
                    items={[
                      {
                        label: t.training.new,
                        href: `/training/new?routine=${routine.id}`,
                      },
                    ]}
                    labels={t.actions}
                  />
                }
                footer={fill(r.itemsCount, { n: String(routine.items.length) })}
              >
                <ul className="flex flex-col text-meta">
                  {routine.items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-3">
                      <span className="truncate">{it.name}</span>
                      <span className="shrink-0 font-display text-muted tabular-nums">
                        {setsText(
                          Array.from({ length: it.sets }, () => ({
                            reps: it.reps,
                            loadKg: it.loadKg,
                            durationS: it.durationS,
                          })),
                          settings.locale,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </ListItem>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
