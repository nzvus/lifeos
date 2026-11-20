import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChipRow } from "./ChipRow";

describe("ChipRow (VIS-40: an open box names its members on a sideways row; his 20 Nov)", () => {
  it("one chip per member after its label, in the order given", () => {
    const html = renderToStaticMarkup(
      <ChipRow
        label="Marche"
        items={[
          { key: "a", label: "Esselunga", value: "4,20 €/kg" },
          { key: "b", label: "Coop" },
        ]}
      />,
    );
    expect(html).toContain('aria-label="Marche"');
    expect(html.indexOf("Esselunga")).toBeLessThan(html.indexOf("Coop"));
    expect(html).toContain("4,20 €/kg");
    expect(html.match(/role="listitem"/g)).toHaveLength(2);
  });

  it("draws nothing without members", () => {
    expect(renderToStaticMarkup(<ChipRow label="Marche" items={[]} />)).toBe("");
  });
});
