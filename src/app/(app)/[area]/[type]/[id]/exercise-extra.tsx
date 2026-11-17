/**
 * An esercizio's own sections on the generic ObjectPage (PAT-30; change
 * 2026-11-07-exercise-scheda), from its specialisation `core/training` (model.md §8): its trend
 * and best e1RM as «Andamento» (TR-21, TR-24), its sessions newest first with their work sets,
 * the schede that use it («Usato in»). Name and guide are its fields, edited in place.
 */
import { Box, F, List } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { logicalDay } from "@/core/engines/time";
import { exerciseTrend } from "@/core/engines/training";
import { readExerciseLog, readExercises, readRoutines, recordsOf } from "@/core/training";
import { trendText } from "@/features/training/present";
import { training } from "@/i18n/training";
import type { Build } from "./extras";

const SHOWN = 20;
const w = training.exercise;

export const exerciseExtra: Build = async (db, owner, id) => {
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const all = await readExercises(db, owner);
  if (!all.some((e) => e.id === id)) return null;
  const [log, routines] = await Promise.all([
    readExerciseLog(db, owner, id),
    readRoutines(db, owner, today, all),
  ]);
  const sessions = log.get(id) ?? [];
  const best = sessions.reduce((m, s) => Math.max(m, s.best ?? 0), 0);
  // TR-23: each record with the day it was set; none before the 3rd session (PAT-55).
  const rec = recordsOf(sessions);
  const records: [string, string, string][] = rec
    ? [
        ...(rec.e1rm
          ? [[w.best, F.num(rec.e1rm.kg, "kg"), rec.e1rm.day] as [string, string, string]]
          : []),
        ...(rec.load
          ? [
              [
                w.maxLoad,
                F.num(rec.load.kg, "kg") + " × " + rec.load.reps,
                rec.load.day,
              ] as [string, string, string],
            ]
          : []),
        ...(rec.repsAt
          ? [
              [
                rec.repsAt.kg === null
                  ? w.recordReps
                  : w.recordAt(F.num(rec.repsAt.kg, "kg")),
                w.reps(rec.repsAt.reps),
                rec.repsAt.day,
              ] as [string, string, string],
            ]
          : []),
      ]
    : [];
  const trend = trendText(
    exerciseTrend(
      sessions.flatMap((s) => (s.best ? [{ day: s.day, value: s.best }] : [])),
    ),
  );
  const usedIn = routines.filter((r) => r.exercises.some((x) => x.exerciseId === id));
  return {
    meta: w.sessions(sessions.length),
    parts: [
      {
        title: w.log,
        node:
          sessions.length === 0 ? (
            <p className="k-help">{w.never}</p>
          ) : (
            <div className="k-stack g1">
              {sessions.slice(0, SHOWN).map((s, i) => (
                <div key={s.day + ":" + i} className="k-line between">
                  <span className="k-body">
                    {F.Day(s.day)}
                    <span className="k-meta">
                      {" · "}
                      {s.sets
                        .map(
                          (t) =>
                            (t.reps ?? "?") +
                            (t.loadKg === null ? "" : "×" + F.n(Number(t.loadKg), 2)),
                        )
                        .join(", ") || w.noSet}
                    </span>
                  </span>
                  <span className="k-num">{s.best ? F.num(s.best, "kg") : "—"}</span>
                </div>
              ))}
            </div>
          ),
      },
    ],
    ...(best > 0 || records.length > 0
      ? {
          progress: (
            <div className="k-stack g1">
              {trend && <p className="k-body">{trend}</p>}
              {rec === null && <p className="k-help">{w.recordsSoon}</p>}
              {records.map(([word, value, day]) => (
                <div key={word} className="k-line between">
                  <span className="k-body">
                    {word}
                    <span className="k-meta">
                      {" · "}
                      {F.date(day)}
                    </span>
                  </span>
                  <span className="k-num">{value}</span>
                </div>
              ))}
            </div>
          ),
        }
      : {}),
    usedIn:
      usedIn.length === 0 ? (
        <p className="k-help">{w.notInRoutine}</p>
      ) : (
        <List label={w.usedIn}>
          {usedIn.map((r) => (
            <Box
              key={r.id}
              density="row"
              rail={false}
              entry={{ fam: "train", title: r.name, href: "/corpo/scheda/" + r.id }}
            />
          ))}
        </List>
      ),
  };
};
