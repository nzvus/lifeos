/** Tests for core/food/off.ts: an Open Food Facts product → form values. */
import { describe, expect, it } from "vitest";
import { offPrefill, parseQuantity } from "./off";

describe("parseQuantity", () => {
  it("reads the usual ways a package is written", () => {
    expect(parseQuantity("500 g")).toEqual({ amount: "500", unit: "g" });
    expect(parseQuantity("1 kg")).toEqual({ amount: "1000", unit: "g" });
    expect(parseQuantity("1,5 l")).toEqual({ amount: "1500", unit: "ml" });
    expect(parseQuantity("75cl")).toEqual({ amount: "750", unit: "ml" });
    expect(parseQuantity("6 x 125 g")).toEqual({ amount: "750", unit: "g" });
    expect(parseQuantity("una confezione")).toBeNull();
  });
});

describe("offPrefill", () => {
  it("maps nutrients per 100 g, the brand, the package and NOVA; missing stays empty", () => {
    const p = offPrefill("8001234567890", {
      status: 1,
      product: {
        product_name: "Rolled oats",
        product_name_it: "Fiocchi d'avena",
        brands: "Crownfield, Lidl",
        quantity: "500 g",
        nova_group: 1,
        nutriments: {
          "energy-kcal_100g": 372,
          proteins_100g: 13,
          carbohydrates_100g: 58.7,
          sugars_100g: "0.7",
          fat_100g: 7,
          "saturated-fat_100g": 1.2,
          salt_100g: 0.0125,
        },
      },
    });
    expect(p).toEqual({
      barcode: "8001234567890",
      name: "Fiocchi d'avena",
      description: "Crownfield",
      unit: "g",
      kcal: "372",
      protein: "13",
      carbs: "58.7",
      sugars: "0.7",
      fat: "7",
      saturatedFat: "1.2",
      fibre: "", // not on the label: the user fills it
      salt: "0.013",
      packageSize: "500",
      nova: "1",
    });
  });

  it("a product that isn't there gives null", () => {
    expect(offPrefill("1", { status: 0 })).toBeNull();
    expect(offPrefill("1", null)).toBeNull();
  });
});
