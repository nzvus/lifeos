/** Tests for core/shared/display.ts — cookie values are untrusted input. */
import { describe, expect, it } from "vitest";
import { parseColorMode, parseLayout } from "./display";

describe("display settings parsing", () => {
  it("accepts every known value", () => {
    expect(parseColorMode("dark")).toBe("dark");
    expect(parseColorMode("light")).toBe("light");
    expect(parseLayout("desktop")).toBe("desktop");
    expect(parseLayout("phone")).toBe("phone");
  });

  it("falls back to the defaults for missing or unknown values", () => {
    expect(parseColorMode(undefined)).toBe("system");
    expect(parseColorMode("DARK")).toBe("system");
    expect(parseLayout("")).toBe("auto");
    expect(parseLayout("tablet")).toBe("auto");
  });
});
