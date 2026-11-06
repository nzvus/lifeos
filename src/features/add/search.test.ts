import { describe, expect, it } from "vitest";
import { searchTargets, type AddTarget } from "./search";

const t = (title: string, sub: string): AddTarget => ({
  key: sub + title,
  title,
  sub,
  fam: "food",
  href: "/" + title,
});
const ALL = [
  t("Acqua", "tipo"),
  t("Caffè", "cibo"),
  t("Latte di cocco", "cibo"),
  t("Caffelatte del mattino", "pasto salvato"),
  t("Push", "allenamento"),
];

describe("⊕'s one search", () => {
  it("keeps what has every word, accents aside; a name starting with it first", () => {
    expect(searchTargets(ALL, "caffe").map((x) => x.title)).toEqual([
      "Caffè",
      "Caffelatte del mattino",
    ]);
    expect(searchTargets(ALL, "latte").map((x) => x.title)).toEqual([
      "Latte di cocco",
      "Caffelatte del mattino",
    ]);
    expect(searchTargets(ALL, "allenamento").map((x) => x.title)).toEqual(["Push"]);
    expect(searchTargets(ALL, "  ")).toEqual([]);
  });
});
