import { describe, expect, it } from "vitest";
import type { FoodChoice } from "./choices";
import { copyLines } from "./copy";

const oats: FoodChoice = {
  key: "oats",
  foodId: "oats",
  productId: null,
  name: "Avena",
  brand: null,
  unit: "g",
  per100: { kcal: "380" },
  uses: 1,
  lastQty: null,
};

describe("copying a meal's lines", () => {
  it("today's catalog values; a food gone keeps its snapshot", () => {
    const lines = copyLines(
      [
        {
          itemId: "oats",
          productId: null,
          name: "Avena vecchia",
          quantity: "50",
          unit: "g",
          values: { kcal: "372" },
        },
        {
          itemId: "gone",
          productId: null,
          name: "Biscotto",
          quantity: "20",
          unit: "g",
          values: { kcal: "450" },
        },
      ],
      new Map([["oats", oats]]),
    );
    expect(lines).toEqual([
      {
        itemId: "oats",
        productId: null,
        name: "Avena",
        quantity: "50",
        unit: "g",
        per100: { kcal: "380" },
      },
      {
        itemId: "gone",
        productId: null,
        name: "Biscotto",
        quantity: "20",
        unit: "g",
        per100: { kcal: "450" },
      },
    ]);
  });
});
