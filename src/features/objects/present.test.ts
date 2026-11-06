import { describe, expect, it } from "vitest";
import { CATALOG_TYPES, catalogType } from "@/core/kinds/catalog";
import { fieldWord, mergeLines, objectFields } from "./present";

describe("an object's values on its page (PAT-04, PAT-13, PAT-30, PAT-93)", () => {
  it("every declared field of every type has its word", () => {
    for (const t of CATALOG_TYPES)
      for (const f of t.fields)
        expect(fieldWord(t, f.key), `${t.key}.${f.key}`).toBeTruthy();
  });

  it("lists every declared field, numbers with their unit, choices in words, empty as empty", () => {
    const route = catalogType("route")!;
    const rows = objectFields(route, {
      mode: "bike",
      distanceKm: 12.5,
      durationMin: null,
      walkingM: 0,
      mapsUrl: "https://maps.example/x",
    });
    expect(rows.map((r) => r.spec.key)).toEqual([
      "mode",
      "distanceKm",
      "durationMin",
      "walkingM",
      "mapsUrl",
    ]);
    expect(rows[0]!.shown).not.toBe("bike");
    expect(rows[0]!.spec.choices?.find((c) => c.value === "bike")?.label).toBe(
      rows[0]!.shown,
    );
    expect(rows[0]!.spec.required).toBe(true);
    expect(rows[1]).toMatchObject({
      value: 12.5,
      spec: { label: "Distanza", unit: "km", min: 0 },
    });
    expect(rows[1]!.shown).toContain("km");
    expect(rows[2]).toMatchObject({ value: null, shown: "" });
  });

  it("says what a merge moves, in words, and what happens to the one that goes (PAT-18)", () => {
    const l = mergeLines({ entries: 2, lines: 0, plans: 1 }, "Run", "Corsa");
    expect(l).toHaveLength(3);
    expect(l[0]).toMatch(/^2 voci passano a «Corsa»\.$/);
    expect(l[1]).toMatch(/^1 posto nel Piano passa a «Corsa»\.$/);
    expect(l[2]).toContain("«Run» va negli archiviati");
    expect(mergeLines({ entries: 0, lines: 0, plans: 0 }, "Run", "Corsa")[0]).toContain(
      "non si sposta niente",
    );
  });
});
