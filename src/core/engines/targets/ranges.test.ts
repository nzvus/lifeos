import { describe, expect, it } from "vitest";
import { microTargets } from "./micros";
import {
  omega3Range,
  omega6Range,
  transRange,
  caffeineBedRange,
  fibreRange,
  inulinRange,
  levelAt,
  microRange,
  proteinRange,
  rangeScore,
  saltRange,
  sugarsRange,
  type Range,
} from "./ranges";

// dossiers/ranges.md §8, the developer's days (reference weight 75.6 kg).
const day = { weightKg: 75.6, kcal: 2778 };
const micro = (m: string) =>
  microRange(microTargets({ sex: "male", age: 24 }).find((t) => t.micro === m)!);
const at = (v: number, r: Range) => [levelAt(v, r), rangeScore(v, r)];

describe("ranges (dossiers/ranges.md §8)", () => {
  it("1. 140.7 g of protein at 75.6 kg is good (121–166 g), score 1", () => {
    const r = proteinRange(day);
    expect(r.zones.map((z) => [z.level, Math.round(z.from)])).toEqual([
      ["bad", 0],
      ["fair", 63],
      ["good", 121],
      ["fair", 166],
      ["bad", 227],
    ]);
    expect(at(140.7, r)).toEqual(["good", 1]);
    // Under it, fair falls from 1 to 0.5 toward the PRI.
    expect(rangeScore(92, r)).toBeCloseTo(0.75, 1);
  });

  it("2. 11.6 g of salt is bad, close to danger", () => {
    const [level, score] = at(11.6, saltRange());
    expect(level).toBe("bad");
    expect(score).toBeCloseTo(0.09, 2);
    expect(at(13, saltRange())).toEqual(["danger", 0]);
    expect(at(4, saltRange())).toEqual(["good", 1]);
  });

  it("3. vitamin D 3.5 µg against its AI of 15: fair, never bad", () => {
    expect(levelAt(3.5, micro("vitD"))).toBe("fair");
    expect(levelAt(0, micro("vitD"))).toBe("fair");
    expect(levelAt(120, micro("vitD"))).toBe("danger");
  });

  it("4. magnesium 551 mg: good, its UL is for supplements only", () => {
    expect(at(551, micro("mg"))).toEqual(["good", 1]);
  });

  it("iron: bad under the AR, fair to the PRI", () => {
    expect(levelAt(4.4, micro("fe"))).toBe("bad");
    expect(levelAt(8, micro("fe"))).toBe("fair");
    expect(levelAt(12.4, micro("fe"))).toBe("good");
  });

  it("5. caffeine at bedtime: 13 mg good, 60 mg fair", () => {
    expect(levelAt(13, caffeineBedRange())).toBe("good");
    expect(levelAt(60, caffeineBedRange())).toBe("fair");
  });

  it("7. fibre 68 g on an inulin day: fair past 60 g; inulin 12 g fair", () => {
    expect(levelAt(68, fibreRange(day))).toBe("fair");
    expect(levelAt(45, fibreRange(day))).toBe("good");
    expect(levelAt(12, inulinRange())).toBe("fair");
  });

  it("free sugars scale with the day's energy", () => {
    const r = sugarsRange(day);
    expect(levelAt(30, r)).toBe("good"); // 4.3 % of 2 778 kcal
    expect(levelAt(50, r)).toBe("fair");
    expect(levelAt(150, r)).toBe("danger");
  });

  it("without a reference weight, protein is judged as a share of energy", () => {
    const r = proteinRange({ weightKg: null, kcal: 2000 });
    expect(r.zones.map((z) => [z.level, z.from])).toEqual([
      ["bad", 0],
      ["good", 50],
      ["fair", 175],
    ]);
  });

  it("a day still going is judged only for what went over", () => {
    expect(rangeScore(40, proteinRange(day), true)).toBe(1);
    expect(rangeScore(40, proteinRange(day))).toBeLessThan(0.5);
    expect(rangeScore(11.6, saltRange(), true)).toBeCloseTo(0.09, 2);
  });

  it("the kinds a guideline speaks of: trans, omega-3, omega-6", () => {
    expect(levelAt(2, transRange(day))).toBe("good"); // under 3.1 g (1 % of 2 778 kcal)
    expect(levelAt(4, transRange(day))).toBe("bad");
    expect(levelAt(0.8, omega3Range(day))).toBe("fair"); // under 1.5 g
    expect(levelAt(2, omega3Range(day))).toBe("good");
    expect(levelAt(10, omega6Range(day))).toBe("fair"); // under 12.3 g
    expect(levelAt(20, omega6Range(day))).toBe("good");
  });
});
