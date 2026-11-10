import { describe, expect, it } from "vitest";
import { formFields, readForm, type FormFieldSpec } from "./form";

const ROUTE: FormFieldSpec[] = [
  {
    key: "mode",
    label: "Mezzo",
    type: "choice",
    required: true,
    choices: [
      { value: "walk", label: "A piedi" },
      { value: "bike", label: "Bici" },
    ],
  },
  { key: "distanceKm", label: "Distanza", type: "number", unit: "km", min: 0, max: 200 },
  { key: "walkingM", label: "A piedi", type: "integer", unit: "m", min: 0 },
  { key: "energy", label: "Energia", type: "scale", scale: 5 },
  { key: "outdoor", label: "All'aperto", type: "boolean" },
  { key: "at", label: "Ora", type: "time" },
];

describe("ObjectForm generated from fields (PAT-61)", () => {
  it("numbers get − / + steppers with their unit, a time its native picker", () => {
    const f = formFields(ROUTE, { distanceKm: 4.5, outdoor: true });
    expect(f.map((x) => x.type)).toEqual([
      "choice",
      "stepper",
      "stepper",
      "scale",
      "choice",
      "time",
    ]);
    expect(f[1]).toMatchObject({
      name: "distanceKm",
      unit: "km",
      step: 0.5,
      defaultValue: "4,5",
    });
    expect(f[2]).toMatchObject({ step: 1 });
    expect(f[3]!.options).toHaveLength(5);
    expect(f[4]).toMatchObject({ defaultValue: "yes" });
  });

  it("reads the posted values back with the decimal comma, and says each error", () => {
    const data: Record<string, string> = {
      mode: "bike",
      distanceKm: "4,5",
      walkingM: "200",
      energy: "4",
      outdoor: "no",
      at: "07:40",
    };
    expect(readForm(ROUTE, (k) => data[k] ?? null)).toEqual({
      values: {
        mode: "bike",
        distanceKm: 4.5,
        walkingM: 200,
        energy: 4,
        outdoor: false,
        at: "07:40",
      },
      errors: {},
    });
    const bad = readForm(
      ROUTE,
      (k) => ({ distanceKm: "300", walkingM: "2,5", energy: "7" })[k] ?? null,
    );
    expect(bad.errors).toEqual({
      mode: "Serve un valore",
      distanceKm: "Scrivi un valore tra 0 e 200 km",
      walkingM: "Scrivi un numero intero",
      energy: "Scrivi un valore tra 1 e 5",
    });
  });
});

describe("a day from its native picker (PAT-61)", () => {
  it("is ISO from the picker, never typed by hand; anything else asks for a day", () => {
    const spec = [{ key: "start", label: "Dal giorno", type: "date" as const }];
    expect(readForm(spec, () => "2026-11-10")).toEqual({
      values: { start: "2026-11-10" },
      errors: {},
    });
    expect(readForm(spec, () => "10/11/2026").errors).toEqual({
      start: "Scegli un giorno",
    });
    expect(formFields(spec, { start: "2026-11-10" })[0]).toMatchObject({
      type: "date",
      defaultValue: "2026-11-10",
    });
  });
});
