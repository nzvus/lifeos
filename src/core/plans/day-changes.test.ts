import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { addStep, createCycle } from "./test-cycles";
import { setCycleOverride, setCycleSkip, setCycleTime } from "./day-changes";
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

  it("PL-43: «Sposta questa volta» keeps the step chosen by hand, and back", async () => {
    const [pull, legs] = await db
      .insert(s.catalogItems)
      .values([
        { userId: a.id, catalog: "routine", name: "Upper" },
        { userId: a.id, catalog: "routine", name: "Lower" },
      ])
      .returning({ id: s.catalogItems.id });
    const id = await createCycle(db, a, "PL2", "2026-11-02");
    await addStep(db, a, id, pull!.id);
    await addStep(db, a, id, legs!.id);
    const day = "2026-11-02";
    const step = async () =>
      (await readDayPlans(db, a, day, day, day))
        .get(day)!
        .cycles.find((c) => c.cycleId === id)!;
    expect((await step()).at).toEqual({});
    // A time alone keeps the ciclo's own step (never read as a rest).
    expect(await setCycleTime(db, a, day, id, "step", 18 * 60)).toBe(true);
    await setCycleTime(db, a, day, id, "b-1", 600);
    expect(await step()).toMatchObject({
      label: "Upper",
      rest: false,
      at: { step: 1080, "b-1": 600 },
    });
    // The step changed by hand keeps the times, and the other way round.
    await setCycleOverride(db, a, day, id, 1);
    expect(await step()).toMatchObject({ label: "Lower", at: { step: 1080 } });
    await setCycleTime(db, a, day, id, "step", null);
    await setCycleTime(db, a, day, id, "b-1", null);
    expect(await step()).toMatchObject({ label: "Lower", at: {} });
    await setCycleOverride(db, a, day, id, undefined);
    expect(await step()).toMatchObject({ label: "Upper", at: {} });
    expect(await setCycleTime(db, b, day, id, "step", 600)).toBe(false);
    expect(await setCycleTime(db, a, day, id, "step", -5)).toBe(false);
  });
});
