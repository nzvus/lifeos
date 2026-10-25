import { describe, expect, it } from "vitest";
import type { DayItem } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { blocksFromDay } from "./from-day";

const reg = kindRegistry();
const item = (kind: string, more: Partial<DayItem> = {}): DayItem =>
  ({
    id: kind + Math.random(),
    kind: reg.get(kind),
    family: "food",
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
    source: "typed",
    confidence: "1",
    note: "",
    ...more,
  }) as DayItem;
const meal = (role: string, minute: number, kcal: string, protein: string) =>
  item("meal", {
    subcategory: role,
    minute,
    lines: [
      {
        id: "l",
        name: "x",
        itemId: null,
        productId: null,
        quantity: "100",
        unit: "g",
        values: { kcal, protein },
      },
    ],
  });

describe("«Salva come modello»", () => {
  it("one block per meal role at its first time, with its shares; sessions with their minutes", () => {
    const blocks = blocksFromDay([
      meal("dinner", 18 * 60 + 36, "300", "10"),
      meal("breakfast", 8 * 60, "500", "30"),
      meal("dinner", 18 * 60 + 16, "200", "10"),
      item("session", { minute: 9 * 60 + 30, values: { durationMin: "55" } }),
      // A coffee logged as a snack is no block; a skipped lunch is not part of the day.
      meal("snack", 13 * 60 + 9, "0", "0"),
      { ...meal("lunch", 13 * 60, "100", "0"), status: "skipped" },
    ]);
    expect(blocks).toEqual([
      {
        kind: "meal",
        role: "breakfast",
        atMin: 480,
        durationMin: null,
        kcalShare: "0.500",
        proteinShare: "0.600",
      },
      {
        kind: "session",
        role: null,
        atMin: 570,
        durationMin: 55,
        kcalShare: null,
        proteinShare: null,
      },
      {
        kind: "meal",
        role: "dinner",
        atMin: 1096,
        durationMin: null,
        kcalShare: "0.500",
        proteinShare: "0.400",
      },
    ]);
  });
});
