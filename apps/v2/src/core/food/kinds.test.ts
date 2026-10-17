import { describe, expect, it } from "vitest";
import { KIND_FIELDS, macroKinds } from "./kinds";

describe("a macro split into its kinds", () => {
  it("takes the shares from the estimates and the grams from the snapshot", () => {
    const k = macroKinds([
      {
        quantity: "50",
        // logged with 13.5 g of protein per 100: the estimate only splits it
        values: { protein: "13.5", fat: "7" },
        estimates: { protein_high: "2", protein_low: "6", fat_mufa: "3", fat_sfa: "1" },
      },
    ]);
    expect(k.protein).toEqual({ high: 1.6875, low: 5.0625 });
    expect(k.protein.high! + k.protein.low!).toBeCloseTo(6.75);
    expect(k.fat).toEqual({ mufa: 2.625, sfa: 0.875 });
    expect(k.carbs).toEqual({});
  });

  it("counts a food without an estimate as none, and multiplies by the servings", () => {
    const k = macroKinds(
      [
        { quantity: "100", values: { fibre: "4" } },
        { quantity: "100", values: { fibre: "2" }, estimates: { fibre_pectin: "1" } },
      ],
      "2",
    );
    expect(k.fibre).toEqual({ none: 8, pectin: 4 });
  });

  it("splits fibre evenly among v1's listed types when no grams are estimated", () => {
    const k = macroKinds([
      {
        quantity: "100",
        values: { fibre: "6" },
        estimates: { fibreTypes: "inulin_fos,pectin,psyllium" },
      },
      { quantity: "100", values: { fibre: "2" }, estimates: { fibreTypes: "psyllium" } },
      // grams win over the list
      {
        quantity: "100",
        values: { fibre: "1" },
        estimates: { fibre_gos: "1", fibreTypes: "pectin" },
      },
    ]);
    expect(k.fibre).toEqual({ inulin: 3, pectin: 3, none: 2, gos: 1 });
  });

  it("names its catalog fields the way the converter writes them", () => {
    expect(KIND_FIELDS).toContain("fibre_insoluble");
    expect(KIND_FIELDS).toContain("carbs_intrinsic");
    expect(KIND_FIELDS).toHaveLength(18);
  });
});
