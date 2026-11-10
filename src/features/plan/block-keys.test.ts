import { describe, expect, it } from "vitest";
import { whatOf } from "./block-keys";

describe("what a blocco's Composer posts (PL-01, PL-02, PL-03)", () => {
  it("objects in order with servings, or one type alone; mixed or empty is none", () => {
    expect(
      whatOf([
        { key: "a", quantity: 1 },
        { key: "b", quantity: 1.5 },
      ]),
    ).toEqual({
      items: [
        { id: "a", quantity: 1 },
        { id: "b", quantity: 1.5 },
      ],
    });
    expect(whatOf([{ key: "kind:water", quantity: 1 }])).toEqual({ kind: "water" });
    expect(
      whatOf([
        { key: "kind:water", quantity: 1 },
        { key: "a", quantity: 1 },
      ]),
    ).toBeNull();
    expect(whatOf([])).toBeNull();
  });
});
