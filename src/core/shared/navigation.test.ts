import { describe, expect, it } from "vitest";
import { safeFrom, withFrom } from "./navigation";

describe("safeFrom", () => {
  it("accepts this app's paths only", () => {
    expect(safeFrom("/?day=2026-10-01", "/meals")).toBe("/?day=2026-10-01");
    expect(safeFrom(undefined, "/meals")).toBe("/meals");
    for (const bad of [
      "//evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      "/\\evil.com",
      "",
    ])
      expect(safeFrom(bad, "/meals")).toBe("/meals");
  });

  it("withFrom adds the origin as a query parameter", () => {
    expect(withFrom("/meals/1", "/?day=2026-10-01")).toBe(
      "/meals/1?from=%2F%3Fday%3D2026-10-01",
    );
    expect(withFrom("/meals/new?copy=1", "/meals")).toBe(
      "/meals/new?copy=1&from=%2Fmeals",
    );
  });
});
