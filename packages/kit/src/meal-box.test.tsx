import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MealBox } from "./MealBox";

const words = { day: "Nella giornata", meal: "Il pasto" };
const part = (key: string, name: string, p: number) => ({
  key,
  name,
  amount: "",
  kcal: p * 10,
  macros: { protein: { all: p } },
});
const data = {
  foods: [part("a", "Fiocchi d'avena", 8), part("b", "Latte", 9)],
  macros: [{ key: "protein" as const, v: 17, t: 40 }],
};
const day = {
  foods: [part("m1", "Colazione", 17), part("m2", "Pranzo", 40)],
  macros: [{ key: "protein" as const, v: 57, t: 160 }],
};
const entry = { fam: "food", title: "Porridge", value: "310 kcal" };

describe("MealBox (PAT-102; his §143: the day's bars, two levels a tap apart)", () => {
  it("shut it is a row with its strip: no bars", () => {
    const shut = renderToStaticMarkup(
      <MealBox entry={entry} data={data} slots={[]} words={words} day={day} lit="m1" />,
    );
    expect(shut).toContain("Porridge");
    expect(shut).not.toContain("k-mrow");
  });

  it("open with the day: the day's own bars first, the level named, no row of chips", () => {
    const html = renderToStaticMarkup(
      <MealBox
        entry={entry}
        data={data}
        slots={[]}
        words={words}
        day={day}
        lit="m1"
        startOpen
      />,
    );
    expect(html).toContain("Nella giornata");
    expect(html).toContain("57"); // the day's protein, not the meal's 17
    expect(html).not.toContain("k-nfood");
  });

  it("without the day (a pasto): only the meal's level, no level switch", () => {
    const html = renderToStaticMarkup(
      <MealBox entry={entry} data={data} slots={[]} words={words} startOpen />,
    );
    expect(html).not.toContain("Nella giornata");
    expect(html).toContain("17");
  });

  it("the macros are drawn once (his §143: «mostri i macro 2 volte»)", () => {
    const html = renderToStaticMarkup(
      <MealBox
        entry={entry}
        data={data}
        slots={[]}
        words={words}
        day={day}
        lit="m1"
        startOpen
      />,
    );
    expect(html.match(/class="k-mrow"/g)).toHaveLength(1);
  });
});
