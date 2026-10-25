import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readUsualMeals } from "./usual";

describe("reading the meals for «di solito»", () => {
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

  it("done and timed meals, their saved meal and foods in order, the owner's only", async () => {
    const [r] = await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "recipe", name: "Porridge" })
      .returning({ id: s.catalogItems.id });
    const [m] = await db
      .insert(s.entries)
      .values({
        userId: a.id,
        kind: "meal",
        day: "2026-10-20",
        status: "done",
        itemId: r!.id,
        startAt: new Date("2026-10-20T06:15:00Z"),
      })
      .returning({ id: s.entries.id });
    await db.insert(s.entries).values({
      userId: a.id,
      kind: "meal",
      day: "2026-10-20",
      status: "planned",
      startAt: new Date("2026-10-20T10:00:00Z"),
    });
    await db.insert(s.entryLines).values([
      {
        userId: a.id,
        entryId: m!.id,
        position: 1,
        name: "Latte",
        quantity: "200",
        unit: "ml",
      },
      {
        userId: a.id,
        entryId: m!.id,
        position: 0,
        name: "Avena",
        quantity: "50",
        unit: "g",
      },
    ]);
    const clock = { timeZone: "Europe/Rome", boundaryMin: 240 };
    expect(await readUsualMeals(db, a, "2026-10-19", "2026-10-21", clock)).toEqual([
      {
        id: m!.id,
        day: "2026-10-20",
        minute: 495,
        recipe: "Porridge",
        foods: ["Avena", "Latte"],
      },
    ]);
    expect(await readUsualMeals(db, b, "2026-10-19", "2026-10-21", clock)).toEqual([]);
  });
});
