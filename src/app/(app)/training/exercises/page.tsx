/** app/(app)/training/exercises/page.tsx — URL /training/exercises: my exercises with their records. */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { records } from "@/core/training/analysis";
import { formatNumber } from "@/core/shared/format";
import { listExercises } from "@/core/training/repositories/exercises";
import { listSessions } from "@/core/training/repositories/sessions";
import { fill } from "@/i18n";
import { ListItem } from "@/ui/ListItem";
import { PageHeader } from "@/ui/PageHeader";

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
        <ul className="grid gap-x-8 md:grid-cols-2">
          {exercises.map((e) => {
            const r = rec.get(e.id);
            return (
              <ListItem
                key={e.id}
                title={
                  <Link
                    href={`/training/exercises/${e.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {e.name}
                  </Link>
                }
                aside={t.training.kinds[e.kind]}
                footer={[
                  count.get(e.id)
                    ? fill(x.sessions, { n: String(count.get(e.id)) })
                    : x.never,
                  e.muscleGroups.join(", ") || null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              >
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
      )}
    </>
  );
}
