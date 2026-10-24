import { describe, expect, it } from "vitest";
import type { DayItem, FoodTargets } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { blockFit } from "@/core/food/score";
import type { ResolvedBlock } from "@/core/plans";
import { daySlots, slotFits } from "./slots";

const reg = kindRegistry();
const item = (kind: string, over: Partial<DayItem> = {}): DayItem => ({
  id: "x",
  kind: reg.get(kind),
  family: reg.get(kind).family,
  subcategory: null,
  status: "done",
  start: null,
  end: null,
  minute: null,
  item: null,
  values: {},
  lines: [],
  children: [],
  sets: [],
  money: null,
  fulfils: null,
  tags: [],
  source: "import",
  confidence: "1",
  note: "",
  ...over,
});
const day: FoodTargets = {
  from: "week",
  since: "2026-10-19",
  kcal: 2778,
  protein: 154,
  carbs: 367,
  fat: 77,
  fibre: 39,
  sugars: 125,
  saturatedFat: 31,
  salt: 5,
};
const block = (role: string, kcal: number, protein?: number): ResolvedBlock => ({
  id: role,
  kind: "meal",
  when: { type: "unset" },
  shares: { kcal, ...(protein !== undefined ? { protein } : {}) },
  defaults: { role },
  origin: "local",
});
const meal = (role: string, kcal: string, protein: string, over: Partial<DayItem> = {}) =>
  item("meal", {
    subcategory: role,
    lines: [
      {
        id: role + kcal,
        name: "x",
        itemId: null,
        productId: null,
        quantity: "100",
        unit: "g",
        values: { kcal, protein },
      },
    ],
    ...over,
  });

describe("a day's meal blocks as targets", () => {
  it("lunch at 35 % kcal and 30 % protein of 2 778 kcal and 154 g (day-templates acceptance 5)", () => {
    const lunch = daySlots([block("lunch", 0.35, 0.3)], day).get("lunch")!;
    expect(lunch).toMatchObject({
      kcal: 972,
      protein: 46,
      carbs: 128,
      fat: 27,
      fibre: 14,
    });
    expect(daySlots([block("lunch", 0.35)], null).size).toBe(0);
  });

  it("the block's fit: its meals together, eaten and still planned", () => {
    const slots = daySlots([block("lunch", 0.35, 0.3)], day);
    const fits = slotFits(
      [
        meal("lunch", "600", "30"),
        meal("lunch", "372", "16", { status: "planned" }),
        meal("lunch", "900", "90", { status: "skipped" }),
        meal("dinner", "900", "90"),
      ],
      slots,
    );
    expect(fits.get("lunch")).toBe(1);
    expect(fits.has("dinner")).toBe(false);
  });

  it("fit: kcal within ±15 % is full, far off is none; more protein is no fault", () => {
    expect(blockFit({ kcal: 1000, protein: 80 }, { kcal: 972, protein: 46 })).toBe(1);
    expect(blockFit({ kcal: 1700, protein: 46 }, { kcal: 1000, protein: 46 })).toBe(0.5);
    expect(blockFit({ kcal: 1000, protein: 10 }, { kcal: 1000, protein: 40 })).toBe(0.5);
    expect(blockFit({ kcal: 500, protein: 0 }, { kcal: 0, protein: 0 })).toBeNull();
  });
});
