import { describe, expect, it } from "vitest";
import { resolveGlyph } from "./glyph";
import { ICONS } from "./icons.generated";

const label = (o: Parameters<typeof resolveGlyph>[1]) => resolveGlyph(ICONS, o).label;

describe("the Glyph resolver (icons.md §2)", () => {
  it("draws every domain, place and control in the registry", () => {
    for (const fam of Object.keys(ICONS.domains))
      expect(resolveGlyph(ICONS, { fam }).d, fam).not.toBe("");
    for (const place of Object.keys(ICONS.places))
      expect(resolveGlyph(ICONS, { place }).d, place).not.toBe("");
    for (const ui of Object.keys(ICONS.controls))
      expect(resolveGlyph(ICONS, { ui }).d, ui).not.toBe("");
  });

  it("goes from the most specific datum to the domain", () => {
    expect(label({ fam: "drink", kind: "coffee" })).toBe("Caffè");
    expect(label({ fam: "drink" })).toBe("Bere");
    expect(label({ ui: "back", fam: "food" })).toBe("Indietro");
    expect(label({ group: "fish", fam: "food" })).toBe("Pesce");
  });

  it("draws each meal role with its own drawing, never the shared fork (UI-81)", () => {
    const roles = ["breakfast", "lunch", "snack", "dinner"];
    const ds = roles.map(
      (sub) => resolveGlyph(ICONS, { fam: "food", kind: "meal", sub }).d,
    );
    const fork = resolveGlyph(ICONS, { fam: "food", kind: "meal" }).d;
    expect(new Set([...ds, fork]).size).toBe(5);
    expect(label({ fam: "food", kind: "meal", sub: "dinner" })).toBe("Cena");
  });

  it("adds the equipment as a corner mark", () => {
    const r = resolveGlyph(ICONS, { pattern: "vertical_pull", equipment: "cavi" });
    expect(r.mark?.label).toBe("Cavi");
  });

  it("draws nothing for unknown data, rather than a wrong icon", () => {
    expect(resolveGlyph(ICONS, { fam: "nope" })).toEqual({
      d: "",
      label: "",
      mark: null,
    });
  });

  it("never draws two different meanings the same way (UI-81 audit, 30 Oct)", () => {
    const d = (o: Parameters<typeof resolveGlyph>[1]) => resolveGlyph(ICONS, o).d;
    const pairs: [
      Parameters<typeof resolveGlyph>[1],
      Parameters<typeof resolveGlyph>[1],
    ][] = [
      [{ section: "values" }, { fam: "body", kind: "weight" }],
      [{ section: "kinds" }, { fam: "money", kind: "budget" }],
      [{ section: "usedIn" }, { fam: "food", kind: "recipe" }],
      [{ ui: "refresh" }, { tag: "cycle" }],
      [{ tag: "local" }, { ui: "add" }],
      [{ fam: "env", kind: "humidity" }, { fam: "drink" }],
      [{ fam: "env", kind: "light" }, { place: "oggi" }],
      [
        { fam: "drink", kind: "water" },
        { fam: "drink", kind: "coffee" },
      ],
    ];
    for (const [a, b] of pairs) expect(d(a), JSON.stringify(a)).not.toBe(d(b));
    const bar = (equipment: string) =>
      resolveGlyph(ICONS, { pattern: "vertical_pull", equipment }).mark?.d;
    expect(bar("parallele")).not.toBe(bar("sbarra"));
  });
});
