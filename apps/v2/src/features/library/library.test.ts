import { describe, expect, it } from "vitest";
import type { FoodChoice } from "@/core/food/choices";
import { foodPage, mealPage, foodRows, listRows, recipeRows, sortValue } from "./library";

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
