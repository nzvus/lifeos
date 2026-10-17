import { describe, expect, it } from "vitest";
import { MICROS, microState, microTargets } from "./micros";

const of = (ts: ReturnType<typeof microTargets>, m: string) =>
  ts.find((t) => t.micro === m)!;

describe("micronutrient targets (EFSA)", () => {
  it("one per micronutrient of kinds.md, for adults", () => {
    expect(microTargets({ sex: "male", age: 31 }).map((t) => t.micro)).toEqual(MICROS);
    expect(() => microTargets({ sex: "female", age: 16 })).toThrow(RangeError);
  });
  it("by sex and age: vitamin A, C, magnesium, calcium at 18–24", () => {
    const m = microTargets({ sex: "male", age: 31 });
    const w = microTargets({ sex: "female", age: 22 });
    expect([of(m, "vitA").value, of(w, "vitA").value]).toEqual([750, 650]);
    expect([of(m, "vitC").value, of(w, "vitC").value]).toEqual([110, 95]);
    expect([of(m, "mg").value, of(w, "mg").value]).toEqual([350, 300]);
    expect([of(m, "ca").value, of(w, "ca").value]).toEqual([950, 1000]);
  });
  it("women's iron: 16 mg before the menopause, 11 after", () => {
    expect(of(microTargets({ sex: "female", age: 35 }), "fe").value).toBe(16);
    expect(of(microTargets({ sex: "female", age: 55 }), "fe").value).toBe(11);
    expect(
      of(microTargets({ sex: "female", age: 45, postmenopausal: true }), "fe").value,
    ).toBe(11);
    expect(of(microTargets({ sex: "male", age: 31 }), "fe").value).toBe(11);
  });
  it("upper levels keep their scope: selenium 255 on the total, magnesium only for supplements", () => {
    const m = microTargets({ sex: "male", age: 31 });
    expect(of(m, "se").upper).toEqual({ value: 255, kind: "UL", scope: "total" });
    expect(of(m, "mg").upper?.scope).toBe("supplements and added salts");
    expect(of(m, "fe").upper).toEqual({ value: 40, kind: "safe", scope: "total" });
    expect(of(m, "vitC").upper).toBeNull();
  });
});

describe("microState", () => {
  const m = microTargets({ sex: "male", age: 31 });
  it("short, met, over the total's upper level", () => {
    expect(microState(40, of(m, "se"))).toBe("short");
    expect(microState(90, of(m, "se"))).toBe("met");
    expect(microState(300, of(m, "se"))).toBe("over");
  });
  it("a form- or supplement-only upper level never makes food 'over'", () => {
    expect(microState(600, of(m, "mg"))).toBe("met");
    expect(microState(5000, of(m, "vitA"))).toBe("met");
  });
  it("sodium is an upper aim: 2 g, as WHO's 5 g of salt", () => {
    expect(microState(1800, of(m, "na"))).toBe("met");
    expect(microState(2400, of(m, "na"))).toBe("over");
  });
});
