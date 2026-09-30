/**
 * app/(app)/training/editor-data.ts — what the session editor needs, shared
 * by /training/new and /training/[id]: my exercises, and for each one the
 * sets of the last time (before the session's day) as short text.
 */
import "server-only";
import type { Owner } from "@/core/identity/owner";
import type { Locale } from "@/core/shared/locales";
import { setsText } from "@/core/training/display";
import { listExercises } from "@/core/training/repositories/exercises";
import { lastSets } from "@/core/training/repositories/sessions";
import { fill, type Messages } from "@/i18n";
import { getDb } from "@/app/_server/runtime";

export async function editorData(
  owner: Owner,
  beforeDay: string,
  locale: Locale,
  t: Messages["training"],
) {
  const db = getDb();
  const exercises = await listExercises(db, owner);
  const previous = await lastSets(
    db,
    owner,
    exercises.map((e) => e.id),
    beforeDay,
  );
  const last: Record<string, string> = {};
  for (const [id, p] of previous)
    last[id] = fill(t.lastTime, {
      day: p.day.slice(8, 10) + "/" + p.day.slice(5, 7),
      sets: setsText(p.sets, locale),
    });
  return {
    exercises: exercises.map((e) => ({ id: e.id, name: e.name, kind: e.kind })),
    last,
    previous,
  };
}
