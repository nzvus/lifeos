import { describe, expect, it } from "vitest";
import {
  addLine,
  moveLine,
  readLines,
  readOrder,
  removeLine,
  setQuantity,
} from "./composer";

const a = { key: "a", quantity: "80" };
const b = { key: "b", quantity: "10" };

describe("Composer lines (PAT-62)", () => {
  it("adds an object once, removes it, changes its quantity", () => {
    expect(addLine([a], b)).toEqual([a, b]);
    expect(addLine([a, b], { key: "a", quantity: "200" })).toEqual([a, b]);
    expect(removeLine([a, b], "a")).toEqual([b]);
    expect(setQuantity([a, b], "b", "12,5")).toEqual([a, { key: "b", quantity: "12,5" }]);
  });

  it("reads the posted lines back as numbers, a bad quantity as an error (PAT-14)", () => {
    const form = new Map([
      ["line.0.key", "a"],
      ["line.0", "80"],
      ["line.1.key", "b"],
      ["line.1", "12,5"],
      ["line.2.key", "c"],
      ["line.2", "tanto"],
    ]);
    const r = readLines((n) => form.get(n) ?? null);
    expect(r.lines).toEqual([
      { key: "a", quantity: 80 },
      { key: "b", quantity: 12.5 },
    ]);
    expect(Object.keys(r.errors)).toEqual(["line.2"]);
  });

  it("PAT-62 lines without quantity: moved up and down, read back in order", () => {
    const c = { key: "c", quantity: "" };
    expect(moveLine([a, b, c], "b", -1).map((l) => l.key)).toEqual(["b", "a", "c"]);
    expect(moveLine([a, b, c], "b", 1).map((l) => l.key)).toEqual(["a", "c", "b"]);
    expect(moveLine([a, b, c], "a", -1).map((l) => l.key)).toEqual(["a", "b", "c"]);
    const form = new Map([
      ["line.0.key", "x"],
      ["line.1.key", "y"],
      ["line.2.key", "x"],
    ]);
    expect(readOrder((n) => form.get(n) ?? null)).toEqual(["x", "y"]);
  });
});
