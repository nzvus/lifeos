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
});
