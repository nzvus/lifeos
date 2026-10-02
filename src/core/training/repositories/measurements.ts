/**
 * core/training/repositories/measurements.ts — body measurements (ADR-0005):
 * the weight that burn estimates use, plus body fat and waist when known,
 * and how each weigh-in was taken (ADR-0027, weigh_in_context).
 */
import { and, asc, desc, eq, isNotNull, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import { bodyMeasurements, weighInContext } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { instantFor } from "../../shared/dates";
import { live } from "../../shared/trash";
import { fail, ok, type Result } from "../../shared/result";
import type { MeasurementInput } from "../validation";

export type WeighInContext = Omit<typeof weighInContext.$inferSelect, "userId">;
export type Measurement = typeof bodyMeasurements.$inferSelect & {
  /** How it was taken; null = not said (ADR-0027). */
  context: WeighInContext | null;
};

export async function listMeasurements(db: Db, owner: Owner): Promise<Measurement[]> {
  const rows = await db
    .select({ m: bodyMeasurements, c: weighInContext })
    .from(bodyMeasurements)
    .leftJoin(
      weighInContext,
      and(
        eq(weighInContext.measurementId, bodyMeasurements.id),
        eq(weighInContext.userId, bodyMeasurements.userId),
      ),
    )
    .where(and(ownedBy(bodyMeasurements, owner), live(bodyMeasurements)))
    .orderBy(asc(bodyMeasurements.day), asc(bodyMeasurements.createdAt));
  return rows.map(({ m, c }) => ({ ...m, context: c && withoutOwner(c) }));
}

const withoutOwner = ({ userId: _, ...c }: typeof weighInContext.$inferSelect) => c;

/** `timeZone` reads the context's clock time (the user's zone). */
export async function addMeasurement(
  db: Db,
  owner: Owner,
  { context, ...input }: MeasurementInput,
  timeZone = "UTC",
): Promise<Result<Measurement>> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(bodyMeasurements)
      .values({ ...input, userId: owner.id })
      .returning();
    if (!context) return ok({ ...row!, context: null });
    const [c] = await tx
      .insert(weighInContext)
      .values({
        measurementId: row!.id,
        userId: owner.id,
        measuredAt: context.time ? instantFor(input.day, context.time, timeZone) : null,
        fasted: context.fasted,
        afterToilet: context.afterToilet,
        afterTraining: context.afterTraining,
      })
      .returning();
    return ok({ ...row!, context: withoutOwner(c!) });
  });
}

/** Moves a measurement to the trash (ADR-0015). */
export async function deleteMeasurement(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const trashed = await db
    .update(bodyMeasurements)
    .set({ deletedAt: new Date() })
    .where(
      and(
        ownedBy(bodyMeasurements, owner),
        live(bodyMeasurements),
        eq(bodyMeasurements.id, id),
      ),
    )
    .returning({ id: bodyMeasurements.id });
  return trashed.length ? ok(null) : fail({ _form: "not_found" });
}

/** Takes a measurement out of the trash (the toast's "Undo"). */
export async function restoreMeasurement(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const restored = await db
    .update(bodyMeasurements)
    .set({ deletedAt: null })
    .where(
      and(
        ownedBy(bodyMeasurements, owner),
        isNotNull(bodyMeasurements.deletedAt),
        eq(bodyMeasurements.id, id),
      ),
    )
    .returning({ id: bodyMeasurements.id });
  return restored.length ? ok(null) : fail({ _form: "not_found" });
}

/** The latest weight measured on or before `day` (kg, exact string), or null. */
export async function weightOn(
  db: Db,
  owner: Owner,
  day: string,
): Promise<string | null> {
  const [row] = await db
    .select({ weightKg: bodyMeasurements.weightKg })
    .from(bodyMeasurements)
    .where(
      and(
        ownedBy(bodyMeasurements, owner),
        live(bodyMeasurements),
        lte(bodyMeasurements.day, day),
      ),
    )
    .orderBy(desc(bodyMeasurements.day), desc(bodyMeasurements.createdAt))
    .limit(1);
  return row?.weightKg ?? null;
}
