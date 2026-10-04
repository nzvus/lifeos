/**
 * app/(app)/day-program.ts — the day page's program items (ADR-0035): each
 * item of the day's slot with its look (colour, icon), done when a session
 * of the day stands for it. Split out of page.tsx (800-line limit).
 */
import { lookOf, type Look } from "@/core/training/calendar";

type Item = { routineId: string | null; exerciseId: string | null };
const NONE: Look = { region: null, pattern: null, cardio: false };

export function programItemsOf<I extends Item>(
  items: readonly I[],
  presets: readonly { routineId: string; look: Look }[],
  exercises: readonly (Omit<Parameters<typeof lookOf>[0][number], "sets"> & {
    id: string;
  })[],
  sessions: readonly {
    routineId: string | null;
    exercises: readonly { exerciseId: string | null }[];
  }[],
): (I & { look: Look; done: boolean })[] {
  const lookById = new Map([
    ...presets.map((x) => [x.routineId, x.look] as const),
    ...exercises.map((e) => [e.id, lookOf([{ ...e, sets: 1 }])] as const),
  ]);
  return items.map((it) => ({
    ...it,
    look: lookById.get(it.routineId ?? it.exerciseId ?? "") ?? NONE,
    done: sessions.some((x) =>
      it.routineId
        ? x.routineId === it.routineId
        : x.exercises.some((e) => e.exerciseId === it.exerciseId),
    ),
  }));
}
