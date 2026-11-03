/**
 * features/training/session-score.ts — one session's score (E7 «Training
 * session»: progression, volume, effort, rests) built the same way for the
 * gym and for the session's box on Oggi and Corpo (ledger TRAIN-36: «la
 * palestra non sembra averne»). An exercise is scored against what E6
 * proposed for it from the sessions before (`adviseExercise`), one set
 * fewer on a tired day, with the rests measured between its working sets.
 */
import type { Db } from "@/core/db/db";
import type { DayItem } from "@/core/day";
import { score, SESSION, type Score } from "@/core/engines/judgements";
import { learnTiming, sessionParts, type ScoredExercise } from "@/core/engines/training";
import type { Owner } from "@/core/identity/owner";
import type { WeightBook } from "@/core/account/weights";
import { adviseExercise, readExercises, readTrainingHistory } from "@/core/training";
import { sessionBox, usesDumbbells } from "./present";

type Advice = ReturnType<typeof adviseExercise>;

/** One exercise of the session as the score reads it, and the sets proposed for it. */
export function scoredExercise(
  c: DayItem,
  a: Advice,
  tired: boolean,
): { proposed: Advice["proposed"]; scored: ScoredExercise } {
  // Readiness 1–2 (v1 ADR-0049): the same load, one set fewer.
  const proposed = tired && a.proposed.length > 1 ? a.proposed.slice(0, -1) : a.proposed;
  // This session's measured rests between working sets (not from one side to the other).
  const work = c.sets.filter((s) => !s.warmup);
  const rests = work.slice(1).flatMap((s, i) => {
    const prev = work[i]!;
    if (prev.side && s.side && prev.side !== s.side) return [];
    return prev.endedAt && s.startedAt
      ? [(s.startedAt.getTime() - prev.endedAt.getTime()) / 1000]
      : [];
  });
  return {
    proposed,
    scored: {
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
    },
  };
}

/**
 * The scores of a day's finished sessions with sets, as their boxes show them
 * (the gym's «La sessione»): session id → the box's score. A session with no
 * working set has none.
 */
export async function readSessionScores(
  db: Db,
  owner: Owner,
  sessions: readonly (DayItem & { day: string })[],
  weights: WeightBook,
): Promise<Map<string, NonNullable<ReturnType<typeof sessionBox>["score"]>>> {
  const out = new Map<string, NonNullable<ReturnType<typeof sessionBox>["score"]>>();
  const done = sessions.filter(
    (s) =>
      s.kind.key === "session" &&
      s.status === "done" &&
      s.children.some((c) => c.sets.some((t) => !t.warmup)),
  );
  if (done.length === 0) return out;
  const catalog = await readExercises(db, owner);
  const byId = new Map(catalog.map((e) => [e.id, e]));
  for (const s of done) {
    const ids = s.children.flatMap((c) => (c.item ? [c.item.id] : []));
    const history = await readTrainingHistory(db, owner, ids, s.id, s.day);
    const timing = learnTiming(history.sessions);
    const readiness = Number(s.values["readiness"] ?? 0) || null;
    const tired = readiness !== null && readiness <= 2;
    // Every exercise, as the gym counts them (a skipped one lowers the volume).
    const scored = s.children.map((c) => {
      const e = c.item ? byId.get(c.item.id) : undefined;
      const a = adviseExercise({
        pattern: e?.pattern ?? null,
        unilateral: e?.unilateral ?? false,
        dumbbells: usesDumbbells(c.item?.name ?? "", e?.equipment ?? null),
        history: c.item ? (history.byExercise.get(c.item.id) ?? []) : [],
        timing,
        settings: { restS: e?.restS ?? undefined, setupS: e?.setupS ?? undefined },
      });
      return scoredExercise(c, a, tired).scored;
    });
    const sc: Score = score(SESSION, sessionParts(scored), weights["session"]);
    const box = sessionBox(sc, null, [], true).score;
    if (box) out.set(s.id, box);
  }
  return out;
}
