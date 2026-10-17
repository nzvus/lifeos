import { describe, expect, it } from "vitest";
import type { FoodChoice } from "@/core/food/choices";
import {
  clockMinute,
  dayWithMeal,
  mealNutrients,
  mealErrors,
  mealKinds,
  mealTotals,
  parseLines,
  quantityOf,
} from "./composer";

const choice = (key: string, per100: Record<string, string>): FoodChoice => ({
  key,
  foodId: key,
  productId: null,
  name: key,
  brand: null,
  unit: "g",
  per100,
  uses: 0,
  lastQty: null,
});
const by = new Map([
  ["oats", choice("oats", { kcal: "372", protein: "13.5", fibre: "10", sugars: "1" })],
  ["milk", choice("milk", { kcal: "46", protein: "3.4", sugars: "4.8" })],
]);

describe("the composer's numbers", () => {
  it("reads a clock time for the role", () => {
    expect(clockMinute("07:30")).toBe(450);
    expect(clockMinute("")).toBeNull();
  });

  it("reads quantities with a comma and refuses what is not one", () => {
    expect(quantityOf("60,5")).toBe("60.5");
    expect(["", "0", "-3", "abc"].map(quantityOf)).toEqual([null, null, null, null]);
  });

  it("adds up the lines it can read, exactly", () => {
    const t = mealTotals(
      [
        { key: "oats", quantity: "50" },
        { key: "milk", quantity: "200" },
        { key: "milk", quantity: "" },
        { key: "gone", quantity: "10" },
      ],
      by,
    );
    expect(t).toEqual({ kcal: 278, protein: 13.55, fibre: 5, sugars: 10.1 });
  });

  it("multiplies the lines by the servings", () => {
    expect(mealTotals([{ key: "oats", quantity: "50" }], by, "1,5")).toEqual({
      kcal: 279,
      protein: 10.125,
      fibre: 7.5,
      sugars: 0.75,
    });
    expect(mealTotals([{ key: "oats", quantity: "50" }], by, "")["kcal"]).toBe(186);
  });

  it("draws the meal alone, and the day with the meal as planned", () => {
    const t = { kcal: 278, protein: 13.55, fibre: 5, sugars: 10.1 };
    expect(mealNutrients(t)).toEqual({
      macros: [
        { key: "protein", v: 13.55 },
        { key: "carbs", v: 0 },
        { key: "fat", v: 0 },
        { key: "fiber", v: 5 },
      ],
    });
    const day = dayWithMeal(
      {
        kcal: { v: 1000, planned: 100, t: 2500 },
        macros: [{ key: "fiber", v: 10, planned: 0, t: 30 }],
        limits: [{ key: "sugars", v: 20, t: 110 }],
      },
      t,
    );
    expect(day).toEqual({
      kcal: { v: 1000, planned: 378, t: 2500 },
      macros: [{ key: "fiber", v: 10, planned: 5, t: 30 }],
      limits: [{ key: "sugars", v: 30.1, t: 110 }],
    });
  });
});

describe("the meal's kinds", () => {
  it("split each macro by its choices' estimates", () => {
    const withKinds = new Map([
      [
        "oats",
        { ...by.get("oats")!, estimates: { protein_high: "1", fibre_betaglucan: "1" } },
      ],
      ["milk", by.get("milk")!],
    ]);
    const k = mealKinds(
      [
        { key: "oats", quantity: "50" },
        { key: "milk", quantity: "200" },
      ],
      withKinds,
    );
    expect(k.protein).toEqual({ high: 6.75, none: 6.8 });
    expect(k.fibre).toEqual({ betaglucan: 5 });
  });
});

describe("what a composer posts", () => {
  it("reads only well-made lines", () => {
    expect(parseLines('[{"key":"a","quantity":"10"},{"key":1},null,"x"]')).toEqual([
      { key: "a", quantity: "10" },
    ]);
    expect(parseLines("not json")).toEqual([]);
    expect(parseLines('{"key":"a"}')).toEqual([]);
  });

  it("words core's errors by the composer's names", () => {
    expect(
      mealErrors({ role: "choice" }, { at: { 1: "quantity" } }, () => ({
        "v.role": "Scegli",
      })),
    ).toEqual({
      "v.role": "Scegli",
      role: "Scegli",
      "line.1": "Scrivi una quantità, per esempio 60 o 60,5.",
    });
  });
});
