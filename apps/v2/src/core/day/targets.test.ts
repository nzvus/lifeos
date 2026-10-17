import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { V1Export } from "../convert/context";
import { convert } from "../convert/convert";
import { loadFile } from "../convert/load";
import type { Db } from "../db/db";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import {
  readDayTargets,
  readRangeTargets,
  targetsOn,
  type TargetDecision,
} from "./targets";

const week: TargetDecision = {
  kind: "week_targets",
  day: "2026-10-06",
  payload: {
    kcal: "2400",
    protein: "160",
    fat: "70",
    carbs: "280",
    fibre: "35",
    shifts: [{ day: "2026-10-07", shiftKcal: 150 }],
  },
};

describe("the targets in force on a day", () => {
  it("takes the accepted week for its 7 days, with the day's shift on the carbs", () => {
    expect(targetsOn([week], "2026-10-12")).toEqual({
      from: "week",
      since: "2026-10-06",
      kcal: 2400,
      protein: 160,
      carbs: 280,
      fat: 70,
      fibre: 35,
      sugars: 108,
      saturatedFat: 27,
      salt: 5,
    });
    expect(targetsOn([week], "2026-10-07")).toMatchObject({
      kcal: 2550,
      carbs: 318,
      protein: 160,
      sugars: 115,
    });
    expect(targetsOn([week], "2026-10-13")).toBeNull();
    expect(targetsOn([week], "2026-10-05")).toBeNull();
  });

  it("prefers the day's own copy, and the latest week before the day", () => {
    const own: TargetDecision = {
      kind: "day_targets",
      day: "2026-10-08",
      payload: { kcal: "2600.000", salt: "4" },
    };
    expect(targetsOn([week, own], "2026-10-08")).toEqual({
      from: "day",
      since: "2026-10-08",
      kcal: 2600,
      protein: null,
      carbs: null,
      fat: null,
      fibre: null,
      sugars: 117,
      saturatedFat: 29,
      salt: 4,
    });
    const next = { ...week, day: "2026-10-09", payload: { kcal: 2000 } };
    expect(targetsOn([week, next], "2026-10-10")?.kcal).toBe(2000);
  });

  it("has none without a kcal, or with no decision", () => {
    expect(
      targetsOn([{ ...week, payload: { protein: "160" } }], "2026-10-07"),
    ).toBeNull();
    expect(targetsOn([], "2026-10-07")).toBeNull();
  });
});

describe("reading the targets (converted v1 decisions)", () => {
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
    const v1 = JSON.parse(
      readFileSync(
        new URL("../convert/fixtures/v1-everything.json", import.meta.url),
        "utf8",
      ),
    ) as V1Export;
    await loadFile(db as never, convert(v1, new Date("2026-10-17T12:00:00Z")), a.id);
  });
  afterAll(() => close());

  it("finds v1's fixed day and its accepted week with the shift", async () => {
    expect(await readDayTargets(db, a, "2026-10-10")).toMatchObject({
      from: "day",
      kcal: 2600,
    });
    expect(await readDayTargets(db, a, "2026-10-07")).toMatchObject({
      from: "week",
      kcal: 2550,
      carbs: 318,
    });
    expect(await readDayTargets(db, a, "2026-10-13")).toBeNull();
    const range = await readRangeTargets(db, a, "2026-10-05", "2026-10-13");
    for (const [d, t] of range) expect(t).toEqual(await readDayTargets(db, a, d));
  });

  it("never reads another user's decisions", async () => {
    expect(await readDayTargets(db, b, "2026-10-10")).toBeNull();
    expect(await readDayTargets(db, b, "2026-10-07")).toBeNull();
  });
});
