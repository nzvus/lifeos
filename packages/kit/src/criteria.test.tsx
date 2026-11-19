import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Box } from "./Box";
import { Criteria } from "./Criteria";
import { Forms } from "./Forms";
import { List } from "./List";

// His pick of 19 Nov: C «punti», with the macros' grammar (VIS-43, VIS-50, VIS-52, VIS-22).
describe("the opened voto: one bar of 100 points, the macros' grammar (VIS-43)", () => {
  const data = {
    value: 71,
    parts: [
      { name: "densità di nutrienti", score: 0.26, weight: 0.39 },
      { name: "limiti", score: 1, weight: 0.26 },
      { name: "sazietà", score: 0.99, weight: 0.35 },
    ],
    missing: ["valore (manca il prezzo)"],
    how: "/oggi/andamento/come-valutiamo?modello=food",
  };
  const h = renderToStaticMarkup(<Criteria data={data} />);
  it("a stretch per criterion, as wide as its weight, in its own colour, filled to its score", () => {
    expect(h.match(/class="seg"/g)).toHaveLength(3);
    expect(h).toContain("flex-grow:0.39");
    expect(h).toContain("--id:var(--crit-1)");
    expect(h).toContain("--v:26%");
  });
  it("its zones under it and the tip in its zone's colour (VIS-52)", () => {
    expect(h.match(/class="zones"/g)).toHaveLength(3);
    expect(h).toContain("--band:var(--heat-bad)");
  });
  it("a row only for what lost points, the costliest first; the full ones on one line", () => {
    expect(h).toContain("10 su 39");
    expect(h).toContain("−29");
    expect(h.indexOf("densità di nutrienti")).toBeLessThan(h.indexOf("Pieni"));
    expect(h).toContain("Pieni:");
    // condensed: every name in view on one line that opens in place (PAT-40)
    expect(h).toMatch(/k-cline" aria-expanded="false"><span class="k-help">Pieni:/);
    expect(h).toContain("limiti ·");
  });
  it("what does not count and why, and its page", () => {
    // condensed too (his 19 Nov): the names closed, the reasons on open
    expect(h).toMatch(
      /Non contano:<\/span><span class="k-cnames"><span class="k-nowrap">valore<\/span>/,
    );
    expect(h).not.toContain("manca il prezzo");
    expect(h).toContain('href="/oggi/andamento/come-valutiamo?modello=food"');
  });
  it("a planned voto is hatched (VIS-22)", () => {
    const p = renderToStaticMarkup(<Criteria data={data} planned />);
    expect(p).toContain("k-critview planned");
    expect(p).toContain("previsto");
  });
  it("is the panel behind a Box's «Voto» door", () => {
    const b = renderToStaticMarkup(
      <Box
        entry={{ fam: "food", title: "Cena", value: "380", score: data }}
        expanded
        doors={[]}
        door="voto"
      />,
    );
    expect(b).toContain("k-cpts");
    expect(b).not.toContain("senza:");
  });
});

describe("a long list: one line naming the rest, opening in place (PAT-40, his pick of 19 Nov)", () => {
  const names = Array.from({ length: 12 }, (_, i) => "cibo " + (i + 1));
  const rows = names.map((n) => <span key={n}>{n}</span>);
  it("past 8 rows the rest stand on one line that names every one", () => {
    const h = renderToStaticMarkup(
      <List label="Cibi" names={names}>
        {rows}
      </List>,
    );
    expect(h).toContain("e altri 4:");
    expect(h).toContain("cibo 9 ·");
    expect(h).toContain("cibo 12");
    expect(h).toContain('aria-expanded="false"');
    expect(h).not.toContain("Mostra altri");
  });
  it("without names, «Mostra altri» as before", () => {
    const h = renderToStaticMarkup(<List label="Cibi">{rows}</List>);
    expect(h).toContain("Mostra altri (4)");
  });
});

describe("forms without words on the bar: proposals (bars study §6; VIS-50, VIS-52)", () => {
  const items = [
    {
      name: "C",
      v: 80,
      t: 110,
      unit: "mg",
      color: "var(--crit-1)",
      zones: [
        { from: 0, level: "bad" as const },
        { from: 77, level: "fair" as const },
        { from: 110, level: "good" as const },
      ],
    },
  ];
  for (const look of ["thin", "tiles", "rings"] as const)
    it(look + ": the share, a mark, the zones behind, the amount in its label", () => {
      const h = renderToStaticMarkup(<Forms items={items} look={look} />);
      expect(h).toMatch(/73/);
      expect(h).toContain("k-st part");
      expect(h).toContain("var(--heat-good)");
      expect(h).toContain("C: 80");
    });
});
