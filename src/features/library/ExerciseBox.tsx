"use client";
/**
 * An esercizio's box in the Elenco (PAT-30 level 1, Deliver ③): its facts as chips (ATT-44) and its
 * e1RM behind a door, drawn as its trend over the last sessions (ATT-43, VIS-102 trend → line).
 * Never done: only its facts (PRD-22).
 */
import { Chart, ChipRow, F, ThingBox, type BoxEntry } from "@lifeos/kit";
import { planDoors } from "@/features/box-doors";
import { training } from "@/i18n/training";
import type { LibraryRow } from "./library";

export function ExerciseBox({
  r,
  entry,
}: {
  r: LibraryRow & { exercise: NonNullable<LibraryRow["exercise"]> };
  entry: BoxEntry;
}) {
  const { trend, facts } = r.exercise;
  const ys = trend.map((t) => t.v);
  const last = ys.at(-1);
  return (
    <ThingBox
      density="row"
      entry={entry}
      doors={planDoors("exercise", {
        ...(last !== undefined
          ? {
              e1rm: {
                label: "e1RM",
                value: F.num(last, "kg"),
                ...(ys.length > 1
                  ? {
                      panel: (
                        <Chart
                          type="trend"
                          caption={training.exercise.e1rmTrend(ys.length)}
                          data={{
                            x: trend.map((t, i) =>
                              i === 0 || i === trend.length - 1 ? F.day(t.d) : "",
                            ),
                            y: ys,
                            unit: "kg",
                            lo: Math.min(...ys),
                            hi: Math.max(...ys),
                            decimals: 1,
                          }}
                        />
                      ),
                    }
                  : {}),
              },
            }
          : {}),
      })}
    >
      <ChipRow
        label={training.exercise.facts}
        items={facts.map((f) => ({ key: f, label: f }))}
      />
    </ThingBox>
  );
}
