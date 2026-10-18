import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readCycles, useCycle } from "./cycles";

describe("the cycles", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  let ppl: string;
  let fb: string;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
    const [push] = await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "routine", name: "Push" })
      .returning({ id: s.catalogItems.id });
    [{ id: ppl }, { id: fb }] = (await db
      .insert(s.templates)
      .values([
        {
          userId: a.id,
          scope: "cycle",
          name: "PPL",
          active: true,
          startDay: "2026-10-08",
        },
        {
          userId: a.id,
          scope: "cycle",
          name: "Full body",
          active: false,
          targets: { notes: "A e B" },
        },
      ])
      .returning({ id: s.templates.id })) as [{ id: string }, { id: string }];
    const [step] = await db
      .insert(s.cycleSteps)
      .values([
        { userId: a.id, cycleId: ppl, position: 0, label: "" },
        { userId: a.id, cycleId: ppl, position: 1, label: "Riposo" },
      ])
      .returning({ id: s.cycleSteps.id });
    await db
      .insert(s.cycleStepItems)
      .values({ userId: a.id, stepId: step!.id, position: 0, itemId: push!.id });
  });
  afterAll(() => close());

  it("reads each cycle's steps with their routines, the one in use first", async () => {
    const got = await readCycles(db, a);
    expect(got.map((c) => [c.name, c.active])).toEqual([
      ["PPL", true],
      ["Full body", false],
    ]);
    expect(got[0]!.steps).toEqual([
      { position: 0, label: "", items: ["Push"] },
      { position: 1, label: "Riposo", items: [] },
    ]);
    expect(got[1]!.notes).toBe("A e B");
    expect(await readCycles(db, b)).toEqual([]);
  });

  it("puts one in use from today and the others aside", async () => {
    expect(await useCycle(db, b, fb, "2026-10-17")).toBe(false);
    expect(await useCycle(db, a, fb, "2026-10-17")).toBe(true);
    const got = await readCycles(db, a);
    expect(got.map((c) => [c.name, c.active, c.startDay])).toEqual([
      ["Full body", true, "2026-10-17"],
      ["PPL", false, "2026-10-08"],
    ]);
  });
});
