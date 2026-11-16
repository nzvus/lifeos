import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MealBox } from "./MealBox";
import { mealDoors } from "./meal-doors";

const l0 = { macros: [{ key: "protein" as const, v: 30 }] };
const w = { nutrients: "Nutrienti", foods: "Cibi", cost: "Costo", details: "Dettagli" };
const d = {
  stats: [{ label: "Costo", value: "≈ 1,40 €" }],
  lines: [{ label: "Fiocchi d'avena", value: "60 g" }],
  foot: "",
};

describe("mealDoors (PAT-30: one box for a meal on the day, on a pasto's page and in the Elenco)", () => {
  it("gives the same doors wherever the meal is met: nutrients, foods, cost", () => {
    const doors = mealDoors(l0, d, undefined, w);
    expect(doors.map((x) => x.key)).toEqual(["nutrients", "foods", "more"]);
    expect(doors[1]!.value).toBe("1");
    expect(doors[2]).toMatchObject({ label: "Costo", value: "≈ 1,40 €" });
  });

  it("lets a place put its own rows behind «Cibi» (a pasto: each opens its cibo)", () => {
    expect(mealDoors(l0, d, "rows", w)[1]!.panel).toBe("rows");
  });

  it("has no doors without nutrients", () => {
    expect(mealDoors(null, d, undefined, w)).toEqual([]);
  });

  it("MealBox: shut it is a row with its strip; open it shows the bars and the doors", () => {
    const entry = { fam: "food", title: "Porridge", value: "533 kcal" };
    const shut = renderToStaticMarkup(
      <MealBox entry={entry} data={l0} labels={w} details={d} />,
    );
    expect(shut).toContain("Porridge");
    expect(shut).not.toContain("k-doors");
    const open = renderToStaticMarkup(
      <MealBox entry={entry} data={l0} labels={w} details={d} startOpen>
        <a href="/x">Registra</a>
      </MealBox>,
    );
    expect(open).toContain("k-doors");
    expect(open).toContain("Nutrienti");
    expect(open).toContain("Registra");
  });

  it("a row keeps its criteria behind «Voto», as a card does (PAT-43: open in place)", () => {
    const score = {
      value: 71,
      parts: [{ name: "densità", score: 0.27, weight: 0.39 }],
      missing: [],
    };
    const row = renderToStaticMarkup(
      <MealBox
        entry={{ fam: "food", title: "Porridge", value: "533 kcal", score }}
        data={l0}
        labels={w}
        details={d}
        density="row"
        startOpen
      />,
    );
    expect(row).toContain("Voto");
  });
});
