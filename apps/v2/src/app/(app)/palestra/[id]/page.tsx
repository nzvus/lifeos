/**
 * Gym mode for one session (`/palestra/<id>`, V-05): the server reads the
 * session with its exercises and sets, each exercise's last two sessions
 * and pattern, and E6's proposal; the client trains and ticks.
 */
import { notFound } from "next/navigation";
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readClock } from "@/core/day";
import { readEntry } from "@/core/entries";
import { localParts, logicalDay } from "@/core/engines/time";
import { proposeSets, readExercises, readHistory } from "@/core/training";
import { Gym, type GymExercise } from "@/features/training/Gym";
import { lastTimeText } from "@/features/training/present";
import { addGymExercise, finishGym, tickSet, untickSet } from "../actions";

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
  const pattern = new Map(catalog.map((e) => [e.id, e.pattern]));
  const ids = session.children.flatMap((c) => (c.item ? [c.item.id] : []));
  const history = await readHistory(db, owner, ids, id);
  const exercises: GymExercise[] = session.children.map((c) => {
    const p = c.item ? (pattern.get(c.item.id) ?? null) : null;
    const h = c.item ? history.get(c.item.id) : undefined;
    return {
      entryId: c.id,
      name: c.item?.name ?? "Esercizio",
      pattern: p,
      proposed: proposeSets(p, h?.last, h?.before).sets,
      last: h ? lastTimeText(h.lastDay, h.last) : "",
      done: c.sets.map((s) => ({
        position: s.position,
        reps: s.reps,
        loadKg: s.loadKg,
        rir: s.rir,
        durationS: s.durationS,
        warmup: s.warmup,
      })),
    };
  });
  const today = logicalDay(new Date(), clock);
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
        dayHref: session.day === today ? "/oggi" : "/oggi/" + session.day,
      }}
      exercises={exercises}
      catalog={catalog.map((e) => ({ id: e.id, name: e.name }))}
      actions={{
        tick: tickSet,
        untick: untickSet,
        add: addGymExercise,
        finish: finishGym,
      }}
    />
  );
}
