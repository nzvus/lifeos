/** app/(app)/training/routines/page.tsx — URL /training/routines: my routines. */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { setsText } from "@/core/training/display";
import { listRoutines } from "@/core/training/repositories/routines";
import { fill } from "@/i18n";
import { ListItem } from "@/ui/ListItem";
import { PageHeader } from "@/ui/PageHeader";

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
        <ul className="grid gap-x-8 md:grid-cols-2">
          {routines.map((routine) => (
            <ListItem
              key={routine.id}
              title={
                <Link
                  href={`/training/routines/${routine.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {routine.name}
                </Link>
              }
              aside={
                <Link href={`/training/new?routine=${routine.id}`} className="underline">
                  {t.training.new}
                </Link>
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
      )}
    </>
  );
}
