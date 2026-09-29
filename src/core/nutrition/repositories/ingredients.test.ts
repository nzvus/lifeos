/**
 * Tests for the ingredients repository, against real Postgres (PGlite).
 *
 * Contains THE cross-user test that ADR-0003/0006 make mandatory for every
 * user-owned entity: with two users, user B must not be able to read, update
 * or delete user A's rows — the invariant is this test, not a comment.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser, ingredientFixture } from "../../testing/test-db";
import {
  createIngredient,
  deleteIngredient,
  getIngredient,
  listIngredients,
  updateIngredient,
} from "./ingredients";
import { createMeal } from "./meals";

let db: Db;
let close: () => Promise<void>;
let alice: Owner;
let bob: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb()); // fresh database per test
  alice = await createTestUser(db, "alice@example.com");
  bob = await createTestUser(db, "bob@example.com");
});
afterEach(() => close());

describe("ingredients repository", () => {
  it("creates and reads back exact decimals", async () => {
    const r = await createIngredient(db, alice, ingredientFixture({ salt: "0.025" }));
    expect(r.ok).toBe(true);
    const [row] = await listIngredients(db, alice);
    expect(row?.salt).toBe("0.025"); // a string from numeric: no float anywhere
    expect(row?.packagePriceCents).toBe(189);
  });

  it("reports a duplicate name as a field error", async () => {
    await createIngredient(db, alice, ingredientFixture());
    const again = await createIngredient(db, alice, ingredientFixture());
    expect(again).toEqual({ ok: false, errors: { name: "duplicate_name" } });
  });

  it("refuses to delete an ingredient used by a meal", async () => {
    const ing = await createIngredient(db, alice, ingredientFixture());
    if (!ing.ok) throw new Error("setup failed");
    await createMeal(db, alice, {
      name: "Porridge",
      notes: "",
      items: [{ ingredientId: ing.value.id, quantity: "60" }],
    });
    expect(await deleteIngredient(db, alice, ing.value.id)).toEqual({
      ok: false,
      errors: { _form: "in_use" },
    });
  });

  it("CROSS-USER: another user can neither see nor change my ingredients", async () => {
    const mine = await createIngredient(db, alice, ingredientFixture());
    if (!mine.ok) throw new Error("setup failed");
    const id = mine.value.id;

    // Bob lists: nothing. Bob fetches by exact id: nothing.
    expect(await listIngredients(db, bob)).toEqual([]);
    expect(await getIngredient(db, bob, id)).toBeNull();

    // Bob tries to update and delete: "not found", and nothing changed.
    const upd = await updateIngredient(
      db,
      bob,
      id,
      ingredientFixture({ name: "Hacked" }),
    );
    expect(upd).toEqual({ ok: false, errors: { _form: "not_found" } });
    expect(await deleteIngredient(db, bob, id)).toEqual({
      ok: false,
      errors: { _form: "not_found" },
    });
    expect((await getIngredient(db, alice, id))?.name).toBe("Oats");

    // The same name is fine for another user (uniqueness is per user).
    expect((await createIngredient(db, bob, ingredientFixture())).ok).toBe(true);
  });
});
