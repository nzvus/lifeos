import { describe, expect, it } from "vitest";
import { studioAllowed } from "./allowed";

describe("the study pages", () => {
  it("are never served in production", () => {
    expect(studioAllowed("production")).toBe(false);
    expect(studioAllowed("development")).toBe(true);
    expect(studioAllowed(undefined)).toBe(true);
  });
});
