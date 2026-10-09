/** core/training/repositories/measurements.ts against a real Postgres (PGlite). */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { addMeasurement, isImplausibleWeight } from "./measurements";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
});
afterEach(() => close());

const weigh = (owner: Owner, day: string, weightKg: string) =>
  addMeasurement(db, owner, {
    day,
    weightKg,
    bodyFatPct: null,
    waistCm: null,
    notes: "",
  });

describe("isImplausibleWeight", () => {
  it("flags a typo against my last plausible weigh-in, not someone else's", async () => {
    await weigh(me, "2026-10-06", "75.40");
    await weigh(me, "2026-10-07", "76.40");
    await weigh(other, "2026-10-07", "86.00");
    expect(await isImplausibleWeight(db, me, "2026-10-08", 86)).toBe(true);
    expect(await isImplausibleWeight(db, me, "2026-10-08", 76)).toBe(false);
    expect(await isImplausibleWeight(db, other, "2026-10-08", 86)).toBe(false);
  });

  it("has nothing to compare with on the first weigh-in", async () => {
    expect(await isImplausibleWeight(db, me, "2026-10-08", 120)).toBe(false);
  });
});
