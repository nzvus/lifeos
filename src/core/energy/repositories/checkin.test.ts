/** The weekly check-in (ADR-0043) against a real Postgres (PGlite). */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readDay } from "../../day/repositories/days";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createProfile, setDayProfile } from "../../nutrition/repositories/profiles";
import { saveProgram } from "../../nutrition/repositories/programs";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { addMeasurement } from "../../training/repositories/measurements";
import { decideCheckin, getCheckinProposal } from "./checkin";
import { saveBody } from "./energy";
import { listWeekCheckins, setGoal, undoWeekCheckin } from "./goals";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
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

const goal = {
  ratePctWeek: "-0.50",
  kind: null,
  targetDay: null,
  targetKg: null,
  kcalFloor: "standard",
  protein: "high",
  split: "balanced",
  checkInWeekday: 1, // Monday
  weeklyCheckIn: true,
} as const;

// 2026-10-10 is a Saturday.
describe("the weekly check-in", () => {
  it("is nothing without a goal", async () => {
    expect(await getCheckinProposal(db, me, "2026-10-10")).toBeNull();
  });

  it("proposes the model's expenditure minus the goal until the factor is learnt", async () => {
    await setGoal(db, me, "2026-10-10", goal);
    const p = (await getCheckinProposal(db, me, "2026-10-10"))!;
    expect(p.due).toBe(true); // the first one is due at once
    expect(p.periodStart).toBe("2026-10-05");
    expect(p.learnt).toBe(false);
    expect(p.factor).toBe(1);
    expect(p.weightKg).toBe(76);
    expect(p.expenditure).toBeGreaterThan(2000);
    expect(p.targets!.kcal).toBe(p.expenditure! - 418);
    expect(p.targets!.protein).toBe(152); // 2.0 × 76
  });

  it("accepting freezes the week for a dynamic day; then it is not due until the next weekday", async () => {
    const dyn = await createProfile(db, me, {
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
    if (!dyn.ok) throw new Error("setup");
    await setGoal(db, me, "2026-10-10", goal);
    const proposed = (await getCheckinProposal(db, me, "2026-10-10"))!.targets!;

    expect((await decideCheckin(db, me, "2026-10-10", "accept")).ok).toBe(true);
    const day = await readDay(db, me, "2026-10-14", {
      today: "2026-10-10",
      autoTargets: false,
    });
    expect(day.basis).toBe("checkin");
    expect(Number(day.own.kcal)).toBe(proposed.kcal);

    expect((await getCheckinProposal(db, me, "2026-10-11"))!.due).toBe(false); // Sunday
    const monday = (await getCheckinProposal(db, me, "2026-10-12"))!;
    expect(monday.due).toBe(true);
    expect(monday.previous).toBe(
      (await getCheckinProposal(db, me, "2026-10-10"))!.expenditure,
    );

    expect(await decideCheckin(db, me, "2026-10-10", "accept")).toEqual({
      ok: false,
      errors: { _form: "not_editable" },
    });
  });

  it("skipping records it without numbers; another user is untouched", async () => {
    await setGoal(db, me, "2026-10-10", goal);
    await setGoal(db, other, "2026-10-10", goal);
    expect((await decideCheckin(db, me, "2026-10-10", "skip")).ok).toBe(true);
    expect((await getCheckinProposal(db, me, "2026-10-10"))!.due).toBe(false);
    expect(await listWeekCheckins(db, me)).toEqual([
      { startDay: "2026-10-10", decision: "skipped" },
    ]);
    expect((await getCheckinProposal(db, other, "2026-10-10"))!.due).toBe(true);
  });

  it("can't accept without body data", async () => {
    await setGoal(db, other, "2026-10-10", goal);
    expect(await decideCheckin(db, other, "2026-10-10", "accept")).toEqual({
      ok: false,
      errors: { _form: "required" },
    });
  });

  it("shifts the week by each day's program, keeping its total (ADR-0044)", async () => {
    const dynamic = {
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
    } as const;
    const rest = await createProfile(db, me, { name: "Rest", ...dynamic }); // the default
    const legs = await createProfile(db, me, { name: "Legs", ...dynamic });
    if (!rest.ok || !legs.ok) throw new Error("setup");
    await saveProgram(db, me, legs.value.id, {
      trainingAt: 18 * 60,
      shiftKcal: 350,
      slots: [],
    });
    // Saturday 10th: legs on Monday 12th and Thursday 15th.
    await setDayProfile(db, me, "2026-10-12", legs.value.id);
    await setDayProfile(db, me, "2026-10-15", legs.value.id);
    await setGoal(db, me, "2026-10-10", goal);

    const p = (await getCheckinProposal(db, me, "2026-10-10"))!;
    // Mean 700 ÷ 7 = 100: legs +250, the other five −100.
    expect(p.shifts).toEqual({
      "2026-10-10": -100,
      "2026-10-11": -100,
      "2026-10-12": 250,
      "2026-10-13": -100,
      "2026-10-14": -100,
      "2026-10-15": 250,
      "2026-10-16": -100,
    });

    expect((await decideCheckin(db, me, "2026-10-10", "accept")).ok).toBe(true);
    // Editing the program afterwards changes nothing in the fixed week.
    await saveProgram(db, me, legs.value.id, {
      trainingAt: null,
      shiftKcal: 0,
      slots: [],
    });
    const opts = { today: "2026-10-10", autoTargets: false };
    const monday = await readDay(db, me, "2026-10-12", opts);
    const tuesday = await readDay(db, me, "2026-10-13", opts);
    expect(Number(monday.own.kcal)).toBe(p.targets!.kcal + 250);
    expect(Number(tuesday.own.kcal)).toBe(p.targets!.kcal - 100);
    expect(Number(monday.own.carbs) - Number(tuesday.own.carbs)).toBe(88); // 350 ÷ 4, rounded per day
    expect(monday.own.protein).toBe(tuesday.own.protein);
  });

  it("off (the default): no card, and an accepted week stops counting (ADR-0048)", async () => {
    const dyn = await createProfile(db, me, {
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
    if (!dyn.ok) throw new Error("setup");
    await setGoal(db, me, "2026-10-10", goal);
    expect((await decideCheckin(db, me, "2026-10-10", "accept")).ok).toBe(true);
    const opts = { today: "2026-10-10", autoTargets: false };
    expect((await readDay(db, me, "2026-10-12", opts)).basis).toBe("checkin");

    await setGoal(db, me, "2026-10-10", { ...goal, weeklyCheckIn: false });
    expect((await getCheckinProposal(db, me, "2026-10-10"))!.due).toBe(false);
    expect((await readDay(db, me, "2026-10-12", opts)).basis).toBe("goal");
  });

  it("an accepted week can be undone: its days follow the goal again", async () => {
    await setGoal(db, me, "2026-10-10", goal);
    await decideCheckin(db, me, "2026-10-10", "accept");
    expect(await undoWeekCheckin(db, me, "2026-10-12")).toEqual({
      ok: true,
      value: null,
    });
    expect(await listWeekCheckins(db, me)).toEqual([]);
    expect(await undoWeekCheckin(db, me, "2026-10-12")).toEqual({
      ok: false,
      errors: { _form: "not_found" },
    });
    expect((await getCheckinProposal(db, me, "2026-10-12"))!.due).toBe(true);
  });
});
