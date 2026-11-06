import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readKindTable } from "./csv";

describe("one kind's entries as a table", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    const [w, m] = (await db
      .insert(s.entries)
      .values([
        {
          userId: a.id,
          kind: "weigh_in",
          day: "2026-10-23",
          status: "done",
          startAt: new Date("2026-10-23T06:20:00Z"),
        },
        { userId: a.id, kind: "meal", day: "2026-10-23", status: "done", note: "cena" },
      ])
      .returning({ id: s.entries.id })) as [{ id: string }, { id: string }];
    await db.insert(s.entryValues).values([
      { userId: a.id, entryId: w.id, field: "weightKg", num: "75.6" },
      { userId: a.id, entryId: w.id, field: "fasted", bool: true },
      { userId: a.id, entryId: m.id, field: "servings", num: "2" },
      { userId: a.id, entryId: m.id, field: "role", text: "dinner" },
    ]);
    const [l] = (await db
      .insert(s.entryLines)
      .values({
        userId: a.id,
        entryId: m.id,
        position: 0,
        name: "Avena",
        quantity: "50",
        unit: "g",
      })
      .returning({ id: s.entryLines.id })) as [{ id: string }];
    await db.insert(s.entryLineValues).values([
      { userId: a.id, lineId: l.id, field: "kcal", num: "372" },
      { userId: a.id, lineId: l.id, field: "protein", num: "13.5" },
    ]);
  });
  afterAll(() => close());

  it("a plain kind: a row per entry, its fields as columns, local times", async () => {
    const t = await readKindTable(db, a, "weigh_in", "Europe/Rome");
    expect(t.header).toEqual([
      "giorno",
      "inizio",
      "fine",
      "stato",
      "fasted",
      "weightKg",
      "nota",
    ]);
    expect(t.rows).toEqual([["2026-10-23", "08:20", "", "done", "sì", "75.6", ""]]);
  });

  it("a meal: a row per food, nutrients in the amount eaten", async () => {
    const t = await readKindTable(db, a, "meal", "Europe/Rome");
    expect(t.rows[0]!.slice(4, 10)).toEqual([
      "dinner",
      "Avena",
      "100",
      "g",
      "372",
      "13.5",
    ]);
  });
});
