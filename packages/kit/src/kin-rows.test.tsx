import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KinRows, type KinWords } from "./KinRows";

const words: KinWords = {
  parents: { row: "Genitori", add: "Aggiungi un genitore" },
  children: { row: "Figli", add: "Aggiungi un figlio" },
  find: "Cerca un genitore",
  edit: (n: string) => "Quante volte " + n,
};
const noop = () => {};

describe("KinRows (PAT-103: parents and children, «+» first, the multiplier before the name)", () => {
  it("draws two rows, each named, the multiplier first; a stored parent is stepped", () => {
    const html = renderToStaticMarkup(
      <KinRows
        words={words}
        hour={12}
        candidates={[]}
        parents={[
          {
            key: "g",
            name: "Gelato Proteico",
            k: "× 1",
            step: { minus: "Meno", plus: "Più", onMinus: noop, onPlus: noop },
          },
        ]}
        children={[
          { key: "c", name: "GELATO proteico al pistacchio", k: "× 1", href: "/x" },
        ]}
        onAddParent={noop}
        onAddChild={noop}
      />,
    );
    expect(html).toContain('aria-label="Genitori"');
    expect(html).toContain('aria-label="Figli"');
    expect(html.indexOf("× 1")).toBeLessThan(html.indexOf(">Gelato Proteico<"));
    // closed, «× k» is a button that opens the stepper; the «+» comes first in its row
    expect(html).toContain('aria-label="Quante volte Gelato Proteico"');
    expect(html).not.toContain('aria-label="Meno"');
    expect(html.indexOf("Aggiungi un genitore")).toBeLessThan(html.indexOf("× 1"));
    expect(html).toContain('href="/x"');
    expect(html).toContain('aria-label="Aggiungi un genitore"');
    expect(html).toContain('aria-label="Aggiungi un figlio"');
  });

  it("without a way to add, an empty row has no «+»", () => {
    const html = renderToStaticMarkup(
      <KinRows words={words} hour={12} candidates={[]} parents={[]} children={[]} />,
    );
    expect(html).not.toContain("Aggiungi");
  });
});
