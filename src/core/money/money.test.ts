import { describe, expect, it } from "vitest";
import { checkAmount, type Category, type Movement } from "./index";
import { monthMoney } from "./month";

const m = (day: string, cents: number, categoryId: string | null = null): Movement => ({
  id: day + cents,
  day,
  startAt: null,
  cents,
  categoryId,
  shop: "",
  method: null,
  note: "",
});
const CATS: Category[] = [
  { id: "eat", name: "Eating out", parentId: null, kind: "expense" },
  { id: "bar", name: "Bar and coffee", parentId: "eat", kind: "expense" },
  { id: "book", name: "Books and games", parentId: null, kind: "expense" },
];

describe("Soldi", () => {
  it("reads what is typed", () => {
    expect(checkAmount("12,50")).toBe(1250);
    expect(checkAmount(" 3 € ")).toBe(300);
    expect(checkAmount("0")).toBeNull();
    expect(checkAmount("1,234")).toBeNull();
    expect(checkAmount("abc")).toBeNull();
  });

  it("the month: spent, earned, the month before to the same day, by top category, by day", () => {
    const r = monthMoney(
      [
        m("2026-10-04", -2300, "eat"),
        m("2026-10-07", -1200, "book"),
        m("2026-10-07", -150, "bar"),
        m("2026-10-10", 5000),
      ],
      [m("2026-09-02", -1000), m("2026-09-20", -9000)],
      CATS,
      "2026-10-12",
    );
    expect(r.spentCents).toBe(3650);
    expect(r.earnedCents).toBe(5000);
    expect(r.beforeCents).toBe(1000);
    expect(r.byCategory).toEqual([
      { id: "eat", cents: 2450 },
      { id: "book", cents: 1200 },
    ]);
    expect(r.days.map((d) => [d.day, d.cents])).toEqual([
      ["2026-10-10", 5000],
      ["2026-10-07", -1350],
      ["2026-10-04", -2300],
    ]);
  });
});
