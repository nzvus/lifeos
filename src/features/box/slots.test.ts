// PAT-30, VIS-102 (Deliver ③, §132): a type gives data; its plan orders it, its instrument shapes it.
import { describe, expect, it } from "vitest";
import { missingSlots, planSlots } from "./slots";

const nutrients = { macros: [{ key: "protein" as const, v: 13 }] };
const trend = { x: ["a", "b"], y: [80, 85], unit: "kg", lo: 80, hi: 85 };

describe("planSlots (PAT-30, VIS-102)", () => {
  it("keeps the plan's order, not the place's, and labels from i18n", () => {
    const s = planSlots("food", { nova: { word: "1" }, nutrients: { nutrients } });
    expect(s.map((x) => x.key)).toEqual(["nutrients", "nova"]);
    expect(s[0]?.label).toBe("Nutrienti");
  });

  it("leaves out what the place has no data for (PRD-22) and names it", () => {
    expect(planSlots("food", { nutrients: { nutrients } }).map((x) => x.key)).toEqual([
      "nutrients",
    ]);
    expect(missingSlots("food", { nutrients: { nutrients } })).toEqual(["nova"]);
  });

  it("refuses a key that is not in the open level", () => {
    expect(() => planSlots("food", { usedIn: { word: "3" } })).toThrow(/usedIn/);
  });

  it("refuses a shape that is not the slot's instrument", () => {
    expect(() => planSlots("food", { nova: { trend, value: "1" } })).toThrow(/word/);
    expect(() => planSlots("exercise", { e1rm: { word: "85 kg" } })).toThrow(/line/);
    expect(planSlots("exercise", { e1rm: { trend, value: "85 kg" } })).toHaveLength(1);
  });

  it("a composition may list its members by name (a scheda's esercizi)", () => {
    expect(planSlots("routine", { exercises: { words: ["Squat"] } })[0]?.label).toBe(
      "Esercizi",
    );
  });
});
