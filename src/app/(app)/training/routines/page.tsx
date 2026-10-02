/**
 * app/(app)/training/routines/page.tsx — URL /training/routines, Training →
 * Routines, the library (ADR-0035): every routine with its exercises, each
 * with its drawing and opening its page. How each routine is going is in
 * Progress → Training.
 */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { setsText } from "@/core/training/display";
import { regionOf } from "@/core/training/anatomy";
import { lookOf } from "@/core/training/calendar";
import Link from "next/link";
import { ExerciseIcon } from "@/ui/ExerciseIcon";
import { listRoutines } from "@/core/training/repositories/routines";
import { TrainingNav } from "@/features/training/nav/TrainingNav";
import { fill } from "@/i18n";
import { ListItem } from "@/ui/ListItem";
import { PageHeader } from "@/ui/PageHeader";
import { TrashMenu } from "@/ui/TrashMenu";
import { deleteRoutineAction, restoreRoutineAction } from "../actions";
import { CARD } from "@/ui/Card";

export default async function RoutinesPage() {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const routines = await listRoutines(db, owner);
  const r = t.routines;
  return (
    <>
      <PageHeader title={t.training.title} />
      <TrainingNav current="routines" t={t} />
      {routines.length === 0 ? (
        <p className="text-muted">{r.empty}</p>
      ) : (
        <div className={CARD}>
          <ul className="grid grid-cols-1 gap-x-8 @3xl:grid-cols-2">
            {routines.map((routine) => (
              <ListItem
                key={routine.id}
                leading={(() => {
                  // ADR-0035: the routine's colour and icon, as in Plan.
                  const look = lookOf(routine.items);
                  return (
                    <ExerciseIcon pattern={look.pattern} region={look.region} size={26} />
                  );
                })()}
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
                {/* Each exercise with its drawing, opening its page (guide,
                    numbers): above the row's own link (ListItem's z-1). */}
                <ul className="flex flex-col gap-0.5 text-meta">
                  {routine.items.map((it) => (
                    <li key={it.id}>
                      <Link
                        href={`/training/exercises/${it.exerciseId}`}
                        className="relative z-2 flex items-center gap-2 rounded-control py-1 hover:bg-paper"
                      >
                        <ExerciseIcon
                          pattern={it.pattern}
                          region={regionOf(it.muscleGroups)}
                          size={20}
                        />
                        <span className="min-w-0 flex-1 truncate">{it.name}</span>
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
                      </Link>
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
