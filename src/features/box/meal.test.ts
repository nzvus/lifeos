// PAT-30, VIS-102 (§132 c; his «yc» of §133 = the plan wins): a meal's box follows its plan.
import { describe, expect, it } from "vitest";
import { mealCost, mealSlots } from "./meal";

const data = { macros: [{ key: "protein" as const, v: 30 }] };
const details = {
  stats: [
    { label: "Costo", value: "≈ 1,40 €" },
    { label: "Nota", value: "dopo la corsa" },
  ],
  lines: [{ label: "Fiocchi d'avena", value: "60 g" }],
  foot: "aggiunto al volo",
};

describe("mealSlots (PAT-30, ATT-06…ATT-11)", () => {
  it("cibi, then nutrients, then the context: the plan's order", () => {
    expect(mealSlots({ data, details }).map((s) => s.key)).toEqual([
      "lines",
      "limits",
      "context",
    ]);
  });

  it("the cost is level 2: not in the box, given to its page", () => {
    const s = mealSlots({ data, details });
    expect(JSON.stringify(s)).not.toContain("1,40");
    expect(mealCost(details)?.value).toBe("≈ 1,40 €");
  });

  it("the context says where it comes from and the rest in words", () => {
    const ctx = mealSlots({ data, details }).find((s) => s.key === "context");
    expect(ctx && "words" in ctx && ctx.words).toEqual([
      "Nota dopo la corsa",
      "aggiunto al volo",
    ]);
  });

  it("the day's lines become cibo rows; a place's richer rows win", () => {
    const lines = mealSlots({ data, details })[0];
    expect(lines && "rows" in lines && lines.rows[0]?.title).toBe("Fiocchi d'avena");
    const own = mealSlots({ data, details, rows: [{ fam: "food", title: "X" }] })[0];
    expect(own && "rows" in own && own.rows[0]?.title).toBe("X");
  });

  it("no lines, no context: only the nutrients (PRD-22)", () => {
    expect(mealSlots({ data }).map((s) => s.key)).toEqual(["limits"]);
  });
});

describe("mealSlots: porzioni and the day's lines (his day, 20 Nov photos)", () => {
  const withServings = {
    stats: [{ label: "Porzioni", value: "0,5" }],
    lines: [{ label: "Salsa di pomodoro", value: "50 g · 21 kcal · ≈ 0,14 €" }],
    foot: "",
  };
  it("porzioni is its own word, never a context word; none where the place has a stepper", () => {
    expect(mealSlots({ data, details: withServings }).map((s) => s.key)).toEqual([
      "lines",
      "limits",
      "servings",
    ]);
    expect(
      mealSlots({ data, details: withServings, stepper: true }).map((s) => s.key),
    ).toEqual(["lines", "limits"]);
  });
  it("a day's line: the amount is the value, kcal and cost the second line", () => {
    const l = mealSlots({ data, details: withServings })[0];
    expect(l && "rows" in l && l.rows[0]).toMatchObject({
      title: "Salsa di pomodoro",
      value: "50 g",
      meta: "21 kcal · ≈ 0,14 €",
    });
  });
});
