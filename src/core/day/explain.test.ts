/** How a day's numbers were built (core/day/explain.ts), on a real day. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import { saveBody } from "../energy/repositories/energy";
import { setGoal } from "../energy/repositories/goals";
import type { Owner } from "../identity/owner";
import { createProfile } from "../nutrition/repositories/profiles";
import { createTestDb, createTestUser } from "../testing/test-db";
import { addMeasurement } from "../training/repositories/measurements";
import { explainDay } from "./explain";
import { readDay } from "./repositories/days";

let db: Db;
let close: () => Promise<void>;
let me: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  await saveBody(db, me, { sex: "male", birthYear: 2003, heightCm: 183 });
  await addMeasurement(db, me, {
    day: "2026-10-01",
    weightKg: "76",
    bodyFatPct: null,
    waistCm: null,
    notes: "",
  });
  const p = await createProfile(db, me, {
    name: "Rec",
    kcal: null,
    protein: null,
    carbs: null,
    sugars: null,
    fat: null,
    saturatedFat: null,
    fiber: null,
    salt: null,
    mode: "dynamic",
    deficitKcal: 200,
    proteinGPerKg: "2.2",
    fatGPerKg: "0.8",
  });
  if (!p.ok) throw new Error("setup");
});
afterEach(() => close());

const opts = { today: "2026-10-10", autoTargets: false };
const goal = {
  ratePctWeek: "0.00",
  kcalFloor: "standard",
  protein: "extra",
  split: "balanced",
  checkInWeekday: 1,
  weeklyCheckIn: false,
} as const;

describe("explainDay", () => {
  it("recomposition toward 73 kg: spend, the pace's kcal, protein per kg of the target", async () => {
    await setGoal(db, me, "2026-10-10", {
      ...goal,
      kind: "recomp",
      targetKg: "73.00",
      targetDay: null,
    });
    const x = explainDay(await readDay(db, me, "2026-10-10", opts))!;
    expect(x.source).toEqual({
      type: "goal",
      kind: "recomp",
      ratePctWeek: -0.35,
      kcalPerDay: -293,
    });
    expect(x.kcal).toBe(x.spend.total - 293);
    expect(x.floored).toBeNull();
    expect(x.protein).toEqual({ g: 161, perKg: 2.2, ofKg: 73 }); // 2.2 × 73
    expect(x.spend.total).toBe(
      x.spend.bmr + x.spend.everyday + x.spend.steps + x.spend.training,
    );
  });

  it("says when the floor held the kcal up", async () => {
    // Lose 6 kg in 4 weeks: the pace is held at 1 % (−836 kcal), under the BMR.
    await setGoal(db, me, "2026-10-10", {
      ...goal,
      kind: "lose",
      targetKg: "70.00",
      targetDay: "2026-11-07",
    });
    const x = explainDay(await readDay(db, me, "2026-10-10", opts))!;
    expect(x.source).toMatchObject({ type: "goal", ratePctWeek: -1, kcalPerDay: -836 });
    expect(x.floored).toBe(x.kcal - (x.spend.total - 836));
    expect(x.floored).toBeGreaterThan(0);
  });

  it("without a goal: the day type's own deficit", async () => {
    const x = explainDay(await readDay(db, me, "2026-10-10", opts))!;
    expect(x.source).toEqual({ type: "type", deficit: 200 });
    expect(x.protein.perKg).toBe(2.2);
  });
});
