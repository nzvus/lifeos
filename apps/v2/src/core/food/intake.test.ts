import { describe, expect, it } from "vitest";
import { intakeOf } from "./intake";

// objects.md §8 test 5, his items (refined export 23 Oct).
describe("what is an «assunzione» (FOOD-44)", () => {
  it("the capsule (0 kcal, caffeine) is one, its dose his last 7,2 g", () => {
    expect(
      intakeOf({
        per100: { kcal: "0" },
        compounds: { caffeine: "1389" },
        stored: {},
        lastQty: "7.200",
      }),
    ).toEqual({ dose: "7.2", doseName: null, chosen: false });
  });
  it("creatine with a named dose he set", () => {
    expect(
      intakeOf({
        per100: { kcal: "0" },
        compounds: { creatine: "100" },
        stored: { intake: true, dose: "3", doseName: "misurino" },
        lastQty: "3.41",
      }),
    ).toEqual({ dose: "3", doseName: "misurino", chosen: true });
  });
  it("Bevanda ACE (12 kcal/100) is not proposed; he can still say no to a coffee", () => {
    expect(intakeOf({ per100: { kcal: "12" }, stored: {}, lastQty: "200" })).toBeNull();
    expect(
      intakeOf({
        per100: { kcal: "2" },
        compounds: { caffeine: "40" },
        stored: { intake: false },
        lastQty: "30",
      }),
    ).toBeNull();
    expect(intakeOf({ per100: { kcal: "0" }, stored: {}, lastQty: null })).toBeNull();
  });
});
