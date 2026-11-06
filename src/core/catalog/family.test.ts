import { describe, expect, it } from "vitest";
import {
  basesOf,
  canBeVariant,
  partsDiff,
  resolveParts,
  variantParts,
  type FamilyItem,
  type Part,
} from "./family";

const p = (food: string, q: string, d: Record<string, unknown> = {}): Part => ({
  partItemId: food,
  quantity: q,
  unit: "g",
  defaults: d,
});
const map = (xs: FamilyItem[]) => new Map(xs.map((x) => [x.id, x]));

// His protein ice creams (objects.md §8 test 1): a base and a flavour.
const base = [p("milk", "400"), p("whey", "15")];

describe("variants (ADR-0060)", () => {
  it("a flavour adds to the base; a change replaces; a removed food goes", () => {
    expect(variantParts(base, [p("pistachio", "40")])).toEqual([
      p("milk", "400"),
      p("whey", "15"),
      p("pistachio", "40"),
    ]);
    expect(
      variantParts(base, [p("whey", "31"), p("milk", "0", { removed: true })]),
    ).toEqual([p("whey", "31")]);
  });

  it("stores only the differences, and they give back what was wanted", () => {
    const wanted = [p("milk", "400"), p("whey", "20"), p("melon", "400")];
    const stored = partsDiff(base, wanted);
    expect(stored).toEqual([p("whey", "20"), p("melon", "400")]);
    expect(variantParts(base, stored)).toEqual(wanted);
    expect(partsDiff(base, [p("milk", "400.00"), p("whey", "15")])).toEqual([]);
    const without = partsDiff(base, [p("milk", "400")]);
    expect(variantParts(base, without)).toEqual([p("milk", "400")]);
  });

  it("a change to the base reaches the variant that does not override it", () => {
    const items = map([
      { id: "base", catalog: "recipe", parentId: null },
      { id: "pist", catalog: "recipe", parentId: "base" },
    ]);
    const own: Record<string, Part[]> = {
      base: [p("milk", "400"), p("whey", "20")],
      pist: [p("pistachio", "40")],
    };
    expect(resolveParts("pist", items, (id) => own[id] ?? [])).toEqual([
      p("milk", "400"),
      p("whey", "20"),
      p("pistachio", "40"),
    ]);
  });

  it("a level is not a variant; loops and depth are refused", () => {
    const items = map([
      { id: "food", catalog: "food", parentId: null },
      { id: "brand", catalog: "product", parentId: "food" },
      { id: "a", catalog: "recipe", parentId: "c" },
      { id: "b", catalog: "recipe", parentId: "a" },
      { id: "c", catalog: "recipe", parentId: "b" },
      { id: "x", catalog: "recipe", parentId: null },
    ]);
    expect(basesOf("brand", items)).toEqual([]);
    expect(basesOf("b", items)).toEqual(["a", "c"]);
    expect(canBeVariant(items.get("x")!, items.get("food")!, items)).toBe(false);
    expect(canBeVariant(items.get("a")!, items.get("b")!, items)).toBe(false);
    expect(canBeVariant(items.get("x")!, items.get("x")!, items)).toBe(false);
  });
});
