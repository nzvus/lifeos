import { describe, expect, it } from "vitest";
import { oldDayLink } from "./old-day-link";

describe("an old Piano day link opens the day in Oggi (PAT-97)", () => {
  it("a date goes to its Oggi page", () => {
    expect(oldDayLink("2026-11-15")).toBe("/oggi/2026-11-15");
  });
  it("no date, a bad one or a repeated one stays on the Piano list", () => {
    expect(oldDayLink(undefined)).toBeNull();
    expect(oldDayLink("domani")).toBeNull();
    expect(oldDayLink(["2026-11-15", "2026-11-16"])).toBeNull();
  });
});
