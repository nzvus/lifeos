import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { habitsDue, readHabits, saveHabit, setHabitActive, type Habit } from "./habits";

const habit = (over: Partial<Habit>): Habit => ({
  id: "h",
  name: "Studio",
  active: true,
  recurrence: { type: "daily" },
  kind: "activity",
  category: "study",
  atMin: null,
  durationMin: 60,
  ...over,
});

describe("habits due on a day", () => {
  it("by their rule, unless an entry of their kind and category covers them", () => {
    const study = habit({});
    const read = habit({
      id: "r",
      kind: "reading",
      category: null,
      recurrence: { type: "weekdays", days: [1, 2, 3, 4, 5] },
    });
    // 2026-10-24 is a Saturday.
    expect(habitsDue([study, read], "2026-10-24", []).map((h) => h.id)).toEqual(["h"]);
    expect(
      habitsDue([study], "2026-10-23", [
        { day: "2026-10-23", kind: "activity", category: "work" },
      ]),
    ).toHaveLength(1);
    expect(
      habitsDue([study], "2026-10-23", [
        { day: "2026-10-23", kind: "activity", category: "study" },
      ]),
    ).toEqual([]);
    expect(habitsDue([habit({ active: false })], "2026-10-23", [])).toEqual([]);
  });

  it("N times a week: due until the week has N other days", () => {
    const stretch = habit({
      recurrence: { type: "timesPerWeek", n: 2 },
      kind: "chore",
      category: null,
    });
    const week = [
      { day: "2026-10-19", kind: "chore", category: null },
      { day: "2026-10-21", kind: "chore", category: null },
      { day: "2026-10-12", kind: "chore", category: null },
    ];
    expect(habitsDue([stretch], "2026-10-23", week)).toEqual([]);
    expect(habitsDue([stretch], "2026-10-23", week.slice(1))).toHaveLength(1);
  });
});

describe("habits, written and read back", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
  });
  afterAll(() => close());

  it("made, changed, paused; meals refused; the owner's only", async () => {
    const input = {
      name: "Studio",
      recurrence: { type: "weekdays" as const, days: [1, 3] },
      kind: "activity",
      category: "study",
      atMin: 1080,
      durationMin: 90,
    };
    const id = (await saveHabit(db, a, null, input))!;
    expect(await readHabits(db, a)).toEqual([{ id, active: true, ...input }]);
    await saveHabit(db, a, id, { ...input, name: "Studiare", atMin: null });
    expect((await readHabits(db, a))[0]).toMatchObject({ name: "Studiare", atMin: null });
    expect(await saveHabit(db, b, id, input)).toBeNull();
    expect(await saveHabit(db, a, null, { ...input, kind: "meal" })).toBeNull();
    await setHabitActive(db, a, id, false);
    expect((await readHabits(db, a))[0]!.active).toBe(false);
    expect(await readHabits(db, b)).toEqual([]);
  });
});
