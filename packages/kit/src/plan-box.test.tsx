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

describe("PlanBox (PAT-30, VIS-102, PAT-102: a slot is drawn by its instrument, never by type)", () => {
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
    // The choice is one chip in the actions row (his §152, PAT-102): the picked marca, closed;
    // the others only once it is tapped.
    expect(html).toContain('aria-label="Marche: Quaker"');
    expect(html).toContain("Quaker · 5,90 €/kg ▾");
    expect(html).not.toContain("Coop");
  });
});

describe("ActionRow (PAT-101: the box's actions, one sideways row, danger last as an icon)", () => {
  const noop = () => {};
  it("open, the actions come first; a stepped value once; the trash last with its word as aria", () => {
    const html = renderToStaticMarkup(
      <PlanBox
        entry={entry}
        startOpen
        slots={[{ key: "nova", label: "NOVA", word: "1" }]}
        actions={[
          { key: "delete", label: "Elimina", danger: "delete", onClick: noop },
          {
            key: "servings",
            label: "Porzioni",
            step: { value: "× 0,5", minus: "Meno", plus: "Più" },
            onMinus: noop,
            onPlus: noop,
          },
        ]}
      />,
    );
    const row = html.slice(html.indexOf('aria-label="Azioni"'));
    expect(html.indexOf('aria-label="Azioni"')).toBeLessThan(html.indexOf("k-doors"));
    expect(row.indexOf("× 0,5")).toBeLessThan(row.indexOf('aria-label="Elimina"'));
    expect(html.match(/× 0,5/g)).toHaveLength(1);
    expect(html).not.toContain(">Elimina<");
  });

  it("shut, no actions are drawn", () => {
    const html = renderToStaticMarkup(
      <PlanBox entry={entry} actions={[{ key: "x", label: "Registra", href: "/x" }]} />,
    );
    expect(html).not.toContain("Azioni");
  });
});
