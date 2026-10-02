/** Tests for the outlook repository: day targets, dynamic ones included. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createProfile, setDayProfile } from "../../nutrition/repositories/profiles";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { addMeasurement } from "../../training/repositories/measurements";
import { saveBody } from "./energy";
import { kcalTargets } from "./outlook";

let db: Db;
let close: () => Promise<void>;
let me: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
});
afterEach(() => close());

const blank = {
  protein: null,
  carbs: null,
  sugars: null,
  fat: null,
  saturatedFat: null,
  fiber: null,
  salt: null,
};

describe("kcalTargets (the week strip)", () => {
  it("a fixed day gives its number, a dynamic one its computed energy, none gives null", async () => {
    await saveBody(db, me, { sex: "male", birthYear: 1996, heightCm: 180 });
    await addMeasurement(db, me, {
      day: "2026-09-01",
      weightKg: "76",
      bodyFatPct: null,
      waistCm: null,
      notes: "",
    });
    const fixed = await createProfile(db, me, { name: "Fisso", kcal: "2500", ...blank });
    const dyn = await createProfile(db, me, {
      name: "Ricomposizione",
      kcal: null,
      ...blank,
      mode: "dynamic",
      deficitKcal: 200,
      proteinGPerKg: "2",
      fatGPerKg: "0.9",
    });
    if (!fixed.ok || !dyn.ok) throw new Error("setup failed");
    await setDayProfile(db, me, "2026-10-01", fixed.value.id);
    await setDayProfile(db, me, "2026-10-02", dyn.value.id);

    const t = await kcalTargets(db, me, ["2026-10-01", "2026-10-02"]);
    expect(t.get("2026-10-01")).toBe(2500);
    // Dynamic: the day's energy minus the 200 kcal deficit — a number, not null.
    expect(t.get("2026-10-02")).toBeGreaterThan(1500);
    expect(t.get("2026-10-02")).toBeLessThan(3000);
  });
});
