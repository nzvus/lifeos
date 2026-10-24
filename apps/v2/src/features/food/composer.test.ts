import { describe, expect, it } from "vitest";
import type { FoodChoice } from "@/core/food/choices";
import {
  clockMinute,
  closeTheGap,
  fittingRecipes,
  mealFoods,
  dayWithMeal,
  estimateTotals,
  mealNutrients,
  mealErrors,
  mealKinds,
  mealTotals,
  parseLines,
  repeatLines,
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
  it("previews an estimate's typed totals, leaving out what is not a number", () => {
    expect(
      estimateTotals({ kcal: "650", protein: "30,5", fat: "", carbs: "tanti" }),
    ).toEqual({
      kcal: 650,
      protein: 30.5,
    });
  });

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

describe("a logged meal registered again", () => {
  it("names today's choices, falling back from a product to its food, and drops the unknown", () => {
    const keys = new Set(["oats", "milk", "milk:lidl"]);
    expect(
      repeatLines(
        [
          { itemId: "oats", productId: "gone", quantity: "60.00" },
          { itemId: "milk", productId: "lidl", quantity: "200.50" },
          { itemId: null, productId: null, quantity: "100" },
          { itemId: "archived", productId: null, quantity: "10" },
        ],
        keys,
      ),
    ).toEqual({
      lines: [
        { key: "oats", quantity: "60" },
        { key: "milk:lidl", quantity: "200,5" },
      ],
      dropped: 2,
    });
  });
});

describe("the composer against the meal's block", () => {
  const block = { kcal: 495, protein: 50, carbs: 60, fat: 15, fibre: 10 };
  const skyr = {
    ...choice("skyr", { kcal: "63", protein: "11" }),
    uses: 20,
    lastQty: "150",
  };
  const cod = { ...choice("cod", { kcal: "80", protein: "17.7" }), uses: 5 };
  const bread = { ...choice("bread", { kcal: "260", protein: "8" }), uses: 30 };

  it("the bars and kcal against the block, the foods as the window's chips", () => {
    const d = mealNutrients(
      { kcal: 300, protein: 20 },
      undefined,
      mealFoods([{ key: "oats", quantity: "50" }], by),
      block,
    );
    expect(d.kcal).toEqual({ v: 300, t: 495 });
    expect(d.macros[0]).toMatchObject({ key: "protein", v: 20, t: 50 });
    expect(d.foods![0]).toMatchObject({
      key: "oats",
      kcal: 186,
      macros: { protein: { all: 6.75 } },
    });
  });

  it("what closes the protein gap: a food in the meal raised, a usual dense one added", () => {
    const g = closeTheGap(
      { kcal: 300, protein: 35 },
      block,
      [{ key: "cod", quantity: "200" }],
      [skyr, cod, bread],
    )!;
    expect(g.gap).toBe(15);
    // Cod: +90 g → +15,9 g; skyr: 140 g → +15,4 g. Bread is not dense in protein.
    expect(g.ideas.map((x) => [x.key, x.quantity, x.raise])).toEqual([
      ["cod", "290", true],
      ["skyr", "140", false],
    ]);
    expect(closeTheGap({ protein: 49 }, block, [], [skyr])!.ideas).toEqual([]);
    expect(closeTheGap({ protein: 10 }, null, [], [skyr])).toBeNull();
  });

  it("the saved meals fitting the block best", () => {
    const fits = fittingRecipes(
      [
        {
          key: "r1",
          recipeId: "r1",
          name: "Merluzzo",
          parts: [{ key: "cod", quantity: "300" }],
          uses: 3,
        },
        {
          key: "r2",
          recipeId: "r2",
          name: "Pizza",
          parts: [],
          uses: 9,
          estimate: { kcal: "900", protein: "35" },
        },
      ],
      new Map([["cod", cod]]),
      block,
    );
    expect(fits.map((f) => f.recipe.name)).toEqual(["Merluzzo"]);
  });
});
