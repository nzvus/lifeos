/**
 * core/training/repositories/measurements.ts — body measurements (ADR-0005):
 * the weight that burn estimates use, plus body fat and waist when known.
 */
import { and, asc, desc, eq, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import { bodyMeasurements } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { fail, ok, type Result } from "../../shared/result";
import type { MeasurementInput } from "../validation";

export type Measurement = typeof bodyMeasurements.$inferSelect;

export async function listMeasurements(db: Db, owner: Owner): Promise<Measurement[]> {
  return db
    .select()
    .from(bodyMeasurements)
    .where(ownedBy(bodyMeasurements, owner))
    .orderBy(asc(bodyMeasurements.day), asc(bodyMeasurements.createdAt));
}

export async function addMeasurement(
  db: Db,
  owner: Owner,
  input: MeasurementInput,
): Promise<Result<Measurement>> {
  const [row] = await db
    .insert(bodyMeasurements)
    .values({ ...input, userId: owner.id })
    .returning();
  return ok(row!);
}

export async function deleteMeasurement(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const gone = await db
    .delete(bodyMeasurements)
    .where(and(ownedBy(bodyMeasurements, owner), eq(bodyMeasurements.id, id)))
    .returning({ id: bodyMeasurements.id });
  return gone.length ? ok(null) : fail({ _form: "not_found" });
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
    .where(and(ownedBy(bodyMeasurements, owner), lte(bodyMeasurements.day, day)))
    .orderBy(desc(bodyMeasurements.day), desc(bodyMeasurements.createdAt))
    .limit(1);
  return row?.weightKg ?? null;
}
