import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { addStep, createCycle } from "./cycles-repo";
import { setCycleOverride, setCycleSkip, setDayModel } from "./day-changes";
import { createModel, setWeekdays } from "./models-repo";
import { readDayPlans } from "./read";

describe("changing one day", () => {
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

  it("another model for the day, then back to the week's", async () => {
    const work = await createModel(db, a, "Lavoro", null);
    const rest = await createModel(db, a, "Riposo", null);
    await setWeekdays(db, a, work, [1, 2, 3, 4, 5, 6, 7]);
    const day = "2026-10-21";
    const model = async () => (await readDayPlans(db, a, day, day, day)).get(day)!.model;
    expect(await model()).toMatchObject({ name: "Lavoro", from: "week" });
    expect(await setDayModel(db, a, day, rest)).toBe(true);
    expect(await model()).toMatchObject({ name: "Riposo", from: "day" });
    expect(await setDayModel(db, b, day, rest)).toBe(false);
    await setDayModel(db, a, day, null);
    expect(await model()).toMatchObject({ name: "Lavoro" });
  });

  it("a cycle's step skipped, and not", async () => {
    const id = await createCycle(db, a, "AB", "2026-10-20");
    const [push] = await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "routine", name: "Push" })
      .returning({ id: s.catalogItems.id });
    await addStep(db, a, id, push!.id);
    const day = "2026-10-22";
    const step = async () =>
      (await readDayPlans(db, a, day, day, day)).get(day)!.cycles[0]!;
    expect(await setCycleSkip(db, a, day, id, true)).toBe(true);
    expect((await step()).skipped).toBe(true);
    expect(await setCycleSkip(db, b, day, id, true)).toBe(false);
    await setCycleSkip(db, a, day, id, false);
    expect((await step()).skipped).toBe(false);
  });

  it("a step chosen by hand, a rest, and back", async () => {
    const [pull, legs] = await db
      .insert(s.catalogItems)
      .values([
        { userId: a.id, catalog: "routine", name: "Pull" },
        { userId: a.id, catalog: "routine", name: "Legs" },
      ])
      .returning({ id: s.catalogItems.id });
    const id = await createCycle(db, a, "PL", "2026-10-26");
    await addStep(db, a, id, pull!.id);
    await addStep(db, a, id, legs!.id);
    const day = "2026-10-26";
    const step = async () =>
      (await readDayPlans(db, a, day, day, day))
        .get(day)!
        .cycles.find((c) => c.cycleId === id)!;
    expect((await step()).label).toBe("Pull");
    await setCycleOverride(db, a, day, id, 1);
    expect((await step()).label).toBe("Legs");
    await setCycleOverride(db, a, day, id, null);
    expect((await step()).rest).toBe(true);
    expect(await setCycleOverride(db, b, day, id, 0)).toBe(false);
    await setCycleOverride(db, a, day, id, undefined);
    expect((await step()).label).toBe("Pull");
  });
});
