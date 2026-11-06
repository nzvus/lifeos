import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { addStep, createCycle, moveStep, readCycleBook, saveCycle } from "./cycles-repo";
import { readDayPlans } from "./read";

describe("cycles, written and read back", () => {
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

  it("steps added, moved, taken out; rules saved; the day's step follows", async () => {
    const [push, pull] = await db
      .insert(s.catalogItems)
      .values([
        { userId: a.id, catalog: "routine", name: "Push" },
        { userId: a.id, catalog: "routine", name: "Pull" },
      ])
      .returning({ id: s.catalogItems.id });
    const id = await createCycle(db, a, "PPR", "2026-10-20");
    expect(await addStep(db, a, id, push!.id)).toBe(true);
    expect(await addStep(db, a, id, pull!.id)).toBe(true);
    expect(await addStep(db, a, id, null)).toBe(true);
    // Another person's routine or cycle: refused.
    expect(await addStep(db, b, id, null)).toBe(false);
    let c = (await readCycleBook(db, a)).cycles[0]!;
    expect(c.steps.map((x) => x.items[0]?.name ?? x.label)).toEqual([
      "Push",
      "Pull",
      "Riposo",
    ]);
    expect(await moveStep(db, a, id, c.steps[2]!.id, -1)).toBe(true);
    c = (await readCycleBook(db, a)).cycles[0]!;
    expect(c.steps.map((x) => [x.position, x.items[0]?.name ?? x.label])).toEqual([
      [0, "Push"],
      [1, "Riposo"],
      [2, "Pull"],
    ]);
    expect(await moveStep(db, b, id, c.steps[0]!.id, 0)).toBe(false);
    await moveStep(db, a, id, c.steps[1]!.id, 0);
    c = (await readCycleBook(db, a)).cycles[0]!;
    expect(c.steps.map((x) => [x.position, x.items[0]?.name])).toEqual([
      [0, "Push"],
      [1, "Pull"],
    ]);
    expect(
      await saveCycle(db, a, id, {
        name: "PP",
        start: "2026-10-20",
        active: true,
        advance: "date",
        onSkip: "shift",
      }),
    ).toBe(true);
    c = (await readCycleBook(db, a)).cycles[0]!;
    expect(c).toMatchObject({ name: "PP", advance: "date", onSkip: "shift" });
    expect((await readCycleBook(db, a)).routines.map((r) => r.name)).toEqual([
      "Pull",
      "Push",
    ]);
    // By date from the 20th: the 21st holds the second step.
    const plans = await readDayPlans(db, a, "2026-10-21", "2026-10-21", "2026-10-21");
    expect(plans.get("2026-10-21")!.cycles[0]).toMatchObject({
      cycle: "PP",
      label: "Pull",
    });
    expect((await readCycleBook(db, b)).cycles).toEqual([]);
  });
});
