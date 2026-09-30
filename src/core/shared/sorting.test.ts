/** Tests for core/shared/sorting.ts. */
import { describe, expect, it } from "vitest";
import { sortByValue } from "./sorting";

const rows = [
  { n: "b", v: 2 },
  { n: "none", v: null },
  { n: "a", v: 1 },
  { n: "c", v: 3 },
];

describe("sortByValue", () => {
  it("sorts both ways and keeps missing values last either way", () => {
    expect(sortByValue(rows, (r) => r.v, "asc").map((r) => r.n)).toEqual([
      "a",
      "b",
      "c",
      "none",
    ]);
    expect(sortByValue(rows, (r) => r.v, "desc").map((r) => r.n)).toEqual([
      "c",
      "b",
      "a",
      "none",
    ]);
  });
  it("compares text with the locale (accents in place, case-insensitive order)", () => {
    const names = [{ s: "zucca" }, { s: "Àrancia" }, { s: "banana" }];
    expect(sortByValue(names, (r) => r.s, "asc").map((r) => r.s)).toEqual([
      "Àrancia",
      "banana",
      "zucca",
    ]);
  });
});
