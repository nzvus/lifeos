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
import {
  DEFAULT_RAMP,
  dumbbellStep,
  learnRamp,
  learnTiming,
  loadStep,
  missingVolume,
  opensGroup,
  REST_FLOOR,
  sessionParts,
  sessionSeconds,
  warmupSets,
  weeklySets,
} from "@/core/engines/training";
import {
  adviseExercise,
  readExercises,
  readTrainingHistory,
  readWeekWork,
  readRoutines,
  readCreatineLines,
  sessionContext,
} from "@/core/training";
import { Gym, type GymExercise } from "@/features/training/Gym";
import {
  contextPills,
  contextText,
  bestE1rm,
  lastTimeText,
  MUSCLE_WORDS,
  muscleSplit,
  sessionBox,
  restSourceText,
  trendText,
  usesDumbbells,
} from "@/features/training/present";
import {
  addGymExercise,
  exerciseSettingsGym,
  finishGym,
  reopenGym,
  skipGymExercise,
  saveRoutineGym,
  removeGym,
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
  const [history, week, routines] = await Promise.all([
    readTrainingHistory(db, owner, ids, id, session.day),
    readWeekWork(db, owner, session.day),
    session.item ? readRoutines(db, owner, session.day, catalog) : Promise.resolve([]),
  ]);
  // «Salva nella routine» only when today's exercises or order differ from it.
  const own = routines.find((r) => r.id === session.item?.id);
  const routine =
    own && own.exercises.map((e) => e.exerciseId).join() !== ids.join()
      ? { name: own.name }
      : null;
  // «Cosa aggiungere» (session.md §5.4): muscles under 10 weekly sets, with an exercise of theirs.
  const usedThisMonth = week.flatMap((w) => {
    const e = byId.get(w.exerciseId);
    return e ? [e] : [];
  });
  const toAdd = missingVolume(
    weeklySets(
      week.flatMap((w) =>
        Array.from({ length: w.sets }, () => ({ exercise: w.exerciseId })),
      ),
      new Map(
        usedThisMonth.map((e) => [
          e.id,
          { direct: e.muscles.slice(0, 1), indirect: e.muscles.slice(1) },
        ]),
      ),
    ),
    usedThisMonth,
  ).map(
    (x) =>
      (MUSCLE_WORDS[x.muscle] ?? x.muscle) +
      ": " +
      F.plural(x.sets, "serie", "serie") +
      " in 7 giorni · " +
      x.exercise.name,
  );
  const timing = learnTiming(history.sessions);
  const readiness = Number(session.values["readiness"] ?? 0) || null;
  const tired = readiness !== null && readiness <= 2;
  const scored: Parameters<typeof sessionParts>[0][number][] = [];
  // The person's own warm-up ramp from these exercises' past sessions, else the default.
  const ramp =
    learnRamp([...history.byExercise.values()].flat().map((h) => h.sets)) ?? DEFAULT_RAMP;
  // Muscles already trained today (sets done): which groups are open, the heaviest loads.
  const musclesOf = (itemId: string | undefined) =>
    (itemId ? byId.get(itemId)?.muscles : undefined) ?? [];
  const startedGroups = session.children.filter((c) => c.sets.some((s) => !s.warmup));
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
    // Warm-ups (session.md §5.1): only before the first work set of this exercise.
    const muscles = musclesOf(c.item?.id);
    const others = startedGroups.filter((o) => o.id !== c.id);
    const workKg = proposed[0]?.loadKg != null ? Number(proposed[0].loadKg) : null;
    const heaviest = others
      .filter((o) => musclesOf(o.item?.id).some((m) => muscles.includes(m)))
      .flatMap((o) => o.sets.filter((t) => !t.warmup).map((t) => Number(t.loadKg ?? 0)));
    const warmups = c.sets.some((t) => !t.warmup)
      ? []
      : warmupSets({
          workKg,
          step: workKg === null ? 1 : dumbbells ? dumbbellStep(workKg) : loadStep(workKg),
          ramp,
          opens: opensGroup(
            muscles[0] ?? null,
            new Set(others.map((o) => musclesOf(o.item?.id)[0] ?? "")),
          ),
          heaviestToday: heaviest.length ? Math.max(...heaviest) : null,
        }).map((w) => ({ reps: w.reps, loadKg: String(w.loadKg) }));
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
      of: {
        ...(p ? { pattern: p } : {}),
        ...(e?.equipment ? { equipment: e.equipment } : {}),
      },
      unilateral: e?.unilateral ?? false,
      dumbbells,
      proposed,
      skipped: c.status === "skipped",
      warmups,
      last: last ? lastTimeText(last.day, last.sets) : "",
      lastE1rm: last ? bestE1rm(last.sets) : null,
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
      done: c.sets.map((s, k) => {
        // The rest before it: from the previous set's end to its start, when both were timed.
        const prev = c.sets[k - 1];
        const rest =
          prev?.endedAt && s.startedAt
            ? Math.round((s.startedAt.getTime() - prev.endedAt.getTime()) / 1000)
            : null;
        return {
          position: s.position,
          reps: s.reps,
          loadKg: s.loadKg,
          rir: s.rir,
          durationS: s.durationS,
          warmup: s.warmup,
          loadEntry: s.loadEntry,
          assumed: !s.done,
          restBeforeS: rest !== null && rest >= 0 && rest < 1800 ? rest : null,
          endedAt: s.endedAt?.getTime() ?? null,
        };
      }),
    };
  });
  // The night and the 24 h need two days; creatine its own narrow read.
  const days = read!.days;
  const creatine = session.start ? await readCreatineLines(db, owner, session.day) : [];
  const context = session.start
    ? sessionContext(days, session.start, session.day, readiness, creatine)
    : null;
  // Finished: one line under the session; in progress: pills under the exercise (the board).
  const before = context && session.status === "done" ? contextText(context) : "";
  const beforePills = context && session.status !== "done" ? contextPills(context) : [];
  // The session so far (the board): its score on what is done — the exercise
  // in progress counts only the sets reached — and where its sets went.
  const finished = session.status === "done";
  const touched = scored.filter((x) => x.done.some((d) => !d.warmup));
  const soFar = finished
    ? scored
    : touched.map((x, i) =>
        i === touched.length - 1
          ? {
              ...x,
              proposed: x.proposed.slice(
                0,
                Math.max(1, x.done.filter((d) => !d.warmup).length),
              ),
            }
          : x,
      );
  const split = muscleSplit(
    session.children.map((c) => ({
      muscles: (c.item ? byId.get(c.item.id)?.muscles : undefined) ?? [],
      sets: c.sets.filter((s) => !s.warmup).length,
    })),
  );
  // A finished session: its logged minutes; in progress: since it began.
  const logged = Number(session.values["durationMin"] ?? NaN);
  const elapsed =
    finished && Number.isFinite(logged)
      ? Math.round(logged)
      : session.start
        ? Math.round(
            ((finished && session.end ? session.end : new Date()).getTime() -
              session.start.getTime()) /
              60_000,
          )
        : null;
  const box =
    touched.length > 0
      ? sessionBox(
          score(SESSION, sessionParts(soFar), known.weights["session"]),
          elapsed,
          split,
          finished,
        )
      : null;
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
        title: (session.item?.name ?? "Allenamento") + (started ? " · " + started : ""),
        context:
          (session.day === today ? "" : F.Day(session.day) + " · ") +
          (done
            ? "finito" +
              (typeof minutes === "string" ? " · " + F.hm(Number(minutes)) : "")
            : started
              ? ""
              : "da iniziare"),
        startedAt: session.start?.getTime() ?? null,
        done,
        readiness,
        leftMin: done ? null : Math.round(leftS / 60),
        // The person's rest after a warm-up set (59 s in the export of 29 Oct), at least the floor.
        warmupRestS: Math.round(
          Math.min(120, Math.max(REST_FLOOR.warmup, timing.warmupRestS)),
        ),
        transitionS: Math.round(timing.transitionS),
        before,
        beforePills,
        box,
        dayHref: session.day === today ? "/oggi" : "/oggi/" + session.day,
        toAdd,
        routine,
      }}
      exercises={exercises}
      catalog={catalog.map((e) => ({ id: e.id, name: e.name }))}
      actions={{
        tick: tickSet,
        untick: untickSet,
        add: addGymExercise,
        finish: finishGym,
        reopen: reopenGym,
        skip: skipGymExercise,
        saveRoutine: saveRoutineGym,
        remove: removeGym.bind(null, session.day),
        readiness: readinessGym,
        settings: exerciseSettingsGym,
      }}
    />
  );
}
