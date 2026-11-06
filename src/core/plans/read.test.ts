import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readDayPlans } from "./read";

describe("reading what each day is supposed to be", () => {
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
    const tpl = async (
      owner: Owner,
      scope: "day" | "cycle",
      name: string,
      start?: string,
    ) =>
      (
        await db
          .insert(s.templates)
          .values({
            userId: owner.id,
            scope,
            name,
            ...(start ? { startDay: start } : {}),
          })
          .returning({ id: s.templates.id })
      )[0]!.id;
    const rest = await tpl(a, "day", "Rest");
    await db.insert(s.weekLayouts).values(
      [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
        userId: a.id,
        weekday,
        templateId: rest,
      })),
    );
    const cycle = await tpl(a, "cycle", "PLPRR", "2026-10-20");
    await db.insert(s.cyclesState).values({ userId: a.id, cycleId: cycle });
    const [pull] = await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "routine", name: "Pull" })
      .returning({ id: s.catalogItems.id });
    const [first] = await db
      .insert(s.cycleSteps)
      .values({ userId: a.id, cycleId: cycle, position: 0, label: "" })
      .returning({ id: s.cycleSteps.id });
    await db
      .insert(s.cycleStepItems)
      .values({ userId: a.id, stepId: first!.id, position: 0, itemId: pull!.id });
    await db
      .insert(s.cycleSteps)
      .values({ userId: a.id, cycleId: cycle, position: 1, label: "Legs" });
    await tpl(b, "day", "Other");
  });
  afterAll(() => close());

  it("the week's model and, from today, the cycle's step and the one after", async () => {
    const p = await readDayPlans(db, a, "2026-10-19", "2026-10-25", "2026-10-23");
    expect(p.get("2026-10-19")!.model?.name).toBe("Rest");
    expect(p.get("2026-10-22")!.cycles).toEqual([]);
    // The first step holds a routine never done since the 20th: it waits, and,
    // having no label, it is named by the routine.
    expect(p.get("2026-10-23")!.cycles[0]).toMatchObject({
      cycle: "PLPRR",
      label: "Pull",
      next: "Legs",
    });
    expect(p.get("2026-10-23")!.cycles[0]!.next).not.toBeNull();
  });

  it("another person's models are not read", async () => {
    const p = await readDayPlans(db, b, "2026-10-19", "2026-10-25", "2026-10-23");
    expect(p.get("2026-10-23")).toEqual({ model: null, cycles: [] });
  });
});
