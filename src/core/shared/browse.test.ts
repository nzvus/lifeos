/** Tests for core/shared/browse.ts — query + sort for the list pages. */
import { describe, expect, it } from "vitest";
import { browse } from "./browse";

const rows = [
  { name: "Skyr", uses: 5, price: 397 as number | null },
  { name: "Burro d'arachidi", uses: 2, price: 597 },
  { name: "Sale", uses: 0, price: null },
];
const base = {
  query: "",
  describe: (r: (typeof rows)[number]) => ({
    text: r.name,
    name: r.name,
    uses: r.uses,
    lastUsed: null,
  }),
  values: { price: (r: (typeof rows)[number]) => r.price },
  locale: "it",
};
const names = (xs: typeof rows) => xs.map((r) => r.name);

describe("browse", () => {
  it("'used' is most used first; ascending reverses it", () => {
    expect(names(browse(rows, { ...base, sort: "used", direction: "desc" }))).toEqual([
      "Skyr",
      "Burro d'arachidi",
      "Sale",
    ]);
    expect(names(browse(rows, { ...base, sort: "used", direction: "asc" }))).toEqual([
      "Sale",
      "Burro d'arachidi",
      "Skyr",
    ]);
  });

  it("'name' is alphabetical", () => {
    expect(names(browse(rows, { ...base, sort: "name", direction: "asc" }))).toEqual([
      "Burro d'arachidi",
      "Sale",
      "Skyr",
    ]);
  });

  it("a value sort puts missing values last in both directions", () => {
    expect(names(browse(rows, { ...base, sort: "price", direction: "asc" }))).toEqual([
      "Skyr",
      "Burro d'arachidi",
      "Sale",
    ]);
    expect(names(browse(rows, { ...base, sort: "price", direction: "desc" }))).toEqual([
      "Burro d'arachidi",
      "Skyr",
      "Sale",
    ]);
  });

  it("the query filters before sorting", () => {
    expect(
      names(browse(rows, { ...base, query: "sa", sort: "name", direction: "asc" })),
    ).toEqual(["Sale"]);
  });
});
