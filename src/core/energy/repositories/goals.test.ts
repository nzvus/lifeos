/** Goals and weekly check-ins (ADR-0043) against a real Postgres (PGlite). */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser } from "../../testing/test-db";
import {
  checkinOn,
  goalFrom,
  listGoals,
  listWeekCheckins,
  recordWeekCheckin,
  setGoal,
  type WeightGoalInput,
  type WeekCheckin,
} from "./goals";

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

const cut: WeightGoalInput = {
  ratePctWeek: "-0.50",
  targetKg: "72.00",
  kcalFloor: "standard",
  protein: "high",
  split: "balanced",
  checkInWeekday: 1,
};

const accepted = (
  startDay: string,
  kcal = 2300,
): Extract<WeekCheckin, { decision: "accepted" }> => ({
  startDay,
  decision: "accepted",
  expenditureKcal: 2720,
  factor: "1.04",
  trendKg: "76.10",
  kcal,
  protein: 144,
  fat: 64,
  carbs: 287,
  fiber: 32,
});

describe("goals", () => {
  it("keeps a history: the goal in force on a day is the latest from before it", async () => {
    await setGoal(db, me, "2026-10-01", { ...cut, ratePctWeek: "0.00", targetKg: null });
    await setGoal(db, me, "2026-10-10", cut);
    await setGoal(db, me, "2026-10-10", { ...cut, protein: "extra" }); // same day: replaced
    await setGoal(db, other, "2026-09-01", { ...cut, ratePctWeek: "0.25" });

    const rows = await listGoals(db, me);
    expect(rows.map((g) => [g.sinceDay, g.ratePctWeek, g.protein])).toEqual([
      ["2026-10-10", "-0.50", "extra"],
      ["2026-10-01", "0.00", "high"],
    ]);
    expect(goalFrom(rows, "2026-09-30")).toBeNull();
    expect(goalFrom(rows, "2026-10-09")?.ratePctWeek).toBe("0.00");
    expect(goalFrom(rows, "2026-10-12")?.ratePctWeek).toBe("-0.50");
    expect((await listGoals(db, other)).map((g) => g.ratePctWeek)).toEqual(["0.25"]);
  });

  it("refuses a rate, a weekday or a preference out of range", async () => {
    await expect(
      setGoal(db, me, "2026-10-10", { ...cut, ratePctWeek: "-2.00" }),
    ).rejects.toThrow();
    await expect(
      setGoal(db, me, "2026-10-10", { ...cut, checkInWeekday: 7 }),
    ).rejects.toThrow();
    await expect(
      setGoal(db, me, "2026-10-10", { ...cut, protein: "huge" as "high" }),
    ).rejects.toThrow();
  });
});

describe("week check-ins", () => {
  it("freezes 7 days from its start; a later check-in takes over from its own day", async () => {
    await recordWeekCheckin(db, me, accepted("2026-10-05", 2300));
    await recordWeekCheckin(db, me, accepted("2026-10-09", 2400)); // done again mid-week
    const rows = await listWeekCheckins(db, me);
    expect(checkinOn(rows, "2026-10-04")).toBeNull();
    expect(checkinOn(rows, "2026-10-08")?.kcal).toBe(2300);
    expect(checkinOn(rows, "2026-10-09")?.kcal).toBe(2400);
    expect(checkinOn(rows, "2026-10-15")?.kcal).toBe(2400);
    expect(checkinOn(rows, "2026-10-16")).toBeNull(); // the week is over: live again
  });

  it("a skipped check-in ends the previous week's numbers and may be replaced", async () => {
    await recordWeekCheckin(db, me, accepted("2026-10-05"));
    expect(
      await recordWeekCheckin(db, me, { startDay: "2026-10-12", decision: "skipped" }),
    ).toEqual({ ok: true, value: null });
    let rows = await listWeekCheckins(db, me);
    expect(checkinOn(rows, "2026-10-11")?.kcal).toBe(2300);
    expect(checkinOn(rows, "2026-10-12")).toBeNull();

    expect((await recordWeekCheckin(db, me, accepted("2026-10-12", 2250))).ok).toBe(true);
    rows = await listWeekCheckins(db, me);
    expect(checkinOn(rows, "2026-10-12")?.kcal).toBe(2250);
  });

  it("never changes an accepted check-in", async () => {
    await recordWeekCheckin(db, me, accepted("2026-10-05", 2300));
    expect(await recordWeekCheckin(db, me, accepted("2026-10-05", 2900))).toEqual({
      ok: false,
      errors: { _form: "not_editable" },
    });
    expect(
      await recordWeekCheckin(db, me, { startDay: "2026-10-05", decision: "skipped" }),
    ).toEqual({ ok: false, errors: { _form: "not_editable" } });
    expect(checkinOn(await listWeekCheckins(db, me), "2026-10-06")?.kcal).toBe(2300);
  });

  it("another user sees only theirs", async () => {
    await recordWeekCheckin(db, me, accepted("2026-10-05"));
    await recordWeekCheckin(db, other, { startDay: "2026-10-05", decision: "skipped" });
    expect(await listWeekCheckins(db, other)).toEqual([
      { startDay: "2026-10-05", decision: "skipped" },
    ]);
    expect((await listWeekCheckins(db, me))[0]?.decision).toBe("accepted");
  });

  it("refuses implausible numbers", async () => {
    await expect(
      recordWeekCheckin(db, me, accepted("2026-10-05", 500)),
    ).rejects.toThrow();
    await expect(
      recordWeekCheckin(db, me, { ...accepted("2026-10-05"), factor: "1.50" }),
    ).rejects.toThrow();
  });
});
