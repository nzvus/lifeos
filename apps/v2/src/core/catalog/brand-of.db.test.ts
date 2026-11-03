import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readFoodChoices } from "../food/catalog";
import { brandInName, makeBrandOf } from "./brand-of";

// objects.md §8 test 2: «Passata di pomodoro (Mutti)» becomes the brand Mutti.
describe("«È una marca di…» (ADR-0060)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let keep: string;
  let gone: string;
  let line: string;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    const ids = (await db
      .insert(s.catalogItems)
      .values([
        { userId: a.id, catalog: "food", name: "Passata di pomodoro" },
        { userId: a.id, catalog: "food", name: "Passata di pomodoro (Mutti)" },
      ])
      .returning({ id: s.catalogItems.id })) as { id: string }[];
    keep = ids[0]!.id;
    gone = ids[1]!.id;
    await db.insert(s.catalogValues).values([
      { userId: a.id, itemId: keep, field: "kcal", num: "30" },
      { userId: a.id, itemId: gone, field: "kcal", num: "36" },
    ]);
    const [e] = (await db
      .insert(s.entries)
      .values({
        userId: a.id,
        kind: "meal",
        day: "2026-10-20",
        status: "done",
        source: "typed",
      })
      .returning({ id: s.entries.id })) as { id: string }[];
    const [l] = (await db
      .insert(s.entryLines)
      .values({
        userId: a.id,
        entryId: e!.id,
        position: 0,
        itemId: gone,
        name: "Passata (Mutti)",
        quantity: "100",
        unit: "g",
      })
      .returning({ id: s.entryLines.id })) as { id: string }[];
    line = l!.id;
    await db
      .insert(s.entryLineValues)
      .values({ userId: a.id, lineId: line, field: "kcal", num: "36" });
  });
  afterAll(() => close());

  it("reads the brand in the name", () => {
    expect(brandInName("Passata di pomodoro (Mutti)")).toBe("Mutti");
    expect(brandInName("Ceci lessati")).toBeNull();
  });

  it("the Mutti food becomes the brand Mutti with its 36 kcal; the past line keeps 36 and gets its brand", async () => {
    expect(await makeBrandOf(db, a, gone, keep, "Mutti")).toBe(true);
    const c = await readFoodChoices(db, a, "2026-11-03");
    const mutti = c.find((x) => x.brand === "Mutti");
    expect(mutti?.foodId).toBe(keep);
    expect(Number(mutti?.per100["kcal"])).toBe(36);
    expect(c.some((x) => x.key === gone)).toBe(false);
    const [l] = await db.select().from(s.entryLines).where(eq(s.entryLines.id, line));
    expect([l?.itemId, l?.productId]).toEqual([keep, mutti?.productId]);
    const [v] = await db
      .select()
      .from(s.entryLineValues)
      .where(eq(s.entryLineValues.lineId, line));
    expect(Number(v?.num)).toBe(36);
    expect(await makeBrandOf(db, a, keep, keep, "x")).toBe(false);
  });
});
