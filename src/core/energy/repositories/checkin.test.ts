/** The weekly check-in (ADR-0043) against a real Postgres (PGlite). */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readDay } from "../../day/repositories/days";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createProfile } from "../../nutrition/repositories/profiles";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { addMeasurement } from "../../training/repositories/measurements";
import { decideCheckin, getCheckinProposal } from "./checkin";
import { saveBody } from "./energy";
import { listWeekCheckins, setGoal } from "./goals";

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
  targetKg: null,
  kcalFloor: "standard",
  protein: "high",
  split: "balanced",
  checkInWeekday: 1, // Monday
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
});
