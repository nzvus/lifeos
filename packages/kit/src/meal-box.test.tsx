import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MealBox } from "./MealBox";
import { macroColumns, votoColumns } from "./PartsBar";

const words = { parts: "Ingredienti", kinds: "Nutrienti", macros: "Macro", voto: "Voto" };
const foods = [
  {
    key: "a",
    name: "Fiocchi d'avena",
    amount: "60 g",
    kcal: 222,
    score: 72,
    macros: { protein: { all: 8 }, carbs: { all: 35 } },
  },
  {
    key: "b",
    name: "Latte",
    amount: "250 ml",
    kcal: 88,
    macros: { protein: { all: 9 }, carbs: { all: 12 } },
  },
];
const data = {
  foods,
  macros: [
    { key: "protein" as const, v: 17, t: 40 },
    { key: "carbs" as const, v: 47, t: 60 },
  ],
};
const score = {
  value: 64,
  parts: [
    { name: "densità", score: 0.6, weight: 0.4, split: { a: 0.7, b: 0.3 } },
    { name: "momento", score: 0.9, weight: 0.1 },
  ],
  missing: [],
};
const entry = { fam: "food", title: "Porridge", value: "310 kcal", score };

describe("MealBox (PAT-102: one anatomy; VIS-106, VIS-107)", () => {
  it("shut it is a row with its strip: no bars, no actions", () => {
    const shut = renderToStaticMarkup(
      <MealBox entry={entry} data={data} slots={[]} words={words} />,
    );
    expect(shut).toContain("Porridge");
    expect(shut).not.toContain("k-pbar");
  });

  it("open: the macro bar, the voto bar, then one row with the mode and the actions", () => {
    const open = renderToStaticMarkup(
      <MealBox
        entry={entry}
        data={data}
        slots={[]}
        words={words}
        startOpen
        actions={[{ key: "x", label: "Elimina", danger: "delete", onClick: () => {} }]}
      />,
    );
    const amount = open.indexOf("k-pbar amount");
    const voto = open.indexOf("k-pbar voto");
    const row = open.indexOf('aria-label="Azioni"');
    expect(amount).toBeGreaterThan(0);
    expect(amount).toBeLessThan(voto);
    expect(voto).toBeLessThan(row);
    expect(open.slice(row)).toMatch(/aria-pressed="true"[^>]*>Ingredienti/);
    // The ingredients mode shows the ingredients, each with its own voto.
    expect(open).toContain("60 g · voto 72");
  });

  it("one ingredient alone: no mode to switch, the nutrients shown", () => {
    const html = renderToStaticMarkup(
      <MealBox
        entry={entry}
        data={{ ...data, foods: [foods[0]!] }}
        slots={[]}
        words={words}
        startOpen
      />,
    );
    expect(html).not.toContain(">Ingredienti<");
  });
});

describe("the bars' columns (VIS-106, VIS-107, MOD-61)", () => {
  it("by part: each macro's fill split by its foods' grams", () => {
    const c = macroColumns({ ...data, kcal: { v: 310, t: 600 } }, "parts");
    // Full when in proportion to its energy: 17 g of 40 (0,425) against 310 kcal of 600 (0,517).
    expect(c[0]!.fill).toBeCloseTo(17 / 40 / (310 / 600), 9);
    expect(c[0]!.pieces.map((p) => [p.part, p.share])).toEqual([
      ["a", 8 / 17],
      ["b", 9 / 17],
    ]);
  });
  it("without the day's energy, one shared scale: the largest macro full", () => {
    expect(macroColumns(data, "kinds")[1]!.fill).toBe(1);
  });
  it("the voto: a column per criterion, split where the parts make it, whole where not", () => {
    const c = votoColumns(score);
    expect(c[0]!.pieces.map((p) => p.part)).toEqual(["a", "b"]);
    expect(c[1]!.pieces).toEqual([]);
  });
});
