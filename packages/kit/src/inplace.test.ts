import { describe, expect, it } from "vitest";
import type { FormFieldSpec } from "./form";
import { inPlaceCommit } from "./inplace";

const km: FormFieldSpec = {
  key: "distanceKm",
  label: "Distanza",
  type: "number",
  unit: "km",
  min: 0,
};
const mode: FormFieldSpec = {
  key: "mode",
  label: "Mezzo",
  type: "choice",
  required: true,
  choices: [
    { value: "walk", label: "A piedi" },
    { value: "bike", label: "Bici" },
  ],
};

describe("InPlace (PAT-13): leaving a value's field", () => {
  it("saves a changed value, typed with his decimal comma", () => {
    expect(inPlaceCommit(km, "4,5", 4.2)).toEqual({ kind: "save", value: 4.5 });
    expect(inPlaceCommit(km, "", 4.2)).toEqual({ kind: "save", value: null });
  });
  it("just closes when nothing changed", () => {
    expect(inPlaceCommit(km, "4,2", 4.2)).toEqual({ kind: "same" });
    expect(inPlaceCommit(km, "", null)).toEqual({ kind: "same" });
    expect(inPlaceCommit(mode, "bike", "bike")).toEqual({ kind: "same" });
  });
  it("keeps the field open with the form's error", () => {
    expect(inPlaceCommit(km, "tanto", 4.2)).toMatchObject({ kind: "error" });
    expect(inPlaceCommit(km, "-1", 4.2)).toMatchObject({ kind: "error" });
    expect(inPlaceCommit(mode, "", "bike")).toMatchObject({ kind: "error" });
  });
});
