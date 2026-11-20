// PAT-30 (his 20 Nov, proposal §130): a cibo's box shows one marca, picked by use, then voto, then
// the first made.
import { describe, expect, it } from "vitest";
import { pickProduct, type Product } from "./library";

const p = (key: string, uses: number, voto?: number): Product => ({
  key,
  name: key,
  uses,
  perKg: null,
  values: {},
  ...(voto !== undefined
    ? { box: { data: { macros: [] }, score: { value: voto, parts: [], missing: [] } } }
    : {}),
});

describe("pickProduct (PAT-30, §130)", () => {
  it("the most used", () => {
    expect(pickProduct([p("a", 2, 90), p("b", 5, 10)])?.key).toBe("b");
  });
  it("never used: the best voto", () => {
    expect(pickProduct([p("a", 0, 40), p("b", 0, 70)])?.key).toBe("b");
  });
  it("a tie: the first made", () => {
    expect(pickProduct([p("a", 0, 70), p("b", 0, 70)])?.key).toBe("a");
    expect(pickProduct([p("a", 3), p("b", 3)])?.key).toBe("a");
  });
  it("used beats a better voto never used", () => {
    expect(pickProduct([p("a", 0, 99), p("b", 1, 10)])?.key).toBe("b");
  });
  it("none: nothing", () => {
    expect(pickProduct([])).toBeUndefined();
  });
});
