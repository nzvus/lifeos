import { describe, expect, it } from "vitest";
import { equipmentOf, sidesOf, stepFor } from "./equipment";

describe("an esercizio's facts (target.md §7.4, TR-02)", () => {
  it("the load step: his own first, else by equipment", () => {
    expect(stepFor({ equipment: "machine", loadStepKg: 7 }, 50)).toBe(7);
    expect(stepFor({ equipment: "machine" }, 50)).toBe(5);
    expect(stepFor({ equipment: "cable" }, 10)).toBe(2.5);
    expect(stepFor({ equipment: "dumbbell" }, 30)).toBe(4); // 2 × 15 kg → 2 × 17 kg
    expect(stepFor({ equipment: "barbell" }, 60)).toBe(2.5);
    expect(stepFor({ equipment: null }, 10)).toBe(1);
  });
  it("older Italian equipment words read as their key", () => {
    expect(equipmentOf("Manubri")).toBe("dumbbell");
    expect(equipmentOf("macchina")).toBe("machine");
    expect(equipmentOf("barbell")).toBe("barbell");
    expect(equipmentOf("trave")).toBeNull();
  });
  it("sides: the new field wins, else the old yes/no", () => {
    expect(sidesOf("per_side", false)).toBe("per_side");
    expect(sidesOf(null, true)).toBe("one_at_a_time");
    expect(sidesOf(undefined, false)).toBe("both");
  });
});
