/** The ledger (ADR-0036): starter categories, movements, mine only, the trash. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { eq } from "drizzle-orm";
import { moneyLines, products } from "../../db/schema";
import { createTestDb, createTestUser } from "../../testing/test-db";
import { parseInput } from "../../shared/validation";
import { movementInput, parseTags } from "../validation";
import {
  addMovement,
  deleteMovement,
  ensureCategories,
  getMovement,
  listMovements,
  restoreMovement,
  updateMovement,
} from "./money";

let db: Db;
let close: () => Promise<void>;
let me: Owner;
let other: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  me = await createTestUser(db, "me@example.com");
  other = await createTestUser(db, "other@example.com");
});
afterEach(() => close());

const input = (v: Record<string, string>) => {
  const r = parseInput(movementInput, { day: "2026-10-04", kind: "expense", ...v });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.value;
};

describe("movementInput", () => {
  it("turns euros into signed exact cents and words into tags", () => {
    expect(input({ amount: "12,35", tags: "#Viaggio, viaggio lavoro" })).toMatchObject({
      amountCents: -1235,
      tags: ["viaggio", "lavoro"],
    });
    expect(input({ amount: "1800", kind: "income" }).amountCents).toBe(180000);
    expect(
      parseInput(movementInput, { day: "2026-10-04", kind: "expense", amount: "1.234" })
        .ok,
    ).toBe(false);
    expect(
      parseInput(movementInput, { day: "2026-10-04", kind: "expense", amount: "0" }).ok,
    ).toBe(false);
    expect(parseTags("a b c d e f g h i j k l")).toHaveLength(10);
  });
});

describe("the ledger", () => {
  it("starts with the starter categories, once, in the account's language", async () => {
    const cats = await ensureCategories(db, me, "it");
    expect(cats.find((c) => c.key === "groceries")?.name).toBe("Spesa alimentare");
    expect(cats.filter((c) => c.parentId).length).toBeGreaterThan(10);
    expect((await ensureCategories(db, me, "it")).length).toBe(cats.length);
    expect(
      (await ensureCategories(db, other, "en")).find((c) => c.key === "groceries")?.name,
    ).toBe("Groceries");
  });

  it("adds, changes, lists and trashes movements, mine only", async () => {
    const cats = await ensureCategories(db, me, "it");
    const food = cats.find((c) => c.key === "groceries")!;
    const salary = cats.find((c) => c.kind === "income")!;
    const r = await addMovement(
      db,
      me,
      input({ amount: "23.40", categoryId: food.id, shop: "Coop" }),
    );
    if (!r.ok) throw new Error("add failed");
    // An expense can't go in an income category, nor in someone else's.
    expect(
      (await addMovement(db, me, input({ amount: "5", categoryId: salary.id }))).ok,
    ).toBe(false);
    const theirs = await ensureCategories(db, other, "it");
    expect(
      await addMovement(db, me, input({ amount: "5", categoryId: theirs[0]!.id })),
    ).toEqual({
      ok: false,
      errors: { categoryId: "not_found" },
    });

    expect((await updateMovement(db, me, r.value.id, input({ amount: "25" }))).ok).toBe(
      true,
    );
    expect((await getMovement(db, me, r.value.id))?.amountCents).toBe(-2500);
    expect(await getMovement(db, other, r.value.id)).toBeNull();
    expect((await updateMovement(db, other, r.value.id, input({ amount: "1" }))).ok).toBe(
      false,
    );

    expect(await listMovements(db, me, "2026-10-01", "2026-10-31")).toHaveLength(1);
    expect(await listMovements(db, other, "2026-10-01", "2026-10-31")).toEqual([]);
    expect((await deleteMovement(db, other, r.value.id)).ok).toBe(false);
    expect((await deleteMovement(db, me, r.value.id)).ok).toBe(true);
    expect(await listMovements(db, me, "2026-10-01", "2026-10-31")).toEqual([]);
    expect((await restoreMovement(db, me, r.value.id)).ok).toBe(true);
    expect(await listMovements(db, me, "2026-10-01", "2026-10-31")).toHaveLength(1);
  });

  it("keeps a receipt line when its product is deleted for good, unlinked", async () => {
    const r = await addMovement(db, me, input({ amount: "3" }));
    if (!r.ok) throw new Error("add failed");
    const [p] = await db
      .insert(products)
      .values({ userId: me.id, name: "Passata", unit: "g", packageSize: "700" })
      .returning({ id: products.id });
    await db.insert(moneyLines).values({
      userId: me.id,
      movementId: r.value.id,
      position: 0,
      description: "PASSATA MUTTI 700G",
      amountCents: 129,
      productId: p!.id,
    });
    // SET NULL (product_id) only: the line keeps its owner and its euro.
    await db.delete(products).where(eq(products.id, p!.id));
    const [line] = await db.select().from(moneyLines);
    expect(line).toMatchObject({ productId: null, userId: me.id, amountCents: 129 });
  });
});
