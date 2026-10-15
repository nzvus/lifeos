import { describe, expect, it } from "vitest";
import { AREA_KEYS, AREAS } from "./areas";
import { EXPORT_TABLES } from "./tables";

describe("areas", () => {
  it("put every exported table in exactly one area, leads among its tables", () => {
    const all = AREA_KEYS.flatMap((a) => [...AREAS[a].tables]);
    expect([...all].sort()).toEqual(EXPORT_TABLES.map((s) => s.key).sort());
    expect(new Set(all).size).toBe(all.length);
    for (const a of AREA_KEYS)
      for (const lead of AREAS[a].lead)
        expect(AREAS[a].tables as readonly string[]).toContain(lead);
  });
});
