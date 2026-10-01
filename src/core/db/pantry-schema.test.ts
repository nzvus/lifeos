/**
 * Tests for migration 0014 (ADR-0017): the database itself refuses what the
 * pantry must never hold, before any repository exists — cross-user links,
 * a product counted in pieces feeding an ingredient's grams, a stock count
 * of nothing, a batch of zero portions.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "./client";
import { batches, logEntries, products, stockCounts } from "./schema";
import type { Owner } from "../identity/owner";
import { createIngredient } from "../nutrition/repositories/ingredients";
import { createTestDb, createTestUser, ingredientFixture } from "../testing/test-db";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;
let oatsId: string;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
  const oats = await createIngredient(db, me, ingredientFixture());
  if (!oats.ok) throw new Error("setup failed");
  oatsId = oats.value.id;
});
afterEach(() => close());

const product = (userId: string, v: Partial<typeof products.$inferInsert> = {}) => ({
  userId,
  name: "Fiocchi d'avena 500 g",
  unit: "g" as const,
  packageSize: "500",
  ...v,
});

describe("pantry schema (migration 0014)", () => {
  it("links my product to my ingredient, never to someone else's", async () => {
    await db.insert(products).values(product(me.id, { ingredientId: oatsId }));
    await expect(
      db.insert(products).values(product(other.id, { ingredientId: oatsId })),
    ).rejects.toThrow();
  });

  it("a product counted in pieces can't feed an ingredient's grams", async () => {
    await expect(
      db.insert(products).values(product(me.id, { unit: "piece", ingredientId: oatsId })),
    ).rejects.toThrow();
    // Without an ingredient (detergent, paper…) pieces are fine.
    await db
      .insert(products)
      .values(product(me.id, { name: "Carta ×8", unit: "piece", packageSize: "8" }));
  });

  it("a stock count is of exactly one ingredient or product", async () => {
    const [p] = await db.insert(products).values(product(me.id)).returning();
    const at = new Date("2026-10-01T10:00:00Z");
    await db
      .insert(stockCounts)
      .values({ userId: me.id, at, ingredientId: oatsId, quantity: "250" });
    await expect(
      db.insert(stockCounts).values({ userId: me.id, at, quantity: "1" }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(stockCounts)
        .values({
          userId: me.id,
          at,
          ingredientId: oatsId,
          productId: p!.id,
          quantity: "1",
        }),
    ).rejects.toThrow();
  });

  it("a batch has portions, and a log entry can take one", async () => {
    const at = new Date("2026-10-01T18:00:00Z");
    await expect(
      db
        .insert(batches)
        .values({
          userId: me.id,
          label: "Riso",
          portions: 0,
          cookedAt: at,
          day: "2026-10-01",
        }),
    ).rejects.toThrow();
    const [b] = await db
      .insert(batches)
      .values({
        userId: me.id,
        label: "Riso e pollo",
        portions: 4,
        cookedAt: at,
        day: "2026-10-01",
      })
      .returning();
    const [e] = await db
      .insert(logEntries)
      .values({ userId: me.id, day: "2026-10-02", label: "Riso e pollo", batchId: b!.id })
      .returning();
    expect(e?.batchId).toBe(b!.id);
  });
});
