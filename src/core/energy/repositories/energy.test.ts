/** Tests for the energy repository (ADR-0014): body data, activity, a day's energy. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { addMeasurement } from "../../training/repositories/measurements";
import { logEstimate } from "../../nutrition/repositories/log";
import { addDays } from "../../shared/dates";
import {
  getBody,
  getCalibration,
  getDayEnergy,
  getWeighIns,
  saveBody,
  setDayActivity,
  setEnergyCorrection,
} from "./energy";

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
      correction: 1,
    });
    expect((await getDayEnergy(db, other, DAY)).activity.level).toBe("mixed");
  });

  it("calibration: a proposal from the last 28 days; accepting it moves the estimate", async () => {
    await saveBody(db, me, { sex: "male", birthYear: 1996, heightCm: 180 });
    const before = (await getDayEnergy(db, me, DAY)).energy;
    expect(before).toBeNull(); // no weight yet
    for (let i = 1; i <= 28; i++) {
      const day = addDays(DAY, -i);
      await logEstimate(db, me, {
        day,
        label: "Day",
        kcal: "2600",
        protein: "0",
        carbs: "0",
        fat: "0",
        fiber: "0",
        cost: null,
      });
      if (i % 4 === 0)
        // −0.5 kg a week, going back in time: heavier in the past.
        await addMeasurement(db, me, {
          day,
          weightKg: (80 + (0.5 / 7) * i).toFixed(2),
          bodyFatPct: null,
          waistCm: null,
          notes: "",
        });
    }
    const c = await getCalibration(db, me, DAY);
    expect(c).toMatchObject({
      verdict: "ok",
      loggedDays: 28,
      weighIns: 7,
      intake: 2600,
      current: 1,
    });
    expect(c.trendKgPerWeek).toBeCloseTo(-0.5, 2);
    expect(c.proposed).not.toBeNull();

    const plain = (await getDayEnergy(db, me, DAY)).energy!;
    await setEnergyCorrection(db, me, c.proposed!, DAY);
    expect((await getBody(db, me, DAY)).correction).toBe(c.proposed);
    // ADR-0026: from that day on; the day before keeps 1.
    expect((await getBody(db, me, addDays(DAY, -1))).correction).toBe(1);
    const fixed = (await getDayEnergy(db, me, DAY)).energy!;
    expect(fixed.baseline.low).toBeGreaterThan(plain.baseline.low);
    // Not someone else's; and a reset is 1.
    expect((await getBody(db, other, DAY)).correction).toBe(1);
    expect((await getCalibration(db, other, DAY)).verdict).toBe("no_body");
    await setEnergyCorrection(db, me, 1, addDays(DAY, 3));
    expect((await getBody(db, me, addDays(DAY, 3))).correction).toBe(1);
    expect((await getBody(db, me, addDays(DAY, 2))).correction).toBe(c.proposed);
  });

  it("the database refuses a factor outside 0.80–1.20", async () => {
    await expect(setEnergyCorrection(db, me, 1.5, DAY)).rejects.toThrow();
  });
});

describe("weigh-ins read with what came before them (ADR-0027)", () => {
  it("a weigh-in after dinner counts less; the trend and BMI come with it", async () => {
    await saveBody(db, me, { sex: "male", birthYear: 1996, heightCm: 180 });
    const estimate = (day: string, at: string, carbs: string) =>
      logEstimate(db, me, {
        day,
        label: "Food",
        kcal: "900",
        protein: "0",
        carbs,
        fat: "0",
        fiber: "0",
        cost: null,
        at: new Date(at),
      });
    // A usual week of 250 g carbs, then 400 g the day before the 2nd weigh-in.
    for (let i = 2; i <= 8; i++)
      await estimate(addDays(DAY, -i), `${addDays(DAY, -i)}T10:00:00Z`, "250");
    await estimate(addDays(DAY, -1), `${addDays(DAY, -1)}T10:00:00Z`, "400");
    await estimate(DAY, `${DAY}T17:00:00Z`, "100"); // dinner, 19:00 in Rome
    const said = { fasted: true, afterToilet: true, afterTraining: false };
    await addMeasurement(
      db,
      me,
      {
        day: addDays(DAY, -1),
        weightKg: "75",
        bodyFatPct: null,
        waistCm: null,
        notes: "",
        context: { ...said, time: "07:00" },
      },
      "Europe/Rome",
    );
    await addMeasurement(
      db,
      me,
      {
        day: DAY,
        weightKg: "77",
        bodyFatPct: null,
        waistCm: null,
        notes: "",
        context: {
          time: "21:00",
          fasted: false,
          afterToilet: true,
          afterTraining: false,
        },
      },
      "Europe/Rome",
    );

    const [a, b] = await getWeighIns(db, me);
    expect(a).toMatchObject({ clues: [], reliability: 1, trend: 75 });
    expect(b!.clues).toEqual(["after_food", "late", "carbs_up"]);
    expect(b!.reliability).toBe(0.25);
    expect(b!.trend).toBe(75.05); // +2 kg on the scale, +50 g in the trend
    expect(b!.indices.bmi).toEqual({ value: 23.8, category: "normal" });
    expect(await getWeighIns(db, other)).toEqual([]);
  });
});
