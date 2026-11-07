// PAT-41 / FD-93: the composer's search is the kit's Find — one row per food, its brands as
// aliases; a brand is added only when the words name it (what `collapseBrands` did).
import { describe, expect, it } from "vitest";
import { find } from "@lifeos/kit";
import type { FoodChoice } from "@/core/food/choices";
import { foodRows, pickedFood } from "./FoodSearch";

const c = (
  key: string,
  foodId: string,
  productId: string | null,
  name: string,
  brand: string | null,
  uses = 1,
): FoodChoice => ({
  key,
  foodId,
  productId,
  name,
  brand,
  unit: "g",
  per100: { kcal: "30" },
  uses,
  lastQty: null,
});
const CHOICES = [
  c("p", "p", null, "Passata di pomodoro", null, 9),
  c("p:m", "p", "m", "Passata di pomodoro", "Mutti", 5),
  c("p:c", "p", "c", "Passata di pomodoro", "Cirio", 2),
  c("y:f", "y", "f", "Yogurt greco", "Fage", 3), // a product with no plain food row
];

describe("the food composer's search (PAT-41, FD-93)", () => {
  it("one row per food, its brands as aliases; a lone product keeps its row", () => {
    const rows = foodRows(CHOICES);
    expect(rows.map((r) => r.id)).toEqual(["p", "y:f"]);
    expect(rows[0]!.aliases).toEqual(["Mutti", "Cirio"]);
    expect(find(rows, "mutti", { hour: 12 }).map((r) => r.id)).toEqual(["p"]);
  });
  it("the row adds the brand the words name, else the food itself", () => {
    expect(pickedFood(CHOICES[0]!, CHOICES, "passata mutti").key).toBe("p:m");
    expect(pickedFood(CHOICES[0]!, CHOICES, "passata").key).toBe("p");
  });
});
