import { describe, expect, it } from "vitest";
import type { DayItem, FoodTargets } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { microTargets } from "@/core/engines/targets";
import { mealScore } from "./score";

const reg = kindRegistry();
const meal = (lines: DayItem["lines"]): DayItem =>
  ({
    id: "m",
    kind: reg.get("meal"),
    family: "food",
    subcategory: "lunch",
    status: "done",
    start: null,
    end: null,
    minute: null,
    item: null,
    values: {},
    lines,
    children: [],
    sets: [],
    money: null,
    fulfils: null,
    tags: [],
    source: "typed",
    confidence: "1",
    note: "",
  }) as DayItem;
const targets: FoodTargets = {
  from: "week",
  since: "2026-10-10",
  kcal: 2778,
  protein: 154,
  carbs: 367,
  fat: 77,
  fibre: 39,
  sugars: 125,
  saturatedFat: 31,
  salt: 5,
};
const broccoli = {
  id: "b",
  name: "Broccoli",
  itemId: "f1",
  productId: null,
  quantity: "300",
  unit: "g",
  values: {
    kcal: "34",
    protein: "2.8",
    fibre: "2.6",
    fat: "0.4",
    carbs: "6.6",
    saturatedFat: "0.04",
    salt: "0.08",
  },
};
const est = new Map([
  [
    "f1",
    {
      k: "316",
      ca: "47",
      fe: "0.7",
      mg: "21",
      vitA: "31",
      vitC: "89",
      vitD: "0",
      folate: "63",
      protein_medium: "1",
      carbs_free: "0",
      carbs_intrinsic: "1",
      fat_n3: "0.02",
      fat_sfa: "0.04",
    },
  ],
]);

describe("a meal's score on the day", () => {
  it("parts in words with their weights; the parts that cannot be computed named", () => {
    const s = mealScore(
      meal([broccoli]),
      targets,
      est,
      microTargets({ sex: "male", age: 24 }),
    )!;
    expect(s.parts.map((p) => p.name)).toEqual(["densità", "limiti"]);
    expect(s.missing).toEqual(["valore", "adatto al blocco"]);
    expect(s.value).toBeGreaterThanOrEqual(70);
    expect(s.parts.reduce((a, p) => a + p.weight, 0)).toBeCloseTo(1, 10);
  });

  it("names the limit that decided it", () => {
    const salty = { ...broccoli, values: { ...broccoli.values, salt: "2" } };
    const s = mealScore(
      meal([salty]),
      targets,
      est,
      microTargets({ sex: "male", age: 24 }),
    )!;
    expect(s.parts.find((p) => p.name.startsWith("limiti"))!.name).toBe("limiti · sale");
  });

  it("none without the day's targets, nor for a coffee", () => {
    expect(mealScore(meal([broccoli]), null, est, null)).toBeUndefined();
    expect(
      mealScore(
        meal([{ ...broccoli, quantity: "5", values: { kcal: "2" } }]),
        targets,
        est,
        null,
      ),
    ).toBeUndefined();
  });
});
