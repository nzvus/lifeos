/**
 * core/import/exercises-classify.ts — fills in the movement pattern and the
 * muscle groups of exercises that have none, from their names
 * (training/anatomy.ts `suggestAnatomy`). Used once for exercises imported
 * before S07; safe to re-run: a field the user already set is never touched,
 * and free-text groups from before the closed list are replaced.
 *
 * `planClassification` is the dry run; `applyClassification` writes it.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { exercises } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { isMuscleGroup, suggestAnatomy } from "../training/anatomy";
import { listExercises } from "../training/repositories/exercises";

export type Classification = {
  id: string;
  name: string;
  pattern: { from: string | null; to: string } | null;
  muscleGroups: { from: string[]; to: string[] } | null;
};

export async function planClassification(
  db: Db,
  owner: Owner,
): Promise<{ changes: Classification[]; unknown: string[] }> {
  const changes: Classification[] = [];
  const unknown: string[] = [];
  for (const e of await listExercises(db, owner)) {
    const s = suggestAnatomy(e.name);
    const groupsSet = e.muscleGroups.length > 0 && e.muscleGroups.every(isMuscleGroup);
    const c: Classification = {
      id: e.id,
      name: e.name,
      pattern: !e.pattern && s.pattern ? { from: e.pattern, to: s.pattern } : null,
      muscleGroups:
        !groupsSet && s.muscleGroups.length > 0
          ? { from: e.muscleGroups, to: s.muscleGroups }
          : null,
    };
    if (c.pattern || c.muscleGroups) changes.push(c);
    else if (!e.pattern && !s.pattern) unknown.push(e.name);
  }
  return { changes, unknown };
}

export async function applyClassification(
  db: Db,
  owner: Owner,
  changes: readonly Classification[],
): Promise<number> {
  for (const c of changes)
    await db
      .update(exercises)
      .set({
        ...(c.pattern && { pattern: c.pattern.to }),
        ...(c.muscleGroups && { muscleGroups: c.muscleGroups.to }),
      })
      .where(and(ownedBy(exercises, owner), eq(exercises.id, c.id)));
  return changes.length;
}
