import { describe, expect, it } from "vitest";
import type { FoodChoice } from "@/core/food/choices";
import {
  exerciseRows,
  foodPage,
  mealPage,
  foodRows,
  listRows,
  recipeRows,
  sortValue,
} from "./library";

const food = (
  key: string,
  name: string,
  per100: Record<string, string>,
  uses = 0,
): FoodChoice => ({
  key,
  foodId: key,
  productId: null,
  name,
  brand: null,
  unit: "g",
  per100,
  uses,
  lastQty: null,
});
const foods = [
  food("oats", "Avena", { kcal: "372", protein: "13.5" }, 5),
  food("skyr", "Skyr", { kcal: "63", protein: "11" }, 2),
  food("salt", "Sale", {}),
];

describe("Libreria's lists", () => {
  it("sorts by a nutrient, per 100 kcal, use or name; no value last", () => {
    const rows = foodRows(foods);
    expect(listRows(rows, "", "kcal").map((r) => r.key)).toEqual([
      "oats",
      "skyr",
      "salt",
    ]);
    expect(listRows(rows, "", "proteinPerKcal").map((r) => r.key)).toEqual([
      "skyr",
      "oats",
      "salt",
    ]);
    expect(listRows(rows, "", "uses")[0]!.key).toBe("oats");
    expect(listRows(rows, "", "name").map((r) => r.name)).toEqual([
      "Avena",
      "Sale",
      "Skyr",
    ]);
    expect(listRows(rows, "SKY", "uses").map((r) => r.key)).toEqual(["skyr"]);
    expect(sortValue(rows[2]!, "protein")).toBeNull();
    const withProduct = foodRows([
      ...foods,
      { ...foods[1]!, key: "skyr:p", productId: "p", brand: "Lidl", uses: 4 },
    ]);
    expect(withProduct.find((r) => r.key === "skyr")).toMatchObject({
      sub: "1 prodotto",
      uses: 6,
    });
    expect(withProduct).toHaveLength(3);
  });

  it("gives a saved meal its parts' totals and names", () => {
    const [r] = recipeRows(
      [
        {
          key: "recipe:1",
          recipeId: "1",
          name: "Porridge",
          parts: [
            { key: "oats", quantity: "50" },
            { key: "skyr", quantity: "100" },
          ],
          uses: 1,
        },
      ],
      foods,
    );
    expect(r!.values).toEqual({ kcal: 249, protein: 17.75 });
    expect(r!.sub).toBe("Avena, Skyr");
  });

  it("gives a food's page its products and the saved meals with it", () => {
    const all = [
      ...foods,
      { ...foods[1]!, key: "skyr:p", productId: "p", brand: "Lidl" },
    ];
    const page = foodPage(
      all,
      [
        {
          key: "recipe:1",
          recipeId: "1",
          name: "Porridge",
          parts: [{ key: "skyr:p", quantity: "150" }],
          uses: 0,
        },
      ],
      "skyr",
    );
    expect(page).toMatchObject({
      name: "Skyr",
      products: [{ brand: "Lidl" }],
      meals: [{ name: "Porridge", quantity: "150" }],
    });
    expect(foodPage(all, [], "nope")).toBeNull();
  });

  it("gives a saved meal's page its foods and totals", () => {
    const recipes = [
      {
        key: "recipe:1",
        recipeId: "1",
        name: "Porridge",
        parts: [{ key: "oats", quantity: "50" }],
        uses: 3,
      },
    ];
    expect(mealPage(foods, recipes, "1")).toMatchObject({
      name: "Porridge",
      parts: [{ name: "Avena", quantity: "50", href: "/libreria/cibo/oats" }],
      totals: { kcal: 186 },
    });
    expect(mealPage(foods, recipes, "2")).toBeNull();
  });
});

describe("the index's shelves", () => {
  it("say the products, the two saved meals used most, the exercises trained", async () => {
    const { shelfLines } = await import("./library");
    const food = (productId: string | null) =>
      ({
        key: "k" + productId,
        foodId: "f",
        productId,
        name: "Avena",
        brand: null,
        unit: "g",
        per100: {},
        uses: 0,
        lastQty: null,
      }) as const;
    const row = (name: string, uses: number) => ({
      key: name,
      name,
      sub: "",
      uses,
      values: {},
    });
    expect(
      shelfLines(
        [food(null), food("p1"), food("p2")],
        [row("Porridge", 3), row("Pizza", 9), row("Insalata", 1)],
        [row("Panca", 4), row("Trazioni", 0)],
      ),
    ).toEqual({
      foods: "ciò che mangi · 2 prodotti",
      meals: "più usati: pizza, porridge",
      exercises: "1 con sessioni · record ed e1RM",
    });
  });
});

describe("the foods by their score", () => {
  it("sorts by the score per 100 kcal, unjudged foods last", () => {
    const row = (name: string, value: number | null) => ({
      key: name,
      name,
      sub: "",
      uses: 0,
      values: {},
      ...(value === null ? {} : { score: { value, parts: [], missing: [] } }),
    });
    const rows = [row("Pane", 12), row("Acqua", null), row("Broccoli", 100)];
    expect(listRows(rows, "", "score").map((r) => r.name)).toEqual([
      "Broccoli",
      "Pane",
      "Acqua",
    ]);
    expect(sortValue(rows[0]!, "score")).toBe(12);
  });
});

describe("an exercise found by a merged name («Unisci»)", () => {
  it("«run» finds Corsa, which shows its own name only", () => {
    const rows = exerciseRows(
      [
        { id: "c", name: "Corsa", pattern: "run", aliases: ["Run"] },
        { id: "p", name: "Panca piana", pattern: "horizontal_press" },
      ],
      new Map(),
      (d) => d,
    );
    const found = listRows(rows, "run", "name");
    expect(found.map((r) => r.name)).toEqual(["Corsa"]);
    expect(found[0]!.sub).toBe("mai fatto");
  });
});
