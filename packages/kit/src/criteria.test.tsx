import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Box } from "./Box";
import { Criteria } from "./Criteria";

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
    expect(h).toContain("limiti: pieno, pesa 26 %");
  });
  it("what does not count and why, and its page", () => {
    expect(h).toContain("Non contano: valore (manca il prezzo)");
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
