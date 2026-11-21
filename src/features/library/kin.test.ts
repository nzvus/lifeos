import { describe, expect, it } from "vitest";
import type { RecipeChoice } from "@/core/food/choices";
import { pastoKin } from "./kin";

const pasto = (
  id: string,
  parts: [string, string][],
  extra: Partial<RecipeChoice> = {},
) => ({
  key: "recipe:" + id,
  recipeId: id,
  name: id,
  parts: parts.map(([key, quantity]) => ({ key, quantity })),
  uses: 0,
  ...extra,
});

describe("pastoKin (MOD-23, PAT-103)", () => {
  it("names each pasto's parents and children, stored and found", () => {
    const kin = pastoKin([
      pasto("Gelato", [
        ["milk", "400"],
        ["whey", "15"],
      ]),
      pasto("Pistacchio", [
        ["milk", "400"],
        ["whey", "15"],
        ["pistachio", "40"],
      ]),
      pasto(
        "Doppio",
        [
          ["milk", "800"],
          ["whey", "30"],
          ["nut", "20"],
        ],
        { parents: [{ id: "Gelato", k: 2 }] },
      ),
      pasto("Stima", [], { estimate: { kcal: "500" } }),
    ]);
    expect(kin.get("Pistacchio")).toEqual({
      parents: [{ id: "Gelato", name: "Gelato", k: 1, stored: false }],
      children: [],
    });
    expect(kin.get("Doppio")?.parents).toEqual([
      { id: "Gelato", name: "Gelato", k: 2, stored: true },
    ]);
    expect(kin.get("Gelato")?.children.map((c) => [c.id, c.k, c.stored])).toEqual([
      ["Pistacchio", 1, false],
      ["Doppio", 2, true],
    ]);
    expect(kin.has("Stima")).toBe(false);
  });
});

describe("ingredientGroups (his §169: which foods each parent brings)", () => {
  it("each parent's foods × k, then the pasto's own", async () => {
    const { ingredientGroups } = await import("./kin");
    const gelato = pasto("Gelato", [
      ["milk", "400"],
      ["whey", "15"],
    ]);
    const doppio = pasto("Doppio", [
      ["milk", "800"],
      ["whey", "30"],
      ["nut", "20"],
    ]);
    const g = ingredientGroups(
      doppio,
      [gelato, doppio],
      [{ id: "Gelato", name: "Gelato", k: 2, stored: true }],
    );
    expect(g.parents).toEqual([
      {
        id: "Gelato",
        name: "Gelato",
        k: 2,
        stored: true,
        foods: [
          { key: "milk", quantity: 800 },
          { key: "whey", quantity: 30 },
        ],
      },
    ]);
    expect(g.own).toEqual([{ key: "nut", quantity: 20 }]);
  });
});

describe("ingredientLines (his §172: a food once, its parents' shares and its own)", () => {
  it("sums a food that comes from two parents and from the pasto itself", async () => {
    const { ingredientLines } = await import("./MealIngredients");
    const f = (key: string, quantity: number) => ({
      key,
      name: key,
      brand: null,
      quantity,
      unit: "g",
    });
    const lines = ingredientLines({
      parents: [
        { id: "a", name: "A", k: 1, foods: [f("milk", 200), f("whey", 15)] },
        { id: "b", name: "B", k: 2, foods: [f("milk", 100)] },
      ],
      own: [f("milk", 50), f("nut", 20)],
    });
    const milk = lines.find((l) => l.f.key === "milk")!;
    expect(milk.parents).toEqual([
      { tone: 0, q: 200 },
      { tone: 1, q: 100 },
    ]);
    expect(milk.own).toBe(50);
    expect(lines.map((l) => l.f.key)).toEqual(["milk", "whey", "nut"]);
  });
});
