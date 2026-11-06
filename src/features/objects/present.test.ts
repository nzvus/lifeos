import { describe, expect, it } from "vitest";
import { CATALOG_TYPES, catalogType } from "@/core/kinds/catalog";
import { fieldWord, valueRows } from "./present";

describe("an object's values on its page (PAT-04, PAT-30, PAT-93)", () => {
  it("every declared field of every type has its word", () => {
    for (const t of CATALOG_TYPES)
      for (const f of t.fields)
        expect(fieldWord(t, f.key), `${t.key}.${f.key}`).toBeTruthy();
  });

  it("lists the declared fields in order, numbers with their unit, choices in words", () => {
    const route = catalogType("route")!;
    const rows = valueRows(route, {
      mode: "bike",
      distanceKm: 12.5,
      durationMin: null,
      walkingM: 0,
      mapsUrl: "https://maps.example/x",
    });
    expect(rows.map((r) => r.key)).toEqual(["mode", "distanceKm", "walkingM", "mapsUrl"]);
    expect(rows[0]!.value).not.toBe("bike");
    expect(rows[1]!.label).toBe("Distanza");
    expect(rows[1]!.value).toContain("km");
    expect(rows[3]!.href).toBe("https://maps.example/x");
  });
});
