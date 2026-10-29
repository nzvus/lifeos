/** Which exercises are activities (a run, a ride): the catalog's kind, else a cardio pattern. */
import { CARDIO_MET } from "@/core/engines/expenditure";
import type { ExerciseChoice } from "@/core/training";

export const isCardio = (e: ExerciseChoice): boolean =>
  e.kind === "cardio" || (e.pattern !== null && e.pattern in CARDIO_MET);
