import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PartsBand } from "./PartsBand";

const part = (key: string, p: number) => ({
  key,
  name: key,
  amount: "",
  kcal: p * 4,
  macros: { protein: { all: p } },
});
const data = {
  foods: [part("colazione", 30), part("pranzo", 50)],
  macros: [{ key: "protein" as const, v: 80, t: 160 }],
};

describe("PartsBand (PAT-102; his §146, §150: the day shrunk to a band at the top)", () => {
  it("hidden until its card is above the screen: no room taken, not reachable", () => {
    const html = renderToStaticMarkup(
      <PartsBand data={data} anchor="x" label="Il giorno" />,
    );
    expect(html).toContain('class="k-bandline"');
    expect(html).toContain('class="k-band"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("shown, one row of full bars like a meal's, each part a piece", () => {
    const html = renderToStaticMarkup(
      <PartsBand data={data} anchor="x" label="Il giorno" startShown />,
    );
    expect(html).toContain('class="k-band on"');
    expect(html).toContain('aria-label="Il giorno"');
    expect(html.match(/class="k-seg"/g)).toHaveLength(2);
  });
});
