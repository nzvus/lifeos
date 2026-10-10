/**
 * core/nutrition/repositories/programs.ts — a day type's program
 * (ADR-0044): training time, shift and timed slots. Owner-filtered; a
 * program belongs to a live day type of the same user. Saving replaces
 * the whole program in one transaction.
 */
import { asc, eq } from "drizzle-orm";
import type { Db } from "../../db/client";
import { dayProgramSlots, dayPrograms } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { fail, ok, type Result } from "../../shared/result";
import type { DayProgram } from "../programs";
import { getProfile } from "./profiles";

const share = (v: string | null) => (v === null ? null : Number(v));

/** Every program of mine, by day type. */
export async function listPrograms(
  db: Db,
  owner: Owner,
): Promise<Map<string, DayProgram>> {
  const [programs, slots] = await Promise.all([
    db.select().from(dayPrograms).where(ownedBy(dayPrograms, owner)),
    db
      .select()
      .from(dayProgramSlots)
      .where(ownedBy(dayProgramSlots, owner))
      .orderBy(asc(dayProgramSlots.at), asc(dayProgramSlots.position)),
  ]);
  const out = new Map<string, DayProgram>();
  for (const p of programs)
    out.set(p.profileId, { trainingAt: p.trainingAt, shiftKcal: p.shiftKcal, slots: [] });
  for (const s of slots) {
    const p = out.get(s.profileId) ?? { trainingAt: null, shiftKcal: 0, slots: [] };
    p.slots.push({
      kind: s.kind,
      at: s.at,
      kcalShare: share(s.kcalShare),
      proteinShare: share(s.proteinShare),
    });
    out.set(s.profileId, p);
  }
  return out;
}

/** One day type's program, or null when it has none. */
export async function getProgram(
  db: Db,
  owner: Owner,
  profileId: string,
): Promise<DayProgram | null> {
  return (await listPrograms(db, owner)).get(profileId) ?? null;
}

/** Replaces a day type's program (an empty one removes it). */
export async function saveProgram(
  db: Db,
  owner: Owner,
  profileId: string,
  program: DayProgram,
): Promise<Result<null>> {
  if (!(await getProfile(db, owner, profileId))) return fail({ _form: "not_found" });
  const empty =
    program.trainingAt === null && program.shiftKcal === 0 && !program.slots.length;
  await db.transaction(async (tx) => {
    await tx.delete(dayProgramSlots).where(eq(dayProgramSlots.profileId, profileId));
    await tx.delete(dayPrograms).where(eq(dayPrograms.profileId, profileId));
    if (empty) return;
    await tx.insert(dayPrograms).values({
      profileId,
      userId: owner.id,
      trainingAt: program.trainingAt,
      shiftKcal: program.shiftKcal,
    });
    if (program.slots.length)
      await tx.insert(dayProgramSlots).values(
        program.slots.map((s, position) => ({
          profileId,
          position,
          userId: owner.id,
          kind: s.kind,
          at: s.at,
          kcalShare: s.kcalShare === null ? null : s.kcalShare.toFixed(2),
          proteinShare: s.proteinShare === null ? null : s.proteinShare.toFixed(2),
        })),
      );
  });
  return ok(null);
}
