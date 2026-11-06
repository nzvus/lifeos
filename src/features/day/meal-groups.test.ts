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

  it("groups only neighbours: far apart or with something else between, two rows", () => {
    const session = { ...meal("gym", "", 800, "0"), kind: reg.get("session") } as DayItem;
    const items = [
      meal("l1", "lunch", 750, "100"),
      meal("l2", "lunch", 900, "100"), // 150 min later: a second lunch row
      meal("s1", "snack", 600, "10"),
      meal("s2", "snack", 640, "10"),
      meal("d1", "dinner", 1140, "10"),
      session,
      meal("d2", "dinner", 1150, "10"),
    ];
    session.minute = 1145;
    const titles: Record<string, string> = {
      l1: "Pranzo",
      l2: "Pranzo",
      s1: "Spuntino",
      s2: "Spuntino",
      d1: "Cena",
      d2: "Cena",
      gym: "Pull",
    };
    const g = mealGroups(items, (i) => titles[i.id]!);
    expect(g.map((x) => [x.merged.id, x.items.map((i) => i.id)])).toEqual([
      ["group:snack:s1", ["s1", "s2"]],
    ]);
  });
});
