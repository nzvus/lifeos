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
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readEntryWithDays } from "@/core/entries";
import { localParts, logicalDay } from "@/core/engines/time";
import { score, SESSION } from "@/core/engines/judgements";
import { learnTiming, sessionParts, sessionSeconds } from "@/core/engines/training";
import {
  adviseExercise,
  readExercises,
  readTrainingHistory,
  readCreatineLines,
  sessionContext,
} from "@/core/training";
import { Gym, type GymExercise } from "@/features/training/Gym";
import {
  contextText,
  lastTimeText,
  scoreText,
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
  const known = await ownerClock();
  const { clock } = known;
  // The session's day and the one before (the night, the 24 h: «Prima:») in one read.
  const [read, catalog] = await Promise.all([
    readEntryWithDays(db, owner, id, { before: 1, known }),
    readExercises(db, owner),
  ]);
  const session = read?.item;
  if (!session || session.kind.key !== "session") notFound();
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const ids = session.children.flatMap((c) => (c.item ? [c.item.id] : []));
  const today = logicalDay(new Date(), clock);
  const history = await readTrainingHistory(db, owner, ids, id, session.day);
  const timing = learnTiming(history.sessions);
  const readiness = Number(session.values["readiness"] ?? 0) || null;
  const tired = readiness !== null && readiness <= 2;
  const scored: Parameters<typeof sessionParts>[0][number][] = [];
  const exercises: GymExercise[] = session.children.map((c) => {
    const e = c.item ? byId.get(c.item.id) : undefined;
    const p = e?.pattern ?? null;
    const h = c.item ? (history.byExercise.get(c.item.id) ?? []) : [];
    const dumbbells = usesDumbbells(c.item?.name ?? "", e?.equipment ?? null);
    const a = adviseExercise({
      pattern: p,
      unilateral: e?.unilateral ?? false,
      dumbbells,
      history: h,
      timing,
      settings: { restS: e?.restS ?? undefined, setupS: e?.setupS ?? undefined },
    });
    // Readiness 1–2 (v1 ADR-0049): the same load, one set fewer.
    const proposed =
      tired && a.proposed.length > 1 ? a.proposed.slice(0, -1) : a.proposed;
    const last = h.at(-1);
    // This session's measured rests between working sets (not from one side to the other).
    const work = c.sets.filter((s) => !s.warmup);
    const rests = work.slice(1).flatMap((s, i) => {
      const prev = work[i]!;
      if (prev.side && s.side && prev.side !== s.side) return [];
      return prev.endedAt && s.startedAt
        ? [(s.startedAt.getTime() - prev.endedAt.getTime()) / 1000]
        : [];
    });
    scored.push({
      role: a.role,
      proposed,
      done: c.sets.map((s) => ({
        reps: s.reps,
        loadKg: s.loadKg,
        warmup: s.warmup,
        rir: s.rir,
      })),
      restS: a.afterPairS ?? a.restS,
      rests,
    });
    return {
      entryId: c.id,
      exerciseId: c.item?.id ?? null,
      name: c.item?.name ?? "Esercizio",
      pattern: p,
      unilateral: e?.unilateral ?? false,
      dumbbells,
      proposed,
      last: last ? lastTimeText(last.day, last.sets) : "",
      trend: trendText(a.trend),
      restS: a.afterPairS ?? a.restS,
      restWords:
        restSourceText(a.restSource, a.restChange) +
        (a.afterPairS !== null ? " · dopo i due lati" : ""),
      setS: a.setS,
      sideS: a.sideS,
      betweenS: a.betweenS,
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
  // The night and the 24 h need two days; creatine its own narrow read.
  const days = read!.days;
  const creatine = session.start ? await readCreatineLines(db, owner, session.day) : [];
  const before = session.start
    ? contextText(sessionContext(days, session.start, session.day, readiness, creatine))
    : "";
  const verdict =
    session.status === "done" ? scoreText(score(SESSION, sessionParts(scored))) : "";
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
        before,
        verdict,
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
