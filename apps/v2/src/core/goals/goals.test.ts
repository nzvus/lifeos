import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { addDays } from "../engines/time";
import { weekDaysOnTarget, weightProgress } from "./progress";
import { inForce, readGoals, readMinutes, readNumbers, type GoalRow } from "./read";
import { checkGoal, createGoal } from "./write";

describe("a weight goal's progress", () => {
  // 80 kg on 1 Oct, losing 0.1 kg a day (0.7 a week) to the 17th.
  const ws = Array.from({ length: 17 }, (_, i) => ({
    day: addDays("2026-10-01", i),
    kg: 80 - 0.1 * i,
  }));

  it("measures from the first week to the last, with the pace and the ETA", () => {
    const p = weightProgress(
      ws,
      { value: 75, since: "2026-10-01", by: "2026-12-10" },
      "2026-10-17",
    )!;
    expect(p.start).toBeCloseTo(79.7, 5);
    expect(p.now).toBeCloseTo(78.7, 5);
    expect(p.pace).toBeCloseTo(-0.7, 5);
    expect(p.needed).toBeCloseTo(-3.7 / (54 / 7), 5);
    expect(p.onTrack).toBe(true);
    expect(p.eta).toBe(addDays("2026-10-17", Math.ceil((3.7 / 0.7) * 7)));
    expect(p.done).toBeCloseTo(1 / 4.7, 5);
  });

  it("says nothing without a recent weighing, and no ETA going the wrong way", () => {
    expect(
      weightProgress(ws, { value: 75, since: "2026-10-01", by: null }, "2026-11-30"),
    ).toBeNull();
    const up = ws.map((w, i) => ({ ...w, kg: 78 + 0.1 * i }));
    expect(
      weightProgress(up, { value: 75, since: "2026-10-01", by: null }, "2026-10-17")?.eta,
    ).toBeNull();
  });
});

describe("a per-day count goal", () => {
  it("counts this week's days on target, weekdays only when asked", () => {
    // Saturday 17 Oct: the week is Mon 12 – Sat 17.
    const counts = [
      { day: "2026-10-12", n: 9000 },
      { day: "2026-10-13", n: 6000 },
      { day: "2026-10-14", n: 8000 },
      { day: "2026-10-17", n: 12000 },
    ];
    expect(weekDaysOnTarget(counts, 8000, "2026-10-17", true)).toEqual({
      hit: 2,
      of: 5,
      mean: 23000 / 3,
    });
    expect(weekDaysOnTarget(counts, 8000, "2026-10-17", false).of).toBe(6);
  });
});

describe("the goals in force", () => {
  const g = (source: string, since: string, until: string | null = null): GoalRow => ({
    id: source + since,
    source,
    metric: {},
    target: "at_least",
    value: 1,
    low: null,
    high: null,
    by: null,
    since,
    until,
  });
  it("keeps the latest started per metric, not yet ended", () => {
    const got = inForce(
      [
        g("weight", "2026-10-10"),
        g("weight", "2026-10-12"),
        g("steps", "2026-10-20"),
        g("read", "2026-10-01", "2026-10-05"),
      ],
      "2026-10-17",
    );
    expect(got.map((x) => x.id)).toEqual(["weight2026-10-12"]);
  });
});

describe("the numbers a goal reads", () => {
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
    const add = async (
      owner: Owner,
      day: string,
      status: "done" | "planned",
      kg: string,
    ) => {
      const [e] = await db
        .insert(s.entries)
        .values({ userId: owner.id, kind: "weigh_in", day, status })
        .returning({ id: s.entries.id });
      await db
        .insert(s.entryValues)
        .values({ userId: owner.id, entryId: e!.id, field: "weightKg", num: kg });
    };
    await add(a, "2026-10-15", "done", "78.4");
    await add(a, "2026-10-16", "planned", "70");
    await add(a, "2026-09-01", "done", "80");
    await add(b, "2026-10-15", "done", "60");
    for (const [cat, h] of [
      ["study", 2],
      ["work", 3],
    ] as const) {
      const [e] = await db
        .insert(s.entries)
        .values({
          userId: a.id,
          kind: "activity",
          day: "2026-10-14",
          status: "done",
          startAt: new Date("2026-10-14T08:00:00Z"),
          endAt: new Date(Date.parse("2026-10-14T08:00:00Z") + h * 3600000),
        })
        .returning({ id: s.entries.id });
      await db
        .insert(s.entryValues)
        .values({ userId: a.id, entryId: e!.id, field: "category", text: cat });
    }
  });
  afterAll(() => close());

  it("reads one field of the owner's done entries in the range", async () => {
    expect(
      await readNumbers(db, a, "weigh_in", "weightKg", "2026-10-01", "2026-10-17"),
    ).toEqual([{ day: "2026-10-15", n: 78.4 }]);
  });

  it("starts a new goal today, in force over the old one of its metric", async () => {
    await createGoal(
      db,
      a,
      { kind: "steps", value: "6000", by: null, weekdays: false },
      "2026-10-10",
    );
    await createGoal(
      db,
      a,
      { kind: "steps", value: "8000", by: null, weekdays: true },
      "2026-10-17",
    );
    const got = await readGoals(db, a, "2026-10-17");
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({
      source: "steps",
      value: 8000,
      metric: { days: "weekdays" },
    });
    expect(await readGoals(db, b, "2026-10-17")).toEqual([]);
  });

  it("adds the minutes of the intervals of one category", async () => {
    expect(
      await readMinutes(
        db,
        a,
        "activity",
        "category",
        "study",
        "2026-10-12",
        "2026-10-17",
      ),
    ).toBe(120);
  });
});

describe("a new goal", () => {
  it("checks the value by kind and the weight's date", () => {
    expect(
      checkGoal(
        { kind: "weight", value: "72,5", by: "2026-12-20", weekdays: "" },
        "2026-10-17",
      ),
    ).toEqual({
      ok: true,
      kind: "weight",
      value: "72.5",
      by: "2026-12-20",
      weekdays: false,
    });
    expect(
      checkGoal(
        { kind: "steps", value: "8000", by: "2026-12-20", weekdays: "yes" },
        "2026-10-17",
      ),
    ).toMatchObject({
      by: null,
      weekdays: true,
    });
    expect(
      checkGoal(
        { kind: "weight", value: "7", by: "2026-10-01", weekdays: "" },
        "2026-10-17",
      ),
    ).toEqual({
      ok: false,
      at: { value: true, by: true },
    });
    expect(
      checkGoal({ kind: "x", value: "1", by: "", weekdays: "" }, "2026-10-17"),
    ).toEqual({ ok: false, at: { kind: true } });
  });
});
