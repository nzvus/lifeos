/**
 * The day engine (ADR-0040) against a real Postgres (PGlite): fixed, dynamic
 * and untyped days; a day alone equals the same day in its week; the active
 * program's routine counts on the days it falls on (the week strip used to
 * leave it out).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import { saveBody } from "../../energy/repositories/energy";
import type { Owner } from "../../identity/owner";
import { createProfile, setDayProfile } from "../../nutrition/repositories/profiles";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { createExercise } from "../../training/repositories/exercises";
import { addMeasurement } from "../../training/repositories/measurements";
import { createProgram } from "../../training/repositories/programs";
import { createRoutine } from "../../training/repositories/routines";
import { readDay, readDays } from "./days";

let db: Db;
let close: () => Promise<void>;
let me: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  await saveBody(db, me, { sex: "male", birthYear: 2003, heightCm: 183 });
  await addMeasurement(db, me, {
    day: "2026-09-01",
    weightKg: "76",
    bodyFatPct: null,
    waistCm: null,
    notes: "",
  });
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
const opts = { today: "2026-10-01", autoTargets: true };

async function dynamicProfile() {
  const p = await createProfile(db, me, {
    name: "Rec",
    kcal: null,
    ...blank,
    mode: "dynamic",
    deficitKcal: 200,
    proteinGPerKg: "2.2",
    fatGPerKg: "0.8",
  });
  if (!p.ok) throw new Error("setup");
  return p.value;
}

describe("readDays", () => {
  it("a fixed day gives its numbers, a dynamic one computed ones, none nothing", async () => {
    const fixed = await createProfile(db, me, { name: "Fisso", kcal: "2500", ...blank });
    const dyn = await dynamicProfile();
    if (!fixed.ok) throw new Error("setup");
    await setDayProfile(db, me, "2026-10-01", fixed.value.id);
    await setDayProfile(db, me, "2026-10-02", dyn.id);

    const days = await readDays(db, me, "2026-09-30", "2026-10-02", opts);
    // The first type is the default: a day without its own copy follows it.
    expect(days.get("2026-09-30")!.plan.source).toBe("default");
    expect(Number(days.get("2026-09-30")!.own.kcal)).toBe(2500);
    expect(days.get("2026-10-01")!.plan.source).toBe("fixed");
    expect(Number(days.get("2026-10-01")!.own.kcal)).toBe(2500);
    const d = days.get("2026-10-02")!;
    expect(d.goal).toBe("recomp"); // 200 kcal, 2.2 and 0.8 g/kg: the preset
    expect(Number(d.own.kcal)).toBeGreaterThan(1500);
    expect(d.own.protein).toBe("167"); // 2.2 g/kg × 76 kg
    // The automatic maxima are added (sugars, saturated fat, salt).
    expect(d.auto).toContain("salt");
  });

  it("without any day type, a day has no targets of its own", async () => {
    const d = await readDay(db, me, "2026-10-01", { ...opts, autoTargets: false });
    expect(d.plan.source).toBe("none");
    expect(d.own.kcal).toBeNull();
    expect(d.energy.energy).not.toBeNull(); // the energy is still estimated
  });

  it("gives the same day the same numbers alone or in its week", async () => {
    const dyn = await dynamicProfile();
    for (const day of ["2026-10-01", "2026-10-02", "2026-10-03"])
      await setDayProfile(db, me, day, dyn.id);
    const week = await readDays(db, me, "2026-10-01", "2026-10-07", opts);
    for (const day of ["2026-10-01", "2026-10-02", "2026-10-03"]) {
      const alone = await readDay(db, me, day, opts);
      expect(alone.targets).toEqual(week.get(day)!.targets);
      expect(alone.energy.energy).toEqual(week.get(day)!.energy.energy);
    }
  });

  it("counts the program's routine on its days, in the week as on the day", async () => {
    const dyn = await dynamicProfile();
    const ex = await createExercise(db, me, {
      name: "Squat",
      kind: "strength",
      muscleGroups: [],
      pattern: null,
      equipment: null,
      unilateral: false,
      notes: "",
    });
    if (!ex.ok) throw new Error("setup");
    const legs = await createRoutine(db, me, {
      name: "Legs",
      notes: "",
      items: [
        {
          exerciseId: ex.value.id,
          sets: 4,
          reps: 8,
          loadKg: "80",
          durationS: null,
          restS: 120,
        },
      ],
    });
    if (!legs.ok) throw new Error("setup");
    const prog = await createProgram(db, me, {
      name: "Legs, rest",
      notes: "",
      startDay: "2026-10-01",
      active: true,
      slots: [
        { label: "", items: [{ routineId: legs.value.id, exerciseId: null }] },
        { label: "Rest", items: [] },
      ],
    });
    if (!prog.ok) throw new Error("setup");
    for (const day of ["2026-10-01", "2026-10-02"])
      await setDayProfile(db, me, day, dyn.id);

    const week = await readDays(db, me, "2026-10-01", "2026-10-02", opts);
    const legsDay = week.get("2026-10-01")!;
    const restDay = week.get("2026-10-02")!;
    expect(legsDay.energy.energy!.training.planned.high).toBeGreaterThan(0);
    expect(restDay.energy.energy!.training.planned.high).toBe(0);
    expect(Number(legsDay.own.kcal)).toBeGreaterThan(Number(restDay.own.kcal));
    expect(legsDay.load).toBe("training");
    expect((await readDay(db, me, "2026-10-01", opts)).own).toEqual(legsDay.own);
  });
});
