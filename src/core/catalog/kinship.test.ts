import { describe, expect, it } from "vitest";
import { childrenOf, expandParts, kinship, type Part } from "./family";

// MOD-23, ADR-0065: a pasto's parent is one of its lines × k; kinship is found from the foods.
const p = (food: string, q: string, d: Record<string, unknown> = {}): Part => ({
  partItemId: food,
  quantity: q,
  unit: "g",
  defaults: d,
});
const gelato = [p("milk", "400"), p("whey", "15")];

describe("expandParts (MOD-23)", () => {
  const own: Record<string, Part[]> = {
    gelato,
    pistacchio: [p("gelato", "1"), p("pistachio", "40")],
    doppio: [p("pistacchio", "2"), p("whey", "5")],
    loopA: [p("loopB", "1"), p("milk", "100")],
    loopB: [p("loopA", "1"), p("whey", "10")],
  };
  const partsOf = (id: string) => own[id] ?? null;

  it("a parent line counts as its foods × k, at any depth; equal foods are summed", () => {
    expect(expandParts("pistacchio", partsOf)).toEqual([...gelato, p("pistachio", "40")]);
    expect(expandParts("doppio", partsOf)).toEqual([
      p("milk", "800"),
      p("whey", "35"),
      p("pistachio", "80"),
    ]);
  });

  it("a line in a loop is left out, never followed forever", () => {
    expect(expandParts("loopA", partsOf)).toEqual([p("whey", "10"), p("milk", "100")]);
  });
});

describe("kinship (MOD-23)", () => {
  const pasto = (id: string, foods: Part[], own: Part[] = foods) => ({ id, own, foods });

  it("finds a parent at k when every food of it is in the child in the same proportions", () => {
    const kin = kinship([
      pasto("gelato", gelato),
      pasto("pistacchio", [...gelato, p("pistachio", "40")]),
      pasto("grande", [p("milk", "600"), p("whey", "22.6"), p("cocoa", "10")]),
    ]);
    expect(kin.get("pistacchio")).toEqual([{ id: "gelato", k: 1, stored: false }]);
    expect(kin.get("grande")).toEqual([{ id: "gelato", k: 1.5, stored: false }]);
    expect(kin.has("gelato")).toBe(false);
    expect(
      childrenOf(kin)
        .get("gelato")
        ?.map((x) => x.id),
    ).toEqual(["pistacchio", "grande"]);
  });

  it("other proportions, another unit, another product or one food are not kin", () => {
    const kin = kinship([
      pasto("gelato", gelato),
      pasto("off", [p("milk", "400"), p("whey", "30"), p("x", "1")]),
      pasto("brand", [
        p("milk", "400", { preferredProduct: "lidl" }),
        p("whey", "15"),
        p("x", "1"),
      ]),
      pasto("ml", [{ ...p("milk", "400"), unit: "ml" }, p("whey", "15"), p("x", "1")]),
      pasto("one", [p("milk", "100")]),
      pasto("withMilk", [p("milk", "100"), p("y", "1")]),
    ]);
    expect([...kin.keys()]).toEqual([]);
  });

  it("twins are not kin; a pure multiple has the smaller as parent", () => {
    const kin = kinship([
      pasto("a", gelato),
      pasto("b", [p("milk", "401"), p("whey", "15")]),
      pasto("double", [p("milk", "800"), p("whey", "30")]),
    ]);
    expect(kin.get("a")).toBeUndefined();
    expect(kin.get("b")).toBeUndefined();
    // «a» and «b» both fit «double» × 2 and share every food: only one is kept.
    expect(kin.get("double")).toEqual([{ id: "a", k: 2, stored: false }]);
  });

  it("only the largest parent is kept, never two sharing a food; stored lines come first", () => {
    const base = pasto("base", gelato);
    const mid = pasto("mid", [...gelato, p("cocoa", "10")]);
    const top = pasto("top", [...gelato, p("cocoa", "10"), p("nut", "20")]);
    expect(kinship([base, mid, top]).get("top")).toEqual([
      { id: "mid", k: 1, stored: false },
    ]);

    const sauce = pasto("sauce", [p("tomato", "100"), p("oil", "10")]);
    const stored = pasto(
      "dish",
      [...gelato, p("tomato", "100"), p("oil", "10")],
      [p("base", "1"), p("tomato", "100"), p("oil", "10")],
    );
    expect(kinship([base, sauce, stored]).get("dish")).toEqual([
      { id: "base", k: 1, stored: true },
      { id: "sauce", k: 1, stored: false },
    ]);
  });
});
