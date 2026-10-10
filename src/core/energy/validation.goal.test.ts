/** The goal form's input (ADR-0043). */
import { describe, expect, it } from "vitest";
import { parseInput } from "../shared/validation";
import { goalInput } from "./validation";

const form = {
  ratePctWeek: "-0,5",
  targetKg: "",
  kcalFloor: "standard",
  protein: "high",
  split: "balanced",
  checkInWeekday: "1",
};

describe("goalInput", () => {
  it("reads a comma, keeps two decimals, an empty target is none", () => {
    expect(parseInput(goalInput, form)).toEqual({
      ok: true,
      value: { ...form, ratePctWeek: "-0.50", targetKg: null, checkInWeekday: 1 },
    });
    const r = parseInput(goalInput, { ...form, targetKg: "72.4" });
    expect(r.ok && r.value.targetKg).toBe("72.40");
  });

  it("refuses a rate or a target out of range, and unknown choices", () => {
    expect(parseInput(goalInput, { ...form, ratePctWeek: "-2" })).toMatchObject({
      ok: false,
      errors: { ratePctWeek: "not_positive" },
    });
    expect(parseInput(goalInput, { ...form, ratePctWeek: "x" })).toMatchObject({
      ok: false,
      errors: { ratePctWeek: "invalid_number" },
    });
    expect(parseInput(goalInput, { ...form, targetKg: "10" })).toMatchObject({
      ok: false,
    });
    expect(parseInput(goalInput, { ...form, split: "keto" })).toMatchObject({
      ok: false,
      errors: { split: "invalid_choice" },
    });
  });
});
