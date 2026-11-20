import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MealBox } from "./MealBox";
import type { PlanSlot } from "./PlanBox";

const l0 = { macros: [{ key: "protein" as const, v: 30 }] };
const slots: PlanSlot[] = [
  {
    key: "lines",
    label: "Cibi",
    rows: [{ fam: "food", title: "Fiocchi d'avena", value: "60 g" }],
  },
  { key: "limits", label: "Nutrienti", nutrients: l0 },
  { key: "context", label: "Contesto", words: ["aggiunto al volo"] },
];
const entry = { fam: "food", title: "Porridge", value: "533 kcal" };

describe("MealBox (PAT-30: one box for a meal on the day, on a pasto's page and in the Elenco)", () => {
  it("shut it is a row with its strip: no doors", () => {
    const shut = renderToStaticMarkup(<MealBox entry={entry} data={l0} slots={slots} />);
    expect(shut).toContain("Porridge");
    expect(shut).not.toContain("k-doors");
  });

  it("open: the bars, the place's actions, the context as words, then its plan's doors in order", () => {
    const open = renderToStaticMarkup(
      <MealBox entry={entry} data={l0} slots={slots} startOpen>
        <a href="/x">Registra</a>
      </MealBox>,
    );
    expect(open.indexOf("Registra")).toBeLessThan(open.indexOf("aggiunto al volo"));
    expect(open.indexOf("aggiunto al volo")).toBeLessThan(open.indexOf("k-doors"));
    const row = open.slice(open.indexOf("k-doors"));
    expect(row.indexOf("Cibi")).toBeLessThan(row.indexOf("Nutrienti"));
    expect(row).not.toContain("Costo");
  });

  it("a row keeps its criteria behind «Voto», as a card does (PAT-43: open in place)", () => {
    const score = {
      value: 71,
      parts: [{ name: "densità", score: 0.27, weight: 0.39 }],
      missing: [],
    };
    const row = renderToStaticMarkup(
      <MealBox
        entry={{ ...entry, score }}
        data={l0}
        slots={slots}
        density="row"
        startOpen
      />,
    );
    expect(row).toContain("Voto");
  });
});
