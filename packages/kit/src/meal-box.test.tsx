import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MealBox } from "./MealBox";

const part = (key: string, name: string, p: number, c: number) => ({
  key,
  name,
  amount: "",
  kcal: (p + c) * 4,
  macros: { protein: { all: p }, carbs: { all: c } },
});
const data = {
  foods: [part("a", "Fiocchi d'avena", 8, 35), part("b", "Latte", 9, 12)],
  kcal: { v: 310, t: 2000 },
  macros: [
    // 17 g against zones starting at 10 (fair) and 15 (good): «ottimo».
    {
      key: "protein" as const,
      v: 17,
      t: 40,
      zones: [
        { from: 0, level: "bad" as const },
        { from: 10, level: "fair" as const },
        { from: 15, level: "good" as const },
      ],
    },
    { key: "carbs" as const, v: 47, t: 60 },
  ],
};
const entry = { fam: "food", title: "Porridge", value: "310 kcal" };
const open = () =>
  renderToStaticMarkup(<MealBox entry={entry} data={data} slots={[]} startOpen />);

describe("MealBox (PAT-102; his §146: the meal's level only, full bars, arrows)", () => {
  it("shut it is a row with its strip: no bars", () => {
    const shut = renderToStaticMarkup(<MealBox entry={entry} data={data} slots={[]} />);
    expect(shut).toContain("Porridge");
    expect(shut).not.toContain("k-mcell");
  });

  it("open: the macros on one row, once, no energy line (the head says it)", () => {
    const html = open();
    expect(html.match(/class="k-mcell"/g)).toHaveLength(2);
    expect(html).not.toContain('class="k-mrow"');
    expect(html).not.toContain("2.000");
  });

  it("each bar is full: its parts' proportions only, no target mark, no ruler", () => {
    const html = open();
    const a = html.indexOf('class="k-mcell"');
    const cell = html.slice(a, html.indexOf('class="k-mcell"', a + 1));
    const widths = [...cell.matchAll(/width:([\d.]+)%/g)].map((m) => Number(m[1]));
    expect(widths.reduce((x, y) => x + y, 0)).toBeCloseTo(100, 0);
    expect(cell).not.toContain("k-mark");
    expect(cell).not.toContain("k-zrule");
  });

  it("each number has its verdict's arrow: ⇈ «ottimo»; – where nothing judges it", () => {
    const html = open();
    expect(html).toContain('class="k-verdict good" role="img" aria-label="ottimo"');
    expect(html).toContain('class="k-verdict none"');
  });

  it("its page is the last icon of the actions row, no column of its own (his §145)", () => {
    const html = renderToStaticMarkup(
      <MealBox entry={{ ...entry, href: "/voce/1" }} data={data} slots={[]} startOpen />,
    );
    expect(html.slice(html.indexOf('aria-label="Azioni"'))).toContain('href="/voce/1"');
    expect(html).not.toContain('class="k-go"');
  });
});
