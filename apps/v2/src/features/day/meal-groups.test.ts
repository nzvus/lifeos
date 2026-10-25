import { describe, expect, it } from "vitest";
import type { DayItem } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { mealGroups } from "./meal-groups";

const reg = kindRegistry();
const meal = (
  id: string,
  role: string,
  minute: number,
  qty: string,
  servings?: string,
): DayItem =>
  ({
    id,
    kind: reg.get("meal"),
    family: "food",
    subcategory: role,
    status: "done",
    start: null,
    end: null,
    minute,
    item: null,
    values: servings ? { role, servings } : { role },
    lines: [
      {
        id: "l",
        name: "x",
        itemId: null,
        productId: null,
        quantity: qty,
        unit: "g",
        values: { kcal: "100" },
      },
    ],
    children: [],
    sets: [],
    money: null,
    fulfils: null,
    tags: [],
    source: "typed",
    confidence: "1",
    note: "",
  }) as DayItem;

describe("meals of one role together", () => {
  it("groups two or more meals named by the role; merges their lines with servings", () => {
    const items = [
      meal("a", "dinner", 1116, "200"),
      meal("b", "dinner", 1096, "50", "2"),
      meal("c", "lunch", 760, "100"),
      meal("coffee", "dinner", 1100, "10"),
    ];
    const titles: Record<string, string> = {
      a: "Cena",
      b: "Cena",
      c: "Pranzo",
      coffee: "Caffè",
    };
    const g = mealGroups(items, (i) => titles[i.id]!);
    expect(g.map((x) => [x.role, x.items.map((i) => i.id)])).toEqual([
      ["dinner", ["b", "a"]],
    ]);
    expect(g[0]!.merged.lines.map((l) => l.quantity)).toEqual(["100", "200"]);
    expect(g[0]!.merged.minute).toBe(1096);
    expect(g[0]!.merged.values["servings"]).toBeUndefined();
  });
});
