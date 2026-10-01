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
  listTags,
  restoreIngredients,
  tagsByIngredient,
  updateIngredient,
} from "./ingredients";
import { createMeal, deleteMeal, getMeal, restoreMeal } from "./meals";
import { getDay, logIngredient } from "./log";

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

describe("quality attributes and free tags (ADR-0012)", () => {
  it("saves them; update keeps tags when not given and replaces them when given", async () => {
    const r = await createIngredient(db, alice, {
      ...ingredientFixture({ name: "Avena" }),
      nova: 1,
      origin: "plant",
      fiberTypes: ["beta_glucan"],
      tags: [
        { name: "Lidl", icon: "store" },
        { name: "Bio", icon: "leaf" },
      ],
    });
    if (!r.ok) throw new Error("setup failed");
    expect([r.value.nova, r.value.origin, r.value.fiberTypes]).toEqual([
      1,
      "plant",
      ["beta_glucan"],
    ]);
    const names = async () =>
      ((await tagsByIngredient(db, alice)).get(r.value.id) ?? []).map((t) => t.name);
    expect(await names()).toEqual(["Bio", "Lidl"]);

    await updateIngredient(db, alice, r.value.id, ingredientFixture({ name: "Avena" }));
    expect(await names()).toEqual(["Bio", "Lidl"]); // not given: kept

    await updateIngredient(db, alice, r.value.id, {
      ...ingredientFixture({ name: "Avena" }),
      tags: [{ name: "Lidl", icon: "shopping-cart" }],
    });
    expect(await names()).toEqual(["Lidl"]);
    expect((await listTags(db, alice)).find((t) => t.name === "Lidl")?.icon).toBe(
      "shopping-cart",
    );

    // CROSS-USER: bob sees none of alice's tags.
    expect(await listTags(db, bob)).toEqual([]);
    expect((await tagsByIngredient(db, bob)).size).toBe(0);
  });

  it("copies the attributes into the log snapshot; reclassifying later changes no past day", async () => {
    const r = await createIngredient(db, alice, {
      ...ingredientFixture({ name: "Biscotti" }),
      nova: 4,
      origin: "mixed",
      fiberTypes: [],
    });
    if (!r.ok) throw new Error("setup failed");
    await logIngredient(db, alice, {
      day: "2026-09-30",
      ingredientId: r.value.id,
      quantity: "30",
    });
    await updateIngredient(db, alice, r.value.id, {
      ...ingredientFixture({ name: "Biscotti" }),
      nova: 3,
    });
    const day = await getDay(db, alice, "2026-09-30");
    expect(day.entries[0]!.lines[0]!.quality).toEqual({
      nova: 4,
      origin: "mixed",
      fiberTypes: [],
    });
  });
});

describe("ingredients in the trash (ADR-0015)", () => {
  it("hides a trashed ingredient everywhere, frees its name, and restores it", async () => {
    const ing = await createIngredient(db, alice, ingredientFixture());
    if (!ing.ok) throw new Error("setup failed");
    const id = ing.value.id;
    expect((await deleteIngredient(db, alice, id)).ok).toBe(true);
    expect(await getIngredient(db, alice, id)).toBeNull();
    expect(await listIngredients(db, alice)).toEqual([]);
    // A meal can't use it, and the log can't either.
    expect(
      (
        await createMeal(db, alice, {
          name: "P",
          notes: "",
          items: [{ ingredientId: id, quantity: "1" }],
        })
      ).ok,
    ).toBe(false);
    expect((await createIngredient(db, alice, ingredientFixture())).ok).toBe(true); // namesake
    expect(await restoreIngredients(db, alice, [id])).toEqual({
      ok: false,
      errors: { _form: "duplicate_name" },
    });
  });

  it("only live meals keep it out of the trash; restoring a meal brings it back", async () => {
    const ing = await createIngredient(db, alice, ingredientFixture());
    if (!ing.ok) throw new Error("setup failed");
    const meal = await createMeal(db, alice, {
      name: "Porridge",
      notes: "",
      items: [{ ingredientId: ing.value.id, quantity: "60" }],
    });
    if (!meal.ok) throw new Error("setup failed");
    await deleteMeal(db, alice, meal.value.id);
    expect((await deleteIngredient(db, alice, ing.value.id)).ok).toBe(true);
    expect((await restoreMeal(db, alice, meal.value.id)).ok).toBe(true);
    expect((await getIngredient(db, alice, ing.value.id))?.name).toBe("Oats");
    expect((await getMeal(db, alice, meal.value.id))?.lines).toHaveLength(1);
    // Someone else can't restore mine.
    expect((await deleteIngredient(db, alice, ing.value.id)).ok).toBe(false); // in use again
    expect((await restoreIngredients(db, bob, [ing.value.id])).ok).toBe(false);
  });
});
