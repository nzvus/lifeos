/** Tests for core/nutrition/validation.ts — what input is accepted, and the error codes. */
import { describe, expect, it } from "vitest";
import { ingredientInput, logMealInput, mealInput, parseInput } from "./validation";

const baseForm = {
  name: " Oats ",
  description: "",
  unit: "g",
  kcal: "372",
  protein: "13,5", // Italian decimal comma
  carbs: "58.7",
  sugars: "0.7",
  fat: "7",
  saturatedFat: "1.3",
  fiber: "10",
  salt: "0.01",
  packagePrice: "1,89",
  packageSize: "500",
};

describe("ingredientInput", () => {
  it("cleans valid input: trims, accepts commas, converts euros to cents", () => {
    const r = parseInput(ingredientInput, baseForm);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.name).toBe("Oats");
    expect(r.value.protein).toBe("13.5");
    expect(r.value.packagePriceCents).toBe(189);
  });

  it("reports codes per field, never sentences", () => {
    const r = parseInput(ingredientInput, {
      ...baseForm,
      name: "",
      kcal: "abc",
      fat: "1.23456",
    });
    expect(r).toEqual({
      ok: false,
      errors: { name: "required", kcal: "invalid_number", fat: "too_many_decimals" },
    });
  });

  it("requires price and package size together", () => {
    const r = parseInput(ingredientInput, { ...baseForm, packageSize: "" });
    expect(r).toEqual({ ok: false, errors: { packagePrice: "price_pair" } });
  });

  it("allows no price at all", () => {
    const r = parseInput(ingredientInput, {
      ...baseForm,
      packagePrice: "",
      packageSize: "",
    });
    expect(r.ok && r.value.packagePriceCents).toBe(null);
  });
});

describe("mealInput / logMealInput", () => {
  it("rejects a meal without lines and a non-positive quantity", () => {
    expect(parseInput(mealInput, { name: "X", notes: "", items: [] })).toEqual({
      ok: false,
      errors: { items: "empty_meal" },
    });
    const id = crypto.randomUUID();
    expect(
      parseInput(mealInput, {
        name: "X",
        notes: "",
        items: [{ ingredientId: id, quantity: "0" }],
      }),
    ).toEqual({ ok: false, errors: { "items.0.quantity": "not_positive" } });
  });

  it("rejects impossible days and malformed ids", () => {
    const r = parseInput(logMealInput, {
      day: "2026-02-30",
      mealId: "nope",
      servings: "1",
    });
    expect(r).toEqual({ ok: false, errors: { day: "invalid_day", mealId: "not_found" } });
  });

  it("takes an optional moment (ADR-0011): empty = not set, unknown = error", () => {
    const base = { day: "2026-09-30", mealId: crypto.randomUUID(), servings: "1" };
    const ok = parseInput(logMealInput, { ...base, moment: "dinner" });
    expect(ok.ok && ok.value.moment).toBe("dinner");
    const empty = parseInput(logMealInput, { ...base, moment: "" });
    expect(empty.ok && empty.value.moment).toBeNull();
    expect(parseInput(logMealInput, { ...base, moment: "brunch" })).toEqual({
      ok: false,
      errors: { moment: "invalid_choice" },
    });
  });
});
