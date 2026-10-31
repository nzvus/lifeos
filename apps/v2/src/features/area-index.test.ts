import { describe, expect, it } from "vitest";
import { AREA_INDEX } from "./area-index";

describe("each area's tabs (map D, first slice)", () => {
  it("lead only to pages that exist, by an address of the app", () => {
    const rows = Object.values(AREA_INDEX).flatMap((t) => Object.values(t).flat());
    expect(rows.length).toBeGreaterThan(10);
    for (const r of rows) expect(r.href).toMatch(/^\/(oggi|piano|andamento|libreria)\//);
  });
});
