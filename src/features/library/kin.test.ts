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
