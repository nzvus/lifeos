import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IngredientTable, shareBackground } from "./IngredientTable";

const words = { add: "Aggiungi", edit: (n: string) => "Quanto " + n, remove: "Togli" };
const noop = () => {};

describe("IngredientTable (PAT-13, PAT-103: names shared by parents, amounts typed in place)", () => {
  it("shares a name's background among its parents in exact proportion, the rest plain", () => {
    expect(shareBackground([])).toBeUndefined();
    expect(
      shareBackground([
        { tone: 0, w: 50 },
        { tone: 1, w: 25 },
      ]),
    ).toBe(
      "linear-gradient(to right, var(--kin-t0) 0.0% 50.0%, var(--kin-t1) 50.0% 75.0%, transparent 75.0%)",
    );
  });

  it("an editable amount is a button to type in; one all its parents' is fixed; the add row first", () => {
    const html = renderToStaticMarkup(
      <IngredientTable
        words={words}
        onSet={noop}
        onRemove={noop}
        onAdd={noop}
        rows={[
          {
            key: "a",
            name: "Latte",
            amount: "400 ml",
            value: 400,
            unit: "ml",
            shares: [{ tone: 0, w: 100 }],
            editable: false,
          },
          {
            key: "b",
            name: "Nocciole",
            amount: "20 g",
            value: 20,
            unit: "g",
            shares: [],
            editable: true,
          },
        ]}
      />,
    );
    expect(html.indexOf("Aggiungi")).toBeLessThan(html.indexOf("Latte"));
    expect(html).toContain('aria-label="Quanto Nocciole"');
    expect(html).not.toContain('aria-label="Quanto Latte"');
    expect(html).toContain("k-iamount fixed");
    expect(html).not.toMatch(/>−</);
  });
});

describe("IngredientTable's search (PAT-103, his §180): under its add tile, like «+ genitore»", () => {
  it("the add tile says it is open, the search in its window under it, the rows still below", () => {
    const html = renderToStaticMarkup(
      <IngredientTable
        words={words}
        onSet={noop}
        onRemove={noop}
        onAdd={noop}
        finding={<b>cerca</b>}
        rows={[
          {
            key: "a",
            name: "Latte",
            amount: "100 ml",
            value: 100,
            unit: "ml",
            shares: [],
            editable: true,
          },
        ]}
      />,
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html.indexOf("k-findwin")).toBeLessThan(html.indexOf("Latte"));
  });
});
