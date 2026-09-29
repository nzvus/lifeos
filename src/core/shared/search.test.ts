/** Tests for core/shared/search.ts — matching and ranking rules. */
import { describe, expect, it } from "vitest";
import { matchScore, normalize, rank } from "./search";

describe("normalize / matchScore", () => {
  it("ignores case and accents", () => {
    expect(normalize("  Caffè  Crème ")).toBe("caffe creme");
    expect(matchScore("caffe", "Caffè d'orzo")).not.toBeNull();
    expect(matchScore("GNOCCHI", "Gnocchi di Patate")).not.toBeNull();
  });

  it("requires every word, in any order", () => {
    expect(matchScore("pat pollo", "Pollo con Patate")).not.toBeNull();
    expect(matchScore("pollo riso", "Pollo con Patate")).toBeNull();
  });

  it("scores start of text > start of word > inside a word", () => {
    const start = matchScore("pol", "Pollo con patate")!;
    const word = matchScore("pat", "Pollo con patate")!;
    const inside = matchScore("oll", "Pollo con patate")!;
    expect(start).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(inside);
  });
});

describe("rank", () => {
  const items = [
    { name: "Skyr Bianco", uses: 1, lastUsed: "2026-09-01" },
    { name: "Latte Scremato", uses: 9, lastUsed: "2026-09-28" },
    { name: "Latte di Cocco", uses: 0, lastUsed: null },
    { name: "Mascarpone", uses: 9, lastUsed: "2026-09-29" },
  ];
  const describe_ = (i: (typeof items)[number]) => ({ text: i.name, ...i });

  it("empty query: most used first, then most recent, then A–Z", () => {
    expect(rank(items, "", describe_).map((i) => i.name)).toEqual([
      "Mascarpone", // 9 uses, used more recently than Latte Scremato
      "Latte Scremato",
      "Skyr Bianco",
      "Latte di Cocco",
    ]);
  });

  it("query: filters, then best match, then usage", () => {
    expect(rank(items, "latte", describe_).map((i) => i.name)).toEqual([
      "Latte Scremato", // same match quality as "Latte di Cocco", but used
      "Latte di Cocco",
    ]);
  });
});
