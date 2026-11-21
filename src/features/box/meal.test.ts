// PAT-102 (§139–§141): a meal's cibi and nutrients are its bars; its other slots are words.
import { describe, expect, it } from "vitest";
import { mealCost, mealSlots } from "./meal";

const details = {
  stats: [
    { label: "Costo", value: "≈ 1,40 €" },
    { label: "Porzioni", value: "0,5" },
    { label: "Nota", value: "dopo la corsa" },
  ],
  lines: [{ label: "Fiocchi d'avena", value: "60 g" }],
  foot: "aggiunto al volo",
};

describe("mealSlots (PAT-102, ATT-08…ATT-11)", () => {
  it("porzioni, then the context: the plan's order; no cibi or nutrients slots", () => {
    expect(mealSlots({ details }).map((s) => s.key)).toEqual(["servings", "context"]);
  });

  it("no porzioni where the place steps them (the day)", () => {
    expect(mealSlots({ details, stepper: true }).map((s) => s.key)).toEqual(["context"]);
  });

  it("the context says where it comes from and the rest in words, never the cost", () => {
    const ctx = mealSlots({ details }).find((s) => s.key === "context");
    expect(ctx && "words" in ctx && ctx.words).toEqual([
      "Nota dopo la corsa",
      "aggiunto al volo",
    ]);
    expect(mealCost(details)?.value).toBe("≈ 1,40 €");
  });

  it("nothing to say: no slots (PRD-22)", () => {
    expect(mealSlots({})).toEqual([]);
  });
});
