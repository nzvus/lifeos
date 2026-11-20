import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PlanBox, slotDoor, type PlanSlot } from "./PlanBox";

const entry = {
  fam: "food",
  title: "Fiocchi d'avena",
  value: "372 kcal/100",
  href: "/x",
};
const trend = { x: ["a", "", "b"], y: [80, 82, 85], unit: "kg", lo: 80, hi: 85 };

describe("PlanBox (PAT-30, VIS-102: a slot is drawn by its instrument, never by type)", () => {
  it("a word is a door with nothing behind it", () => {
    expect(slotDoor({ key: "nova", label: "NOVA", word: "1" })).toEqual({
      key: "nova",
      label: "NOVA",
      value: "1",
    });
  });

  it("a trend is a door with its chart behind it only from two points", () => {
    const one = slotDoor({
      key: "e1rm",
      label: "e1RM",
      value: "85 kg",
      trend: { ...trend, y: [85] },
    });
    expect(one && "panel" in one).toBe(false);
    const many = slotDoor({ key: "e1rm", label: "e1RM", value: "85 kg", trend });
    expect(many?.panel).toBeTruthy();
  });

  it("names are a sideways row above the doors, never a door", () => {
    const s: PlanSlot = { key: "facts", label: "Fatti", words: ["Spinta", "Bilanciere"] };
    expect(slotDoor(s)).toBeNull();
    const html = renderToStaticMarkup(
      <PlanBox
        entry={entry}
        startOpen
        slots={[s, { key: "nova", label: "NOVA", word: "1" }]}
      />,
    );
    expect(html.indexOf("Bilanciere")).toBeLessThan(html.indexOf("k-doors"));
    expect(html).toContain("NOVA");
  });

  it("variants: the picked one draws the head and the doors; the others are chips", () => {
    const html = renderToStaticMarkup(
      <PlanBox
        entry={entry}
        startOpen
        variantsLabel="Marche"
        picked="b"
        variants={[
          {
            key: "a",
            label: "Coop",
            head: { value: "360 kcal/100" },
            slots: [{ key: "nova", label: "NOVA", word: "1" }],
          },
          {
            key: "b",
            label: "Quaker",
            meta: "5,90 €/kg",
            head: { value: "380 kcal/100" },
            slots: [{ key: "nova", label: "NOVA", word: "3" }],
          },
        ]}
      />,
    );
    expect(html).toContain("380 kcal/100");
    expect(html).not.toContain("360 kcal/100");
    expect(html).toContain("Coop");
    expect(html).toMatch(/aria-pressed="true"[^>]*>.*?Quaker/);
  });
});
