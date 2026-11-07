/**
 * A scheda's own sections on the generic ObjectPage (PAT-30; change 2026-11-07-exercise-scheda):
 * «Inizia» (its one primary: a session starts from it, TR-07) and «Cambia gli esercizi» (its
 * Composer, PAT-62), then its exercises in order, each opening its page.
 */
import { Box, List } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { logicalDay } from "@/core/engines/time";
import { readExercises, readRoutines } from "@/core/training";
import { StartButton } from "@/features/training/StartButton";
import { training } from "@/i18n/training";
import { startGym } from "../../../palestra/actions";
import type { Build } from "./extras";

const w = training.routine;

export const routineExtra: Build = async (db, owner, id) => {
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const r = (await readRoutines(db, owner, today, await readExercises(db, owner))).find(
    (x) => x.id === id,
  );
  if (!r) return null;
  return {
    meta: w.meta(r.exercises.length, r.uses),
    summary: (
      <div className="k-line g2 wrap">
        <StartButton label={w.start} start={startGym.bind(null, r.id)} />
        <a className="k-btn secondary" href={"/corpo/scheda/" + r.id + "/componi"}>
          {w.compose}
        </a>
      </div>
    ),
    parts: [
      {
        title: w.exercises,
        node: (
          <List label={w.exercises}>
            {r.exercises.map((x, i) => (
              <Box
                key={x.exerciseId}
                density="row"
                rail={false}
                entry={{
                  fam: "train",
                  title: i + 1 + ". " + x.name,
                  href: "/corpo/esercizio/" + x.exerciseId,
                }}
              />
            ))}
          </List>
        ),
      },
    ],
  };
};
