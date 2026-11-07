/**
 * A scheda's forms (PAT-04, PAT-62; change 2026-11-07-exercise-scheda): `/corpo/scheda/nuovo`
 * («Parti da…» with `?da=<scheda>`) and `/corpo/scheda/<id>/componi`, both the kit `Composer`
 * without quantities over his exercises.
 */
import { notFound } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { localParts, logicalDay } from "@/core/engines/time";
import { readExercises, readRoutines } from "@/core/training";
import { RoutineComposer } from "@/features/training/RoutineComposer";
import { training } from "@/i18n/training";
import type { NewFormRender } from "./new-forms";
import { saveRoutine } from "./routine-actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function context() {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const now = new Date();
  const exercises = await readExercises(db, owner);
  const routines = await readRoutines(db, owner, logicalDay(now, clock), exercises);
  return {
    hour: Math.floor(localParts(now, clock.timeZone).minute / 60),
    routines,
    items: exercises.map((x) => ({ id: x.id, name: x.name })),
  };
}

export const newRoutine: NewFormRender = async (back, q) => {
  const c = await context();
  const from =
    q["da"] && UUID.test(q["da"]) ? c.routines.find((r) => r.id === q["da"]) : undefined;
  return (
    <RoutineComposer
      title={training.routine.newTitle}
      back={from ? { label: from.name, href: "/corpo/scheda/" + from.id } : back}
      exercises={c.items}
      initial={{ name: "", order: from ? from.exercises.map((e) => e.exerciseId) : [] }}
      hour={c.hour}
      action={saveRoutine.bind(null, from ? { from: from.id } : {})}
    />
  );
};

export const composeRoutine = async (id: string) => {
  const c = await context();
  const r = c.routines.find((x) => x.id === id);
  if (!r) notFound();
  return (
    <RoutineComposer
      title={r.name}
      back={{ label: r.name, href: "/corpo/scheda/" + r.id }}
      exercises={c.items}
      initial={{ name: r.name, order: r.exercises.map((e) => e.exerciseId) }}
      hour={c.hour}
      action={saveRoutine.bind(null, { id: r.id })}
    />
  );
};
