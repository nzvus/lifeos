/**
 * Tests for meals + daily log: totals computed on read, the snapshot rule
 * (ADR-0007), and cross-user isolation of meals and log entries.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser, ingredientFixture } from "../../testing/test-db";
import { createIngredient, deleteIngredient, updateIngredient } from "./ingredients";
import { getHistory } from "./history";
import { getUsage } from "./usage";
import {
  copyDay,
  deleteLogEntry,
  editLogEntry,
  getLogEntry,
  entryTiming,
  getDay,
  logEstimate,
  logIngredient,
  logMeal,
  refreshLogEntry,
  restoreLogEntry,
  setEntryStatus,
  setEntryTime,
} from "./log";
import {
  createMeal,
  deleteMeal,
  getMeal,
  listMeals,
  restoreMeal,
  updateMeal,
} from "./meals";

let db: Db;
let close: () => Promise<void>;
let alice: Owner;
let bob: Owner;
let oatsId: string;
let milkId: string;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  alice = await createTestUser(db, "alice@example.com");
  bob = await createTestUser(db, "bob@example.com");
  const oats = await createIngredient(db, alice, ingredientFixture()); // 372 kcal/100 g
  const milk = await createIngredient(
    db,
    alice,
    ingredientFixture({
      name: "Milk",
      unit: "ml",
      kcal: "46",
      packagePriceCents: null,
      packageSize: null,
    }),
  );
  if (!oats.ok || !milk.ok) throw new Error("setup failed");
  oatsId = oats.value.id;
  milkId = milk.value.id;
});
afterEach(() => close());

async function porridge() {
  const r = await createMeal(db, alice, {
    name: "Porridge",
    notes: "",
    items: [
      { ingredientId: oatsId, quantity: "60" }, // 223.2 kcal
      { ingredientId: milkId, quantity: "200" }, // 92 kcal
    ],
  });
  if (!r.ok) throw new Error("setup failed");
  return r.value.id;
}

describe("meals", () => {
  it("computes totals from lines on read", async () => {
    const id = await porridge();
    const meal = await getMeal(db, alice, id);
    expect(meal?.totals.nutrients.kcal).toBe("315.2");
    // Milk has no price -> the cost is a lower bound, and flagged as such.
    expect(meal?.totals).toMatchObject({ costCents: 23, costComplete: false });
  });

  it("follows ingredient edits (a recipe should)", async () => {
    const id = await porridge();
    await updateIngredient(db, alice, oatsId, ingredientFixture({ kcal: "400" }));
    expect((await getMeal(db, alice, id))?.totals.nutrients.kcal).toBe("332.0"); // 240 + 92
  });

  it("CROSS-USER: another user cannot read, edit, delete or use my meals/ingredients", async () => {
    const id = await porridge();
    expect(await listMeals(db, bob)).toEqual([]);
    expect(await getMeal(db, bob, id)).toBeNull();
    const input = {
      name: "X",
      notes: "",
      items: [{ ingredientId: oatsId, quantity: "1" }],
    };
    expect(await updateMeal(db, bob, id, input)).toEqual({
      ok: false,
      errors: { "items.0.ingredientId": "not_found" }, // Alice's oats are invisible to Bob
    });
    expect(await createMeal(db, bob, input)).toEqual({
      ok: false,
      errors: { "items.0.ingredientId": "not_found" },
    });
    expect((await deleteMeal(db, bob, id)).ok).toBe(false);
    expect((await getMeal(db, alice, id))?.name).toBe("Porridge");
  });
});

describe("daily log", () => {
  const day = "2026-09-29";

  it("day totals equal the sum of entries, with servings applied", async () => {
    const mealId = await porridge();
    await logMeal(db, alice, { day, mealId, servings: "1.5" }); // 472.8
    await logIngredient(db, alice, { day, ingredientId: oatsId, quantity: "10" }); // 37.2
    const view = await getDay(db, alice, day);
    expect(view.entries.map((e) => e.totals.nutrients.kcal)).toEqual(["472.8", "37.2"]);
    expect(view.totals.nutrients.kcal).toBe("510.0");
  });

  it("SNAPSHOT (ADR-0007): later edits and deletions never change logged history", async () => {
    const mealId = await porridge();
    await logMeal(db, alice, { day, mealId, servings: "1" });
    const before = await getDay(db, alice, day);

    // Change the ingredient, rewrite the meal, then delete the meal entirely.
    await updateIngredient(db, alice, oatsId, ingredientFixture({ kcal: "999" }));
    await updateMeal(db, alice, mealId, {
      name: "Porridge v2",
      notes: "",
      items: [{ ingredientId: oatsId, quantity: "500" }],
    });
    await deleteMeal(db, alice, mealId);

    const after = await getDay(db, alice, day);
    expect(after.totals).toEqual(before.totals);
    expect(after.entries[0]?.label).toBe("Porridge"); // the name at logging time
    // In the trash the link stays (the meal can come back, ADR-0015); a purge
    // deletes the row and the foreign key sets it to null. The data stays.
    expect(after.entries[0]?.mealId).toBe(mealId);
  });

  it("keeps a single-ingredient entry after the ingredient is deleted", async () => {
    await logIngredient(db, alice, { day, ingredientId: milkId, quantity: "100" });
    expect((await deleteIngredient(db, alice, milkId)).ok).toBe(true);
    expect((await getDay(db, alice, day)).totals.nutrients.kcal).toBe("46.0");
  });

  it("CROSS-USER: another user cannot see, log from, or delete my entries", async () => {
    const mealId = await porridge();
    const entry = await logMeal(db, alice, { day, mealId, servings: "1" });
    if (!entry.ok) throw new Error("setup failed");

    expect((await getDay(db, bob, day)).entries).toEqual([]);
    expect(await logMeal(db, bob, { day, mealId, servings: "1" })).toEqual({
      ok: false,
      errors: { mealId: "not_found" },
    });
    expect(
      await logIngredient(db, bob, { day, ingredientId: oatsId, quantity: "1" }),
    ).toEqual({
      ok: false,
      errors: { ingredientId: "not_found" },
    });
    expect((await deleteLogEntry(db, bob, entry.value.id)).ok).toBe(false);
    expect((await getDay(db, alice, day)).entries).toHaveLength(1);
  });

  it("copyDay repeats a day's food as logged, and nothing of another user", async () => {
    const mealId = await porridge();
    await logMeal(db, alice, { day, mealId, servings: "1.5" });
    await logIngredient(db, alice, { day, ingredientId: oatsId, quantity: "10" });
    // A later recipe change must NOT leak into the copy (ADR-0007).
    await updateIngredient(db, alice, oatsId, ingredientFixture({ kcal: "999" }));

    expect(await copyDay(db, alice, day, "2026-09-30")).toEqual({
      ok: true,
      value: { copied: 2 },
    });
    const copy = await getDay(db, alice, "2026-09-30");
    const original = await getDay(db, alice, day);
    // The copy is a PLAN (ADR-0009): nothing eaten yet, the same food planned.
    expect(copy.totals.nutrients.kcal).toBe("0.0");
    expect(copy.withPlanned).toEqual(original.totals);
    expect(copy.entries.map((e) => [e.label, e.servings])).toEqual([
      ["Porridge", "1.50"],
      ["Oats", "1.00"],
    ]);

    // CROSS-USER: Bob copying Alice's day copies nothing (he sees no entries).
    expect(await copyDay(db, bob, day, "2026-09-30")).toEqual({
      ok: true,
      value: { copied: 0 },
    });
    expect((await getDay(db, bob, "2026-09-30")).entries).toEqual([]);
  });

  it("refreshLogEntry applies current values on purpose (e.g. a price added later)", async () => {
    await logIngredient(db, alice, { day, ingredientId: milkId, quantity: "200" }); // milk: no price
    expect((await getDay(db, alice, day)).totals.costComplete).toBe(false);
    await updateIngredient(
      db,
      alice,
      milkId,
      ingredientFixture({
        name: "Milk",
        unit: "ml",
        kcal: "46",
        packagePriceCents: 100,
        packageSize: "1000",
      }),
    );
    expect((await getDay(db, alice, day)).totals.costComplete).toBe(false); // snapshot: unchanged

    const [entry] = (await getDay(db, alice, day)).entries;
    expect((await refreshLogEntry(db, alice, entry!.id)).ok).toBe(true);
    const after = await getDay(db, alice, day);
    expect(after.totals).toMatchObject({ costCents: 20, costComplete: true }); // 200 ml at 1 €/l
    expect(after.entries[0]!.lines[0]!.quantity).toBe("200.00"); // the amount eaten is kept

    // CROSS-USER: Bob can't refresh Alice's entry.
    expect((await refreshLogEntry(db, bob, entry!.id)).ok).toBe(false);
  });

  it("ADR-0009: planned entries count only in withPlanned; confirming sets the time", async () => {
    const mealId = await porridge(); // 315.2 kcal per serving
    await logMeal(db, alice, { day, mealId, servings: "1" }); // eaten (default)
    const planned = await logMeal(db, alice, {
      day,
      mealId,
      servings: "1",
      status: "planned",
      at: null,
    });
    if (!planned.ok) throw new Error("setup failed");

    let view = await getDay(db, alice, day);
    expect(view.totals.nutrients.kcal).toBe("315.2"); // eaten only
    expect(view.planned.nutrients.kcal).toBe("315.2");
    expect(view.withPlanned.nutrients.kcal).toBe("630.4");
    expect(view.entries.find((e) => e.id === planned.value.id)).toMatchObject({
      status: "planned",
      at: null,
    });

    const tick = new Date("2026-09-29T11:15:00Z");
    expect((await setEntryStatus(db, alice, planned.value.id, "eaten", tick)).ok).toBe(
      true,
    );
    view = await getDay(db, alice, day);
    expect(view.totals.nutrients.kcal).toBe("630.4");
    expect(view.entries.find((e) => e.id === planned.value.id)?.at).toBe(
      tick.toISOString(),
    );

    // The time stays editable.
    await setEntryTime(db, alice, planned.value.id, new Date("2026-09-29T10:00:00Z"));
    expect(
      (await getDay(db, alice, day)).entries.find((e) => e.id === planned.value.id)?.at,
    ).toBe("2026-09-29T10:00:00.000Z");

    // CROSS-USER: Bob can neither tick nor move Alice's entry.
    expect((await setEntryStatus(db, bob, planned.value.id, "planned")).ok).toBe(false);
    expect((await setEntryTime(db, bob, planned.value.id, null)).ok).toBe(false);
  });

  it("entryTiming: eaten without time = now, planned without time = none, time in the user's zone", () => {
    const now = new Date("2026-09-29T08:00:00Z");
    expect(entryTiming(day, false, null, "Europe/Rome", now)).toEqual({
      status: "eaten",
      at: now,
    });
    expect(entryTiming(day, true, null, "Europe/Rome", now)).toEqual({
      status: "planned",
      at: null,
    });
    expect(entryTiming(day, true, "13:00", "Europe/Rome", now).at?.toISOString()).toBe(
      "2026-09-29T11:00:00.000Z",
    );
  });

  it("estimated meal: typed totals and cost add up exactly; copyDay makes plans", async () => {
    const est = await logEstimate(db, alice, {
      day,
      label: "Pizza da amici",
      kcal: "850",
      protein: "35",
      carbs: "95",
      fat: "32",
      fiber: "0",
      cost: "8.50",
    });
    if (!est.ok) throw new Error("setup failed");
    const view = await getDay(db, alice, day);
    expect(view.entries[0]).toMatchObject({ label: "Pizza da amici", estimated: true });
    expect(view.totals.nutrients).toMatchObject({
      kcal: "850.0",
      protein: "35.0",
      fat: "32.0",
    });
    expect(view.totals).toMatchObject({ costCents: 850, costComplete: true });

    await copyDay(db, alice, day, "2026-09-30");
    const copy = await getDay(db, alice, "2026-09-30");
    expect(copy.entries[0]).toMatchObject({
      status: "planned",
      at: null,
      estimated: true,
    });
    expect(copy.totals.nutrients.kcal).toBe("0.0"); // nothing EATEN yet
    expect(copy.withPlanned.nutrients.kcal).toBe("850.0");
    // The 7-day history counts only eaten food.
    const h = await getHistory(db, alice, "2026-09-29", "2026-09-30");
    expect(h.map((d) => d.totals.nutrients.kcal)).toEqual(["850.0", "0.0"]);
  });
});

describe("moments (ADR-0011)", () => {
  it("stores an entry's moment, copies it when a day is repeated, and a meal's category", async () => {
    const meal = await createMeal(db, alice, {
      name: "Yogurt",
      notes: "",
      category: "breakfast",
      items: [{ ingredientId: milkId, quantity: "200" }],
    });
    if (!meal.ok) throw new Error("setup failed");
    expect((await getMeal(db, alice, meal.value.id))?.category).toBe("breakfast");

    await logMeal(db, alice, {
      day: "2026-09-29",
      mealId: meal.value.id,
      servings: "1",
      moment: "snack",
    });
    await logIngredient(db, alice, {
      day: "2026-09-29",
      ingredientId: oatsId,
      quantity: "50",
    });
    const day = await getDay(db, alice, "2026-09-29");
    expect(day.entries.map((e) => e.moment)).toEqual(["snack", null]);

    await copyDay(db, alice, "2026-09-29", "2026-09-30");
    const copy = await getDay(db, alice, "2026-09-30");
    expect(copy.entries.map((e) => e.moment).sort()).toEqual(["snack", null].sort());
  });
});

describe("meals in the trash (ADR-0015)", () => {
  const meal = (name: string) => ({
    name,
    notes: "",
    category: null,
    items: [{ ingredientId: oatsId, quantity: "50" }],
  });

  it("a deleted meal disappears, can be restored, and frees its name meanwhile", async () => {
    const r = await createMeal(db, alice, meal("Porridge"));
    if (!r.ok) throw new Error("setup");
    const id = r.value.id;
    expect((await deleteMeal(db, alice, id)).ok).toBe(true);
    expect(await getMeal(db, alice, id)).toBeNull();
    expect((await listMeals(db, alice)).map((m) => m.name)).toEqual([]);
    // Deleting twice, or editing it while in the trash: not found.
    expect((await deleteMeal(db, alice, id)).ok).toBe(false);
    expect((await updateMeal(db, alice, id, meal("X"))).ok).toBe(false);
    // Someone else can't restore it.
    expect((await restoreMeal(db, bob, id)).ok).toBe(false);
    expect((await restoreMeal(db, alice, id)).ok).toBe(true);
    expect((await getMeal(db, alice, id))?.name).toBe("Porridge");
  });

  it("restoring next to a live namesake is refused, not merged", async () => {
    const r = await createMeal(db, alice, meal("Porridge"));
    if (!r.ok) throw new Error("setup");
    await deleteMeal(db, alice, r.value.id);
    expect((await createMeal(db, alice, meal("Porridge"))).ok).toBe(true);
    expect(await restoreMeal(db, alice, r.value.id)).toEqual({
      ok: false,
      errors: { _form: "duplicate_name" },
    });
  });
});

describe("log entries in the trash (ADR-0015)", () => {
  it("leave the day, its totals, the history and the usage; Undo brings them back", async () => {
    const day = "2026-09-29";
    const r = await logIngredient(db, alice, {
      day,
      ingredientId: oatsId,
      quantity: "100",
    });
    if (!r.ok) throw new Error("setup");
    const id = r.value.id;
    const before = await getDay(db, alice, day);

    expect((await deleteLogEntry(db, alice, id)).ok).toBe(true);
    const gone = await getDay(db, alice, day);
    expect(gone.entries).toEqual([]);
    expect(gone.totals.nutrients.kcal).toBe("0.0");
    expect((await getHistory(db, alice, day, day))[0]?.logged).toBe(false);
    expect((await getUsage(db, alice, "2026-01-01")).ingredients).toEqual({});
    // In the trash: no tick, no time change, no second delete.
    expect((await setEntryStatus(db, alice, id, "planned")).ok).toBe(false);
    expect((await deleteLogEntry(db, alice, id)).ok).toBe(false);

    // CROSS-USER: someone else can't restore it.
    expect((await restoreLogEntry(db, bob, id)).ok).toBe(false);
    expect((await restoreLogEntry(db, alice, id)).ok).toBe(true);
    expect(await getDay(db, alice, day)).toEqual(before);
    // Restoring twice: not found.
    expect((await restoreLogEntry(db, alice, id)).ok).toBe(false);
  });
});

describe("editing a day's entry as a local copy (ADR-0022)", () => {
  it("grams, swaps and additions change the entry, never the meal", async () => {
    const mealId = await porridge();
    const logged = await logMeal(db, alice, { day: "2026-10-01", mealId, servings: "1" });
    if (!logged.ok) throw new Error("setup failed");
    const id = logged.value.id;
    const entry = (await getLogEntry(db, alice, id))!;
    const [oats, milk] = entry.lines;
    // The oats change after logging: a kept line keeps its snapshot.
    await updateIngredient(db, alice, oatsId, ingredientFixture({ kcal: "999" }));
    const rice = await createIngredient(
      db,
      alice,
      ingredientFixture({ name: "Rice", kcal: "350" }),
    );
    if (!rice.ok) throw new Error("setup failed");

    const r = await editLogEntry(db, alice, id, {
      servings: "1",
      items: [
        { itemId: oats!.itemId, quantity: "40" }, // 40 × 3.72 = 148.8
        { itemId: milk!.itemId, ingredientId: rice.value.id, quantity: "50" }, // swapped: 175
        { ingredientId: milkId, quantity: "100" }, // added: 46
      ],
    });
    expect(r.ok).toBe(true);
    const after = (await getLogEntry(db, alice, id))!;
    expect(after.lines.map((l) => [l.name, l.quantity])).toEqual([
      ["Oats", "40.00"],
      ["Rice", "50.00"],
      ["Milk", "100.00"],
    ]);
    expect(after.totals.nutrients.kcal).toBe("369.8");
    expect(after.mealId).toBe(mealId);
    // The meal is as it was.
    const meal = (await getMeal(db, alice, mealId))!;
    expect(meal.lines.map((l) => l.quantity)).toEqual(["60.00", "200.00"]);
  });

  it("is mine only, and estimates have nothing to edit", async () => {
    const mealId = await porridge();
    const logged = await logMeal(db, alice, { day: "2026-10-01", mealId, servings: "1" });
    if (!logged.ok) throw new Error("setup failed");
    const input = { servings: "2", items: [{ ingredientId: oatsId, quantity: "10" }] };
    expect(await editLogEntry(db, bob, logged.value.id, input)).toEqual({
      ok: false,
      errors: { _form: "not_found" },
    });
    expect(await getLogEntry(db, bob, logged.value.id)).toBeNull();
    const est = await logEstimate(db, alice, {
      day: "2026-10-01",
      label: "Pizza",
      kcal: "800",
      protein: "0",
      carbs: "0",
      fat: "0",
      fiber: "0",
      cost: null,
    });
    if (!est.ok) throw new Error("setup failed");
    expect(await editLogEntry(db, alice, est.value.id, input)).toEqual({
      ok: false,
      errors: { _form: "not_editable" },
    });
    // Bob can't add Alice's ingredient to his own entry either.
    const bobMeal = await createIngredient(
      db,
      bob,
      ingredientFixture({ name: "Bob oats" }),
    );
    if (!bobMeal.ok) throw new Error("setup failed");
    const bobEntry = await logIngredient(db, bob, {
      day: "2026-10-01",
      ingredientId: bobMeal.value.id,
      quantity: "50",
    });
    if (!bobEntry.ok) throw new Error("setup failed");
    expect(await editLogEntry(db, bob, bobEntry.value.id, input)).toEqual({
      ok: false,
      errors: { "items.0.ingredientId": "not_found" },
    });
  });
});
