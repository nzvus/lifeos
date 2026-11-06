import { describe, expect, it } from "vitest";
import { DEFAULT_ROLE_BOUNDS } from "@/core/kinds";
import { roleOf } from "./meal-input";

describe("a meal's role is stored (capture.md §4, §8.2)", () => {
  it("27 Oct 11:09 with no choice, lunch from 11:00 → lunch, taken from the time", () => {
    expect(roleOf("", "11:09", DEFAULT_ROLE_BOUNDS)).toEqual({
      role: "lunch",
      roleSource: "auto",
    });
  });
  it("a chosen role stays the person's; no time and no choice → none", () => {
    expect(roleOf("snack", "11:09", DEFAULT_ROLE_BOUNDS)).toEqual({
      role: "snack",
      roleSource: "manual",
    });
    expect(roleOf("", "", DEFAULT_ROLE_BOUNDS)).toEqual({ role: "", roleSource: "" });
  });
  it("the person's own bounds: lunch from 12:00 makes 11:09 a breakfast", () => {
    expect(roleOf("", "11:09", { ...DEFAULT_ROLE_BOUNDS, lunchFrom: 720 }).role).toBe(
      "breakfast",
    );
  });
});
