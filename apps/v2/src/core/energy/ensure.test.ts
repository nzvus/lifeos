import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { addDays } from "../engines/time";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { ensureWeekTargets, recomputeWeekTargets } from "./ensure";
import { readEnergyRows } from "./read";

const clock = { timeZone: "Europe/Rome", boundaryMin: 240 };
const today = "2026-10-24"; // a Saturday: the week's Monday is the 19th

describe("this week's automatic targets", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  const weekRows = (owner: Owner) =>
    db
      .select({ payload: s.decisions.payload })
      .from(s.decisions)
      .where(and(eq(s.decisions.userId, owner.id), eq(s.decisions.kind, "week_targets")));

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
    await db
      .insert(s.settings)
      .values({ userId: a.id, sex: "male", birthYear: 2003, heightCm: "183" });
    // Four weeks before the 19th: a fasted weigh-in at 76 kg and 2 500 kcal a day.
    for (let i = 1; i <= 28; i++) {
      const day = addDays("2026-10-19", -i);
      const [w] = await db
        .insert(s.entries)
        .values({ userId: a.id, kind: "weigh_in", day, status: "done" })
        .returning({ id: s.entries.id });
      await db.insert(s.entryValues).values([
        { userId: a.id, entryId: w!.id, field: "weightKg", num: "76" },
        { userId: a.id, entryId: w!.id, field: "fasted", bool: true },
        { userId: a.id, entryId: w!.id, field: "afterToilet", bool: true },
      ]);
      const [m] = await db
        .insert(s.entries)
        .values({ userId: a.id, kind: "meal", day, status: "done" })
        .returning({ id: s.entries.id });
      const [l] = await db
        .insert(s.entryLines)
        .values({
          userId: a.id,
          entryId: m!.id,
          position: 0,
          name: "Giorno",
          quantity: "100",
          unit: "g",
        })
        .returning({ id: s.entryLines.id });
      await db
        .insert(s.entryLineValues)
        .values({ userId: a.id, lineId: l!.id, field: "kcal", num: "2500" });
      await db.insert(s.decisions).values({ userId: a.id, kind: "day_closed", day });
    }
  });
  afterAll(() => close());

  it("reads only the kcal of each meal, and the owner's", async () => {
    const rows = await readEnergyRows(db, a, "2026-09-21", "2026-10-18");
    expect(rows.meals).toHaveLength(28);
    expect(rows.meals[0]).toMatchObject({ kcal: 2500, estimated: false });
    expect(rows.closed).toHaveLength(28);
    expect(rows.profile).toEqual({ sex: "male", birthYear: 2003, heightCm: 183 });
    expect((await readEnergyRows(db, b, "2026-09-21", "2026-10-18")).meals).toEqual([]);
  });

  it("is made once, on Monday, and read back after", async () => {
    const first = (await ensureWeekTargets(db, a, today, clock))!;
    expect(first).toMatchObject({ source: "auto", from: "2026-08-24", to: "2026-10-18" });
    expect(Math.abs(Number(first["expenditureKcal"]) - 2500)).toBeLessThan(200);
    await ensureWeekTargets(db, a, today, clock);
    expect(await weekRows(a)).toHaveLength(1);
    expect(await ensureWeekTargets(db, b, today, clock)).toBeNull();
    expect(await weekRows(b)).toEqual([]);
  });

  it("«Ricalcola» makes an automatic week again, never a v1 check-in", async () => {
    await recomputeWeekTargets(db, a, today, clock);
    expect(await weekRows(a)).toHaveLength(1);
    await db
      .update(s.decisions)
      .set({ payload: { kcal: "2778" } })
      .where(and(eq(s.decisions.userId, a.id), eq(s.decisions.kind, "week_targets")));
    expect(await recomputeWeekTargets(db, a, today, clock)).toEqual({ kcal: "2778" });
  });
});
