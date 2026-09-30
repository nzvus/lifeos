/** Tests for meal ratings (ADR-0012): factors, scores saved with the meal, isolation. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { createTestDb, createTestUser, ingredientFixture } from "../../testing/test-db";
import { createIngredient } from "./ingredients";
import { createMeal, getMeal, updateMeal } from "./meals";
import {
  averageScores,
  createFactor,
  deleteFactor,
  listFactors,
  ratingsByMeal,
} from "./ratings";

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

const base = () => ({
  name: "Porridge",
  notes: "",
  items: [{ ingredientId: oatsId, quantity: "60" }],
});

describe("meal ratings", () => {
  it("keeps factors in order, refuses duplicates", async () => {
    await createFactor(db, me, "Gusto");
    await createFactor(db, me, "Sazietà");
    expect((await createFactor(db, me, "Gusto")).ok).toBe(false);
    expect((await listFactors(db, me)).map((f) => [f.name, f.position])).toEqual([
      ["Gusto", 0],
      ["Sazietà", 1],
    ]);
  });

  it("saves scores and notes with the meal; left out = kept; given = replaced", async () => {
    const taste = await createFactor(db, me, "Gusto");
    const fill = await createFactor(db, me, "Sazietà");
    if (!taste.ok || !fill.ok) throw new Error("setup failed");
    const meal = await createMeal(db, me, {
      ...base(),
      review: "Meglio con cannella",
      ratings: [
        { factorId: taste.value.id, score: 4 },
        { factorId: fill.value.id, score: 5 },
      ],
    });
    if (!meal.ok) throw new Error("setup failed");
    const scores = async () => (await ratingsByMeal(db, me)).get(meal.value.id);
    expect(await scores()).toEqual({ [taste.value.id]: 4, [fill.value.id]: 5 });
    expect((await getMeal(db, me, meal.value.id))?.review).toBe("Meglio con cannella");

    await updateMeal(db, me, meal.value.id, base()); // no ratings/review: kept
    expect(await scores()).toEqual({ [taste.value.id]: 4, [fill.value.id]: 5 });
    expect((await getMeal(db, me, meal.value.id))?.review).toBe("Meglio con cannella");

    await updateMeal(db, me, meal.value.id, {
      ...base(),
      review: "",
      ratings: [{ factorId: taste.value.id, score: 2 }],
    });
    expect(await scores()).toEqual({ [taste.value.id]: 2 });

    await deleteFactor(db, me, taste.value.id); // its scores go with it
    expect(await scores()).toBeUndefined();
  });

  it("refuses another user's factor, and never shows another user's ratings", async () => {
    const theirs = await createFactor(db, other, "Loro");
    if (!theirs.ok) throw new Error("setup failed");
    const r = await createMeal(db, me, {
      ...base(),
      ratings: [{ factorId: theirs.value.id, score: 3 }],
    });
    expect(r).toEqual({ ok: false, errors: { ratings: "not_found" } });
    expect(await listFactors(db, other)).toHaveLength(1);
    expect(await listFactors(db, me)).toEqual([]);
    expect((await deleteFactor(db, me, theirs.value.id)).ok).toBe(false);
  });
});

describe("averageScores", () => {
  it("averages each meal's scores to one decimal", () => {
    expect(averageScores(new Map([["m", { a: 4, b: 5, c: 4 }]]))).toEqual({ m: 4.3 });
  });
});
