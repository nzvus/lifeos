import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MealBox } from "./MealBox";
import { Nutrients } from "./Nutrients";

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

  it("no way to its page from the box: no arrow, everything is in it (his §130, §178)", () => {
    const html = renderToStaticMarkup(
      <MealBox entry={{ ...entry, href: "/voce/1" }} data={data} slots={[]} startOpen />,
    );
    expect(html).not.toContain('href="/voce/1"');
    expect(html).not.toContain('class="k-go"');
  });

  it("with its two halves, the kcal is a cell first, then the macros, in rows of three (§178)", () => {
    const html = renderToStaticMarkup(
      <MealBox entry={entry} data={data} slots={[]} startOpen ingredients={<i />} />,
    );
    expect(html).toContain('class="k-ninline rows"');
    const cells = html.match(/class="k-mcell[^"]*"/g) ?? [];
    expect(cells[0]).toBe('class="k-mcell kcal"');
  });

  it("no icon in the head of a list of one type (his §178, VIS-30)", () => {
    const html = renderToStaticMarkup(
      <MealBox entry={entry} data={data} slots={[]} lead={false} />,
    );
    expect(html).not.toContain('class="k-lead"');
    expect(
      renderToStaticMarkup(<MealBox entry={entry} data={data} slots={[]} />),
    ).toContain('class="k-lead"');
  });
});

describe("MealBox shut (VIS-43, his §185): the voto's number over its own mini skyline", () => {
  it("the number follows the skyline in the head's voto tile, the strip carries no voto", () => {
    const score = {
      value: 71,
      parts: [{ name: "x", weight: 1, score: 0.7 }],
    } as unknown as NonNullable<Parameters<typeof MealBox>[0]["entry"]["score"]>;
    const html = renderToStaticMarkup(
      <MealBox entry={{ ...entry, score }} data={data} slots={[]} density="row" />,
    );
    const trail = html.slice(html.indexOf('class="k-trail"'));
    expect(trail.indexOf("k-sky mini")).toBeLessThan(trail.indexOf('class="k-vn"'));
    expect(html).not.toContain("k-onstrip");
  });
});

describe("Nutrients' misure (PAT-105, his §184): a picked one says its name and share", () => {
  it("each misura carries its name, word and share of the kcal, shown when picked", () => {
    const html = renderToStaticMarkup(
      <Nutrients
        data={data}
        part="main"
        chips={false}
        inline
        picked="protein"
        onPick={() => {}}
      />,
    );
    expect(html).toContain('class="k-mcell picked"');
    expect(html).toContain('<span class="k-mname">Proteine</span>');
    expect(html).toMatch(/\d+ % kcal/);
  });
});
