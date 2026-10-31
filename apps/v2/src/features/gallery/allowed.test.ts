import { describe, expect, it } from "vitest";
import { galleryAllowed } from "./allowed";

describe("the kit's gallery", () => {
  it("is never served in production", () => {
    expect(galleryAllowed("production")).toBe(false);
    expect(galleryAllowed("development")).toBe(true);
    expect(galleryAllowed(undefined)).toBe(true);
  });
});
