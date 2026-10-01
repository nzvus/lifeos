/** Tests for the energy repository (ADR-0014): body data, activity, a day's energy. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { addMeasurement } from "../../training/repositories/measurements";
import { getBody, getDayEnergy, saveBody, setDayActivity } from "./energy";

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

const DAY = "2026-10-01";

describe("energy repository", () => {
  it("without body data there is no estimate, and it says what is missing", async () => {
    const v = await getDayEnergy(db, me, DAY);
    expect(v.energy).toBeNull();
    expect(v.missing).toEqual(["sex", "birthYear", "heightCm", "weight"]);
    expect(v.activity).toEqual({ level: "mixed", walkingMin: null, steps: null });
  });

  it("body data + the day's weight + activity give the day's energy", async () => {
    await saveBody(db, me, { sex: "male", birthYear: 1996, heightCm: 180 });
    await addMeasurement(db, me, {
      day: "2026-09-20",
      weightKg: "75",
      bodyFatPct: null,
      waistCm: null,
      notes: "",
    });
    await setDayActivity(db, me, DAY, { level: "sitting", walkingMin: 60, steps: null });
    const v = await getDayEnergy(db, me, DAY);
    expect(v.missing).toEqual([]);
    expect(v.energy?.bmr).toBe(1730);
    expect(v.energy?.walking).toEqual({ low: 150, high: 210 });
    // Saving again updates (one row per day).
    await setDayActivity(db, me, DAY, {
      level: "on_feet",
      walkingMin: null,
      steps: null,
    });
    expect((await getDayEnergy(db, me, DAY)).activity.level).toBe("on_feet");
  });

  it("is mine only", async () => {
    await saveBody(db, me, { sex: "female", birthYear: 1990, heightCm: 165 });
    await setDayActivity(db, me, DAY, { level: "on_feet", walkingMin: 30, steps: null });
    expect(await getBody(db, other, DAY)).toEqual({
      sex: null,
      birthYear: null,
      heightCm: null,
      weightKg: null,
    });
    expect((await getDayEnergy(db, other, DAY)).activity.level).toBe("mixed");
  });
});
