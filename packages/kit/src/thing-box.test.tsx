import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ThingBox } from "./ThingBox";

const entry = {
  fam: "food",
  title: "Fiocchi d'avena",
  value: "372 kcal/100",
  href: "/cibo/cibo/1",
};
const doors = [
  { key: "nutrients", label: "Nutrienti", value: "100 g", panel: <p>bars</p> },
  { key: "nova", label: "NOVA", value: "1" },
];

describe("ThingBox (PAT-30: the row, open in place, the page are one Box)", () => {
  it("shut, it is one row: no doors, no «Apri»", () => {
    const html = renderToStaticMarkup(<ThingBox entry={entry} doors={doors} />);
    expect(html).toContain("Fiocchi d&#x27;avena");
    expect(html).not.toContain("k-doors");
    expect(html).not.toContain("Apri");
  });

  it("open, its plan's doors in order, its page an icon at the row's end (level 2; his 20 Nov)", () => {
    const html = renderToStaticMarkup(<ThingBox entry={entry} doors={doors} startOpen />);
    expect(html.indexOf("Nutrienti")).toBeLessThan(html.indexOf("NOVA"));
    // No «Apri» button: the icon sits after the last door, inside the doors' row.
    expect(html).not.toContain(">Apri<");
    const row = html.slice(html.indexOf("k-doors"));
    expect(row.indexOf("NOVA")).toBeLessThan(
      row.indexOf('class="k-go" href="/cibo/cibo/1"'),
    );
    // One door at a time, none at first.
    expect(html).not.toContain("bars");
  });
});
