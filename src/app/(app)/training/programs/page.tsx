/**
 * app/(app)/training/programs/page.tsx — URL /training/programs: my training
 * programs (ADR-0024). The days they lay out, changeable one at a time
 * (ADR-0029), are in the Plan tab (ADR-0035).
 */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { lookOf, type Look } from "@/core/training/calendar";
import { listExercises } from "@/core/training/repositories/exercises";
import { listPrograms } from "@/core/training/repositories/programs";
import { listRoutines } from "@/core/training/repositories/routines";
import { PlanChip } from "@/ui/PlanChip";

const NONE: Look = { region: null, pattern: null, cardio: false };
import { fill } from "@/i18n";
import { TEXT_LINK } from "@/ui/button";
import { Badge } from "@/ui/Badge";
import { CARD } from "@/ui/Card";
import { ListItem } from "@/ui/ListItem";
import { PageHeader } from "@/ui/PageHeader";
import { TrainingNav } from "@/features/training/nav/TrainingNav";
import { TrashMenu } from "@/ui/TrashMenu";
import { deleteProgramAction, restoreProgramAction } from "./actions";

const INTL = { it: "it-IT", en: "en-GB" } as const;

export default async function ProgramsPage() {
  const { owner, settings, t } = await requireContext();
  const p = t.programs;
  const db = getDb();
  const [programs, routines, exercises] = await Promise.all([
    listPrograms(db, owner),
    listRoutines(db, owner),
    listExercises(db, owner),
  ]);
  const looks = new Map<string, Look>([
    ...routines.map((r) => [r.id, lookOf(r.items)] as const),
    ...exercises.map((e) => [e.id, lookOf([{ ...e, sets: 1 }])] as const),
  ]);
  const date = new Intl.DateTimeFormat(INTL[settings.locale], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t.training.title} />
      <TrainingNav current="programs" t={t} />
      <p className="text-meta text-muted">{p.subtitle}</p>
      {/* ADR-0035: the coming days live in the Plan tab, as a calendar. */}
      <Link href="/plan" className={`self-start text-meta ${TEXT_LINK}`}>
        {p.seePlan}
      </Link>
      {programs.length === 0 ? (
        <p className={`${CARD} text-muted`}>{p.empty}</p>
      ) : (
        <div className={CARD}>
          <ul className="grid grid-cols-1 gap-x-8 @3xl:grid-cols-2">
            {programs.map((x) => (
              <ListItem
                key={x.id}
                href={`/training/programs/${x.id}`}
                title={x.name}
                aside={x.active ? <Badge tone="done">{p.activeBadge}</Badge> : undefined}
                action={
                  <TrashMenu
                    id={x.id}
                    name={x.name}
                    trash={deleteProgramAction}
                    restore={restoreProgramAction}
                    labels={t.actions}
                  />
                }
                footer={fill(p.since, {
                  day: date.format(new Date(`${x.startDay}T12:00:00Z`)),
                })}
              >
                {/* The cycle in order, each item in its colour (ADR-0035). */}
                <ol className="flex flex-wrap items-center gap-1 text-meta">
                  {x.slots.map((sl) => (
                    <li key={sl.position} className="inline-flex flex-wrap gap-1">
                      {sl.items.length === 0 ? (
                        <PlanChip look={NONE} state="rest" label={sl.label || p.rest} />
                      ) : (
                        sl.items.map((it) => (
                          <PlanChip
                            key={`${it.routineId ?? ""}${it.exerciseId ?? ""}`}
                            look={
                              (it.routineId
                                ? looks.get(it.routineId)
                                : looks.get(it.exerciseId ?? "")) ?? NONE
                            }
                            state="done"
                            label={it.name}
                          />
                        ))
                      )}
                    </li>
                  ))}
                </ol>
              </ListItem>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
