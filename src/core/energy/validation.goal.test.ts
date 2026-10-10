/** The goal form's input (ADR-0043, ADR-0045). */
import { describe, expect, it } from "vitest";
import { parseInput } from "../shared/validation";
import { goalInput } from "./validation";

const form = {
  kind: "lose",
  targetKg: "",
  targetDay: "",
  kcalFloor: "standard",
  protein: "extra",
  split: "balanced",
  checkInWeekday: "1",
};

describe("goalInput", () => {
  it("reads a comma; an empty target weight or day is none", () => {
    expect(parseInput(goalInput, form)).toEqual({
      ok: true,
      // An unticked checkbox sends nothing: the check-in is off (ADR-0048).
      value: {
        ...form,
        targetKg: null,
        targetDay: null,
        checkInWeekday: 1,
        weeklyCheckIn: false,
      },
    });
    const r = parseInput(goalInput, {
      ...form,
      targetKg: "72,4",
      targetDay: "2026-12-01",
    });
    expect(r.ok && [r.value.targetKg, r.value.targetDay]).toEqual([
      "72.40",
      "2026-12-01",
    ]);
  });

  it("refuses a target out of range, a bad day and unknown choices", () => {
    expect(parseInput(goalInput, { ...form, targetKg: "10" })).toMatchObject({
      ok: false,
    });
    expect(parseInput(goalInput, { ...form, targetDay: "2026-13-01" })).toMatchObject({
      ok: false,
      errors: { targetDay: "invalid_day" },
    });
    expect(parseInput(goalInput, { ...form, kind: "bulk" })).toMatchObject({
      ok: false,
      errors: { kind: "invalid_choice" },
    });
  });
});
