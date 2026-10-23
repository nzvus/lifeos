/**
 * Gym mode for one session (`/palestra/<id>`, V-05): the server reads the
 * session with its exercises and sets, each exercise's history of 120 days
 * and the person's timing, and E6's advice (dossiers/training.md §5): the
 * proposed sets with the learnt drop, the rest and where it comes from, the
 * trend, the timers; a readiness of 1–2 takes one set off each exercise.
 * The client trains and ticks.
 */
import { notFound } from "next/navigation";
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readClock } from "@/core/day";
import { readEntry } from "@/core/entries";
import { localParts, logicalDay } from "@/core/engines/time";
import { learnTiming, sessionSeconds } from "@/core/engines/training";
import { adviseExercise, readExercises, readTrainingHistory } from "@/core/training";
import { Gym, type GymExercise } from "@/features/training/Gym";
import {
  lastTimeText,
  restSourceText,
  trendText,
  usesDumbbells,
} from "@/features/training/present";
import {
  addGymExercise,
  exerciseSettingsGym,
  finishGym,
  readinessGym,
  tickSet,
  untickSet,
} from "../actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function GymPage({ params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  const db = await getDb();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const session = await readEntry(db, owner, id);
  if (!session || session.kind.key !== "session") notFound();
  const [{ clock }, catalog] = await Promise.all([
    readClock(db, owner),
    readExercises(db, owner),
  ]);
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const ids = session.children.flatMap((c) => (c.item ? [c.item.id] : []));
  const today = logicalDay(new Date(), clock);
  const history = await readTrainingHistory(db, owner, ids, id, today);
  const timing = learnTiming(history.sessions);
  const readiness = Number(session.values["readiness"] ?? 0) || null;
  const tired = readiness !== null && readiness <= 2;
  const exercises: GymExercise[] = session.children.map((c) => {
    const e = c.item ? byId.get(c.item.id) : undefined;
    const p = e?.pattern ?? null;
    const h = c.item ? (history.byExercise.get(c.item.id) ?? []) : [];
    const a = adviseExercise({
      pattern: p,
      unilateral: e?.unilateral ?? false,
      history: h,
      timing,
      settings: { restS: e?.restS ?? undefined, setupS: e?.setupS ?? undefined },
    });
    // Readiness 1–2 (v1 ADR-0049): the same load, one set fewer.
    const proposed =
      tired && a.proposed.length > 1 ? a.proposed.slice(0, -1) : a.proposed;
    const last = h.at(-1);
    return {
      entryId: c.id,
      exerciseId: c.item?.id ?? null,
      name: c.item?.name ?? "Esercizio",
      pattern: p,
      unilateral: e?.unilateral ?? false,
      dumbbells: usesDumbbells(c.item?.name ?? "", e?.equipment ?? null),
      proposed,
      last: last ? lastTimeText(last.day, last.sets) : "",
      trend: trendText(a.trend),
      restS: a.afterPairS ?? a.restS,
      restWords:
        restSourceText(a.restSource, a.restChange) +
        (a.afterPairS !== null ? " · dopo i due lati" : ""),
      setS: a.setS,
      setupS: a.setupS,
      settings: { restS: e?.restS ?? null, setupS: e?.setupS ?? null },
      done: c.sets.map((s) => ({
        position: s.position,
        reps: s.reps,
        loadKg: s.loadKg,
        rir: s.rir,
        durationS: s.durationS,
        warmup: s.warmup,
        loadEntry: s.loadEntry,
        assumed: !s.done,
      })),
    };
  });
  // What is left, in minutes: the sets not done yet with the person's timing.
  const leftS = sessionSeconds(
    exercises.map((x) => ({
      sets: x.proposed
        .slice(x.done.filter((d) => !d.warmup).length)
        .map((s) => ({ reps: s.reps, durationS: s.durationS, warmup: false })),
      restS: x.restS,
    })),
    timing,
  );
  const started = session.start
    ? F.time(localParts(session.start, clock.timeZone).minute)
    : null;
  const done = session.status === "done";
  const minutes = session.values["durationMin"];
  return (
    <Gym
      session={{
        id,
        title: session.item?.name ?? "Allenamento",
        context:
          (session.day === today ? "" : F.Day(session.day) + " · ") +
          (done
            ? "finito" +
              (typeof minutes === "string" ? " · " + F.hm(Number(minutes)) : "")
            : started
              ? "iniziato alle " + started
              : "da iniziare"),
        startedAt: session.start?.getTime() ?? null,
        done,
        readiness,
        leftMin: done ? null : Math.round(leftS / 60),
        warmupRestS: Math.round(Math.min(60, Math.max(30, timing.warmupRestS))),
        transitionS: Math.round(timing.transitionS),
        dayHref: session.day === today ? "/oggi" : "/oggi/" + session.day,
      }}
      exercises={exercises}
      catalog={catalog.map((e) => ({ id: e.id, name: e.name }))}
      actions={{
        tick: tickSet,
        untick: untickSet,
        add: addGymExercise,
        finish: finishGym,
        readiness: readinessGym,
        settings: exerciseSettingsGym,
      }}
    />
  );
}
