/** A month of the ledger (ADR-0036): totals, pace, categories, shops, food. */
import { describe, expect, it } from "vitest";
import { monthSummary } from "./summary";

const cats = [
  {
    id: "food",
    name: "Spesa",
    icon: "cart",
    key: "groceries",
    kind: "expense" as const,
    parentId: null,
  },
  {
    id: "super",
    name: "Supermercato",
    icon: "",
    key: null,
    kind: "expense" as const,
    parentId: "food",
  },
  {
    id: "out",
    name: "Ristoranti",
    icon: "utensils",
    key: "eating_out",
    kind: "expense" as const,
    parentId: null,
  },
  {
    id: "pay",
    name: "Stipendio",
    icon: "briefcase",
    key: null,
    kind: "income" as const,
    parentId: null,
  },
];
const mv = (day: string, euros: number, categoryId: string | null = null, shop = "") => ({
  day,
  amountCents: Math.round(euros * 100),
  categoryId,
  shop,
});

describe("monthSummary", () => {
  const s = monthSummary({
    month: "2026-10",
    today: "2026-10-04",
    movements: [
      mv("2026-10-01", -40.5, "super", "Esselunga"),
      mv("2026-10-02", -12, "food", "esselunga"),
      mv("2026-10-04", -30, "out", "Indiano"),
      mv("2026-10-03", -7.5),
      mv("2026-10-01", 1800, "pay"),
    ],
    lastMonth: [mv("2026-09-02", -50), mv("2026-09-20", -100)],
    categories: cats,
    none: "No category",
  });

  it("adds spending and income in exact cents", () => {
    expect(s).toMatchObject({
      spentCents: 9000,
      incomeCents: 180000,
      balanceCents: 171000,
    });
  });

  it("compares the pace with last month by the same day, and projects the month", () => {
    expect(s.days).toBe(4);
    expect(s.cumulative).toEqual([4050, 5250, 6000, 9000]);
    expect(s.lastMonthSameDayCents).toBe(5000);
    expect(s.lastCumulative).toHaveLength(30);
    expect(s.projectedCents).toBe(69750); // 90 € in 4 days × 31
  });

  it("groups by top-level category, children inside, no category last", () => {
    expect(s.expenses.map((e) => [e.id, e.cents])).toEqual([
      ["food", 5250],
      ["out", 3000],
      [null, 750],
    ]);
    expect(s.expenses[0]!.children).toEqual([
      { id: "super", name: "Supermercato", cents: 4050 },
    ]);
    expect(s.expenses[0]!.share).toBeCloseTo(5250 / 9000);
    expect(s.income[0]).toMatchObject({ id: "pay", cents: 180000, share: 1 });
  });

  it("joins shops whatever their case, and finds the food categories by key", () => {
    expect(s.shops[0]).toEqual({ shop: "Esselunga", cents: 5250, count: 2 });
    expect(s.food).toEqual({ groceriesCents: 5250, eatingOutCents: 3000 });
  });

  it("has no projection for a past month and no pace without last month's data", () => {
    const past = monthSummary({
      month: "2026-09",
      today: "2026-10-04",
      movements: [mv("2026-09-02", -50)],
      lastMonth: [],
      categories: cats,
      none: "-",
    });
    expect(past).toMatchObject({
      days: 30,
      projectedCents: null,
      lastMonthSameDayCents: null,
    });
  });
});
