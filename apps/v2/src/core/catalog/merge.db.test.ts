import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { mergeItems, mergePreview } from "./merge";

describe("«Unisci» (capture.md §4, data-repair R5)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  const item = async (o: Owner, name: string, catalog = "exercise") =>
    (
      (await db
        .insert(s.catalogItems)
        .values({ userId: o.id, catalog, name })
        .returning({ id: s.catalogItems.id })) as [{ id: string }]
    )[0].id;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
  });
  afterAll(() => close());

  it("Run into Corsa: its sessions move, the guide comes along, «Run» stays as an alias", async () => {
    const corsa = await item(a, "Corsa");
    const run = await item(a, "Run");
    await db.insert(s.catalogValues).values([
      { userId: a.id, itemId: corsa, field: "pattern", text: "run" },
      { userId: a.id, itemId: run, field: "pattern", text: "run" },
      { userId: a.id, itemId: run, field: "guide", text: "Passo regolare." },
    ]);
    const sessions = await db
      .insert(s.entries)
      .values(
        ["2026-10-20", "2026-10-22"].map((day) => ({
          userId: a.id,
          kind: "session_exercise",
          day,
          status: "done" as const,
          itemId: run,
        })),
      )
      .returning({ id: s.entries.id });

    expect(await mergePreview(db, a, run)).toEqual({ entries: 2, lines: 0, plans: 0 });
    const r = await mergeItems(db, a, corsa, run);
    expect(r?.moved.entries).toBe(2);

    const moved = await db
      .select()
      .from(s.entries)
      .where(eq(s.entries.id, sessions[0]!.id));
    expect(moved[0]!.itemId).toBe(corsa);
    const values = Object.fromEntries(
      (
        await db.select().from(s.catalogValues).where(eq(s.catalogValues.itemId, corsa))
      ).map((v) => [v.field, v.text]),
    );
    expect(values).toEqual({ pattern: "run", guide: "Passo regolare.", aliases: "Run" });
    const gone = (
      await db.select().from(s.catalogItems).where(eq(s.catalogItems.id, run))
    )[0]!;
    expect(gone.archivedAt).not.toBeNull();
    expect(gone.deletedAt).toBeNull();
  });

  it("never across catalogs, owners, or an item into itself", async () => {
    const x = await item(a, "Tapis roulant");
    const food = await item(a, "Avena", "food");
    const other = await item(b, "Treadmill");
    expect(await mergeItems(db, a, x, food)).toBeNull();
    expect(await mergeItems(db, a, x, other)).toBeNull();
    expect(await mergeItems(db, a, x, x)).toBeNull();
  });
});
