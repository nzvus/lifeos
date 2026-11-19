import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Box } from "./Box";
import { Criteria } from "./Criteria";

describe("a voto open: one line per criterion, why some do not count, its page (VIS-43, PAT-51)", () => {
  const entry = {
    fam: "food",
    title: "Cena",
    value: "380",
    score: {
      value: 64,
      parts: [
        { name: "densità di nutrienti", score: 0.5, weight: 0.6 },
        { name: "limiti", score: 0.8, weight: 0.4 },
      ],
      missing: ["valore (manca il prezzo)"],
      how: "/oggi/andamento/come-valutiamo?modello=food",
    },
  };
  const html = renderToStaticMarkup(
    <Box
      entry={entry}
      expanded
      onToggle={() => {}}
      doors={[]}
      door="voto"
      onDoor={() => {}}
    />,
  );
  it("each criterion is one row: mark, name and weight, ruler, number", () => {
    expect(html.match(/class="k-crit"/g)).toHaveLength(2);
    expect(html).toContain("pesa 60 %");
  });
  it("says what does not count and why, after the criteria, and links its page", () => {
    expect(html).toContain("Non contano: valore (manca il prezzo)");
    expect(html).not.toContain("senza:");
    expect(html.indexOf("Non contano")).toBeGreaterThan(html.lastIndexOf("k-crit"));
    expect(html).toContain('href="/oggi/andamento/come-valutiamo?modello=food"');
    expect(html).toContain("Come valutiamo ›");
  });
});

describe("Criteria: the opened voto, three proposals (VIS-43; his 19 Nov)", () => {
  const data = {
    value: 71,
    parts: [
      { name: "densità di nutrienti", score: 0.26, weight: 0.39 },
      { name: "limiti", score: 1, weight: 0.61 },
    ],
    missing: ["valore (manca il prezzo)"],
    how: "/oggi/andamento/come-valutiamo?modello=food",
  };
  for (const look of ["inbar", "columns", "points"] as const) {
    it(
      look +
        ": every criterion with its mark and number, why some do not count, its page",
      () => {
        const h = renderToStaticMarkup(<Criteria data={data} look={look} />);
        expect(h).toContain("densità di nutrienti");
        expect(h).toContain("limiti");
        expect(
          h.match(/k-st /g)?.length ?? h.match(/role="img"/g)?.length,
        ).toBeGreaterThan(0);
        expect(h).toContain("Non contano: valore (manca il prezzo)");
        expect(h).toContain('href="/oggi/andamento/come-valutiamo?modello=food"');
      },
    );
  }
  it("points: the costliest first, with what it lost", () => {
    const h = renderToStaticMarkup(<Criteria data={data} look="points" />);
    expect(h.indexOf("densità di nutrienti")).toBeLessThan(h.indexOf("limiti"));
    expect(h).toContain("−29");
  });
});
