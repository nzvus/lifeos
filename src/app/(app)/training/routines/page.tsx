/** app/(app)/training/routines/page.tsx — URL /training/routines: my routines. */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { setsText } from "@/core/training/display";
import { listRoutines } from "@/core/training/repositories/routines";
import { fill } from "@/i18n";
import { ListItem } from "@/ui/ListItem";
import { PageHeader } from "@/ui/PageHeader";
import { TrashMenu } from "@/ui/TrashMenu";
import { deleteRoutineAction, restoreRoutineAction } from "../actions";
import { CARD } from "@/ui/Card";

export default async function RoutinesPage() {
  const { owner, settings, t } = await requireContext();
  const routines = await listRoutines(getDb(), owner);
  const r = t.routines;
  return (
    <>
      <PageHeader
        title={r.title}
        back={{ href: "/training", label: t.training.back }}
        action={{ href: "/training/routines/new", label: r.new }}
      />
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
