import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readCreatineDoses } from "./creatine-read";

describe("the creatine eaten, by its compound (dossiers/compounds.md §4)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;

  const meal = async (
    owner: Owner,
    day: string,
    itemId: string,
    name: string,
    quantity: string,
    over: { servings?: string; status?: "done" | "planned" } = {},
  ) => {
    const [{ id }] = (await db
      .insert(s.entries)
      .values({ userId: owner.id, kind: "intake", day, status: over.status ?? "done" })
      .returning({ id: s.entries.id })) as [{ id: string }];
    await db.insert(s.entryLines).values({
      userId: owner.id,
      entryId: id,
      position: 0,
      itemId,
      name,
      quantity,
      unit: "g",
    });
    if (over.servings)
      await db
        .insert(s.entryValues)
        .values({ userId: owner.id, entryId: id, field: "servings", num: over.servings });
  };

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
    const food = async (owner: Owner, name: string, creatine?: string) => {
      const [{ id }] = (await db
        .insert(s.catalogItems)
        .values({ userId: owner.id, catalog: "food", name })
        .returning({ id: s.catalogItems.id })) as [{ id: string }];
      if (creatine)
        await db
          .insert(s.catalogValues)
          .values({ userId: owner.id, itemId: id, field: "creatine", num: creatine });
      return id;
    };
    const mono = await food(a, "Creatina monoidrato", "100");
    // A pre-workout named without «creatin»: 30 % creatine by weight.
    const mix = await food(a, "Pre-allenamento", "30");
    const oats = await food(a, "Avena");
    await meal(a, "2026-11-01", mono, "Creatina monoidrato", "3.41");
    await meal(a, "2026-11-02", mono, "Creatina monoidrato", "1.70", { servings: "2" });
    await meal(a, "2026-11-02", mix, "Pre-allenamento", "10");
    await meal(a, "2026-11-03", mono, "Creatina monoidrato", "5", { status: "planned" });
    await meal(a, "2026-11-03", oats, "Creatina? no, avena", "80");
    await meal(b, "2026-11-01", await food(b, "Creatina", "100"), "Creatina", "5");
  });
  afterAll(() => close());

  it("sums each day's grams by the food's compound and servings, done only, the owner's", async () => {
    const doses = await readCreatineDoses(db, a, "2026-11-03");
    expect([...doses].map(([d, g]) => [d, Math.round(g * 100) / 100])).toEqual([
      ["2026-11-01", 3.41],
      ["2026-11-02", 6.4],
    ]);
  });
});
