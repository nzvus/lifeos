import { describe, expect, it } from "vitest";
import { galleryAllowed } from "./allowed";

describe("the kit's gallery (PAT-94)", () => {
  it("is never served in production, except the CI build that photographs it", () => {
    expect(galleryAllowed("production")).toBe(false);
    expect(galleryAllowed("production", "false")).toBe(false);
    expect(galleryAllowed("production", "true")).toBe(true);
    expect(galleryAllowed("development")).toBe(true);
    expect(galleryAllowed(undefined)).toBe(true);
  });
});
