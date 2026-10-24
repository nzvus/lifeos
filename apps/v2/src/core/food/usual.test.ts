import { describe, expect, it } from "vitest";
import { usualAt, type UsualMeal } from "./usual";

const m = (
  id: string,
  day: string,
  minute: number,
  foods: string[],
  recipe: string | null = null,
): UsualMeal => ({
  id,
  day,
  minute,
  recipe,
  foods,
});

describe("what is usual at this hour", () => {
  it("around now, on two days at least, the most frequent first; by saved meal or by foods", () => {
    const meals = [
      m("a", "2026-10-20", 470, ["Latte", "Avena"]),
      m("b", "2026-10-21", 485, ["Avena", "Latte"]),
      m("c", "2026-10-22", 500, ["Avena", "Latte"]),
      m("d", "2026-10-21", 520, [], "Porridge"),
      m("e", "2026-10-22", 530, ["x"], "Porridge"),
      m("f", "2026-10-22", 480, ["Caffè"]),
      m("g", "2026-10-22", 800, ["Pasta"]),
      m("h", "2026-10-23", 790, ["Pasta"]),
    ];
    expect(usualAt(meals, 490)).toEqual([
      { label: "Latte, Avena", days: 3, lastId: "c", lastDay: "2026-10-22" },
      { label: "Porridge", days: 2, lastId: "e", lastDay: "2026-10-22" },
    ]);
  });

  it("across midnight", () => {
    expect(
      usualAt([m("a", "d1", 1420, ["Tisana"]), m("b", "d2", 10, ["Tisana"])], 1435),
    ).toHaveLength(1);
  });
});
