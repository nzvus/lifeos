/** app/(app)/training/exercises/page.tsx — URL /training/exercises: my exercises with their records. */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { records } from "@/core/training/analysis";
import {
  isMovementPattern,
  isMuscleGroup,
  MUSCLE_GROUP_REGION,
  regionOf,
} from "@/core/training/anatomy";
import { formatNumber } from "@/core/shared/format";
import { listExercises } from "@/core/training/repositories/exercises";
import { listSessions } from "@/core/training/repositories/sessions";
import { fill } from "@/i18n";
import { ExerciseIcon } from "@/ui/ExerciseIcon";
import { ListItem } from "@/ui/ListItem";
import { MuscleChips } from "@/ui/MuscleChip";
import { PageHeader } from "@/ui/PageHeader";
import { TrashMenu } from "@/ui/TrashMenu";
import { deleteExerciseAction, restoreExerciseAction } from "../actions";
import { CARD } from "@/ui/Card";

export default async function ExercisesPage() {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const [exercises, sessions] = await Promise.all([
    listExercises(db, owner),
    listSessions(db, owner, "2000-01-01", "2999-12-31"),
  ]);
  const done = sessions.filter((s) => s.status === "done");
  const rec = records(done);
  const count = new Map<string, number>();
  for (const s of done)
    for (const e of s.exercises)
      count.set(e.exerciseId, (count.get(e.exerciseId) ?? 0) + 1);
  const n = (v: number) => formatNumber(String(v), settings.locale, 1);
  const date = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  const x = t.exercises;
  return (
    <>
      <PageHeader
        title={x.title}
        back={{ href: "/training", label: t.training.back }}
        action={{ href: "/training/exercises/new", label: x.new }}
      />
      {exercises.length === 0 ? (
        <p className="text-muted">{x.empty}</p>
      ) : (
        <div className={CARD}>
          <ul className="grid grid-cols-1 gap-x-8 @3xl:grid-cols-2">
            {exercises.map((e) => {
              const r = rec.get(e.id);
              return (
                <ListItem
                  key={e.id}
                  leading={
                    <span className="inline-flex">
                      <ExerciseIcon
                        pattern={e.pattern}
                        region={regionOf(e.muscleGroups)}
                        size={24}
                      />
                    </span>
                  }
                  href={`/training/exercises/${e.id}`}
                  title={e.name}
                  action={
                    <TrashMenu
                      id={e.id}
                      name={e.name}
                      trash={deleteExerciseAction}
                      restore={restoreExerciseAction}
                      items={[
                        { label: t.training.new, href: `/training/new?exercise=${e.id}` },
                      ]}
                      labels={t.actions}
                    />
                  }
                  footer={[
                    // In the footer, not aside: aside never wraps, and a long
                    // pattern name pushed into the title (design review).
                    e.pattern && isMovementPattern(e.pattern)
                      ? x.patterns[e.pattern]
                      : t.training.kinds[e.kind],
                    count.get(e.id)
                      ? fill(x.sessions, { n: String(count.get(e.id)) })
                      : x.never,
                  ].join(" · ")}
                >
                  <MuscleChips
                    groups={e.muscleGroups.filter(isMuscleGroup).map((g) => ({
                      label: x.groups[g],
                      region: MUSCLE_GROUP_REGION[g],
                    }))}
                  />
                  {r && (r.maxLoad || r.bestE1rm) && (
                    <p className="text-meta text-muted tabular-nums">
                      {[
                        r.maxLoad &&
                          fill(x.maxLoad, {
                            kg: n(r.maxLoad.kg),
                            day: date(r.maxLoad.day),
                          }),
                        r.bestE1rm &&
                          fill(x.bestE1rm, {
                            kg: n(r.bestE1rm.kg),
                            day: date(r.bestE1rm.day),
                          }),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </ListItem>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
