/** Tests for core/nutrition/preferences.ts and its form validation. */
import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES, preferencesFormValues, preferencesOf } from "./preferences";
import { parseInput, preferencesInput } from "./validation";

const row = {
  autoTargets: false,
  lunchFrom: 720,
  snackFrom: 960,
  dinnerFrom: 1170,
  trendsRange: 30,
  listSort: "protein",
  listPer: "kcal",
};

describe("preferences", () => {
  it("reads the stored columns, falling back for unknown values", () => {
    expect(preferencesOf(row)).toEqual({
      autoTargets: false,
      bounds: { lunch: 720, snack: 960, dinner: 1170 },
      trendsRange: 30,
      listSort: "protein",
      listPer: "kcal",
    });
    const odd = preferencesOf({
      ...row,
      trendsRange: 14,
      listSort: "vibes",
      listPer: "x",
    });
    expect([odd.trendsRange, odd.listSort, odd.listPer]).toEqual([7, "used", "none"]);
  });

  it("round-trips through the form", () => {
    const values = preferencesFormValues(preferencesOf(row));
    expect(values.lunchFrom).toBe("12:00");
    const parsed = parseInput(preferencesInput, values);
    expect(parsed.ok && parsed.value).toEqual({ ...row, trendsRange: 30 });
  });

  it("rejects moment hours out of order", () => {
    const values = { ...preferencesFormValues(DEFAULT_PREFERENCES), dinnerFrom: "14:00" };
    expect(parseInput(preferencesInput, values)).toEqual({
      ok: false,
      errors: { dinnerFrom: "moments_order" },
    });
  });
});
